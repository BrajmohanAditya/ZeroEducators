import { Quiz } from "../../models/quiz/quiz.model.js";
import cloudinary from "../../config/cloudinary.js";
import { QuizQuestion } from "../../models/quiz/quiz.question.model.js";

// Create a new quiz
export const createQuiz = async (req, res, next) => {
  try {
    const {
      nameOfExam,
      quizName,
      duration,
      negativeMark,
      section,
      totalNoOfQueation,
      totalMarks,
    } = req.body;

    const file = req.file;

    if (
      !nameOfExam ||
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

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Logo file is required" });
    }
    // Upload to cloudinary (similar to course.controller.js)
    const base64 = `data:${req.file.mimetype};base64,${file.buffer.toString("base64")}`;
    const uploadRes = await cloudinary.uploader.upload(base64, {
      folder: "Akash_Academy",
      timeout: 120000,
    });

    const newQuiz = new Quiz({
      nameOfExam,
      quizName,
      duration,
      negativeMark: negativeMark || 0,
      section: JSON.parse(section),
      totalNoOfQueation,
      totalMarks,
      logoUrl: uploadRes.secure_url,
      logoId: uploadRes.public_id,
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
    const { quizType } = req.query;
    
    // Create a filter object. Default is empty (fetch all).
    const filter = {};
    if (quizType) {
      filter.quizType = quizType; // 'Free' or 'Paid'
    }

    const quizzes = await Quiz.find(filter).sort({ createdAt: 1 });

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

    // If new logo is uploaded, upload it to Cloudinary
    if (req.file) {
      const file = req.file;
      const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
      const uploadRes = await cloudinary.uploader.upload(base64, {
        folder: "Akash_Academy",
        timeout: 120000,
      });
      updateData.logoUrl = uploadRes.secure_url;
      updateData.logoId = uploadRes.public_id;
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
      await cloudinary.uploader.destroy(deletedQuiz.logoId);
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
