import multer from "multer";
import fs from "fs";
import path from "path";
import os from "os";

// Use project root temp_uploads directory (on the 19GB root disk) rather than /tmp (which is a 455MB RAM disk on EC2)
const tempUploadDir = path.join(process.cwd(), "temp_uploads");
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

// Automatically clean up stale temp upload files (older than 30 minutes)
export const cleanupStaleTempUploads = () => {
  try {
    const dirsToCheck = [tempUploadDir, path.join(os.tmpdir(), "zero_educators_video_uploads")];
    for (const dir of dirsToCheck) {
      if (!fs.existsSync(dir)) continue;
      const now = Date.now();
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        try {
          const stats = fs.statSync(filePath);
          if (now - stats.mtimeMs > 30 * 60 * 1000) {
            fs.unlinkSync(filePath);
          }
        } catch (_) {}
      }
    }
  } catch (err) {
    console.error("[Temp Cleanup Error]:", err);
  }
};

// Run cleanup immediately and periodically every 15 minutes
cleanupStaleTempUploads();
setInterval(cleanupStaleTempUploads, 15 * 60 * 1000);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const originalName = file?.originalname || "video.mp4";
    const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${uniqueSuffix}-${cleanName}`);
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