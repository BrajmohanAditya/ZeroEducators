import express from "express";
import {
  createQuizQuestion,
  bulkCreateQuizQuestions,
  getQuizQuestions,
  updateQuizQuestion,
  deleteQuizQuestion,
} from "../../controllers/quiz/quiz.question.controller.js";

const router = express.Router();

router.post("/create", createQuizQuestion);
router.post("/bulk-create", bulkCreateQuizQuestions);
router.get("/get/:quizId", getQuizQuestions);
router.put("/update/:id", updateQuizQuestion);
router.delete("/delete/:id", deleteQuizQuestion);

export default router;
