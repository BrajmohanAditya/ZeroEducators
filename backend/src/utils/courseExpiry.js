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
    const parsedTarget = new Date(validTillMatch[1].trim());
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
export const syncUserCourseExpiry = async (userId) => {
  if (!userId) return null;

  try {
    const user = await User.findById(userId);
    if (!user) return null;

    // Never expire courses for admin or demo reviewer
    if (user.role === "admin" || isTesterEmail(user.email)) {
      return user;
    }

    const purchasedList = user.purchasedCourse || [];
    if (purchasedList.length === 0) {
      return user;
    }

    // Find all successful orders for this user
    const orders = await Order.find({
      user: userId,
      paymentGateway: { $ne: "failed" },
    }).sort({ createdAt: -1 });

    const now = new Date();
    const coursesToRemove = [];

    for (const courseRef of purchasedList) {
      const courseIdStr = courseRef?._id
        ? courseRef._id.toString()
        : courseRef.toString();

      // Find all orders associated with this specific course
      const courseOrders = orders.filter((o) => {
        if (!o.course) return false;
        return o.course.toString() === courseIdStr;
      });

      // If no order exists at all (e.g. legacy direct database insert without order), retain access
      if (courseOrders.length === 0) {
        continue;
      }

      // Check if user has ANY active order for this course
      let hasActiveAccess = false;

      for (const ord of courseOrders) {
        // If order already has expiresAt, use it; otherwise compute from planDuration
        let expiry = ord.expiresAt;
        if (!expiry && ord.planDuration) {
          expiry = calculatePlanExpiry(ord.planDuration, ord.createdAt);
        }

        // If expiry is null -> Lifetime access!
        if (expiry === null) {
          hasActiveAccess = true;
          break;
        }

        // If expiry date is still in the future -> Active access!
        if (new Date(expiry) > now) {
          hasActiveAccess = true;
          break;
        }
      }

      // If every order for this course has expired, mark for removal
      if (!hasActiveAccess) {
        coursesToRemove.push(courseIdStr);
      }
    }

    // If any courses expired, pull them from user's purchasedCourse array in DB
    if (coursesToRemove.length > 0) {
      console.log(
        `[Auto-Expiry] User ${user.email} has ${coursesToRemove.length} expired course(s):`,
        coursesToRemove
      );

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $pull: { purchasedCourse: { $in: coursesToRemove } },
        },
        { new: true }
      );

      return updatedUser;
    }

    return user;
  } catch (error) {
    console.error("[Auto-Expiry] Error checking course expiry for user:", error);
    return null;
  }
};
