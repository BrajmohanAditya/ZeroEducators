import { runBunnyVideosBackup, getBunnyBackupStatus } from "../src/jobs/bunnyBackup.job.js";

async function main() {
  console.log("==================================================");
  console.log("  🚀 ZERO EDUCATORS - BUNNY STREAM TO ZATA S3 SYNC");
  console.log("==================================================");

  const result = await runBunnyVideosBackup();
  console.log("Initiated:", result.message);

  const interval = setInterval(() => {
    const status = getBunnyBackupStatus();
    if (status.running) {
      const current = status.currentVideo ? `[${status.currentVideo.title}]` : "";
      console.log(
        `⏳ Progress: ${status.processed}/${status.totalVideos} | Backed Up: ${status.uploaded} | Skipped: ${status.skipped} | Failed: ${status.failed} ${current}`
      );
    } else {
      clearInterval(interval);
      console.log("==================================================");
      console.log("  ✅ BUNNY BACKUP COMPLETED!");
      console.log(`  - Total Videos:    ${status.totalVideos}`);
      console.log(`  - Newly Uploaded:  ${status.uploaded}`);
      console.log(`  - Already Synced:  ${status.skipped}`);
      console.log(`  - Failed:          ${status.failed}`);
      if (status.lastError) {
        console.log(`  - Last Error:      ${status.lastError}`);
      }
      console.log("==================================================");
      process.exit(0);
    }
  }, 5000);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
