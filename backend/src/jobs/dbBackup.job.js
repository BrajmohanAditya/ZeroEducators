import mongoose from "mongoose";
import zlib from "zlib";
import { uploadToZata } from "../config/zata.js";

/**
 * Perform a full database backup of all collections and upload to Zata Cloud S3
 */
export const runMongoBackup = async () => {
  try {
    console.log("[DB-Backup] Starting full MongoDB backup...");
    const db = mongoose.connection.db;
    if (!db) {
      console.error("[DB-Backup] Database connection not ready. Skipping backup.");
      return { success: false, message: "Database connection not ready" };
    }

    const collections = await db.listCollections().toArray();
    const backupData = {
      timestamp: new Date().toISOString(),
      databaseName: db.databaseName,
      collections: {},
    };

    let totalDocs = 0;
    for (const col of collections) {
      const colName = col.name;
      // Skip system collections if any
      if (colName.startsWith("system.")) continue;

      const docs = await db.collection(colName).find({}).toArray();
      backupData.collections[colName] = docs;
      totalDocs += docs.length;
    }

    console.log(
      `[DB-Backup] Captured ${Object.keys(backupData.collections).length} collections with ${totalDocs} documents.`
    );

    // Convert to JSON string
    const jsonString = JSON.stringify(backupData, null, 2);

    // Compress with Gzip to minimize storage size (typically 80-90% smaller)
    const compressedBuffer = zlib.gzipSync(Buffer.from(jsonString, "utf-8"));

    const dateStr = new Date().toISOString().split("T")[0];
    const timestampStr = Date.now();
    const fileName = `backup-${db.databaseName}-${dateStr}-${timestampStr}.json.gz`;

    // Upload to Zata Cloud in the private 'database-backups' folder
    const uploadResult = await uploadToZata(
      compressedBuffer,
      fileName,
      "application/gzip",
      "database-backups"
    );

    console.log(`[DB-Backup] Backup successfully uploaded to Zata Cloud! Key: ${uploadResult.fileKey}`);

    return {
      success: true,
      fileKey: uploadResult.fileKey,
      collectionsCount: Object.keys(backupData.collections).length,
      documentsCount: totalDocs,
      originalSizeBytes: Buffer.byteLength(jsonString),
      compressedSizeBytes: compressedBuffer.length,
    };
  } catch (error) {
    console.error("[DB-Backup] Error during database backup:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Start daily automated backup schedule (every 24 hours)
 */
export const startDbBackupSchedule = () => {
  // First backup runs 30 seconds after server starts
  setTimeout(() => {
    runMongoBackup();
  }, 30000);

  // Then recurring every 24 hours (24 * 60 * 60 * 1000 ms)
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  setInterval(() => {
    runMongoBackup();
  }, TWENTY_FOUR_HOURS);

  console.log("[DB-Backup] Automated daily MongoDB backup schedule registered (runs every 24 hours to Zata S3).");
};
