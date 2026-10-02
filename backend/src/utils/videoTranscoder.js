import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import { s3Client, uploadToZata as uploadToB2 } from "../config/zata.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";

/**
 * Resolves FFmpeg executable path
 */
export const getFfmpegPath = async () => {
  try {
    const installer = await import("@ffmpeg-installer/ffmpeg");
    if (installer?.default?.path) {
      return installer.default.path;
    }
  } catch {
    // fallback
  }
  return "ffmpeg";
};

/**
 * Quality Profiles for Multi-Bitrate Streaming
 */
export const QUALITY_PROFILES = {
  "360p": {
    height: 360,
    videoBitrate: "380k",
    maxrate: "450k",
    bufsize: "700k",
    audioBitrate: "64k",
  },
  "480p": {
    height: 480,
    videoBitrate: "750k",
    maxrate: "850k",
    bufsize: "1400k",
    audioBitrate: "96k",
  },
  "720p": {
    height: 720,
    videoBitrate: "1300k",
    maxrate: "1500k",
    bufsize: "2600k",
    audioBitrate: "128k",
  },
};

/**
 * Transcodes a video file to a target resolution/bitrate profile with FastStart
 * 
 * @param {string} inputPath 
 * @param {string} outputPath 
 * @param {'360p'|'480p'|'720p'} quality 
 * @returns {Promise<boolean>}
 */
export const transcodeToQuality = async (inputPath, outputPath, quality = "360p") => {
  const profile = QUALITY_PROFILES[quality] || QUALITY_PROFILES["360p"];
  const ffmpegPath = await getFfmpegPath();

  const args = [
    "-y",
    "-i", inputPath,
    "-vf", `scale=-2:${profile.height}`,
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-b:v", profile.videoBitrate,
    "-maxrate", profile.maxrate,
    "-bufsize", profile.bufsize,
    "-c:a", "aac",
    "-b:a", profile.audioBitrate,
    "-movflags", "+faststart",
    outputPath,
  ];

  return new Promise((resolve) => {
    try {
      execFile(ffmpegPath, args, { maxBuffer: 20 * 1024 * 1024 }, (error) => {
        if (error) {
          console.warn(`[VideoTranscoder] ${quality} transcode notice:`, error.message);
          resolve(false);
        } else if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } catch (err) {
      console.warn(`[VideoTranscoder] Exception during ${quality} transcode:`, err.message);
      resolve(false);
    }
  });
};

/**
 * Asynchronously generates multi-quality variants (360p & 480p) in the background
 * without blocking the user's upload response.
 * 
 * @param {string} sourceFilePath - Local path of uploaded MP4 (must remain until transcoding completes or copied)
 * @param {string} primaryKey - S3 key of main video (e.g. courseModule/1789059095751-8696.mp4)
 */
export const generateMultiQualityAsync = async (sourceFilePath, primaryKey) => {
  if (!sourceFilePath || !primaryKey) return;
  if (!fs.existsSync(sourceFilePath)) return;

  // Make a working copy in temp directory so original temp file can be cleaned up
  const tempDir = path.resolve("./temp_transcode");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const ext = path.extname(primaryKey) || ".mp4";
  const baseKey = primaryKey.replace(ext, "");
  const workInput = path.join(tempDir, `work_${Date.now()}${ext}`);

  try {
    fs.copyFileSync(sourceFilePath, workInput);
  } catch (err) {
    console.warn("[VideoTranscoder] Could not clone source for background transcode:", err.message);
    return;
  }

  // Run asynchronously in background
  setImmediate(async () => {
    try {
      console.log(`[VideoTranscoder] 🚀 Starting background multi-quality generation for ${primaryKey}...`);

      const qualities = ["360p", "480p"];
      for (const q of qualities) {
        const outPath = path.join(tempDir, `out_${q}_${Date.now()}${ext}`);
        const success = await transcodeToQuality(workInput, outPath, q);

        if (success && fs.existsSync(outPath)) {
          const targetKey = `${baseKey}_${q}${ext}`;
          console.log(`[VideoTranscoder] Uploading ${q} version to S3 (${targetKey})...`);
          
          await uploadToB2(
            outPath,
            path.basename(targetKey),
            "video/mp4",
            "courseModule",
            null,
            targetKey
          );

          try {
            fs.unlinkSync(outPath);
          } catch {}
          console.log(`[VideoTranscoder] ✓ ${q} variant successfully published!`);
        }
      }
    } catch (bgErr) {
      console.warn("[VideoTranscoder] Background generation error:", bgErr.message);
    } finally {
      try {
        if (fs.existsSync(workInput)) fs.unlinkSync(workInput);
      } catch {}
    }
  });
};
