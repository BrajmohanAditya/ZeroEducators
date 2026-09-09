import { QuizQuestion } from "../../models/quiz/quiz.question.model.js";
import { Quiz } from "../../models/quiz/quiz.model.js";

// Create a new quiz question
export const createQuizQuestion = async (req, res, next) => {
  try {
    const {
      quizId,
      sectionName,
      questionText,
      marks,
      optionsInstruction,
      options,
      solutionExplanation,
    } = req.body;

    // 1. Basic validation
    if (
      !quizId ||
      !sectionName ||
      !questionText ||
      !options ||
      options.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide all required fields including quizId, sectionName, questionText, and options.",
      });
    }

    // 2. Verify if the Quiz exists
    const quizExists = await Quiz.findById(quizId);
    if (!quizExists) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // 3. Create the Question
    const newQuestion = await QuizQuestion.create({
      quizId,
      sectionName,
      questionText,
      marks: marks || 1,
      optionsInstruction,
      options, // Ensure the frontend sends options array with { text, isCorrect, image }
      solutionExplanation,
    });

    return res.status(201).json({
      success: true,
      message: "Question added successfully",
      question: newQuestion,
    });
  } catch (error) {
    next(error);

  }
};

// Get all questions for a specific quiz
export const getQuizQuestions = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }
    if (quiz.isLocked) {
      return res.status(403).json({
        success: false,
        message: " locked",
      });
    }

    const questions = await QuizQuestion.find({ quizId });

    return res.status(200).json({
      success: true,
      questions,
    });
  } catch (error) {
    next(error);
  }
};

export const updateQuizQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      sectionName,
      questionText,
      marks,
      optionsInstruction,
      options,
      solutionExplanation,
    } = req.body;

    const question = await QuizQuestion.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    if (sectionName !== undefined) question.sectionName = sectionName;
    if (questionText !== undefined) question.questionText = questionText;
    if (marks !== undefined) question.marks = Number(marks);
    if (optionsInstruction !== undefined) question.optionsInstruction = optionsInstruction;
    if (options !== undefined) question.options = options;
    if (solutionExplanation !== undefined) question.solutionExplanation = solutionExplanation;

    await question.save();

    return res.status(200).json({
      success: true,
      message: "Question updated successfully",
      question,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteQuizQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const question = await QuizQuestion.findById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    await QuizQuestion.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Bulk Create Quiz Questions from CSV/Excel
export const bulkCreateQuizQuestions = async (req, res, next) => {
  try {
    const { quizId, questions } = req.body;

    if (!quizId) {
      return res.status(400).json({
        success: false,
        message: "Quiz ID is required",
      });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Questions array is required and must not be empty",
      });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Format & validate questions for insertion
    const validQuestions = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText || !q.questionText.trim()) {
        continue; // Skip empty rows
      }

      const formattedOptions = (q.options || []).map((opt) => ({
        text: (opt.text !== undefined && opt.text !== null ? String(opt.text) : "").trim(),
        isCorrect: Boolean(opt.isCorrect),
        image: opt.image || "",
      }));

      // If at least 2 options exist
      if (formattedOptions.length < 2) {
        continue;
      }

      // Ensure at least one is correct; if none, default first to true
      const hasCorrect = formattedOptions.some((o) => o.isCorrect);
      if (!hasCorrect && formattedOptions.length > 0) {
        formattedOptions[0].isCorrect = true;
      }

      validQuestions.push({
        quizId,
        sectionName: (q.sectionName || "General").trim(),
        questionText: q.questionText.trim(),
        marks: Number(q.marks) > 0 ? Number(q.marks) : 1,
        optionsInstruction: (q.optionsInstruction || "").trim(),
        options: formattedOptions,
        solutionExplanation: (q.solutionExplanation || "").trim(),
      });
    }

    if (validQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid questions found to import. Please check your data format.",
      });
    }

    const insertedDocs = await QuizQuestion.insertMany(validQuestions);

    return res.status(201).json({
      success: true,
      message: `${insertedDocs.length} questions imported successfully`,
      count: insertedDocs.length,
      questions: insertedDocs,
    });
  } catch (error) {
    next(error);
  }
};

