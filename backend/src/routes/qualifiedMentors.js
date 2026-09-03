import express from "express";
import {
  createQualifiedMentor,
  getQualifiedMentors,
  updateQualifiedMentor,
  deleteQualifiedMentor,
} from "../controllers/qualifiedMentors.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

// Mount endpoints for Qualified Mentors
router.post("/create", upload.single("image"), createQualifiedMentor);
router.get("/all", getQualifiedMentors);
router.put("/:id", upload.single("image"), updateQualifiedMentor);
router.delete("/:id", deleteQualifiedMentor);

export default router;
