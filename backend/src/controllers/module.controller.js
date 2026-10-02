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

    // Remove temporary files from local disk after successful S3 upload
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlink(tempFilePath, () => {});
      tempFilePath = null;
    }
    if (optimizedTempPath && fs.existsSync(optimizedTempPath)) {
      fs.unlink(optimizedTempPath, () => {});
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
 * 🚀 Returns direct CDN pre-signed URL as JSON for web players (No 302 redirects, zero server load)
 */
export const getModuleStreamUrl = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const user = req.user;

    // Fast memory cache check (valid for 3.5 hours)
    const cached = streamUrlCache.get(moduleId);
    if (cached && Date.now() < cached.expiresAt) {
      return res.status(200).json({ success: true, streamUrl: cached.url });
    }

    const { module, videoId, courseId } = await resolveVideoDetails(moduleId);
    if (!module || !videoId) {
      return res.status(404).json({ message: "Module not found" });
    }

    const hasAccess = await checkUserAccess(courseId, user);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied. Course not enrolled." });
    }

    const getObjectCmd = new GetObjectCommand({
      Bucket: ENV.ZATA_BUCKET_NAME,
      Key: videoId,
    });

    const directCdnUrl = await getSignedUrl(s3Client, getObjectCmd, { expiresIn: 14400 }); // 4 hours valid
    if (directCdnUrl) {
      streamUrlCache.set(moduleId, {
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
 * Legacy 302 redirect streaming endpoint (kept for backward compatibility with mobile app)
 */
export const streamModuleVideo = async (req, res) => {
  let module = null;
  try {
    const { moduleId } = req.params;
    const user = req.user;

    // Fast memory cache check
    const cached = streamUrlCache.get(moduleId);
    if (cached && Date.now() < cached.expiresAt) {
      return res.redirect(302, cached.url);
    }

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

    const getObjectCmd = new GetObjectCommand({
      Bucket: ENV.ZATA_BUCKET_NAME,
      Key: videoId,
    });

    const directCdnUrl = await getSignedUrl(s3Client, getObjectCmd, { expiresIn: 14400 }); // 4 hours valid
    if (directCdnUrl) {
      streamUrlCache.set(moduleId, {
        url: directCdnUrl,
        expiresAt: Date.now() + 3.5 * 60 * 60 * 1000,
      });
      return res.redirect(302, directCdnUrl);
    }

    return res.status(404).json({ message: "Unable to generate streaming URL" });
  } catch (error) {
    if (error.name === "NoSuchKey" || error.Code === "NoSuchKey") {
      if (module?.Video && (module.Video.startsWith("http://") || module.Video.startsWith("https://"))) {
        return res.redirect(module.Video);
      }
      return res.status(404).json({ message: "Video file not found in storage bucket" });
    }
    if (!res.headersSent) {
      console.error("Video stream error:", error.message || error);
      res.status(500).json({ message: "Failed to generate video stream" });
    }
  }
};

