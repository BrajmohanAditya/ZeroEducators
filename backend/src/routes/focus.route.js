import express from "express";
import {
  startFocusSession,
  pingFocusSession,
  stopFocusSession,
  getFocusStats,
} from "../controllers/focus.controller.js";

const router = express.Router();

router.post("/start", startFocusSession);
router.post("/ping", pingFocusSession);
router.post("/stop", stopFocusSession);
router.get("/stats", getFocusStats);

export default router;
