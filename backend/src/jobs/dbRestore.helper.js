import mongoose from "mongoose";
import zlib from "zlib";
import { s3Client } from "../config/zata.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { ENV } from "../config/env.js";

/**
 * Restore database from a backup file stored on Zata S3
 * @param {string} fileKey - S3 Key (e.g. "database-backups/backup-zeroeducators-2026-09-21-12345.json.gz")
 */
export const restoreDatabaseFromZata = async (fileKey) => {
  try {
    console.log(`[DB-Restore] Fetching backup from Zata Cloud: ${fileKey}...`);
    const getCommand = new GetObjectCommand({
      Bucket: ENV.ZATA_BUCKET_NAME,
      Key: fileKey,
    });

    const response = await s3Client.send(getCommand);
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const compressedBuffer = Buffer.concat(chunks);

    // Decompress Gzip
    const decompressedJson = zlib.gunzipSync(compressedBuffer).toString("utf-8");
    const backupData = JSON.parse(decompressedJson);

    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection not ready");

    console.log(`[DB-Restore] Backup timestamp: ${backupData.timestamp}. Restoring collections...`);

    let restoredCount = 0;
    for (const [colName, docs] of Object.entries(backupData.collections)) {
      if (!docs || docs.length === 0) continue;

      const col = db.collection(colName);
      // Upsert/Insert documents
      for (const doc of docs) {
        await col.replaceOne({ _id: doc._id }, doc, { upsert: true });
      }
      restoredCount += docs.length;
      console.log(`[DB-Restore] Restored ${docs.length} document(s) in collection "${colName}".`);
    }

    console.log(`[DB-Restore] Restoration finished successfully! Total ${restoredCount} document(s) restored.`);
    return { success: true, restoredCount };
  } catch (error) {
    console.error("[DB-Restore] Error restoring database:", error);
    return { success: false, error: error.message };
  }
};
