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

/**
 * Inspect video resolution and duration using FFmpeg
 */
function getVideoInfo(inputFilePath) {
  return new Promise((resolve) => {
    const proc = spawn(ffmpegPath, ["-i", inputFilePath]);
    let stderr = "";
    proc.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    proc.on("close", () => {
      let width = 1280;
      let height = 720;
      let durationStr = "unknown";

      const resMatch = stderr.match(/Video:.*? (\d{3,5})x(\d{3,5})/);
      if (resMatch) {
        width = parseInt(resMatch[1], 10);
        height = parseInt(resMatch[2], 10);
      }

      const durMatch = stderr.match(/Duration: (\d{2}:\d{2}:\d{2}\.\d{2})/);
      if (durMatch) {
        durationStr = durMatch[1];
      }

      resolve({ width, height, durationStr });
    });
    proc.on("error", () => resolve({ width: 1280, height: 720, durationStr: "unknown" }));
  });
}

/**
 * Encode a single rendition to HLS (.ts chunks + .m3u8 playlist)
 */
function encodeRendition(inputFilePath, outputDir, rendition, segmentSeconds) {
  const playlistPath = path.join(outputDir, `${rendition.name}.m3u8`);
  const segmentPattern = path.join(outputDir, `${rendition.name}_%03d.ts`);

  const args = [
    "-y",
    "-i",
    inputFilePath,
    "-vf",
    `scale=w=${rendition.width}:h=${rendition.height}:force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2`,
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    String(rendition.crf),
    "-maxrate",
    rendition.maxrate,
    "-bufsize",
    rendition.bufsize,
    "-c:a",
    "aac",
    "-b:a",
    rendition.audioBitrate,
    "-ac",
    "2",
    "-g",
    "48",
    "-keyint_min",
    "48",
    "-sc_threshold",
    "0",
    "-start_number",
    "0",
    "-hls_time",
    String(segmentSeconds),
    "-hls_playlist_type",
    "vod",
    "-hls_flags",
    "independent_segments",
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
        process.stdout.write(`\r   ⏳ Progress: ${match[1]}`);
      }
    });

    proc.on("close", (code) => {
      process.stdout.write("\n");
      if (code === 0 && fs.existsSync(playlistPath)) {
        resolve(playlistPath);
      } else {
        reject(new Error(`FFmpeg error for ${rendition.name} (exit code ${code})`));
      }
    });

    proc.on("error", (err) => {
      reject(err);
    });
  });
}

/**
 * Create Master Playlist linking 720p, 480p, 360p
 */
function createMasterPlaylist(outputDir, renditions) {
  let content = "#EXTM3U\n#EXT-X-VERSION:3\n\n";

  for (const r of renditions) {
    content += `#EXT-X-STREAM-INF:BANDWIDTH=${r.bandwidth},AVERAGE-BANDWIDTH=${r.avgBandwidth},RESOLUTION=${r.width}x${r.height},NAME="${r.name}"\n`;
    content += `${r.name}.m3u8\n\n`;
  }

  // Create both index.m3u8 and master.m3u8 for maximum compatibility
  const indexPath = path.join(outputDir, "index.m3u8");
  const masterPath = path.join(outputDir, "master.m3u8");
  fs.writeFileSync(indexPath, content.trim() + "\n", "utf8");
  fs.writeFileSync(masterPath, content.trim() + "\n", "utf8");
}

/**
 * Multi-Variant HLS Transcoder (360p, 480p, 720p)
 */
async function convertVideoToMultiQualityHls(inputFilePath, outputDir, segmentSeconds = 4) {
  if (!fs.existsSync(inputFilePath)) {
    throw new Error(`File not found: ${inputFilePath}`);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log("\n=======================================================");
  console.log("🎬 ZERO EDUCATORS - MULTI-QUALITY HLS CONVERTER");
  console.log("   🌟 Renditions: 720p (HD), 480p (SD), 360p (Data Saver)");
  console.log("=======================================================");
  console.log(`📁 Input Video : ${inputFilePath}`);
  console.log(`📂 Output Dir  : ${outputDir}`);

  const info = await getVideoInfo(inputFilePath);
  console.log(`📐 Resolution  : ${info.width}x${info.height}`);
  console.log(`⏱️  Duration    : ${info.durationStr}`);
  console.log(`✂️  Segment Size: ${segmentSeconds} seconds`);
  console.log("-------------------------------------------------------");

  // Determine renditions based on source height
  const allRenditions = [
    {
      name: "720p",
      width: 1280,
      height: 720,
      crf: 22,
      maxrate: "1600k",
      bufsize: "2400k",
      audioBitrate: "128k",
      bandwidth: 1600000,
      avgBandwidth: 1400000,
      label: "720p HD",
    },
    {
      name: "480p",
      width: 854,
      height: 480,
      crf: 23,
      maxrate: "850k",
      bufsize: "1400k",
      audioBitrate: "96k",
      bandwidth: 900000,
      avgBandwidth: 800000,
      label: "480p SD",
    },
    {
      name: "360p",
      width: 640,
      height: 360,
      crf: 24,
      maxrate: "450k",
      bufsize: "800k",
      audioBitrate: "64k",
      bandwidth: 500000,
      avgBandwidth: 400000,
      label: "360p Data Saver",
    },
  ];

  // If source height is less than 720, skip 720p to avoid wasteful upscaling
  const renditionsToEncode = allRenditions.filter((r) => {
    if (info.height < 500 && r.height === 720) return false;
    return true;
  });

  const totalSteps = renditionsToEncode.length;
  const completedRenditions = [];

  for (let i = 0; i < renditionsToEncode.length; i++) {
    const r = renditionsToEncode[i];
    console.log(`\n[${i + 1}/${totalSteps}] 🚀 Encoding ${r.label}...`);
    await encodeRendition(inputFilePath, outputDir, r, segmentSeconds);
    completedRenditions.push(r);
    console.log(`   ✅ ${r.label} complete!`);
  }

  console.log("\n📝 Generating Master Playlist (index.m3u8 & master.m3u8)...");
  createMasterPlaylist(outputDir, completedRenditions);

  console.log("=======================================================");
  console.log("🎉 ALL RESOLUTIONS CONVERTED SUCCESSFULLY!");
  console.log("   • 720p HD playlist + segments");
  console.log("   • 480p SD playlist + segments");
  console.log("   • 360p Data Saver playlist + segments");
  console.log("   • index.m3u8 (Master playlist with auto/adaptive switching)");
  console.log("=======================================================");

  return path.join(outputDir, "index.m3u8");
}

/**
 * Single-Stream Ultra Fast Mode (Stream copy)
 */
async function convertVideoFastSingle(inputFilePath, outputDir, segmentSeconds = 4) {
  if (!fs.existsSync(inputFilePath)) {
    throw new Error(`File not found: ${inputFilePath}`);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const playlistPath = path.join(outputDir, "index.m3u8");
  const segmentPattern = path.join(outputDir, "segment_%03d.ts");

  console.log("\n=======================================================");
  console.log("🎬 ZERO EDUCATORS - ULTRA-FAST SINGLE HLS");
  console.log("=======================================================");
  console.log(`📁 Input Video : ${inputFilePath}`);
  console.log(`📂 Output Dir  : ${outputDir}`);
  console.log(`⏱️  Chunk Size  : ${segmentSeconds} seconds`);
  console.log("-------------------------------------------------------");
  console.log("🚀 Converting video into HLS (.m3u8 + .ts segments)...");

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
        // Also copy as master.m3u8
        fs.copyFileSync(playlistPath, path.join(outputDir, "master.m3u8"));
        console.log("✅ HLS Conversion Completed Successfully!");
        resolve(playlistPath);
      } else {
        console.log("\n⚠️ Stream copy notice: Trying fast re-encode with libx264...");
        reencodeSingleToHls(inputFilePath, outputDir, segmentSeconds)
          .then(resolve)
          .catch(reject);
      }
    });

    proc.on("error", reject);
  });
}

