import express from "express";
import {
  createSuccessBoard,
  getSuccessBoard,
  updateSuccessBoard,
  deleteSuccessBoard,
} from "../controllers/success.board.controller.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

// Mount endpoints for Success Board
router.post("/create", upload.single("image"), createSuccessBoard);
router.get("/all", getSuccessBoard);
router.put("/:id", upload.single("image"), updateSuccessBoard);
router.delete("/:id", deleteSuccessBoard);

export default router;
