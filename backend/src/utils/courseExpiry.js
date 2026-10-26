import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Order } from "../models/order.model.js";
import { isTesterEmail } from "../config/env.js";

/**
 * Calculates the expiration Date object from a plan duration string.
 * Returns null if duration signifies Lifetime access or cannot be parsed as a time limit.
 *
 * Examples:
 * - "1 Month", "6 Months", "12 months" -> +N months
 * - "1 Year", "2 Years" -> +N years
 * - "30 Days", "45 days" -> +N days
 * - "Valid till 15 Feb 2027" -> parsed target date
 * - "Lifetime", "Lifetime Access" -> null
 */
export const calculatePlanExpiry = (planDuration, purchaseDate = new Date()) => {
  if (!planDuration || typeof planDuration !== "string") {
    return null;
  }

  const clean = planDuration.trim();
  const lower = clean.toLowerCase();

  // Lifetime access check
  if (lower.includes("lifetime") || lower.includes("unlimited")) {
    return null;
  }

  const baseDate = new Date(purchaseDate);

  // Check for "Valid till <date>" or "Valid until <date>"
  const validTillMatch = clean.match(/valid\s*(?:till|until)\s*[:\-]?\s*(.+)/i);
  if (validTillMatch && validTillMatch[1]) {
    const rawDateStr = validTillMatch[1].trim();
    let parsedTarget = new Date(rawDateStr);
    if (isNaN(parsedTarget.getTime())) {
      const parts = rawDateStr.split(/[\/\-\.]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          parsedTarget = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        } else {
          parsedTarget = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        }
      }
    }
    if (!isNaN(parsedTarget.getTime())) {
      // Set to end of that day (23:59:59)
      parsedTarget.setHours(23, 59, 59, 999);
      return parsedTarget;
    }
  }

  // Check for Month patterns (e.g. "1 Month", "6 Months", "12 months")
  const monthMatch = clean.match(/(\d+)\s*(?:month|months|mo)\b/i);
  if (monthMatch) {
    const count = parseInt(monthMatch[1], 10);
    if (!isNaN(count) && count > 0) {
      const expiry = new Date(baseDate);
      expiry.setMonth(expiry.getMonth() + count);
      return expiry;
    }
  }

  // Check for Year patterns (e.g. "1 Year", "2 Years", "1 yr")
  const yearMatch = clean.match(/(\d+)\s*(?:year|years|yr|yrs)\b/i);
  if (yearMatch) {
    const count = parseInt(yearMatch[1], 10);
    if (!isNaN(count) && count > 0) {
      const expiry = new Date(baseDate);
      expiry.setFullYear(expiry.getFullYear() + count);
      return expiry;
    }
  }

  // Check for Day patterns (e.g. "30 Days", "15 days")
  const dayMatch = clean.match(/(\d+)\s*(?:day|days)\b/i);
  if (dayMatch) {
    const count = parseInt(dayMatch[1], 10);
    if (!isNaN(count) && count > 0) {
      const expiry = new Date(baseDate);
      expiry.setDate(expiry.getDate() + count);
      return expiry;
    }
  }

  // Check if string itself is a direct parseable date
  const directDate = new Date(clean);
  if (!isNaN(directDate.getTime()) && directDate.getFullYear() > 2020) {
    directDate.setHours(23, 59, 59, 999);
    return directDate;
  }

  // Default fallback: if duration cannot be parsed as a time limit, treat as lifetime
  return null;
};

/**
 * Checks all enrolled courses for a given user and automatically removes (via $pull)
 * any course whose latest order validity has passed.
 *
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<User>} Updated user document
 */
