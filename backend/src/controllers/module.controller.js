import { Course } from "../models/course.model.js";
import { Modules } from "../models/module.model.js";
import { User } from "../models/user.model.js";
import { uploadToZata as uploadToB2, s3Client } from "../config/zata.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
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

export const streamModuleVideo = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const user = req.user;

    let module = await Modules.findById(moduleId);
    let videoId = module?.Video_id;
    let courseId = module?.courseId;

    if (!module) {
      const courseWithVideo = await Course.findOne({ "topics.videos._id": moduleId });
      if (courseWithVideo) {
        courseId = courseWithVideo._id;
        for (const topic of courseWithVideo.topics) {
          const v = topic.videos?.id(moduleId);
          if (v) {
            videoId = v.Video_id;
            module = { Video_id: v.Video_id, courseId: courseWithVideo._id };
            break;
          }
        }
      }
    }

    if (!module || !videoId) {
      return res.status(404).json({ message: "Module not found" });
    }

    // Access control: admins, enrolled users, or free courses
    if (user?.role !== "admin") {
      const course = await Course.findById(courseId);
      const isPurchased = user?.purchasedCourse?.some(
        (cId) => cId.toString() === courseId?.toString()
      );
      if (!isPurchased && !course?.isFree) {
        return res.status(403).json({ message: "Access denied. Course not enrolled." });
      }
    }

    const range = req.headers.range || "bytes=0-";
    const command = new GetObjectCommand({
      Bucket: ENV.ZATA_BUCKET_NAME,
      Key: videoId,
      Range: range,
    });

    const s3Response = await s3Client.send(command);

    // Set streaming and security headers to prevent downloading and buffering
    const headers = {
      "Content-Type": s3Response.ContentType || "video/mp4",
      "Accept-Ranges": "bytes",
      "Content-Disposition": "inline",
      "Cache-Control": "private, max-age=86400, no-transform",
      "X-Content-Type-Options": "nosniff",
    };

    if (s3Response.ContentRange) {
      headers["Content-Range"] = s3Response.ContentRange;
      headers["Content-Length"] = s3Response.ContentLength;
      res.writeHead(206, headers);
    } else {
      if (s3Response.ContentLength) {
        headers["Content-Length"] = s3Response.ContentLength;
      }
      res.writeHead(200, headers);
    }

    s3Response.Body.pipe(res);
  } catch (error) {
    if (!res.headersSent) {
      console.error("Video stream error:", error);
      res.status(500).json({ message: "Failed to stream video" });
    }
  }
};

