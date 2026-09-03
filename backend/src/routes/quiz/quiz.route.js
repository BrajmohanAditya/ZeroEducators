import express from "express";
import { isAdmin, isLoggedIn } from "../../middlewares/auth.middleware.js";
import {
  createQuiz,
  getQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
} from "../../controllers/quiz/quiz.controller.js";
import upload from "../../middlewares/multer.js";
import {
  toggleQuizLock,
  toggleQuizType,
} from "../../controllers/quiz/quiz.controller.js";
const quizRoute = express.Router();

// Notice we add isLoggedIn and adminRoute to protect the creation route!
quizRoute.post(
  "/create",
  upload.single("logo"),
  isLoggedIn,
  isAdmin,
  createQuiz,
);
quizRoute.get("/getQuizzes", getQuizzes);
quizRoute.get("/getQuiz/:id", getQuizById);
quizRoute.put(
  "/update/:id",
  upload.single("logo"),
  isLoggedIn,
  isAdmin,
  updateQuiz,
);
quizRoute.delete("/delete/:id", isLoggedIn, isAdmin, deleteQuiz);
quizRoute.patch("/toggle-lock/:id", isLoggedIn, isAdmin, toggleQuizLock);
quizRoute.patch("/quizType/:id", isLoggedIn, isAdmin, toggleQuizType);

export default quizRoute;
