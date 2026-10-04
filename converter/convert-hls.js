import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import readline from "readline";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use backend's node_modules directly so no separate npm install is required
const backendDir = path.resolve(__dirname, "../backend");
const backendRequire = createRequire(path.join(backendDir, "package.json"));

// Load dotenv from backend
try {
  const dotenv = backendRequire("dotenv");
  const envPath = path.join(backendDir, ".env");
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
} catch {
  // ignore
}

// Locate FFmpeg binary (bundled installer or system)
function getFfmpegPath() {
  const bundled = path.resolve(
    backendDir,
    "node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe"
  );
  if (fs.existsSync(bundled)) {
    return bundled;
  }
  return "ffmpeg";
}

const ffmpegPath = getFfmpegPath();

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

async function convertVideoToHls(inputFilePath, outputDir, segmentSeconds = 4) {
  if (!fs.existsSync(inputFilePath)) {
    throw new Error(`File not found: ${inputFilePath}`);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const playlistPath = path.join(outputDir, "index.m3u8");
  const segmentPattern = path.join(outputDir, "segment_%03d.ts");

  console.log("\n=======================================================");
  console.log("🎬 ZERO EDUCATORS - HLS CONVERTER (Ultra-Fast ⚡)");
  console.log("=======================================================");
  console.log(`📁 Input Video : ${inputFilePath}`);
  console.log(`📂 Output Dir   : ${outputDir}`);
  console.log(`⏱️  Chunk Size  : ${segmentSeconds} seconds`);
  console.log("-------------------------------------------------------");
  console.log("🚀 Converting video into HLS (.m3u8 + .ts segments)...");

  // Ultra-fast conversion using stream copy (takes 5-15 seconds, 0 quality loss)
  const args = [
    "-y",
    "-i",
    inputFilePath,
    "-c:v",
    "copy",
    "-c:a",
    "copy",
    "-sn",
    "-start_number",
    "0",
    "-hls_time",
    String(segmentSeconds),
    "-hls_list_size",
    "0",
    "-f",
    "hls",
    "-hls_segment_filename",
    segmentPattern,
    playlistPath,
  ];

  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args);

    proc.stderr.on("data", (data) => {
      const msg = data.toString();
      const match = msg.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
      if (match) {
        process.stdout.write(`\r⏳ Processing progress: ${match[1]}`);
      }
    });

    proc.on("close", (code) => {
      process.stdout.write("\n");
      if (code === 0 && fs.existsSync(playlistPath)) {
        console.log("✅ HLS Conversion Completed Successfully!");
        resolve(playlistPath);
      } else {
        console.log("\n⚠️ Stream copy notice: Trying fast re-encode with standard H.264...");
        reencodeToHls(inputFilePath, outputDir, segmentSeconds)
          .then(resolve)
          .catch(reject);
      }
    });

    proc.on("error", (err) => {
      reject(err);
    });
  });
}

function reencodeToHls(inputFilePath, outputDir, segmentSeconds) {
  const playlistPath = path.join(outputDir, "index.m3u8");
  const segmentPattern = path.join(outputDir, "segment_%03d.ts");

  const args = [
    "-y",
    "-i",
    inputFilePath,
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "23",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-start_number",
    "0",
    "-hls_time",
    String(segmentSeconds),
    "-hls_list_size",
    "0",
    "-f",
    "hls",
    "-hls_segment_filename",
    segmentPattern,
    playlistPath,
  ];

  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args);
    proc.stderr.on("data", (data) => {
      const msg = data.toString();
      const match = msg.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
      if (match) {
        process.stdout.write(`\r⏳ Encoding progress: ${match[1]}`);
      }
    });

    proc.on("close", (code) => {
      process.stdout.write("\n");
      if (code === 0) {
        console.log("✅ HLS Re-encode Completed Successfully!");
        resolve(playlistPath);
      } else {
        reject(new Error(`FFmpeg exited with error code ${code}`));
      }
    });

    proc.on("error", reject);
  });
}

async function uploadHlsToZata(outputDir, remoteFolder = "courseModule/hls") {
  const endpoint = process.env.ZATA_ENDPOINT;
  const bucketName = process.env.ZATA_BUCKET_NAME;
  const accessKey = process.env.ZATA_ACCESS_KEY;
  const secretKey = process.env.ZATA_SECRET_KEY;
  const region = process.env.ZATA_REGION || "idr01";

  if (!endpoint || !bucketName || !accessKey || !secretKey) {
    console.warn("\n⚠️ Zata S3 credentials not fully found in backend/.env.");
    console.warn("Skipping automatic upload. HLS files are ready in your local folder!");
    return null;
  }

  let S3Client, PutObjectCommand;
  try {
    const s3Module = backendRequire("@aws-sdk/client-s3");
    S3Client = s3Module.S3Client;
    PutObjectCommand = s3Module.PutObjectCommand;
  } catch (err) {
    console.warn("Could not load @aws-sdk/client-s3 from backend:", err.message);
    return null;
  }

  const s3 = new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
    forcePathStyle: true,
  });

  const files = fs.readdirSync(outputDir);
  const total = files.length;
  console.log(`\n☁️  Uploading ${total} HLS files to Zata S3 (${bucketName})...`);

  const folderName = `${Date.now()}-${path.basename(outputDir)}`;
  const s3Prefix = `${remoteFolder}/${folderName}`;

  let uploadedCount = 0;

  for (const file of files) {
    const filePath = path.join(outputDir, file);
    const s3Key = `${s3Prefix}/${file}`;
    const contentType = file.endsWith(".m3u8")
      ? "application/vnd.apple.mpegurl"
      : "video/mp2t";

    const fileBuffer = fs.readFileSync(filePath);

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: contentType,
        ACL: "public-read",
      })
    );

    uploadedCount++;
    process.stdout.write(
      `\r📤 Uploading: ${uploadedCount}/${total} files [${Math.round(
        (uploadedCount / total) * 100
      )}%]`
    );
  }

  const masterM3u8Url = `${endpoint}/${bucketName}/${s3Prefix}/index.m3u8`;
  console.log("\n\n🎉 ALL HLS FILES UPLOADED TO ZATA S3!");
  console.log("=======================================================");
  console.log("🔗 YOUR HLS STREAM URL (Copy this into Course/Module):");
  console.log(`👉  ${masterM3u8Url}`);
  console.log("=======================================================\n");

  return masterM3u8Url;
}

async function main() {
  let videoPath = process.argv[2];

  if (!videoPath) {
    videoPath = await askQuestion("👉 Enter or drag-and-drop the video file path: ");
  }

  // Remove surrounding quotes if dropped from Windows Explorer
  videoPath = videoPath.replace(/^["']|["']$/g, "").trim();

  if (!videoPath || !fs.existsSync(videoPath)) {
    console.error("❌ Invalid file path or file does not exist.");
    process.exit(1);
  }

  const baseName = path.basename(videoPath, path.extname(videoPath));
  const outputDir = path.join(path.dirname(videoPath), `${baseName}_hls`);

  try {
    await convertVideoToHls(videoPath, outputDir, 4);

    const shouldUpload = await askQuestion(
      "\n☁️  Do you want to upload this HLS video directly to Zata S3 now? (y/n): "
    );

    if (shouldUpload.toLowerCase() === "y" || shouldUpload.toLowerCase() === "yes") {
      await uploadHlsToZata(outputDir);
    } else {
      console.log(`\n📁 HLS files saved locally in:\n👉 ${outputDir}`);
    }
  } catch (err) {
    console.error("\n❌ Conversion error:", err.message || err);
  }

  console.log("\nPress Enter to exit...");
  await askQuestion("");
}

main();
