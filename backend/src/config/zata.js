import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { ENV } from "./env.js";

// Initialize S3 Client with Zata.ai S3 Endpoint
export const s3Client = new S3Client({
  endpoint: ENV.ZATA_ENDPOINT,
  region: ENV.ZATA_REGION || "idr01",
  credentials: {
    accessKeyId: ENV.ZATA_ACCESS_KEY,
    secretAccessKey: ENV.ZATA_SECRET_KEY,
  },
  forcePathStyle: true, // Required for Zata.ai and custom S3 providers
});

/**
 * Upload a file buffer to Zata Cloud Storage
 * @param {Buffer} fileBuffer - req.file.buffer
 * @param {string} originalName - req.file.originalname
 * @param {string} mimeType - req.file.mimetype
 * @param {string} folder - sub-folder name (e.g. "courses", "ebooks", "hero")
 * @returns {Promise<{url: string, fileKey: string}>}
 */
export const uploadToZata = async (fileBuffer, originalName, mimeType, folder = "uploads") => {
  const cleanFileName = originalName ? originalName.replace(/\s+/g, "_") : "file";
  const uniqueKey = `${folder}/${Date.now()}-${cleanFileName}`;

  const command = new PutObjectCommand({
    Bucket: ENV.ZATA_BUCKET_NAME,
    Key: uniqueKey,
    Body: fileBuffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);

  // Zata.ai public file URL
  const publicUrl = `${ENV.ZATA_ENDPOINT}/${ENV.ZATA_BUCKET_NAME}/${uniqueKey}`;

  return {
    url: publicUrl,
    fileKey: uniqueKey,
  };
};

/**
 * Delete a file from Zata Cloud Storage
 * @param {string} fileKey - the uniqueKey saved in DB (e.g. "courses/12345-image.png")
 */
export const deleteFromZata = async (fileKey) => {
  if (!fileKey) return;
  const command = new DeleteObjectCommand({
    Bucket: ENV.ZATA_BUCKET_NAME,
    Key: fileKey,
  });
  return await s3Client.send(command);
};

// Aliases for convenience
export const uploadToB2 = uploadToZata;
export const deleteFromB2 = deleteFromZata;
export const uploadToStorage = uploadToZata;
export const deleteFromStorage = deleteFromZata;