export const syncUserCourseExpiry = async (userId, cachedUser = null) => {
  if (!userId) return null;

  try {
    const user = cachedUser || (await User.findById(userId));
    if (!user) return null;

    // Never expire courses for admin or demo reviewer
    if (user.role === "admin" || isTesterEmail(user.email)) {
      return user;
    }

    const purchasedList = user.purchasedCourse || [];
    const purchasedExamsList = user.purchasedExams || [];

    if (purchasedList.length === 0 && purchasedExamsList.length === 0) {
      return user;
    }

    const now = new Date();
    const coursesToRemove = [];
    const examsToRemove = [];

    // 1. Check Course Expiry
    if (purchasedList.length > 0) {
      const courseOrders = await Order.find({
        user: userId,
        course: { $exists: true },
        paymentGateway: { $ne: "failed" },
      })
        .select("course expiresAt planDuration createdAt")
        .sort({ createdAt: -1 })
        .lean();

      for (const courseRef of purchasedList) {
        const courseIdStr = courseRef?._id
          ? courseRef._id.toString()
          : courseRef.toString();

        const matchingOrders = courseOrders.filter((o) => {
          if (!o.course) return false;
          return o.course.toString() === courseIdStr;
        });

        if (matchingOrders.length === 0) {
          continue;
        }

        let hasActiveAccess = false;
        for (const ord of matchingOrders) {
          let expiry = ord.expiresAt;
          if (!expiry && ord.planDuration) {
            expiry = calculatePlanExpiry(ord.planDuration, ord.createdAt);
          }

          if (expiry === null) {
            hasActiveAccess = true;
            break;
          }

          if (new Date(expiry) > now) {
            hasActiveAccess = true;
            break;
          }
        }

        if (!hasActiveAccess) {
          coursesToRemove.push(courseIdStr);
        }
      }
    }

    // 2. Check Exam Expiry
    if (purchasedExamsList.length > 0) {
      const examOrders = await Order.find({
        user: userId,
        exam: { $exists: true },
        paymentGateway: { $ne: "failed" },
      })
        .select("exam expiresAt planDuration createdAt")
        .sort({ createdAt: -1 })
        .lean();

      for (const examRef of purchasedExamsList) {
        const examIdStr = examRef?._id
          ? examRef._id.toString()
          : examRef.toString();

        const matchingOrders = examOrders.filter((o) => {
          if (!o.exam) return false;
          return o.exam.toString() === examIdStr;
        });

        if (matchingOrders.length === 0) {
          continue;
        }

        let hasActiveAccess = false;
        for (const ord of matchingOrders) {
          let expiry = ord.expiresAt;
          if (!expiry && ord.planDuration) {
            expiry = calculatePlanExpiry(ord.planDuration, ord.createdAt);
          }

          if (expiry === null) {
            hasActiveAccess = true;
            break;
          }

          if (new Date(expiry) > now) {
            hasActiveAccess = true;
            break;
          }
        }

        if (!hasActiveAccess) {
          examsToRemove.push(examIdStr);
        }
      }
    }

    // 3. Apply updates if any courses or exams expired
    if (coursesToRemove.length > 0 || examsToRemove.length > 0) {
      const updateOps = {};

      if (coursesToRemove.length > 0) {
        console.log(
          `[Auto-Expiry] User ${user.email} has ${coursesToRemove.length} expired course(s):`,
          coursesToRemove
        );
        const objectIds = coursesToRemove
          .map((id) => {
            try {
              return new mongoose.Types.ObjectId(id);
            } catch {
              return null;
            }
          })
          .filter(Boolean);

        updateOps.purchasedCourse = { $in: [...coursesToRemove, ...objectIds] };
      }

      if (examsToRemove.length > 0) {
        console.log(
          `[Auto-Expiry] User ${user.email} has ${examsToRemove.length} expired exam(s):`,
          examsToRemove
        );
        const objectIds = examsToRemove
          .map((id) => {
            try {
              return new mongoose.Types.ObjectId(id);
            } catch {
              return null;
            }
          })
          .filter(Boolean);

        updateOps.purchasedExams = { $in: [...examsToRemove, ...objectIds] };
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $pull: updateOps },
        { returnDocument: "after" }
      );

      return updatedUser;
    }

    return user;
  } catch (error) {
    console.error("[Auto-Expiry] Error checking course expiry for user:", error);
    return null;
  }
};
