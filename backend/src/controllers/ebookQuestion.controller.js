import { EbookQuestion } from "../models/eBook/ebookQuestion.model.js";
import { Ebook } from "../models/eBook/ebook.model.js";
import cloudinary from "../config/cloudinary.js";

export const createEbookQuestion = async (req, res, next) => {
  try {
    const {
      ebookId,
      chapterNumber,
      chapterName,
      questionText,
      marks,
      optionsInstruction,
      options,
      solutionExplanation,
    } = req.body;

    if (!ebookId || !chapterNumber || !questionText || !options) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const ebook = await Ebook.findById(ebookId);
    if (!ebook) {
      return res.status(404).json({
        success: false,
        message: "eBook not found",
      });
    }

    if (ebook.maxQuestionsPerChapter && ebook.maxQuestionsPerChapter > 0) {
      const questionCount = await EbookQuestion.countDocuments({
        ebookId,
        chapterNumber: Number(chapterNumber),
      });
      if (questionCount >= ebook.maxQuestionsPerChapter) {
        return res.status(400).json({
          success: false,
          message: `Maximum question limit reached (${ebook.maxQuestionsPerChapter} questions) for Chapter ${chapterNumber}.`,
        });
      }
    }

    let parsedOptions = options;
    if (typeof options === "string") {
      try {
        parsedOptions = JSON.parse(options);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Invalid options format",
        });
      }
    }

    let questionImageUrl = "";
    if (req.file) {
      const base64Img = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const uploadResImg = await cloudinary.uploader.upload(base64Img, {
        folder: "TejasDefence/ebooks/questions",
      });
      questionImageUrl = uploadResImg.secure_url;
    }

    const newQuestion = new EbookQuestion({
      ebookId,
      chapterNumber: Number(chapterNumber),
      chapterName,
      questionText,
      questionImage: questionImageUrl,
      marks: Number(marks || 1),
      optionsInstruction,
      options: parsedOptions,
      solutionExplanation,
    });

    await newQuestion.save();

    return res.status(201).json({
      success: true,
      message: "Question added successfully to chapter " + chapterNumber,
      question: newQuestion,
    });
  } catch (error) {
    console.error("Error creating ebook question:", error);
    next(error);
  }
};

export const getEbookQuestions = async (req, res, next) => {
  try {
    const { ebookId, chapterNumber } = req.params;

    const query = { ebookId };
    if (chapterNumber) {
      query.chapterNumber = Number(chapterNumber);
    }

    const questions = await EbookQuestion.find(query).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: questions.length,
      questions,
    });
  } catch (error) {
    console.error("Error fetching ebook questions:", error);
    next(error);
  }
};

export const deleteEbookQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const question = await EbookQuestion.findById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    await EbookQuestion.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting ebook question:", error);
    next(error);
  }
};

export const updateEbookQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      chapterNumber,
      chapterName,
      questionText,
      marks,
      optionsInstruction,
      options,
      solutionExplanation,
    } = req.body;

    const question = await EbookQuestion.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    let parsedOptions = options;
    if (typeof options === "string") {
      try {
        parsedOptions = JSON.parse(options);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Invalid options format",
        });
      }
    }

    let questionImageUrl = question.questionImage;
    if (req.file) {
      const base64Img = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const uploadResImg = await cloudinary.uploader.upload(base64Img, {
        folder: "TejasDefence/ebooks/questions",
      });
      questionImageUrl = uploadResImg.secure_url;
    }

    question.chapterNumber = Number(chapterNumber || question.chapterNumber);
    if (chapterName !== undefined) question.chapterName = chapterName;
    if (questionText !== undefined) question.questionText = questionText;
    if (marks !== undefined) question.marks = Number(marks);
    if (optionsInstruction !== undefined) question.optionsInstruction = optionsInstruction;
    if (parsedOptions !== undefined) question.options = parsedOptions;
    if (solutionExplanation !== undefined) question.solutionExplanation = solutionExplanation;
    question.questionImage = questionImageUrl;

    await question.save();

    return res.status(200).json({
      success: true,
      message: "Question updated successfully",
      question,
    });
  } catch (error) {
    console.error("Error updating ebook question:", error);
    next(error);
  }
};
