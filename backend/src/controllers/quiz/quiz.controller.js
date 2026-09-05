import { Quiz } from "../../models/quiz/quiz.model.js";
import { Exam } from "../../models/quiz/exam.model.js";
import { uploadToZata as uploadToB2, deleteFromZata as deleteFromB2 } from "../../config/zata.js";
import { QuizQuestion } from "../../models/quiz/quiz.question.model.js";

// Create a new quiz
export const createQuiz = async (req, res, next) => {
  try {
    const {
      examId,
      nameOfExam,
      quizName,
      duration,
      negativeMark,
      section,
      totalNoOfQueation,
      totalMarks,
      quizType,
    } = req.body;

    const file = req.file;

    let finalExamName = nameOfExam;
    let finalLogoUrl = "";
    let finalLogoId = "";

    // If examId is provided, retrieve exam details
    if (examId) {
      const exam = await Exam.findById(examId);
      if (!exam) {
        return res.status(404).json({
          success: false,
          message: "Selected exam not found",
        });
      }
      finalExamName = finalExamName || exam.title;
      finalLogoUrl = exam.logoUrl;
      finalLogoId = exam.logoId;
    }

    if (
      !finalExamName ||
      !quizName ||
      !duration ||
      !section ||
      !totalNoOfQueation ||
      !totalMarks 
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // If a specific logo file is uploaded, upload to B2
    if (file) {
      const uploadRes = await uploadToB2(
        file.buffer,
        file.originalname,
        file.mimetype,
        "quizzes"
      );
      finalLogoUrl = uploadRes.url;
      finalLogoId = uploadRes.fileKey;
    } else if (!finalLogoUrl) {
      return res
        .status(400)
        .json({ success: false, message: "Logo is required" });
    }

    const newQuiz = new Quiz({
      examId: examId || undefined,
      nameOfExam: finalExamName,
      quizName,
      duration: Number(duration),
      negativeMark: Number(negativeMark) || 0,
      section: typeof section === "string" ? JSON.parse(section) : section,
      totalNoOfQueation: Number(totalNoOfQueation),
      totalMarks: Number(totalMarks),
      quizType: quizType || "Free",
      logoUrl: finalLogoUrl,
      logoId: finalLogoId,
    });

    await newQuiz.save();

    return res.status(201).json({
      success: true,
      message: "Quiz created successfully",
      quiz: newQuiz,
    });
  } catch (error) {
    next(error);
  }
};

// Get all quizzes
export const getQuizzes = async (req, res, next) => {
  try {
    const { quizType, examId } = req.query;
    
    // Create a filter object. Default is empty (fetch all).
    const filter = {};
    if (quizType) {
      filter.quizType = quizType; // 'Free' or 'Paid'
    }

    if (examId) {
      // Find the exam to support legacy quizzes that only had nameOfExam
      const exam = await Exam.findById(examId);
      if (exam) {
        filter.$or = [{ examId }, { nameOfExam: exam.title }];
      } else {
        filter.examId = examId;
      }
    }

    const quizzes = await Quiz.find(filter)
      .populate("examId", "title logoUrl category")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      quizzes,
      count: quizzes.length,
    });
  } catch (error) {
    next(error);
  }
};

// Get single quiz by id
export const getQuizById = async (req, res, next) => {
  try {
    const quizId = req.params.id;

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    return res.status(200).json({
      success: true,
      quiz,
    });
  } catch (error) {
    next(error);
  }
};

// Update quiz
export const updateQuiz = async (req, res, next) => {
  try {
    const quizId = req.params.id;
    const updateData = { ...req.body };

    // Parse section array if sent as a JSON string
    if (updateData.section && typeof updateData.section === "string") {
      try {
        updateData.section = JSON.parse(updateData.section);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Invalid format for section data",
        });
      }
    }

    // If new logo is uploaded, upload it to Backblaze B2
    if (req.file) {
      const existingQuiz = await Quiz.findById(quizId);
      if (existingQuiz?.logoId) {
        try {
          await deleteFromB2(existingQuiz.logoId);
        } catch (e) {
          console.error("Error deleting old quiz logo:", e);
        }
      }
      const file = req.file;
      const uploadRes = await uploadToB2(
        file.buffer,
        file.originalname,
        file.mimetype,
        "quizzes"
      );
      updateData.logoUrl = uploadRes.url;
      updateData.logoId = uploadRes.fileKey;
    }

    const updatedQuiz = await Quiz.findByIdAndUpdate(
      quizId,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updatedQuiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Quiz updated successfully",
      quiz: updatedQuiz,
    });
  } catch (error) {
    next(error);
  }
};

// Delete quiz
export const deleteQuiz = async (req, res, next) => {
  try {
    const quizId = req.params.id;

    const deletedQuiz = await Quiz.findByIdAndDelete(quizId);

    if (!deletedQuiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }
    if (deletedQuiz.logoId) {
      try {
        await deleteFromB2(deletedQuiz.logoId);
      } catch (e) {
        console.error("Error deleting quiz logo:", e);
      }
    }
    await QuizQuestion.deleteMany({ quizId: quizId });
    return res.status(200).json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Lock or unlock quiz
export const toggleQuizLock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findById(id);

    if (!quiz)
      return res
        .status(404)
        .json({ success: false, message: "Quiz not found" });

    quiz.isLocked = !quiz.isLocked; // Status ko ulta kar do (true ko false, false ko true)
    await quiz.save();

    return res
      .status(200)
      .json({ success: true, message: "Quiz status updated", quiz });
  } catch (error) {
    next(error);
  }
};

// Toggle Free/Paid quiz type
export const toggleQuizType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findById(id);
    
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });

    // Toggle between 'Free' and 'Paid'
    quiz.quizType = quiz.quizType === "Paid" ? "Free" : "Paid";
    await quiz.save();

    return res.status(200).json({ 
      success: true, 
      message: `Quiz changed to ${quiz.quizType}`, 
      quiz 
    });
  } catch (error) {
    next(error);
  }
};
