import {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
  PutBucketCorsCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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
 * Clear any custom bucket CORS rules so Zata's gateway Nginx proxy handles CORS cleanly
 * without duplicating Access-Control-Allow-Origin headers ('*, http://localhost:5173')
 */
export const cleanBucketCors = async () => {
  try {
    const { DeleteBucketCorsCommand } = await import("@aws-sdk/client-s3");
    await s3Client.send(new DeleteBucketCorsCommand({ Bucket: ENV.ZATA_BUCKET_NAME }));
  } catch (_) {
    // Ignore if no CORS config exists
  }
};

// Ensure clean CORS on boot
cleanBucketCors().catch(() => {});

/**
 * Generate a pre-signed URL for direct browser-to-S3 upload
 * @param {string} fileName - original file name
 * @param {string} mimeType - file MIME type (e.g. "video/mp4")
 * @param {string} folder - sub-folder name (default "courseModule")
 * @returns {Promise<{uploadUrl: string, fileKey: string, publicUrl: string}>}
 */
export const getPresignedUploadUrl = async (
  fileName,
  mimeType = "video/mp4",
  folder = "courseModule"
) => {
  const cleanFileName = fileName ? fileName.replace(/[^a-zA-Z0-9.-]/g, "_") : "video.mp4";
  const uniqueKey = `${folder}/${Date.now()}-${cleanFileName}`;

  const command = new PutObjectCommand({
    Bucket: ENV.ZATA_BUCKET_NAME,
    Key: uniqueKey,
    ContentType: mimeType || "video/mp4",
  });

  // URL valid for 2 hours to allow large uploads to complete
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 7200 });
  const publicUrl = `${ENV.ZATA_ENDPOINT}/${ENV.ZATA_BUCKET_NAME}/${uniqueKey}`;

  return {
    uploadUrl,
    fileKey: uniqueKey,
    publicUrl,
  };
};

/**
 * Initiate S3 Multipart Upload
 */
export const initiateMultipartUpload = async (
  fileName,
  mimeType = "video/mp4",
  folder = "courseModule"
) => {
  const cleanFileName = fileName ? fileName.replace(/[^a-zA-Z0-9.-]/g, "_") : "video.mp4";
  const uniqueKey = `${folder}/${Date.now()}-${cleanFileName}`;

  const command = new CreateMultipartUploadCommand({
    Bucket: ENV.ZATA_BUCKET_NAME,
    Key: uniqueKey,
    ContentType: mimeType || "video/mp4",
  });

  const response = await s3Client.send(command);
  const publicUrl = `${ENV.ZATA_ENDPOINT}/${ENV.ZATA_BUCKET_NAME}/${uniqueKey}`;

  return {
    uploadId: response.UploadId,
    fileKey: uniqueKey,
    publicUrl,
  };
};

/**
 * Generate Presigned URLs for multiple parts (batch)
 */
export const getMultipartPartUrls = async (fileKey, uploadId, partNumbers = []) => {
  const partUrls = await Promise.all(
    partNumbers.map(async (partNumber) => {
      const command = new UploadPartCommand({
        Bucket: ENV.ZATA_BUCKET_NAME,
        Key: fileKey,
        UploadId: uploadId,
        PartNumber: Number(partNumber),
      });

      const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 7200 });
      return {
        partNumber: Number(partNumber),
        presignedUrl,
      };
    })
  );

  return partUrls;
};

/**
 * Complete S3 Multipart Upload by merging all parts
 */
export const completeMultipartUpload = async (fileKey, uploadId, parts = []) => {
  const sortedParts = [...parts].sort((a, b) => a.PartNumber - b.PartNumber);

  const command = new CompleteMultipartUploadCommand({
    Bucket: ENV.ZATA_BUCKET_NAME,
    Key: fileKey,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: sortedParts,
    },
  });

  const response = await s3Client.send(command);
  const publicUrl = `${ENV.ZATA_ENDPOINT}/${ENV.ZATA_BUCKET_NAME}/${fileKey}`;

  return {
    success: true,
    location: response.Location || publicUrl,
    publicUrl,
    fileKey,
  };
};

/**
 * Abort an unfinished Multipart Upload
 */
export const abortMultipartUpload = async (fileKey, uploadId) => {
  try {
    const command = new AbortMultipartUploadCommand({
      Bucket: ENV.ZATA_BUCKET_NAME,
      Key: fileKey,
      UploadId: uploadId,
    });
    await s3Client.send(command);
    return { success: true };
  } catch (err) {
    console.warn("[Zata S3] Abort multipart upload notice:", err?.message || err);
    return { success: false, message: err?.message };
  }
};

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
