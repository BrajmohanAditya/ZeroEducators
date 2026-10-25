import multer from "multer";
import fs from "fs";
import path from "path";
import os from "os";

// Active files currently being uploaded or processed
export const activeTempFiles = new Set();

export const markTempFileActive = (filePath) => {
  if (filePath) activeTempFiles.add(path.resolve(filePath));
};

export const markTempFileInactive = (filePath) => {
  if (filePath) activeTempFiles.delete(path.resolve(filePath));
};

// Use project root temp_uploads directory (on the 19GB root disk) rather than /tmp (which is a 455MB RAM disk on EC2)
const tempUploadDir = path.join(process.cwd(), "temp_uploads");
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

// 6 Hours retention for abandoned temp files (prevents corrupting slow large 1GB-5GB video uploads)
const TEMP_RETENTION_MS = 6 * 60 * 60 * 1000;

// Automatically clean up stale temp upload files (older than 6 hours and NOT currently in use)
export const cleanupStaleTempUploads = () => {
  try {
    const dirsToCheck = [tempUploadDir, path.join(os.tmpdir(), "zero_educators_video_uploads")];
    const now = Date.now();

    for (const dir of dirsToCheck) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const resolvedPath = path.resolve(filePath);

        // 1. Never delete a file currently marked active
        if (activeTempFiles.has(resolvedPath)) {
          continue;
        }

        try {
          const stats = fs.statSync(filePath);

          // 2. Only delete files older than 6 hours
          if (now - stats.mtimeMs > TEMP_RETENTION_MS) {
            fs.unlinkSync(filePath);
            console.log(`[Temp Cleanup] Safely deleted stale abandoned upload: ${file}`);
          }
        } catch (_) {}
      }
    }
  } catch (err) {
    console.error("[Temp Cleanup Error]:", err);
  }
};

// Run cleanup periodically every 60 minutes (instead of aggressive 15 minutes)
setInterval(cleanupStaleTempUploads, 60 * 60 * 1000);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const originalName = file?.originalname || "video.mp4";
    const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${uniqueSuffix}-${cleanName}`;
    const fullPath = path.resolve(path.join(tempUploadDir, filename));
    markTempFileActive(fullPath);
    cb(null, filename);
  },
});

export const videoUpload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 1024 * 5, // 5GB limit to allow large lecture / long videos
  },
});

// Helper to format upload errors with friendly messages
export const formatUploadError = (err) => {
  if (!err) return "Video upload failed";
  const msg = err.message || String(err);
  if (msg.includes("-122") || msg.includes("EDQUOT") || msg.includes("ENOSPC")) {
    return "Server disk space / quota is full. Please clear temporary files or increase server storage.";
  }
  if (err.code === "LIMIT_FILE_SIZE") {
    return "Video file exceeds the maximum allowed size (5GB).";
  }
  return msg;
};