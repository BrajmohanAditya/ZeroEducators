import {
  getAllBunnyVideos,
  backupSingleBunnyVideo,
} from "../services/bunnyBackup.service.js";

let isBackupRunning = false;
let backupState = {
  running: false,
  totalVideos: 0,
  processed: 0,
  uploaded: 0,
  skipped: 0,
  failed: 0,
  currentVideo: null,
  lastRunAt: null,
  lastError: null,
};

/**
 * Get current backup progress and status
 */
export const getBunnyBackupStatus = () => {
  return { ...backupState };
};

/**
 * Execute full backup of all Bunny Stream videos to Zata Cloud S3
 */
export const runBunnyVideosBackup = async ({ force = false } = {}) => {
  if (isBackupRunning) {
    return {
      success: false,
      message: "Backup job is already running in background",
      state: backupState,
    };
  }

  isBackupRunning = true;
  backupState = {
    running: true,
    totalVideos: 0,
    processed: 0,
    uploaded: 0,
    skipped: 0,
    failed: 0,
    currentVideo: null,
    lastRunAt: new Date().toISOString(),
    lastError: null,
  };

  // Run in background asynchronously so callers are not blocked
  (async () => {
    try {
      console.log("[Bunny-Auto-Backup] Starting full sync from Bunny Stream to Zata Cloud S3...");
      const { total, videos } = await getAllBunnyVideos();
      backupState.totalVideos = total;
      console.log(`[Bunny-Auto-Backup] Discovered ${total} videos on Bunny Stream.`);

      for (const video of videos) {
        // Skip unfinished / encoding videos
        if (video.status !== 4 && video.encodeProgress < 100) {
          console.log(`[Bunny-Auto-Backup] Skipping video still encoding (${video.title || video.guid})`);
          backupState.skipped++;
          backupState.processed++;
          continue;
        }

        backupState.currentVideo = {
          guid: video.guid,
          title: video.title,
        };

        try {
          const res = await backupSingleBunnyVideo(video, (loaded, totalBytes) => {
            // Optional live chunk log
          });

          if (res.status === "skipped") {
            backupState.skipped++;
          } else if (res.status === "uploaded") {
            backupState.uploaded++;
            console.log(`[Bunny-Auto-Backup] Successfully backed up: ${video.title} (${video.guid})`);
          }
        } catch (err) {
          console.error(`[Bunny-Auto-Backup] Error backing up video ${video.guid} (${video.title}):`, err.message);
          backupState.failed++;
          backupState.lastError = err.message;
        }

        backupState.processed++;
      }

      console.log(
        `[Bunny-Auto-Backup] Backup finished! Total: ${backupState.totalVideos}, Uploaded: ${backupState.uploaded}, Already Backed Up: ${backupState.skipped}, Failed: ${backupState.failed}`
      );
    } catch (err) {
      console.error("[Bunny-Auto-Backup] Fatal error during sync job:", err);
      backupState.lastError = err.message;
    } finally {
      backupState.running = false;
      backupState.currentVideo = null;
      isBackupRunning = false;
    }
  })();

  return {
    success: true,
    message: "Bunny Stream to Zata S3 backup initiated in background",
  };
};

/**
 * Automated Cron / Timer Schedule for Bunny Backup
 * Runs every 24 hours to automatically backup any new videos uploaded to Bunny
 */
export const startBunnyBackupSchedule = () => {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  // Run initial sync 30 seconds after boot (allows database & server to stabilize first)
  setTimeout(() => {
    console.log("[Bunny-Auto-Backup] Running initial server-boot sync to Zata Cloud S3...");
    runBunnyVideosBackup().catch((err) => {
      console.error("[Bunny-Auto-Backup] Error in initial boot sync:", err);
    });
  }, 30 * 1000);

  // Then schedule daily incremental sync
  setInterval(() => {
    console.log("[Bunny-Auto-Backup] Triggering automated daily backup check to Zata Cloud S3...");
    runBunnyVideosBackup().catch((err) => {
      console.error("[Bunny-Auto-Backup] Error in scheduled run:", err);
    });
  }, TWENTY_FOUR_HOURS);

  console.log("[Bunny-Auto-Backup] Automated daily sync to Zata Cloud S3 registered (runs on boot + every 24 hours).");
};
