import { ENV } from "../src/config/env.js";
import mongoose from "mongoose";
import { Modules } from "../src/models/module.model.js";
import { Course } from "../src/models/course.model.js";
import { getBunnyVideo, getBunnyHlsUrl } from "../src/config/bunny.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function syncStatus() {
  console.log("🚀 Connecting to MongoDB...");
  await mongoose.connect(ENV.MONGO_URI);
  console.log("Connected to MongoDB.\n");

  const modules = await Modules.find({ bunnyGuid: { $exists: true, $ne: null } });
  console.log(`📋 Found ${modules.length} modules tracked on Bunny.\n`);

  let completedCount = 0;
  let processingCount = 0;
  let errorCount = 0;

  for (let i = 0; i < modules.length; i++) {
    const mod = modules[i];
    const prefix = `[${i + 1}/${modules.length}]`;

    try {
      const bunnyData = await getBunnyVideo(mod.bunnyGuid);
      const status = bunnyData.status; 
      // Bunny Status: 0=Created, 1=Uploaded, 2=Processing, 3=Transcoding, 4=Finished, 5=Error

      if (status === 4) {
        const hlsUrl = getBunnyHlsUrl(mod.bunnyGuid);

        const wasNotLive = mod.Video !== hlsUrl;
        mod.bunnyStatus = "completed";
        if (wasNotLive) {
          if (!mod.originalZataVideo) {
            mod.originalZataVideo = mod.Video;
            mod.originalZataVideoId = mod.Video_id;
          }
          mod.Video = hlsUrl;
          mod.Video_id = mod.bunnyGuid;
          await mod.save();

          // Sync to Course subjects.chapters.videos
          await Course.updateMany(
            { "subjects.chapters.videos.moduleId": mod._id },
            {
              $set: {
                "subjects.chapters.videos.$[elem].Video": hlsUrl,
                "subjects.chapters.videos.$[elem].Video_id": mod.bunnyGuid,
                "subjects.chapters.videos.$[elem].bunnyGuid": mod.bunnyGuid,
              },
            },
            { arrayFilters: [{ "elem.moduleId": mod._id }] }
          );

          console.log(`${prefix} 🎉 LIVE ON BUNNY CDN: "${mod.title}" (Resolutions: ${bunnyData.availableResolutions || "Auto"})`);
        } else {
          console.log(`${prefix} ✅ Already Live: "${mod.title}"`);
        }
        completedCount++;
      } else if (status === 5) {
        console.log(`${prefix} ❌ Bunny reported transcode error for "${mod.title}" (Guid: ${mod.bunnyGuid})`);
        mod.bunnyStatus = "error";
        await mod.save();
        errorCount++;
      } else {
        const progress = bunnyData.encodeProgress || 0;
        console.log(`${prefix} ⏳ Still Processing (${progress}%): "${mod.title}" (Status: ${status})`);
        mod.bunnyStatus = "processing";
        await mod.save();
        processingCount++;
      }

      await sleep(150);
    } catch (err) {
      console.error(`${prefix} ⚠️ Check error for "${mod.title}":`, err.message || err);
    }
  }

  console.log("\n==========================================");
  console.log("📊 SYNC STATUS SUMMARY");
  console.log(`Total Tracked:         ${modules.length}`);
  console.log(`Fully Transcoded (Live): ${completedCount}`);
  console.log(`Currently Processing:    ${processingCount}`);
  console.log(`Failed / Error:          ${errorCount}`);
  console.log("==========================================\n");

  await mongoose.disconnect();
}

syncStatus().catch((err) => {
  console.error("Fatal sync error:", err);
  process.exit(1);
});
