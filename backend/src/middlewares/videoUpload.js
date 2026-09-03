import multer from 'multer';

const storage = multer.memoryStorage();

export const videoUpload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 500 // 500MB
  }
});