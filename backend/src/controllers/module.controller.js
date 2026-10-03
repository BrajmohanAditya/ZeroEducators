import mongoose from "mongoose";
import { Course } from "../models/course.model.js";
import { Modules } from "../models/module.model.js";
import { User } from "../models/user.model.js";
import { uploadToZata as uploadToB2, s3Client } from "../config/zata.js";
import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV, isTesterEmail } from "../config/env.js";
import { applyFaststart } from "../utils/faststart.js";
import fs from "fs";
import path from "path";

const qualityVariantCache = new Map();

export const moduleUploadProgressMap = new Map();

export const getUploadProgress = (req, res) => {
  const { uploadId } = req.params;
  const progress = moduleUploadProgressMap.get(uploadId) || {
    status: "idle",
    loaded: 0,
    total: 0,
    percent: 0,
  };
  return res.json(progress);
};

export const createModule = async (req, res) => {
  let tempFilePath = null;
  const uploadId = req.body.uploadId;
  try {
    const { courseId, title } = req.body;
    if (!courseId || !title) {
      return res.status(400).json({
        message: "Please provide both courseId and title",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Please select a video file to upload",
      });
    }

    tempFilePath = req.file.path;
    const fileSize = req.file.size || (tempFilePath ? fs.statSync(tempFilePath).size : 0);

    if (uploadId) {
      moduleUploadProgressMap.set(uploadId, {
        status: "saving_to_cloud",
        loaded: 0,
        total: fileSize,
        percent: 0,
      });
    }

    let uploadFilePath = tempFilePath;
    let optimizedTempPath = null;

    // 🚀 FastStart Optimization: Move moov atom to the beginning for zero-buffer instant streaming
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      optimizedTempPath = `${tempFilePath}-faststart.mp4`;
      const isOptimized = await applyFaststart(tempFilePath, optimizedTempPath);
      if (isOptimized && fs.existsSync(optimizedTempPath)) {
        uploadFilePath = optimizedTempPath;
      }
    }

    const finalUploadSize = uploadFilePath ? fs.statSync(uploadFilePath).size : fileSize;

    // Upload to Zata S3 using multipart chunked upload with live progress callback
    const { url: videoUrl, fileKey: videoId } = await uploadToB2(
      uploadFilePath || req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      "courseModule",
      (loaded, total) => {
        if (uploadId) {
          const totalBytes = total || finalUploadSize || 1;
          const percent = Math.min(100, Math.round((loaded * 100) / totalBytes));
          moduleUploadProgressMap.set(uploadId, {
            status: "saving_to_cloud",
            loaded,
            total: totalBytes,
            percent,
          });
        }
      }
    );

    const module = await Modules.create({
      courseId,
      title,
      Video: videoUrl,
      Video_id: videoId,
    });

    await Course.findByIdAndUpdate(courseId, {
      $push: { modules: module._id },
    });

    // Remove temporary files from local disk after successful S3 upload
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlink(tempFilePath, () => {});
      tempFilePath = null;
    }
    if (optimizedTempPath && fs.existsSync(optimizedTempPath)) {
      fs.unlink(optimizedTempPath, () => {});
    }

    if (uploadId) {
      moduleUploadProgressMap.set(uploadId, {
        status: "completed",
        loaded: fileSize,
        total: fileSize,
        percent: 100,
        module,
      });
      // Cleanup after 3 minutes
      setTimeout(() => {
        moduleUploadProgressMap.delete(uploadId);
      }, 3 * 60 * 1000);
    }

    return res.status(201).json({
      message: "Module created successfully",
      module,
    });
  } catch (error) {
    if (uploadId) {
      moduleUploadProgressMap.set(uploadId, {
        status: "error",
        message: error.message || "Failed to upload video module",
      });
    }

    // Ensure temporary file cleanup on failure
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (err) {
        console.error("Error cleaning up temp video on failure:", err);
      }
    }

    console.error("error from create module:", error);
    return res.status(500).json({
      message: error.message || "Failed to upload video module",
    });
  }
};

