import express from "express";
import {
  createPremiumStudent,
  getPremiumStudents,
  updatePremiumStudent,
  deletePremiumStudent,
} from "../controllers/premium.student.controller.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

// Mount endpoints
router.post("/create", upload.single("image"), createPremiumStudent);
router.get("/all", getPremiumStudents);
router.put("/:id", upload.single("image"), updatePremiumStudent);
router.delete("/:id", deletePremiumStudent);

export default router;
