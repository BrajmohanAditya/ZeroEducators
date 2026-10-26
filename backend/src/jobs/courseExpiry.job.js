import { User } from "../models/user.model.js";
import { syncUserCourseExpiry } from "../utils/courseExpiry.js";

/**
 * Automatically checks and removes expired courses for all enrolled non-admin students
 */
export const runAutoCourseExpiry = async () => {
  try {
    const usersWithAccess = await User.find({
      role: { $ne: "admin" },
      $or: [
        { purchasedCourse: { $exists: true, $not: { $size: 0 } } },
        { purchasedExams: { $exists: true, $not: { $size: 0 } } },
      ],
    }).select("_id email purchasedCourse purchasedExams role");

    if (!usersWithAccess || usersWithAccess.length === 0) {
      return;
    }

    let expiredCount = 0;
    for (const user of usersWithAccess) {
      try {
        const prevCount =
          (user.purchasedCourse?.length || 0) + (user.purchasedExams?.length || 0);
        const updated = await syncUserCourseExpiry(user._id, user);
        const newCount =
          (updated?.purchasedCourse?.length || 0) + (updated?.purchasedExams?.length || 0);
        if (prevCount > newCount) {
          expiredCount += prevCount - newCount;
        }
      } catch (err) {
        console.error(`[Auto-Expiry-Job] Error syncing user ${user.email}:`, err?.message || err);
      }
    }

    if (expiredCount > 0) {
      console.log(`[Auto-Expiry-Job] Auto-expired ${expiredCount} course/exam access(es) across users.`);
    }
  } catch (error) {
    console.error("[Auto-Expiry-Job] Error running auto-expiry job:", error);
  }
};

/**
 * Start the background course expiry schedule (runs every 1 hour)
 */
export const startCourseExpiryJob = () => {
  // Run 15 seconds after server start (ensures DB connection is stable)
  setTimeout(() => {
    runAutoCourseExpiry();
  }, 15000);

  // Run every 1 hour (60 * 60 * 1000 ms)
  const ONE_HOUR = 60 * 60 * 1000;
  setInterval(() => {
    runAutoCourseExpiry();
  }, ONE_HOUR);

  console.log(`[Course-Expiry-Job] Course auto-expiry schedule registered (runs every 1 hour).`);
};
