import { Course } from "../models/course.model.js";
import { permanentlyDeleteCourseHelper } from "../controllers/course.controller.js";

const RETENTION_DAYS = 15;

/**
 * Clean up courses that have been in Trash for more than RETENTION_DAYS (15 days)
 */
export const runCourseAutoCleanup = async () => {
  try {
    const cutoffDate = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

    const expiredCourses = await Course.find({
      isDeleted: true,
      deletedAt: { $lte: cutoffDate },
    }).select("_id title deletedAt");

    if (!expiredCourses || expiredCourses.length === 0) {
      console.log(`[Auto-Cleanup] No courses in Trash older than ${RETENTION_DAYS} days.`);
      return;
    }

    console.log(
      `[Auto-Cleanup] Found ${expiredCourses.length} expired course(s) in Trash (> ${RETENTION_DAYS} days old). Cleaning up...`
    );

    for (const course of expiredCourses) {
      try {
        console.log(`[Auto-Cleanup] Permanently purging course: "${course.title}" (${course._id})...`);
        await permanentlyDeleteCourseHelper(course._id);
        console.log(`[Auto-Cleanup] Successfully purged course "${course.title}".`);
      } catch (err) {
        console.error(`[Auto-Cleanup] Failed to purge course "${course.title}" (${course._id}):`, err);
      }
    }

    console.log("[Auto-Cleanup] Expired courses cleanup complete.");
  } catch (error) {
    console.error("[Auto-Cleanup] Error running course auto-cleanup job:", error);
  }
};

/**
 * Start the daily background cleanup schedule
 */
export const startCourseCleanupJob = () => {
  // Run 10 seconds after server starts (ensures DB is connected)
  setTimeout(() => {
    runCourseAutoCleanup();
  }, 10000);

  // Run every 24 hours (24 * 60 * 60 * 1000 ms)
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  setInterval(() => {
    runCourseAutoCleanup();
  }, TWENTY_FOUR_HOURS);

  console.log(`[Auto-Cleanup] Course 15-day auto-delete schedule registered (runs every 24 hours).`);
};
