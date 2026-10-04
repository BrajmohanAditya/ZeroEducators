import {
  S3Client,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
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
import path from "path";

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
 * Configure explicit CORS on Zata S3 Bucket for our specific domains
 * This allows both live domain (zeroeducators.com) and localhost without wildcard collisions
 */
export const configureBucketCors = async () => {
  try {
    const { PutBucketCorsCommand } = await import("@aws-sdk/client-s3");
    const corsCommand = new PutBucketCorsCommand({
      Bucket: ENV.ZATA_BUCKET_NAME,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["PUT", "POST", "GET", "HEAD"],
            AllowedOrigins: [
              "https://zeroeducators.com",
              "https://www.zeroeducators.com",
              "http://localhost:5173",
              "http://localhost:3000",
            ],
            ExposeHeaders: ["ETag", "x-amz-request-id"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    });
    await s3Client.send(corsCommand);
  } catch (err) {
    console.warn("[Zata S3] CORS rule notice:", err?.message || err);
  }
};

// Ensure specific domain CORS is set on boot
configureBucketCors().catch(() => {});

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
  onProgress = null,
  customKey = null,
  acl = null
) => {
  const cleanFileName = originalName ? originalName.replace(/\s+/g, "_") : "file";
  const uniqueKey = customKey || `${folder}/${Date.now()}-${cleanFileName}`;

  let body = fileInput;

  // If a file path string is passed, stream it from disk to prevent high memory usage
  if (typeof fileInput === "string") {
    body = fs.createReadStream(fileInput);
  }

  // Auto-grant public-read for HLS stream manifests and .ts segments so players can stream directly without SigV4 collisions
  const resolvedAcl = acl || (uniqueKey.includes("/hls/") ? "public-read" : undefined);

  const uploadParams = {
    Bucket: ENV.ZATA_BUCKET_NAME,
    Key: uniqueKey,
    Body: body,
    ContentType: mimeType,
  };
  if (resolvedAcl) {
    uploadParams.ACL = resolvedAcl;
  }

  // Upload using @aws-sdk/lib-storage (automatically performs multipart chunking for large files/videos)
  const parallelUploads3 = new Upload({
    client: s3Client,
    params: uploadParams,
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
 * Delete a file or an entire HLS folder from Zata Cloud Storage
 * @param {string} fileKey - the uniqueKey saved in DB (e.g. "courses/12345-image.png" or "courseModule/hls/173000-xyz")
 */
export const deleteFromZata = async (fileKey) => {
  if (!fileKey) return;

  // Clean if a full URL was passed instead of relative S3 key
  let cleanKey = fileKey;
  if (cleanKey.startsWith("http://") || cleanKey.startsWith("https://")) {
    try {
      const urlObj = new URL(cleanKey);
      let pathname = urlObj.pathname.replace(/^\/+/, "");
      if (pathname.startsWith(ENV.ZATA_BUCKET_NAME + "/")) {
        pathname = pathname.substring(ENV.ZATA_BUCKET_NAME.length + 1);
      }
      cleanKey = pathname;
    } catch {}
  }

  try {
    // If it's an HLS stream, folder, or directory key without file extension
    const isFolderOrHls =
      cleanKey.includes("/hls/") ||
      cleanKey.endsWith(".m3u8") ||
      cleanKey.endsWith("/") ||
      !path.extname(cleanKey);

    if (isFolderOrHls) {
      let folderPrefix = cleanKey;
      if (folderPrefix.endsWith("/index.m3u8")) {
        folderPrefix = folderPrefix.replace("/index.m3u8", "");
      } else if (folderPrefix.endsWith(".m3u8")) {
        folderPrefix = folderPrefix.substring(0, folderPrefix.lastIndexOf("/"));
      }

      if (!folderPrefix.endsWith("/")) {
        folderPrefix += "/";
      }

      let continuationToken = undefined;
      let totalDeleted = 0;
      do {
        const listCmd = new ListObjectsV2Command({
          Bucket: ENV.ZATA_BUCKET_NAME,
          Prefix: folderPrefix,
          ContinuationToken: continuationToken,
        });

        const listed = await s3Client.send(listCmd);
        if (listed.Contents && listed.Contents.length > 0) {
          const deleteParams = {
            Bucket: ENV.ZATA_BUCKET_NAME,
            Delete: {
              Objects: listed.Contents.map((obj) => ({ Key: obj.Key })),
              Quiet: true,
            },
          };
          await s3Client.send(new DeleteObjectsCommand(deleteParams));
          totalDeleted += listed.Contents.length;
        }
        continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
      } while (continuationToken);

      if (totalDeleted > 0) {
        console.log(`[Zata S3] Deleted ${totalDeleted} HLS files for folder: ${folderPrefix}`);
      }
    }

    // Always attempt deleting the specific key as well
    const command = new DeleteObjectCommand({
      Bucket: ENV.ZATA_BUCKET_NAME,
      Key: cleanKey,
    });
    return await s3Client.send(command);
  } catch (err) {
    console.error(`[Zata S3] Error deleting ${fileKey}:`, err);
    throw err;
  }
};

/**
 * Generate Presigned URLs for batch uploading an HLS folder directly to Zata S3
 */
export const getHlsBatchPresignedUrls = async (folderName, fileList = [], customPrefix = null) => {
  const cleanFolderName = folderName
    ? folderName.replace(/[^a-zA-Z0-9_-]/g, "_")
    : "lecture_hls";
  const s3Prefix = customPrefix
    ? `${customPrefix.replace(/^\/+|\/+$/g, "")}/${Date.now()}-${cleanFolderName}`
    : `courses/hls/${Date.now()}-${cleanFolderName}`;

  const urls = await Promise.all(
    fileList.map(async (item) => {
      const fileName = typeof item === "string" ? path.basename(item) : path.basename(item.name);
      const s3Key = `${s3Prefix}/${fileName}`;
      const contentType = fileName.endsWith(".m3u8")
        ? "application/vnd.apple.mpegurl"
        : "video/mp2t";

      const command = new PutObjectCommand({
        Bucket: ENV.ZATA_BUCKET_NAME,
        Key: s3Key,
        ContentType: contentType,
        ACL: "public-read",
      });

      const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 7200 });
      return {
        name: fileName,
        key: s3Key,
        presignedUrl,
        contentType,
      };
    })
  );

  const masterM3u8Url = `${ENV.ZATA_ENDPOINT}/${ENV.ZATA_BUCKET_NAME}/${s3Prefix}/index.m3u8`;

  return {
    folderPrefix: s3Prefix,
    masterM3u8Url,
    urls,
  };
};

// Aliases for convenience
export const uploadToB2 = uploadToZata;
export const deleteFromB2 = deleteFromZata;
export const uploadToStorage = uploadToZata;
export const deleteFromStorage = deleteFromZata;

