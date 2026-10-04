import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function uploadHlsFolder(outputDir, remoteFolder = "courseModule/hls") {
  const endpoint = process.env.ZATA_ENDPOINT;
  const bucketName = process.env.ZATA_BUCKET_NAME;
  const accessKey = process.env.ZATA_ACCESS_KEY;
  const secretKey = process.env.ZATA_SECRET_KEY;
  const region = process.env.ZATA_REGION || "idr01";

  if (!endpoint || !bucketName || !accessKey || !secretKey) {
    console.error("\n❌ Zata S3 credentials not found in backend/.env!");
    return null;
  }

  let S3Client, PutObjectCommand;
  try {
    const s3Module = backendRequire("@aws-sdk/client-s3");
    S3Client = s3Module.S3Client;
    PutObjectCommand = s3Module.PutObjectCommand;
  } catch (err) {
    console.error("❌ Could not load @aws-sdk/client-s3 from backend:", err.message);
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

  if (files.length === 0) {
    console.error(`\n❌ No .m3u8 or .ts files found in: ${outputDir}`);
    return null;
  }

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
  console.log("==================================================================");
  console.log("🔗 YOUR HLS STREAM URL (Copy and paste this into Admin Panel):");
  console.log(`👉  ${masterM3u8Url}`);
  console.log("==================================================================\n");

  return masterM3u8Url;
}

async function main() {
  let folderPath = process.argv[2];

  if (!folderPath) {
    folderPath = await askQuestion("👉 Enter or drag-and-drop the converted HLS folder path: ");
  }

  folderPath = folderPath.replace(/^["']|["']$/g, "").trim();

  if (!folderPath || !fs.existsSync(folderPath)) {
    console.error("❌ Invalid folder path or folder does not exist.");
    process.exit(1);
  }

  const stat = fs.statSync(folderPath);
  if (!stat.isDirectory()) {
    console.error("❌ Please provide a directory containing .m3u8 and .ts files, not a single file.");
    process.exit(1);
  }

  try {
    await uploadHlsFolder(folderPath);
  } catch (err) {
    console.error("\n❌ Upload error:", err.message || err);
  }

  console.log("Press Enter to exit...");
  await askQuestion("");
}

main();