function reencodeSingleToHls(inputFilePath, outputDir, segmentSeconds) {
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
        fs.copyFileSync(playlistPath, path.join(outputDir, "master.m3u8"));
        console.log("✅ HLS Re-encode Completed Successfully!");
        resolve(playlistPath);
      } else {
        reject(new Error(`FFmpeg exited with error code ${code}`));
      }
    });

    proc.on("error", reject);
  });
}

/**
 * Upload all HLS files (.m3u8 and .ts) to Zata S3 with 10x concurrent upload pool
 */
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

  const files = fs
    .readdirSync(outputDir)
    .filter((f) => f.endsWith(".m3u8") || f.endsWith(".ts"));

  const total = files.length;
  console.log(`\n☁️  Uploading ${total} HLS files to Zata S3 (${bucketName})...`);

  const folderName = `${Date.now()}-${path
    .basename(outputDir)
    .replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const s3Prefix = `${remoteFolder}/${folderName}`;

  let uploadedCount = 0;
  const CONCURRENCY = 10;
  let fileIndex = 0;

  async function uploadWorker() {
    while (fileIndex < files.length) {
      const currentIndex = fileIndex++;
      const file = files[currentIndex];
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
      const percent = Math.round((uploadedCount / total) * 100);
      process.stdout.write(
        `\r📤 Uploading [${CONCURRENCY}x Parallel]: ${uploadedCount}/${total} files [${percent}%]`
      );
    }
  }

  const workers = Array(Math.min(CONCURRENCY, files.length))
    .fill(0)
    .map(() => uploadWorker());

  await Promise.all(workers);

  const masterM3u8Url = `${endpoint}/${bucketName}/${s3Prefix}/index.m3u8`;
  console.log("\n\n🎉 ALL HLS FILES UPLOADED TO ZATA S3!");
  console.log("=======================================================");
  console.log("🔗 YOUR MULTI-QUALITY HLS STREAM URL (Copy into Course/Module):");
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

  console.log("\nChoose Conversion Mode:");
  console.log("1) 🌟 Multi-Quality HLS (720p HD + 480p SD + 360p Data Saver) [RECOMMENDED]");
  console.log("2) ⚡ Fast Single-Quality (Stream Copy in 10-15s, original resolution)");
  const modeChoice = await askQuestion("Select mode [1/2] (Default is 1): ");

  const isMultiQuality = modeChoice.trim() !== "2";

  const baseName = path.basename(videoPath, path.extname(videoPath));
  const outputDir = path.join(path.dirname(videoPath), `${baseName}_hls`);

  try {
    if (isMultiQuality) {
      await convertVideoToMultiQualityHls(videoPath, outputDir, 4);
    } else {
      await convertVideoFastSingle(videoPath, outputDir, 4);
    }

    const shouldUpload = await askQuestion(
      "\n☁️  Do you want to upload this HLS video directly to Zata S3 now? (y/n): "
    );

    if (
      shouldUpload.toLowerCase() === "y" ||
      shouldUpload.toLowerCase() === "yes"
    ) {
      await uploadHlsToZata(outputDir);
    } else {
      console.log(`\n📁 HLS files saved locally in:\n👉 ${outputDir}`);
      console.log(
        "💡 You can upload this folder anytime later using: node converter/upload-hls.js"
      );
    }
  } catch (err) {
    console.error("\n❌ Conversion error:", err.message || err);
  }

  console.log("\nPress Enter to exit...");
  await askQuestion("");
}

main();
