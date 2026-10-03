import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import { uploadToZata as uploadToB2 } from "../config/zata.js";

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
    // fallback to system ffmpeg
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
 * Transcodes a video file to a target resolution/bitrate MP4 with FastStart
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

// ─────────────────────────────────────────────────────────────────────────────
// HLS TRANSCODING — MP4 → Multi-Quality HLS (.m3u8 + .ts segments)
//
// Generates 3 quality tiers (360p, 480p, 720p) as HLS streams in a temp
// directory, then uploads every .ts segment + .m3u8 manifest to S3.
// Returns the public URL of the master manifest — save this in DB!
//
// S3 layout example (primaryKey = "courseModule/abc123.mp4"):
//   courseModule/hls/abc123/360p/index.m3u8
//   courseModule/hls/abc123/360p/seg000.ts ...
//   courseModule/hls/abc123/480p/index.m3u8  ...
//   courseModule/hls/abc123/720p/index.m3u8  ...
//   courseModule/hls/abc123/master.m3u8  ← SAVE THIS URL in DB
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {string} inputPath   - local path to source video file
 * @param {string} primaryKey  - S3 key of the original video (e.g. courseModule/abc123.mp4)
 * @param {string} s3BaseUrl   - public base URL of S3 bucket (e.g. https://s3.zata.ai/bucketname)
 * @returns {Promise<string|null>} - public master manifest URL, or null on failure
 */
export const transcodeToHls = async (inputPath, primaryKey, s3BaseUrl) => {
  if (!inputPath || !fs.existsSync(inputPath)) {
    console.warn("[HLS] Input file not found:", inputPath);
    return null;
  }

  const ffmpegPath = await getFfmpegPath();

  // Derive clean base name: "courseModule/abc123.mp4" → "abc123"
  const ext      = path.extname(primaryKey);
  const baseName = path.basename(primaryKey, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
  const folder   = path.dirname(primaryKey); // e.g. "courseModule"

  // Local temp directory for this job
  const tempDir = path.resolve(`./temp_hls_${Date.now()}_${baseName}`);
  fs.mkdirSync(tempDir, { recursive: true });

  const hlsQualities        = ["360p", "480p", "720p"];
  const successfulQualities = [];

  // ── Step 1: Transcode each quality to HLS locally ─────────────────────────
  for (const q of hlsQualities) {
    const profile    = QUALITY_PROFILES[q];
    const qualDir    = path.join(tempDir, q);
    fs.mkdirSync(qualDir, { recursive: true });

    const segPattern = path.join(qualDir, "seg%03d.ts");
    const manifest   = path.join(qualDir, "index.m3u8");

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
      "-f",                 "hls",
      "-hls_time",          "6",      // 6-second segments
      "-hls_list_size",     "0",      // keep all segments
      "-hls_segment_type",  "mpegts",
      "-hls_segment_filename", segPattern,
      manifest,
    ];

    console.log(`[HLS] Transcoding ${q}...`);
    const ok = await new Promise((resolve) => {
      execFile(ffmpegPath, args, { maxBuffer: 30 * 1024 * 1024 }, (err) => {
        if (err) {
          console.warn(`[HLS] ${q} notice:`, err.message);
          resolve(false);
        } else if (fs.existsSync(manifest) && fs.statSync(manifest).size > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });

    if (ok) {
      successfulQualities.push(q);
      console.log(`[HLS] ✓ ${q} ready`);
    } else {
      console.warn(`[HLS] ✗ ${q} skipped`);
    }
  }

  if (successfulQualities.length === 0) {
    console.error("[HLS] All qualities failed — aborting.");
    _cleanupDir(tempDir);
    return null;
  }

  // ── Step 2: Upload .ts segments + per-quality .m3u8 to S3 ────────────────
  const s3HlsPrefix = `${folder}/hls/${baseName}`; // e.g. courseModule/hls/abc123

  for (const q of successfulQualities) {
    const qualDir = path.join(tempDir, q);
    const files   = fs.readdirSync(qualDir);

    for (const file of files) {
      const localPath = path.join(qualDir, file);
      const s3Key     = `${s3HlsPrefix}/${q}/${file}`;
      const mimeType  = file.endsWith(".m3u8")
        ? "application/vnd.apple.mpegurl"
        : "video/mp2t";
      try {
        await uploadToB2(localPath, file, mimeType, "", null, s3Key);
      } catch (uploadErr) {
        console.warn(`[HLS] Upload failed (${s3Key}):`, uploadErr.message);
      }
    }
    console.log(`[HLS] ✓ ${q} segments uploaded to S3`);
  }

  // ── Step 3: Build & upload master playlist ────────────────────────────────
  const BANDWIDTH_MAP  = { "360p": 500000,  "480p": 900000,  "720p": 1600000 };
  const RESOLUTION_MAP = { "360p": "640x360", "480p": "854x480", "720p": "1280x720" };

  let masterContent = "#EXTM3U\n#EXT-X-VERSION:3\n\n";
  for (const q of successfulQualities) {
    const variantUrl = `${s3BaseUrl}/${s3HlsPrefix}/${q}/index.m3u8`;
    masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${BANDWIDTH_MAP[q]},RESOLUTION=${RESOLUTION_MAP[q]},NAME="${q}"\n${variantUrl}\n\n`;
  }

  const masterLocalPath = path.join(tempDir, "master.m3u8");
  fs.writeFileSync(masterLocalPath, masterContent, "utf8");

  const masterS3Key = `${s3HlsPrefix}/master.m3u8`;
  try {
    await uploadToB2(masterLocalPath, "master.m3u8", "application/vnd.apple.mpegurl", "", null, masterS3Key);
    console.log(`[HLS] ✓ Master manifest uploaded: ${masterS3Key}`);
  } catch (err) {
    console.error("[HLS] Master upload failed:", err.message);
    _cleanupDir(tempDir);
    return null;
  }

  _cleanupDir(tempDir);

  const masterUrl = `${s3BaseUrl}/${masterS3Key}`;
  console.log(`[HLS] 🎉 Stream ready → ${masterUrl}`);
  return masterUrl;
};

/** Recursively remove a temp directory (best-effort) */
const _cleanupDir = (dirPath) => {
  try {
    if (fs.existsSync(dirPath)) fs.rmSync(dirPath, { recursive: true, force: true });
  } catch { /* ignore */ }
};

/**
 * Asynchronously generates:
 *   1. HLS stream  (primary — adaptive, eliminates buffering)
 *   2. MP4 variants 360p + 480p  (fallback for non-HLS environments)
 *
 * Does NOT block the upload response — runs in background via setImmediate.
 *
 * @param {string}   sourceFilePath - Local path of uploaded MP4
 * @param {string}   primaryKey     - S3 key  (e.g. courseModule/abc.mp4)
 * @param {string}   [s3BaseUrl]    - Public base URL of S3 bucket
 * @param {Function} [onHlsReady]  - Optional callback(hlsUrl) once HLS master is ready
 */
export const generateMultiQualityAsync = async (
  sourceFilePath,
  primaryKey,
  s3BaseUrl,
  onHlsReady
) => {
  if (!sourceFilePath || !primaryKey) return;
  if (!fs.existsSync(sourceFilePath)) return;

  // Working copy — lets the caller clean up its temp file immediately
  const tempDir  = path.resolve("./temp_transcode");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const ext       = path.extname(primaryKey) || ".mp4";
  const workInput = path.join(tempDir, `work_${Date.now()}${ext}`);

  try {
    fs.copyFileSync(sourceFilePath, workInput);
  } catch (err) {
    console.warn("[VideoTranscoder] Could not clone source:", err.message);
    return;
  }

  setImmediate(async () => {
    try {
      console.log(`[VideoTranscoder] 🚀 Background processing started for ${primaryKey}...`);

      // ── 1. HLS (primary) ─────────────────────────────────────────────────
      if (s3BaseUrl) {
        const hlsUrl = await transcodeToHls(workInput, primaryKey, s3BaseUrl);
        if (hlsUrl && typeof onHlsReady === "function") {
          onHlsReady(hlsUrl);
        }
      }

      // ── 2. MP4 fallback variants ──────────────────────────────────────────
      const baseKey   = primaryKey.replace(ext, "");
      const qualities = ["360p", "480p"];

      for (const q of qualities) {
        const outPath = path.join(tempDir, `out_${q}_${Date.now()}${ext}`);
        const success = await transcodeToQuality(workInput, outPath, q);

        if (success && fs.existsSync(outPath)) {
          const targetKey = `${baseKey}_${q}${ext}`;
          await uploadToB2(outPath, path.basename(targetKey), "video/mp4", "courseModule", null, targetKey);
          try { fs.unlinkSync(outPath); } catch {}
          console.log(`[VideoTranscoder] ✓ MP4 ${q} fallback published`);
        }
      }

      console.log(`[VideoTranscoder] ✅ Done for ${primaryKey}`);
    } catch (bgErr) {
      console.warn("[VideoTranscoder] Background error:", bgErr.message);
    } finally {
      try { if (fs.existsSync(workInput)) fs.unlinkSync(workInput); } catch {}
    }
  });
};
