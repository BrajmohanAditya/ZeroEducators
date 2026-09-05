import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { ENV } from "./env.js";
import fs from "fs";

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
 * Upload a file (Buffer, Stream, or disk FilePath) to Zata Cloud Storage with chunked multipart support
 * @param {Buffer|ReadableStream|string} fileInput - req.file.buffer, stream, or file path on disk
 * @param {string} originalName - req.file.originalname
 * @param {string} mimeType - req.file.mimetype
 * @param {string} folder - sub-folder name (e.g. "courseModule", "courses", "ebooks")
 * @returns {Promise<{url: string, fileKey: string}>}
 */
export const uploadToZata = async (
  fileInput,
  originalName,
  mimeType,
  folder = "uploads",
  onProgress = null
) => {
  const cleanFileName = originalName ? originalName.replace(/\s+/g, "_") : "file";
  const uniqueKey = `${folder}/${Date.now()}-${cleanFileName}`;

  let body = fileInput;

  // If a file path string is passed, stream it from disk to prevent high memory usage
  if (typeof fileInput === "string") {
    body = fs.createReadStream(fileInput);
  }

  // Upload using @aws-sdk/lib-storage (automatically performs multipart chunking for large files/videos)
  const parallelUploads3 = new Upload({
    client: s3Client,
    params: {
      Bucket: ENV.ZATA_BUCKET_NAME,
      Key: uniqueKey,
      Body: body,
      ContentType: mimeType,
    },
    partSize: 20 * 1024 * 1024, // 20MB chunk size (fewer parts, higher throughput)
    queueSize: 6, // 6 concurrent part uploads
    leavePartsOnError: false,
  });

  parallelUploads3.on("httpUploadProgress", (progress) => {
    if (progress.loaded && typeof onProgress === "function") {
      onProgress(progress.loaded, progress.total);
    }
  });

  await parallelUploads3.done();

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
