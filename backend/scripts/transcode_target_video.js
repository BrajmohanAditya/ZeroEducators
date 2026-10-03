/**
 * ─────────────────────────────────────────────────────────────────────────────
 * HLS Transcoding Script for EXISTING Videos
 *
 * Usage:
 *   node scripts/transcode_target_video.js [S3_KEY]
 *
 * Example:
 *   node scripts/transcode_target_video.js courseModule/1789059095751-8696.mp4
 *
 * What it does:
 *   1. Downloads the original video from S3
 *   2. Transcodes to 360p + 480p + 720p HLS (.ts segments + .m3u8)
 *   3. Uploads all HLS files back to S3
 *   4. Also creates 360p + 480p MP4 fallback variants
 *   5. Prints the master .m3u8 URL → save this in the DB as the video src
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs from "fs";
import path from "path";
import { s3Client, uploadToZata as uploadToB2 } from "../src/config/zata.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { ENV } from "../src/config/env.js";
import { transcodeToHls, transcodeToQuality } from "../src/utils/videoTranscoder.js";

const TARGET_KEY = process.argv[2] || "courseModule/1789059095751-8696.mp4";

// Build the public base URL from env (e.g. https://s3.zata.ai/bucketname)
const S3_BASE_URL = `${ENV.ZATA_ENDPOINT}/${ENV.ZATA_BUCKET_NAME}`;

async function run() {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀  HLS + Multi-Quality Transcoder`);
  console.log(`📄  Target: ${TARGET_KEY}`);
  console.log(`${"=".repeat(60)}\n`);

  // ── Step 1: Download original video from S3 ───────────────────────────────
  const tempDir   = path.resolve("./temp_transcode_manual");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const ext       = path.extname(TARGET_KEY) || ".mp4";
  const tempInput = path.join(tempDir, `source_${Date.now()}${ext}`);

  console.log(`[1/4] Downloading ${TARGET_KEY} from S3...`);
  try {
    const getCmd = new GetObjectCommand({ Bucket: ENV.ZATA_BUCKET_NAME, Key: TARGET_KEY });
    const s3Res  = await s3Client.send(getCmd);
    const ws     = fs.createWriteStream(tempInput);

    await new Promise((resolve, reject) => {
      s3Res.Body.pipe(ws);
      s3Res.Body.on("error", reject);
      ws.on("finish", resolve);
    });

    const sizeMb = (fs.statSync(tempInput).size / (1024 * 1024)).toFixed(2);
    console.log(`✓  Downloaded ${sizeMb} MB\n`);
  } catch (err) {
    console.error("✗  Download failed:", err.message);
    process.exit(1);
  }

  // ── Step 2: Generate HLS stream (primary) ─────────────────────────────────
  console.log("[2/4] Generating HLS stream (360p + 480p + 720p)...");
  const masterUrl = await transcodeToHls(tempInput, TARGET_KEY, S3_BASE_URL);

  if (masterUrl) {
    console.log(`\n✅  HLS Master Manifest URL (save this in DB):`);
    console.log(`    ${masterUrl}\n`);
  } else {
    console.warn("⚠️   HLS generation failed — continuing with MP4 fallback only\n");
  }

  // ── Step 3: Generate MP4 fallback variants (360p + 480p) ──────────────────
  console.log("[3/4] Generating MP4 fallback variants (360p + 480p)...");
  const baseKey   = TARGET_KEY.replace(ext, "");
  const qualities = ["360p", "480p"];

  for (const q of qualities) {
    const outPath = path.join(tempDir, `variant_${q}_${Date.now()}${ext}`);
    console.log(`      Transcoding ${q}...`);
    const success = await transcodeToQuality(tempInput, outPath, q);

    if (success && fs.existsSync(outPath)) {
      const targetKey = `${baseKey}_${q}${ext}`;
      const sizeMb    = (fs.statSync(outPath).size / (1024 * 1024)).toFixed(2);
      console.log(`      Uploading ${q} (${sizeMb} MB) → ${targetKey}`);

      await uploadToB2(outPath, path.basename(targetKey), "video/mp4", "courseModule", null, targetKey);
      try { fs.unlinkSync(outPath); } catch {}
      console.log(`      ✓ ${q} MP4 uploaded`);
    } else {
      console.warn(`      ✗ ${q} MP4 failed — skipped`);
    }
  }

  // ── Step 4: Cleanup ───────────────────────────────────────────────────────
  console.log("\n[4/4] Cleaning up local temp files...");
  try {
    if (fs.existsSync(tempInput))  fs.unlinkSync(tempInput);
    if (fs.existsSync(tempDir))    fs.rmdirSync(tempDir);
  } catch { /* ignore */ }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`✅  COMPLETE!`);
  if (masterUrl) {
    console.log(`\n🔗  HLS URL to save in DB:`);
    console.log(`    ${masterUrl}`);
  }
  console.log(`${"=".repeat(60)}\n`);
}

run().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
