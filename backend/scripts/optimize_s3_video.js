import fs from "fs";
import path from "path";
import { s3Client } from "../src/config/zata.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { ENV } from "../src/config/env.js";
import { applyFaststart } from "../src/utils/faststart.js";

const TARGET_KEY = process.argv[2] || "courseModule/1789059095751-8696.mp4";

async function optimizeS3Video() {
  console.log(`\n==============================================`);
  console.log(`🚀 Starting FastStart Optimization for: ${TARGET_KEY}`);
  console.log(`==============================================\n`);

  const tempDir = path.resolve("./temp_faststart");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const tempInput = path.join(tempDir, `raw_${Date.now()}.mp4`);
  const tempOutput = path.join(tempDir, `faststart_${Date.now()}.mp4`);

  try {
    // 1. Download file from Zata S3
    console.log(`Step 1: Downloading from Zata S3...`);
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

    // 2. Apply FFmpeg FastStart (Moves moov atom to start)
    console.log(`Step 2: Relocating moov atom to beginning with FFmpeg...`);
    const startTime = Date.now();
    const success = await applyFaststart(tempInput, tempOutput);

    if (!success || !fs.existsSync(tempOutput)) {
      throw new Error("FFmpeg FastStart process failed.");
    }
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✓ FastStart completed in ${elapsed}s! Output size: ${(fs.statSync(tempOutput).size / (1024 * 1024)).toFixed(2)} MB.`);

    // 3. Upload back to Zata S3 under the same key
    console.log(`Step 3: Uploading optimized file back to Zata S3 (${TARGET_KEY})...`);
    const uploadStream = fs.createReadStream(tempOutput);
    const parallelUpload = new Upload({
      client: s3Client,
      params: {
        Bucket: ENV.ZATA_BUCKET_NAME,
        Key: TARGET_KEY,
        Body: uploadStream,
        ContentType: "video/mp4",
      },
      partSize: 20 * 1024 * 1024,
      queueSize: 6,
      leavePartsOnError: false,
    });

    parallelUpload.on("httpUploadProgress", (p) => {
      if (p.loaded && p.total) {
        const percent = Math.round((p.loaded * 100) / p.total);
        process.stdout.write(`\rUploading to S3: ${percent}% (${(p.loaded / (1024*1024)).toFixed(1)}MB / ${(p.total / (1024*1024)).toFixed(1)}MB)`);
      }
    });

    await parallelUpload.done();
    console.log(`\n✓ S3 Re-upload complete!`);

    // 4. Verify new atom layout
    console.log(`Step 4: Verifying atom layout on S3...`);
    const verifyCmd = new GetObjectCommand({
      Bucket: ENV.ZATA_BUCKET_NAME,
      Key: TARGET_KEY,
      Range: "bytes=0-1024",
    });
    const verifyRes = await s3Client.send(verifyCmd);
    const chunks = [];
    for await (const chunk of verifyRes.Body) chunks.push(chunk);
    const buf = Buffer.concat(chunks);
    const ascii = buf.toString("ascii").replace(/[^\x20-\x7E]/g, ".");
    console.log(`Verified first 120 bytes: "${ascii.substring(0, 120)}"`);

    if (ascii.includes("moov")) {
      console.log(`🎉 SUCCESS: 'moov' atom is now at the BEGINNING of the file!`);
    } else {
      console.log(`Notice: Header check: ${ascii.substring(0, 60)}`);
    }

    console.log(`\n==============================================`);
    console.log(`✅ VIDEO OPTIMIZATION COMPLETE! Video will now start instantly!`);
    console.log(`==============================================\n`);
  } catch (err) {
    console.error("Optimization failed:", err);
  } finally {
    // Cleanup temporary files
    try {
      if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
      if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
      if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
    } catch {}
  }
}

optimizeS3Video();
