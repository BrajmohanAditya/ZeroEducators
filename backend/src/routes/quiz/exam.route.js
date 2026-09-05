import express from "express";
import { isAdmin, isLoggedIn } from "../../middlewares/auth.middleware.js";
import upload from "../../middlewares/multer.js";
import {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
  toggleExamLock,
} from "../../controllers/quiz/exam.controller.js";

const examRoute = express.Router();

examRoute.post("/create", isLoggedIn, isAdmin, upload.single("logo"), createExam);
examRoute.get("/all", getExams);
examRoute.get("/single/:id", getExamById);
examRoute.put("/update/:id", isLoggedIn, isAdmin, upload.single("logo"), updateExam);
examRoute.delete("/delete/:id", isLoggedIn, isAdmin, deleteExam);
examRoute.patch("/toggle-lock/:id", isLoggedIn, isAdmin, toggleExamLock);

export default examRoute;
