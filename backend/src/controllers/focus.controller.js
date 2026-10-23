import { FocusSession } from "../models/focusSession.model.js";

let cachedCount = 0;
let lastCacheTime = 0;
const CACHE_TTL_MS = 15000; // 15 seconds in-memory cache to eliminate redundant DB queries

// Helper to count active students in the last 2 minutes with in-memory caching
const getLiveActiveCount = async (forceFresh = false) => {
  const now = Date.now();
  if (!forceFresh && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedCount;
  }
  const twoMinutesAgo = new Date(now - 2 * 60 * 1000);
  cachedCount = await FocusSession.countDocuments({
    status: "active",
    lastPingAt: { $gte: twoMinutesAgo },
  });
  lastCacheTime = now;
  return cachedCount;
};

export const startFocusSession = async (req, res) => {
  try {
    const { userId, deviceId, userName, durationMinutes } = req.body;

    if (!userId && !deviceId) {
      return res.status(400).json({
        success: false,
        message: "userId or deviceId is required",
      });
    }

    // Cancel any older dangling active session for this user/device
    const userQuery = userId ? { userId } : { deviceId };
    await FocusSession.updateMany(
      { ...userQuery, status: "active" },
      { $set: { status: "cancelled", completedAt: new Date() } }
    );

    // Create new session
    const session = await FocusSession.create({
      userId: userId || null,
      deviceId: deviceId || null,
      userName: userName || "Student",
      durationMinutes: Number(durationMinutes) || 25,
      actualMinutes: 0,
      status: "active",
      startedAt: new Date(),
      lastPingAt: new Date(),
    });

    const activeStudents = await getLiveActiveCount();

    return res.status(201).json({
      success: true,
      sessionId: session._id,
      activeStudents,
      message: "Focus session started",
    });
  } catch (error) {
    console.error("Error starting focus session:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to start focus session",
      error: error.message,
    });
  }
};

export const pingFocusSession = async (req, res) => {
  try {
    const { sessionId, actualMinutes } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: "sessionId required" });
    }

    const updateData = { lastPingAt: new Date() };
    if (typeof actualMinutes === "number") {
      updateData.actualMinutes = actualMinutes;
    }

    await FocusSession.findByIdAndUpdate(sessionId, updateData);

    const activeStudents = await getLiveActiveCount();

    return res.status(200).json({
      success: true,
      activeStudents,
    });
  } catch (error) {
    console.error("Error pinging focus session:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to ping focus session",
      error: error.message,
    });
  }
};

export const stopFocusSession = async (req, res) => {
  try {
    const { sessionId, actualMinutes, status = "completed" } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: "sessionId required" });
    }

    const session = await FocusSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    session.status = status === "cancelled" ? "cancelled" : "completed";
    session.completedAt = new Date();
    if (typeof actualMinutes === "number") {
      session.actualMinutes = actualMinutes;
    } else {
      const minutesSpent = Math.max(
        1,
        Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60000)
      );
      session.actualMinutes = Math.min(minutesSpent, session.durationMinutes);
    }
    await session.save();

    const activeStudents = await getLiveActiveCount();

    return res.status(200).json({
      success: true,
      session,
      activeStudents,
      message: "Focus session ended",
    });
  } catch (error) {
    console.error("Error stopping focus session:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to stop focus session",
      error: error.message,
    });
  }
};

export const getFocusStats = async (req, res) => {
  try {
    const { userId, deviceId } = req.query;

    const activeStudents = await getLiveActiveCount();

    let todayMinutes = 0;
    let totalCompletedSessions = 0;

    const identifier = userId
      ? { userId }
      : deviceId
      ? { deviceId }
      : null;

    if (identifier) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const todaySessions = await FocusSession.find({
        ...identifier,
        status: "completed",
        completedAt: { $gte: startOfToday },
      });

      todayMinutes = todaySessions.reduce((acc, s) => acc + (s.actualMinutes || 0), 0);
      totalCompletedSessions = await FocusSession.countDocuments({
        ...identifier,
        status: "completed",
      });
    }

    return res.status(200).json({
      success: true,
      activeStudents,
      todayMinutes,
      totalCompletedSessions,
    });
  } catch (error) {
    console.error("Error fetching focus stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch focus stats",
      error: error.message,
    });
  }
};
