import { QuizResult } from "../../models/quiz/quizResult.model.js";
import { QuizQuestion } from "../../models/quiz/quiz.question.model.js";
import { Quiz } from "../../models/quiz/quiz.model.js";

// @desc    Submit a quiz and calculate result
// @route   POST /api/quizResult/submit
// @access  Private (Logged In)
export const submitQuiz = async (req, res, next) => {
  try {
    const userId = req.user._id; // Assumes isLoggedIn middleware adds req.user
    const { quizId, userAnswers } = req.body;
    
    // --- THIS LOG WILL SHOW IN YOUR BACKEND TERMINAL ---
    console.log("Received User Answers Dictionary: ", userAnswers);

    if (!quizId || !userAnswers) {
      return res.status(400).json({ success: false, message: "Quiz ID and User Answers are required." });
    }
    // --- ADD THIS SECURITY CHECK HERE ---
    const existingResult = await QuizResult.findOne({
      user: userId,
      quiz: quizId,
    });

    if (existingResult) {
      return res.status(403).json({
        success: false,
        message: "You have already submitted"
      });
    }
    // ------------------------------------

    // 1. Fetch Quiz details to get negative marks
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found." });
    }
    const negativeMark = quiz.negativeMark || 0;

    // 2. Fetch all questions for this quiz
    const questions = await QuizQuestion.find({ quizId });

    let totalScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;

    // 3. Calculate scores
    questions.forEach((question) => {
      const qId = question._id.toString();
      const userAnswerIndex = userAnswers[qId];

      if (userAnswerIndex === undefined || userAnswerIndex === null) {
        unattemptedCount++;
        return; // Next question
      }

      // Find which option is correct
      const correctOptionIndex = question.options.findIndex(opt => opt.isCorrect);

      if (userAnswerIndex === correctOptionIndex) {
        correctCount++;
        totalScore += question.marks || 1;
      } else {
        wrongCount++;
        totalScore -= negativeMark;
      }
    });

    // 4. Save result to database
    totalScore = Number(totalScore.toFixed(2));
    const newResult = await QuizResult.create({
      user: userId,
      quiz: quizId,
      totalScore,
      correctCount,
      wrongCount,
      unattemptedCount,
      userAnswers,
    });

    res.status(201).json({
      success: true,
      message: "Quiz submitted successfully",
      result: newResult,
    });
  } catch (error) {
    console.error("Error submitting quiz:", error);
    next(error);
  }
};

// @desc    Get user's quiz results
// @route   GET /api/quizResult/my-results
// @access  Private
export const getMyResults = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // optionally filter by quizId
    const { quizId } = req.query;
    let filter = { user: userId };
    if (quizId) filter.quiz = quizId;

    const results = await QuizResult.find(filter)
      .populate("quiz", "nameOfExam") // populate specific fields if needed
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("Error fetching results:", error);
    next(error);
  }
};

// @desc    Get all results of a quiz (for leaderboard/participants list)
// @route   GET /api/quizResult/all-results/:quizId
// @access  Private (Logged In)
export const getAllQuizResults = async (req, res, next) => {
  try {
    const { quizId } = req.params;

    const results = await QuizResult.find({ quiz: quizId })
      .populate("user", "name email")
      .sort({ totalScore: -1, createdAt: 1 });

    res.status(200).json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("Error fetching all quiz results:", error);
    next(error);
  }
};
