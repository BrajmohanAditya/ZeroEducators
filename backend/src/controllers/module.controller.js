import mongoose from "mongoose";
import { Course } from "../models/course.model.js";
import { Modules } from "../models/module.model.js";
import { User } from "../models/user.model.js";
import { uploadToZata as uploadToB2, s3Client } from "../config/zata.js";
import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { ENV } from "../config/env.js";
import fs from "fs";

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

    // Upload to Zata S3 using multipart chunked upload with live progress callback
    const { url: videoUrl, fileKey: videoId } = await uploadToB2(
      tempFilePath || req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      "courseModule",
      (loaded, total) => {
        if (uploadId) {
          const totalBytes = total || fileSize || 1;
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

    // Remove temporary file from local disk after successful S3 upload
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlink(tempFilePath, (err) => {
        if (err) console.error("Error removing temp video file:", err);
      });
      tempFilePath = null;
    }

    const module = await Modules.create({
      courseId,
      title,
      Video: videoUrl,
      Video_id: videoId,
    });

    await Course.findByIdAndUpdate(courseId, {
      $push: { modules: module._id },
    });

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
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export const streamModuleVideo = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const user = req.user;

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

    if (!module || !videoId) {
      return res.status(404).json({ message: "Module not found" });
    }

    // Access control: admins, demo tester, enrolled users, or free courses
    const isTester = ENV.TESTER_EMAIL && user?.email?.toLowerCase() === ENV.TESTER_EMAIL.toLowerCase();
    if (user?.role !== "admin" && !isTester && courseId) {
      const course = await Course.findById(courseId);
      const isPurchased = user?.purchasedCourse?.some(
        (cId) => cId.toString() === courseId?.toString()
      );
      if (!isPurchased && !course?.isFree) {
        return res.status(403).json({ message: "Access denied. Course not enrolled." });
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

