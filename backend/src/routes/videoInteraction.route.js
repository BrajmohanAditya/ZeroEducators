import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import {
  getVideoInteractions,
  toggleVideoLike,
  addVideoComment,
  deleteVideoComment,
} from "../controllers/videoInteraction.controller.js";

const router = express.Router();

// Public / optional auth: Get likes and comments
router.get("/:videoId", getVideoInteractions);

// Protected routes: Like, comment, delete comment
router.post("/:videoId/like", isLoggedIn, toggleVideoLike);
router.post("/:videoId/comment", isLoggedIn, addVideoComment);
router.delete("/comment/:commentId", isLoggedIn, deleteVideoComment);

export default router;
