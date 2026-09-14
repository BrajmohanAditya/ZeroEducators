import { VideoLike } from "../models/videoLike.model.js";
import { VideoComment } from "../models/videoComment.model.js";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";

// Helper to optionally parse user from token without throwing 401
const getOptionalUserId = (req) => {
  try {
    const token = req.cookies?.token || req.query?.token;
    if (!token) return null;
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    return decoded?.userId || null;
  } catch {
    return null;
  }
};

/**
 * GET /api/video-interaction/:videoId
 * Returns like count, user's like status, and comments list
 */
export const getVideoInteractions = async (req, res) => {
  try {
    const { videoId } = req.params;
    if (!videoId) {
      return res.status(400).json({ success: false, message: "Video ID is required" });
    }

    const currentUserId = req.user?._id || getOptionalUserId(req);

    // Parallel fetch: like count, user like check, comments list
    const [likeCount, userLike, comments] = await Promise.all([
      VideoLike.countDocuments({ videoId }),
      currentUserId ? VideoLike.exists({ videoId, user: currentUserId }) : null,
      VideoComment.find({ videoId })
        .populate("user", "name email role")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      likeCount,
      isLiked: Boolean(userLike),
      commentsCount: comments.length,
      comments,
    });
  } catch (error) {
    console.error("Error in getVideoInteractions:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch video interactions" });
  }
};

/**
 * POST /api/video-interaction/:videoId/like
 * Toggles like for current logged in user
 */
export const toggleVideoLike = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { courseId } = req.body;
    const userId = req.user._id;

    if (!videoId || !courseId) {
      return res.status(400).json({ success: false, message: "Video ID and Course ID are required" });
    }

    const existingLike = await VideoLike.findOne({ videoId, user: userId });

    let liked = false;
    if (existingLike) {
      await VideoLike.findByIdAndDelete(existingLike._id);
      liked = false;
    } else {
      await VideoLike.create({
        courseId,
        videoId,
        user: userId,
      });
      liked = true;
    }

    const likeCount = await VideoLike.countDocuments({ videoId });

    return res.status(200).json({
      success: true,
      liked,
      likeCount,
      message: liked ? "Video liked" : "Video unliked",
    });
  } catch (error) {
    console.error("Error in toggleVideoLike:", error);
    return res.status(500).json({ success: false, message: "Failed to update like status" });
  }
};

/**
 * POST /api/video-interaction/:videoId/comment
 * Adds a new comment on a video
 */
export const addVideoComment = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { courseId, comment } = req.body;
    const userId = req.user._id;

    if (!videoId || !courseId) {
      return res.status(400).json({ success: false, message: "Video ID and Course ID are required" });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: "Comment cannot be empty" });
    }

    const newComment = await VideoComment.create({
      courseId,
      videoId,
      user: userId,
      comment: comment.trim(),
    });

    const populatedComment = await VideoComment.findById(newComment._id)
      .populate("user", "name email role")
      .lean();

    return res.status(201).json({
      success: true,
      comment: populatedComment,
      message: "Comment posted successfully",
    });
  } catch (error) {
    console.error("Error in addVideoComment:", error);
    return res.status(500).json({ success: false, message: "Failed to post comment" });
  }
};

/**
 * DELETE /api/video-interaction/comment/:commentId
 * Deletes a comment (author or admin only)
 */
export const deleteVideoComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const comment = await VideoComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    const isAuthor = comment.user.toString() === userId.toString();
    const isAdmin = userRole === "admin";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ success: false, message: "You are not authorized to delete this comment" });
    }

    await VideoComment.findByIdAndDelete(commentId);

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteVideoComment:", error);
    return res.status(500).json({ success: false, message: "Failed to delete comment" });
  }
};
