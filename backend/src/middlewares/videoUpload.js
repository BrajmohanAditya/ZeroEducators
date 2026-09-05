import multer from "multer";
import fs from "fs";
import path from "path";
import os from "os";

// Store in OS temp directory so nodemon and dev-watchers never trigger a server restart during upload
const tempUploadDir = path.join(os.tmpdir(), "zero_educators_video_uploads");
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${uniqueSuffix}-${cleanName}`);
  },
});

export const videoUpload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 1024 * 5, // 5GB limit to allow large lecture / long videos
  },
});