// Cache video metadata (size, mime type) to avoid redundant S3 HeadObject roundtrips
const videoMetadataCache = new Map();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
// In-memory cache for generated presigned streaming URLs (keyed by moduleId or videoId)
const streamUrlCache = new Map();

/**
 * Resolves video details (module, videoId, courseId) across Modules, Course Subjects, Topics, or direct key
 */
const resolveVideoDetails = async (moduleId) => {
  const isObjectId = mongoose.isValidObjectId(moduleId);
  let module = null;
  let videoId = null;
  let courseId = null;

  if (isObjectId) {
    module = await Modules.findById(moduleId);
    if (module) {
      videoId = module.Video_id;
      courseId = module.courseId;
    }
  }

  // 1. Search in Course subjects -> chapters -> videos
  if (!module) {
    const matchConditions = [
      { "subjects.chapters.videos.Video_id": moduleId },
    ];
    if (isObjectId) {
      matchConditions.push({ "subjects.chapters.videos._id": moduleId });
      matchConditions.push({ "subjects.chapters.videos.moduleId": moduleId });
    }

    const courseWithSubjectVideo = await Course.findOne({ $or: matchConditions });

    if (courseWithSubjectVideo) {
      courseId = courseWithSubjectVideo._id;
      for (const subject of courseWithSubjectVideo.subjects || []) {
        for (const chapter of subject.chapters || []) {
          const v = (chapter.videos || []).find(
            (vid) =>
              (isObjectId && vid._id?.toString() === moduleId) ||
              (isObjectId && vid.moduleId?.toString() === moduleId) ||
              vid.Video_id === moduleId
          );
          if (v) {
            videoId = v.Video_id;
            module = { Video_id: v.Video_id, courseId: courseWithSubjectVideo._id, Video: v.Video };
            break;
          }
        }
        if (module) break;
      }
    }
  }

  // 2. Search in Course topics -> videos
  if (!module) {
    const matchTopicConditions = [
      { "topics.videos.Video_id": moduleId },
    ];
    if (isObjectId) {
      matchTopicConditions.push({ "topics.videos._id": moduleId });
      matchTopicConditions.push({ "topics.videos.moduleId": moduleId });
    }
    const courseWithVideo = await Course.findOne({ $or: matchTopicConditions });
    if (courseWithVideo) {
      courseId = courseWithVideo._id;
      for (const topic of courseWithVideo.topics || []) {
        const v = (topic.videos || []).find(
          (vid) =>
            (isObjectId && vid._id?.toString() === moduleId) ||
            (isObjectId && vid.moduleId?.toString() === moduleId) ||
            vid.Video_id === moduleId
        );
        if (v) {
          videoId = v.Video_id;
          module = { Video_id: v.Video_id, courseId: courseWithVideo._id, Video: v.Video };
          break;
        }
      }
    }
  }

  // 3. Fallback: if direct S3 key was provided or matches
  if (!videoId) {
    const decodedKey = decodeURIComponent(moduleId);
    if (decodedKey.includes("courseModule")) {
      videoId = decodedKey;
      module = { Video_id: videoId };
    }
  }

  // Sanitize videoId in case it was stored as a full S3 URL
  if (videoId && (videoId.startsWith("http://") || videoId.startsWith("https://"))) {
    const urlParts = videoId.split("courseModule/");
    if (urlParts.length > 1) {
      videoId = `courseModule/${urlParts[1]}`;
    }
  }

  return { module, videoId, courseId };
};

/**
 * Validates whether user is allowed to access course video
 */
const checkUserAccess = async (courseId, user) => {
  const isTester = isTesterEmail(user?.email);
  if (user?.role !== "admin" && !isTester && courseId) {
    const course = await Course.findById(courseId);
    const isPurchased = user?.purchasedCourse?.some(
      (cId) => cId.toString() === courseId?.toString()
    );
    if (!isPurchased && !course?.isFree) {
      return false;
    }
  }
  return true;
};

