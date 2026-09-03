import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { ENV } from "./env.js";

export const s3Client = new S3Client({
  endpoint: ENV.B2_ENDPOINT,
  region: ENV.B2_REGION || "us-east-005",
  credentials: {
    accessKeyId: ENV.B2_KEY_ID,
    secretAccessKey: ENV.B2_APPLICATION_KEY,
  },
});

/**
 * Upload a file buffer to Backblaze B2
 * @param {Buffer} fileBuffer - req.file.buffer
 * @param {string} originalName - req.file.originalname
 * @param {string} mimeType - req.file.mimetype
 * @param {string} folder - sub-folder name (e.g. "courses", "ebooks", "hero")
 * @returns {Promise<{url: string, fileKey: string}>}
 */
export const uploadToB2 = async (fileBuffer, originalName, mimeType, folder = "uploads") => {
  const cleanFileName = originalName ? originalName.replace(/\s+/g, "_") : "file";
  const uniqueKey = `${folder}/${Date.now()}-${cleanFileName}`;

  const command = new PutObjectCommand({
    Bucket: ENV.B2_BUCKET_NAME,
    Key: uniqueKey,
    Body: fileBuffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);

  // Backblaze direct S3 public URL
  const publicUrl = `https://${ENV.B2_BUCKET_NAME}.s3.us-east-005.backblazeb2.com/${uniqueKey}`;

  return {
    url: publicUrl,
    fileKey: uniqueKey,
  };
};

/**
 * Delete a file from Backblaze B2
 * @param {string} fileKey - the uniqueKey saved in DB (e.g. "courses/12345-image.png")
 */
export const deleteFromB2 = async (fileKey) => {
  if (!fileKey) return;
  const command = new DeleteObjectCommand({
    Bucket: ENV.B2_BUCKET_NAME,
    Key: fileKey,
  });
  return await s3Client.send(command);
};
