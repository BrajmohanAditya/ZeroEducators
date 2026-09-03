import express from "express";
import { isLoggedIn } from "../../middlewares/auth.middleware.js";
import {
  submitQuiz,
  getMyResults,
  getAllQuizResults,
} from "../../controllers/quiz/quiz.result.controller.js";

const quizResultRoute = express.Router();

quizResultRoute.post("/submit", isLoggedIn, submitQuiz);
quizResultRoute.get("/my-results", isLoggedIn, getMyResults);
quizResultRoute.get("/all-results/:quizId", isLoggedIn, getAllQuizResults);

export default quizResultRoute;