/**
 * 🚀 Returns direct CDN pre-signed URL as JSON for clients supporting direct cloud streaming
 */
export const getModuleStreamUrl = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const user = req.user;

    const requestedQuality = req.query.quality; // '360p' | '480p' | '720p'
    const cacheKey = `${moduleId}_${requestedQuality || "main"}`;

    // Fast memory cache check (valid for 3.5 hours)
    const cached = streamUrlCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return res.status(200).json({ success: true, streamUrl: cached.url });
    }

    const { module, videoId, courseId } = await resolveVideoDetails(moduleId);
    if (!module || !videoId) {
      // If external video URL
      if (module?.Video && (module.Video.startsWith("http://") || module.Video.startsWith("https://"))) {
        return res.status(200).json({ success: true, streamUrl: module.Video });
      }
      return res.status(404).json({ message: "Module not found" });
    }

    const hasAccess = await checkUserAccess(courseId, user);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied. Course not enrolled." });
    }

    // Priority 1: If module.Video is already an HLS master manifest
    if (module?.Video && module.Video.includes("master.m3u8")) {
      return res.status(200).json({ success: true, streamUrl: module.Video });
    }

    // Priority 2: Check if HLS was generated in S3 for this video
    const ext = path.extname(videoId) || ".mp4";
    const baseName = path.basename(videoId, ext);
    const folder = path.dirname(videoId);
    const hlsMasterKey = `${folder}/hls/${baseName}/master.m3u8`;
    const hlsCacheKey = `hls_ready_${hlsMasterKey}`;
    let hasHls = qualityVariantCache.get(hlsCacheKey);
    if (hasHls === undefined) {
      try {
        await s3Client.send(new HeadObjectCommand({ Bucket: ENV.ZATA_BUCKET_NAME, Key: hlsMasterKey }));
        hasHls = true;
        qualityVariantCache.set(hlsCacheKey, true);
      } catch {
        hasHls = false;
        qualityVariantCache.set(hlsCacheKey, false);
      }
    }
    if (hasHls) {
      const hlsUrl = `${ENV.ZATA_ENDPOINT}/${ENV.ZATA_BUCKET_NAME}/${hlsMasterKey}`;
      return res.status(200).json({ success: true, streamUrl: hlsUrl });
    }

    let activeKey = videoId;
    if (requestedQuality === "360p" || requestedQuality === "480p") {
      const ext = path.extname(videoId) || ".mp4";
      const variantKey = `${videoId.replace(ext, "")}_${requestedQuality}${ext}`;
      let hasVariant = qualityVariantCache.get(variantKey);
      if (hasVariant === undefined) {
        try {
          await s3Client.send(new HeadObjectCommand({ Bucket: ENV.ZATA_BUCKET_NAME, Key: variantKey }));
          hasVariant = true;
          qualityVariantCache.set(variantKey, true);
        } catch {
          hasVariant = false;
          qualityVariantCache.set(variantKey, false);
        }
      }
      if (hasVariant) {
        activeKey = variantKey;
      }
    }

    const getObjectCmd = new GetObjectCommand({
      Bucket: ENV.ZATA_BUCKET_NAME,
      Key: activeKey,
    });

    const directCdnUrl = await getSignedUrl(s3Client, getObjectCmd, { expiresIn: 14400 }); // 4 hours valid
    if (directCdnUrl) {
      streamUrlCache.set(cacheKey, {
        url: directCdnUrl,
        expiresAt: Date.now() + 3.5 * 60 * 60 * 1000,
      });
      return res.status(200).json({ success: true, streamUrl: directCdnUrl });
    }

    return res.status(404).json({ message: "Unable to generate streaming URL" });
  } catch (error) {
    console.error("Get stream URL error:", error.message || error);
    return res.status(500).json({ message: "Failed to generate video stream URL" });
  }
};

