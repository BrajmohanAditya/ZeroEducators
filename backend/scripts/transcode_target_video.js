import fs from "fs";
import path from "path";
import { s3Client, uploadToZata as uploadToB2 } from "../src/config/zata.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { ENV } from "../src/config/env.js";
import { transcodeToQuality } from "../src/utils/videoTranscoder.js";

const TARGET_KEY = process.argv[2] || "courseModule/1789059095751-8696.mp4";

async function transcodeExistingVideo() {
  console.log(`\n======================================================`);
  console.log(`🚀 Transcoding Existing S3 Video to Multi-Bitrate: ${TARGET_KEY}`);
  console.log(`======================================================\n`);

  const tempDir = path.resolve("./temp_transcode_manual");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const ext = path.extname(TARGET_KEY) || ".mp4";
  const baseKey = TARGET_KEY.replace(ext, "");
  const tempInput = path.join(tempDir, `source_${Date.now()}${ext}`);

  try {
    // 1. Download original video from S3
    console.log(`Step 1: Downloading ${TARGET_KEY} from S3...`);
    const getCmd = new GetObjectCommand({
      Bucket: ENV.ZATA_BUCKET_NAME,
      Key: TARGET_KEY,
    });
    const s3Res = await s3Client.send(getCmd);
    const writeStream = fs.createWriteStream(tempInput);
    
    await new Promise((resolve, reject) => {
      s3Res.Body.pipe(writeStream);
      s3Res.Body.on("error", reject);
      writeStream.on("finish", resolve);
    });

    const inputSizeMB = (fs.statSync(tempInput).size / (1024 * 1024)).toFixed(2);
    console.log(`✓ Downloaded ${inputSizeMB} MB to local disk.`);

    // 2. Transcode to 360p and 480p
    const qualities = ["360p", "480p"];
    for (const q of qualities) {
      console.log(`\nStep 2 [${q}]: Transcoding to ${q}...`);
      const tempOutput = path.join(tempDir, `variant_${q}_${Date.now()}${ext}`);
      const startTime = Date.now();
      const success = await transcodeToQuality(tempInput, tempOutput, q);

      if (!success || !fs.existsSync(tempOutput)) {
        console.error(`✗ Failed to transcode ${q}`);
        continue;
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const outSizeMB = (fs.statSync(tempOutput).size / (1024 * 1024)).toFixed(2);
      console.log(`✓ Transcoded to ${q} in ${elapsed}s! Output size: ${outSizeMB} MB.`);

      // 3. Upload variant back to S3 with custom key
      const targetVariantKey = `${baseKey}_${q}${ext}`;
      console.log(`Step 3 [${q}]: Uploading to S3 (${targetVariantKey})...`);
      
      await uploadToB2(
        tempOutput,
        path.basename(targetVariantKey),
        "video/mp4",
        "courseModule",
        null,
        targetVariantKey
      );

      console.log(`✓ S3 Upload complete for ${targetVariantKey}!`);

      try {
        fs.unlinkSync(tempOutput);
      } catch {}
    }

    console.log(`\n======================================================`);
    console.log(`✅ MULTI-QUALITY TRANSCODING COMPLETE! Both 360p & 480p are live on S3!`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error("Transcoding failed:", err);
  } finally {
    try {
      if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
      if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
    } catch {}
  }
}

transcodeExistingVideo();
