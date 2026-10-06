import { ENV } from "../src/config/env.js";
import mongoose from "mongoose";
import { Modules } from "../src/models/module.model.js";
import { Course } from "../src/models/course.model.js";
import { s3Client } from "../src/config/zata.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { fetchBunnyVideo, getBunnyHlsUrl } from "../src/config/bunny.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function updateCourseVideoRef(moduleId, bunnyGuid, originalVideo) {
  try {
    const courses = await Course.find({
      $or: [
        { "subjects.chapters.videos.moduleId": moduleId },
        { "topics.videos.moduleId": moduleId },
      ],
    });
    for (const c of courses) {
      let modified = false;
      for (const s of c.subjects || []) {
        for (const ch of s.chapters || []) {
          for (const v of ch.videos || []) {
            if (v.moduleId?.toString() === moduleId.toString()) {
              v.bunnyGuid = bunnyGuid;
              if (!v.originalZataVideo) v.originalZataVideo = originalVideo;
              modified = true;
            }
          }
        }
      }
      for (const t of c.topics || []) {
        for (const v of t.videos || []) {
          if (v.moduleId?.toString() === moduleId.toString()) {
            v.bunnyGuid = bunnyGuid;
            if (!v.originalZataVideo) v.originalZataVideo = originalVideo;
            modified = true;
          }
        }
      }
      if (modified) {
        await c.save();
      }
    }
  } catch (err) {
    console.warn(`Course ref update notice for module ${moduleId}:`, err.message || err);
  }
}

async function migrateAll() {
  console.log("🚀 Connecting to MongoDB...");
  await mongoose.connect(ENV.MONGO_URI);
  console.log(" Connected to MongoDB.\n");

  const modules = await Modules.find({});
  console.log(`📋 Total Modules in Database: ${modules.length}`);

  let queuedCount = 0;
  let alreadyMigratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < modules.length; i++) {
    const mod = modules[i];
    const prefix = `[${i + 1}/${modules.length}]`;

    // 1. Check if already has a bunnyGuid or is already using Bunny CDN
    if (mod.bunnyGuid || (mod.Video && mod.Video.includes("b-cdn.net"))) {
      console.log(`${prefix} ⏩ Already queued/migrated: "${mod.title}" (${mod.bunnyGuid || "Bunny CDN"})`);
      alreadyMigratedCount++;
      continue;
    }

    // 2. Check if it's a file on Zata
    const videoUrl = mod.Video || "";
    let s3Key = mod.Video_id || "";

    // Sanitize s3Key if it was stored as full URL
    if (s3Key.startsWith("http://") || s3Key.startsWith("https://")) {
      if (s3Key.includes("courseModule/")) {
        s3Key = "courseModule/" + s3Key.split("courseModule/")[1];
      } else if (s3Key.includes("courses/")) {
        s3Key = "courses/" + s3Key.split("courses/")[1];
      }
    }

    if (!s3Key && videoUrl.includes("courseModule/")) {
      s3Key = "courseModule/" + videoUrl.split("courseModule/")[1];
    }

    // Skip if it is an .m3u8 index manifest (Bunny fetch takes raw video files)
    if (s3Key.endsWith(".m3u8") || videoUrl.endsWith(".m3u8")) {
      console.log(`${prefix} ⚠️ Skipped HLS manifest (already segmented): "${mod.title}"`);
      skippedCount++;
      continue;
    }

    try {
      // 3. Generate 24-hour Presigned URL from Zata S3
      const getObjectCmd = new GetObjectCommand({
        Bucket: ENV.ZATA_BUCKET_NAME,
        Key: s3Key,
      });
      const presignedUrl = await getSignedUrl(s3Client, getObjectCmd, { expiresIn: 86400 });

      // 4. Trigger Bunny Video Fetch
      const cleanTitle = (mod.title || `Lecture_${mod._id}`).trim();
      const bunnyRes = await fetchBunnyVideo(presignedUrl, cleanTitle);

      if (!bunnyRes?.id) {
        throw new Error(bunnyRes?.message || "Failed to get video ID from Bunny API");
      }

      const bunnyGuid = bunnyRes.id;

      // 5. Update Module in MongoDB
      mod.bunnyGuid = bunnyGuid;
      mod.bunnyStatus = "processing";
      mod.originalZataVideo = mod.Video;
      mod.originalZataVideoId = mod.Video_id;
      await mod.save();

      // 6. Also update Course subjects.chapters.videos or topics.videos if referenced
      await updateCourseVideoRef(mod._id, bunnyGuid, mod.Video);

      console.log(`${prefix} ✅ Queued to Bunny: "${cleanTitle}" -> GUID: ${bunnyGuid}`);
      queuedCount++;

      // Small 300ms pause to respect API rate limits
      await sleep(300);
    } catch (err) {
      console.error(`${prefix} ❌ Error queueing "${mod.title}":`, err.message || err);
      errorCount++;
    }
  }

  console.log("\n==========================================");
  console.log("🎉 MIGRATION QUEUE COMPLETED!");
  console.log(`Total Modules:          ${modules.length}`);
  console.log(`Successfully Queued:    ${queuedCount}`);
  console.log(`Already on Bunny:       ${alreadyMigratedCount}`);
  console.log(`Skipped (HLS):          ${skippedCount}`);
  console.log(`Errors:                 ${errorCount}`);
  console.log("==========================================\n");

  await mongoose.disconnect();
}

migrateAll().catch((err) => {
  console.error("Fatal migration error:", err);
  process.exit(1);
});