/**
 * High-performance HTTP 206 Partial Content Video Streaming Route
 * 1. Works with all web browsers (Chrome, Edge, Safari, Firefox) without CORS issues.
 * 2. Delivers fast startup with 2.5MB range chunks and low memory overhead.
 * 3. Supports mobile app redirect if requested via ?redirect=true.
 */
export const streamModuleVideo = async (req, res) => {
  let module = null;
  try {
    const { moduleId } = req.params;
    const user = req.user;

    const videoDetails = await resolveVideoDetails(moduleId);
    module = videoDetails.module;
    const videoId = videoDetails.videoId;
    const courseId = videoDetails.courseId;

    if (!module || !videoId) {
      return res.status(404).json({ message: "Module not found" });
    }

    const hasAccess = await checkUserAccess(courseId, user);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied. Course not enrolled." });
    }

    // 🚀 ZERO LATENCY DIRECT CDN STREAMING (Eliminates Double-Hop Backend Proxy)
    // By default, deliver direct high-speed pre-signed S3/CDN URL via 302 redirect.
    // The mobile/browser will stream directly from Zata S3 at full CDN speed without stressing Node.js.
    if (req.query.proxy !== "true") {
      // If module.Video is an external URL (e.g. Cloudinary or direct CDN)
      if (!videoId && module?.Video && (module.Video.startsWith("http://") || module.Video.startsWith("https://"))) {
        return res.redirect(302, module.Video);
      }

      if (videoId) {
        let activeKey = videoId;
        const requestedQuality = req.query.quality; // '360p' | '480p' | '720p'

        // Check if a lower-bitrate variant is requested (e.g. 360p or 480p)
        if (requestedQuality === "360p" || requestedQuality === "480p") {
          const ext = path.extname(videoId) || ".mp4";
          const variantKey = `${videoId.replace(ext, "")}_${requestedQuality}${ext}`;
          
          let hasVariant = qualityVariantCache.get(variantKey);
          if (hasVariant === undefined) {
            try {
              await s3Client.send(new HeadObjectCommand({ Bucket: ENV.ZATA_BUCKET_NAME, Key: variantKey }));
              hasVariant = true;
              qualityVariantCache.set(variantKey, true);
            } catch {
              hasVariant = false;
              qualityVariantCache.set(variantKey, false);
            }
          }
          if (hasVariant) {
            activeKey = variantKey;
          }
        }

        const cacheKey = `${moduleId}_${requestedQuality || "main"}`;
        const cached = streamUrlCache.get(cacheKey);
        if (cached && Date.now() < cached.expiresAt) {
          return res.redirect(302, cached.url);
        }
        try {
          const getObjectCmd = new GetObjectCommand({
            Bucket: ENV.ZATA_BUCKET_NAME,
            Key: activeKey,
          });
          const directCdnUrl = await getSignedUrl(s3Client, getObjectCmd, { expiresIn: 14400 });
          if (directCdnUrl) {
            streamUrlCache.set(cacheKey, {
              url: directCdnUrl,
              expiresAt: Date.now() + 3.5 * 60 * 60 * 1000,
            });
            return res.redirect(302, directCdnUrl);
          }
        } catch (signErr) {
          console.warn("[Stream Module] Pre-signed redirect generation notice, falling back to proxy:", signErr?.message || signErr);
        }
      }
    }

    // 1. Get cached video metadata or query S3 HeadObject
    let metadata = videoMetadataCache.get(videoId);
    if (!metadata || Date.now() - metadata.cachedAt > CACHE_TTL_MS) {
      try {
        const headCommand = new HeadObjectCommand({
          Bucket: ENV.ZATA_BUCKET_NAME,
          Key: videoId,
        });
        const headRes = await s3Client.send(headCommand);
        metadata = {
          contentLength: Number(headRes.ContentLength) || 0,
          contentType: headRes.ContentType || "video/mp4",
          cachedAt: Date.now(),
        };
        videoMetadataCache.set(videoId, metadata);
      } catch (headErr) {
        if (headErr.name === "NoSuchKey" || headErr.Code === "NoSuchKey") {
          if (module?.Video && (module.Video.startsWith("http://") || module.Video.startsWith("https://"))) {
            return res.redirect(module.Video);
          }
        }
        console.warn("[Stream Module] HeadObject notice:", headErr?.message || headErr?.name);
      }
    }

    const totalSize = metadata?.contentLength || 0;
    const contentType = metadata?.contentType || "video/mp4";

    // 2. Chunk Slicing: 2.5MB per chunk (delivers fast startup and prevents buffering)
    const CHUNK_SIZE = 2.5 * 1024 * 1024; // 2.5MB
    const rangeHeader = req.headers.range;

    let start = 0;
    let end = totalSize > 0 ? totalSize - 1 : undefined;

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      start = parseInt(parts[0], 10);
      if (isNaN(start)) start = 0;

      if (parts[1]) {
        end = parseInt(parts[1], 10);
      } else if (totalSize > 0) {
        // Open-ended range (e.g. bytes=0-): cap end byte to start + CHUNK_SIZE
        end = Math.min(start + CHUNK_SIZE - 1, totalSize - 1);
      }
    } else if (totalSize > 0) {
      end = Math.min(CHUNK_SIZE - 1, totalSize - 1);
    }

    // Validate range limits
    if (totalSize > 0 && (start >= totalSize || (end !== undefined && (end >= totalSize || start > end)))) {
      res.setHeader("Content-Range", `bytes */${totalSize}`);
      return res.status(416).json({ message: "Requested range not satisfiable" });
    }

    const s3Range = end !== undefined ? `bytes=${start}-${end}` : rangeHeader || "bytes=0-";

    const command = new GetObjectCommand({
      Bucket: ENV.ZATA_BUCKET_NAME,
      Key: videoId,
      Range: s3Range,
    });

    const s3Response = await s3Client.send(command);

    // 3. Set headers for HTTP 206 Partial Content
    const chunkSize = end !== undefined ? end - start + 1 : s3Response.ContentLength;
    const headers = {
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
      "Content-Disposition": "inline",
      "Cache-Control": "private, max-age=86400, no-transform",
      "X-Content-Type-Options": "nosniff",
    };

    if (totalSize > 0 && end !== undefined) {
      headers["Content-Range"] = `bytes ${start}-${end}/${totalSize}`;
      headers["Content-Length"] = chunkSize;
      res.writeHead(206, headers);
    } else if (s3Response.ContentRange) {
      headers["Content-Range"] = s3Response.ContentRange;
      if (s3Response.ContentLength) headers["Content-Length"] = s3Response.ContentLength;
      res.writeHead(206, headers);
    } else {
      if (s3Response.ContentLength) headers["Content-Length"] = s3Response.ContentLength;
      res.writeHead(200, headers);
    }

    // 4. Socket Disconnect Cleanup: Stop S3 stream immediately when client seeks or navigates away
    let isClientClosed = false;
    res.on("close", () => {
      isClientClosed = true;
      if (s3Response?.Body && typeof s3Response.Body.destroy === "function") {
        s3Response.Body.destroy();
      }
    });

    s3Response.Body.on("error", (streamErr) => {
      if (!isClientClosed && !res.headersSent) {
        console.error("S3 stream pipe error:", streamErr);
        res.status(500).json({ message: "Streaming error" });
      }
    });

    s3Response.Body.pipe(res);
  } catch (error) {
    if (error.name === "NoSuchKey" || error.Code === "NoSuchKey") {
      if (module?.Video && (module.Video.startsWith("http://") || module.Video.startsWith("https://"))) {
        return res.redirect(module.Video);
      }
      return res.status(404).json({ message: "Video file not found in storage bucket" });
    }
    if (!res.headersSent) {
      console.error("Video stream error:", error.message || error);
      res.status(500).json({ message: "Failed to stream video" });
    }
  }
};

