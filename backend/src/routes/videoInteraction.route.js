import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import {
  getVideoInteractions,
  toggleVideoLike,
  addVideoComment,
  deleteVideoComment,
  rateVideo,
} from "../controllers/videoInteraction.controller.js";

const router = express.Router();

// Public / optional auth: Get likes, comments, and ratings
router.get("/:videoId", getVideoInteractions);

// Protected routes: Like, comment, delete comment, rate
router.post("/:videoId/like", isLoggedIn, toggleVideoLike);
router.post("/:videoId/comment", isLoggedIn, addVideoComment);
router.post("/:videoId/rating", isLoggedIn, rateVideo);
router.delete("/comment/:commentId", isLoggedIn, deleteVideoComment);

export default router;
