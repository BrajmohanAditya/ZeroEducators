import { Exam } from "../../models/quiz/exam.model.js";
import { Quiz } from "../../models/quiz/quiz.model.js";
import { QuizQuestion } from "../../models/quiz/quiz.question.model.js";
import { uploadToZata as uploadToB2, deleteFromZata as deleteFromB2 } from "../../config/zata.js";

// 1. Create a new Exam
export const createExam = async (req, res, next) => {
  try {
    const { title, description, category, price } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Exam title is required",
      });
    }

    let logoUrl = "";
    let logoId = "";

    if (req.file) {
      const file = req.file;
      const uploadRes = await uploadToB2(
        file.buffer,
        file.originalname,
        file.mimetype,
        "exams/logos"
      );
      logoUrl = uploadRes.url;
      logoId = uploadRes.fileKey;
    }

    const newExam = new Exam({
      title: title.trim(),
      description: description ? description.trim() : "",
      category: category ? category.trim() : "",
      price: Math.max(0, Number(price) || 0),
      logoUrl,
      logoId,
    });

    await newExam.save();

    return res.status(201).json({
      success: true,
      message: "Exam created successfully",
      exam: newExam,
    });
  } catch (error) {
    console.error("Error creating exam:", error);
    next(error);
  }
};

// 2. Get all Exams with Quiz count
export const getExams = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    const exams = await Exam.find(filter).sort({ createdAt: -1 }).lean();

    // Attach total quizzes count for each exam
    const examsWithCounts = await Promise.all(
      exams.map(async (exam) => {
        const quizCount = await Quiz.countDocuments({
          $or: [{ examId: exam._id }, { nameOfExam: exam.title }],
        });
        return {
          ...exam,
          totalQuizzes: quizCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      exams: examsWithCounts,
      count: examsWithCounts.length,
    });
  } catch (error) {
    console.error("Error getting exams:", error);
    next(error);
  }
};

// 3. Get Single Exam by ID with its Quizzes
export const getExamById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findById(id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // Find quizzes under this exam (support both examId and legacy nameOfExam)
    const quizzes = await Quiz.find({
      $or: [{ examId: exam._id }, { nameOfExam: exam.title }],
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      exam,
      quizzes,
      quizCount: quizzes.length,
    });
  } catch (error) {
    console.error("Error getting exam by id:", error);
    next(error);
  }
};

// 4. Update Exam
export const updateExam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, category, price, isLocked } = req.body;

    const existingExam = await Exam.findById(id);
    if (!existingExam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (category !== undefined) updateData.category = category.trim();
    if (price !== undefined) updateData.price = Math.max(0, Number(price) || 0);
    if (isLocked !== undefined) updateData.isLocked = Boolean(isLocked);

    // If a new logo file is uploaded
    if (req.file) {
      if (existingExam.logoId) {
        try {
          await deleteFromB2(existingExam.logoId);
        } catch (e) {
          console.error("Error deleting old exam logo:", e);
        }
      }

      const file = req.file;
      const uploadRes = await uploadToB2(
        file.buffer,
        file.originalname,
        file.mimetype,
        "exams/logos"
      );
      updateData.logoUrl = uploadRes.url;
      updateData.logoId = uploadRes.fileKey;
    }

    const updatedExam = await Exam.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Exam updated successfully",
      exam: updatedExam,
    });
  } catch (error) {
    console.error("Error updating exam:", error);
    next(error);
  }
};

// 5. Delete Exam (and all its quizzes & questions)
export const deleteExam = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedExam = await Exam.findByIdAndDelete(id);
    if (!deletedExam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // Delete exam logo from B2
    if (deletedExam.logoId) {
      try {
        await deleteFromB2(deletedExam.logoId);
      } catch (e) {
        console.error("Error deleting exam logo from B2:", e);
      }
    }

    // Find and delete all child quizzes
    const childQuizzes = await Quiz.find({
      $or: [{ examId: deletedExam._id }, { nameOfExam: deletedExam.title }],
    });

    for (const quiz of childQuizzes) {
      if (quiz.logoId) {
        try {
          await deleteFromB2(quiz.logoId);
        } catch (e) {
          console.error("Error deleting quiz logo:", e);
        }
      }
      // Delete questions for this quiz
      await QuizQuestion.deleteMany({ quizId: quiz._id });
    }

    await Quiz.deleteMany({
      $or: [{ examId: deletedExam._id }, { nameOfExam: deletedExam.title }],
    });

    return res.status(200).json({
      success: true,
      message: "Exam and all associated quizzes deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting exam:", error);
    next(error);
  }
};

// 6. Toggle Exam Lock
export const toggleExamLock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findById(id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    exam.isLocked = !exam.isLocked;
    await exam.save();

    return res.status(200).json({
      success: true,
      message: `Exam ${exam.isLocked ? "locked" : "unlocked"} successfully`,
      exam,
    });
  } catch (error) {
    console.error("Error toggling exam lock:", error);
    next(error);
  }
};
