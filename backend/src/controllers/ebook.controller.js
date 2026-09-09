import { uploadToZata as uploadToB2, deleteFromZata as deleteFromB2 } from "../config/zata.js";
import { Ebook } from "../models/eBook/ebook.model.js";
import { EbookQuestion } from "../models/eBook/ebookQuestion.model.js";

export const createEbook = async (req, res, next) => {
  try {
    const { title, numberOfChapters, maxQuestionsPerChapter, amount } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    let imageUrl = "";
    let imageId = "";
    let pdfUrl = "";
    let pdfId = "";

    // Upload cover image (thumbnail)
    const thumbnailFile = req.files?.["thumbnail"]?.[0];
    if (thumbnailFile) {
      const uploadResImg = await uploadToB2(
        thumbnailFile.buffer,
        thumbnailFile.originalname,
        thumbnailFile.mimetype,
        "ebooks/thumbnails"
      );
      imageUrl = uploadResImg.url;
      imageId = uploadResImg.fileKey;
    }

    // Upload PDF
    const pdfFile = req.files?.["pdf"]?.[0];
    if (pdfFile) {
      const uploadResPdf = await uploadToB2(
        pdfFile.buffer,
        pdfFile.originalname,
        pdfFile.mimetype,
        "ebooks/pdfs"
      );
      pdfUrl = uploadResPdf.url;
      pdfId = uploadResPdf.fileKey;
    }

    const newEbook = new Ebook({
      userId: req.user._id,
      title,
      numberOfChapters: Number(numberOfChapters || 0),
      maxQuestionsPerChapter: Number(maxQuestionsPerChapter || 0),
      amount: Number(amount || 0),
      thumbnail: imageUrl,
      thumbnail_id: imageId,
      pdfUrl,
      pdf_id: pdfId,
    });

    await newEbook.save();

    return res.status(201).json({
      success: true,
      message: "eBook created successfully",
      ebook: newEbook,
    });
  } catch (error) {
    console.error("Error creating ebook:", error);
    next(error);
  }
};

export const getEbooks = async (req, res, next) => {
  try {
    const ebooks = await Ebook.find({}).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: ebooks.length,
      ebooks,
    });
  } catch (error) {
    console.error("Error fetching ebooks:", error);
    next(error);
  }
};

export const getSingleEbook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ebook = await Ebook.findById(id).populate("userId", "name email");

    if (!ebook) {
      return res.status(404).json({
        success: false,
        message: "eBook not found",
      });
    }

    return res.status(200).json({
      success: true,
      ebook,
    });
  } catch (error) {
    console.error("Error fetching single ebook:", error);
    next(error);
  }
};

export const deleteEbook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ebook = await Ebook.findById(id);

    if (!ebook) {
      return res.status(404).json({
        success: false,
        message: "eBook not found",
      });
    }

    // Delete thumbnail from B2
    if (ebook.thumbnail_id) {
      try {
        await deleteFromB2(ebook.thumbnail_id);
      } catch (e) {
        console.error("Error deleting ebook thumbnail:", e);
      }
    }

    // Delete PDF from B2
    if (ebook.pdf_id) {
      try {
        await deleteFromB2(ebook.pdf_id);
      } catch (e) {
        console.error("Error deleting ebook PDF:", e);
      }
    }

    // Delete all child questions and their images
    const questions = await EbookQuestion.find({ ebookId: id });
    for (const q of questions) {
      if (q.questionImageId) {
        try {
          await deleteFromB2(q.questionImageId);
        } catch (e) {
          console.error("Error deleting question image:", e);
        }
      }
    }
    await EbookQuestion.deleteMany({ ebookId: id });

    await Ebook.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "eBook deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting ebook:", error);
    next(error);
  }
};

export const editEbook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, numberOfChapters, maxQuestionsPerChapter, amount } = req.body;

    const ebook = await Ebook.findById(id);
    if (!ebook) {
      return res.status(404).json({
        success: false,
        message: "eBook not found",
      });
    }

    // Handle thumbnail update
    const thumbnailFile = req.files?.["thumbnail"]?.[0];
    if (thumbnailFile) {
      if (ebook.thumbnail_id) {
        await deleteFromB2(ebook.thumbnail_id);
      }
      const uploadResImg = await uploadToB2(
        thumbnailFile.buffer,
        thumbnailFile.originalname,
        thumbnailFile.mimetype,
        "ebooks/thumbnails"
      );
      ebook.thumbnail = uploadResImg.url;
      ebook.thumbnail_id = uploadResImg.fileKey;
    }

    // Handle PDF update
    const pdfFile = req.files?.["pdf"]?.[0];
    if (pdfFile) {
      if (ebook.pdf_id) {
        await deleteFromB2(ebook.pdf_id);
      }
      const uploadResPdf = await uploadToB2(
        pdfFile.buffer,
        pdfFile.originalname,
        pdfFile.mimetype,
        "ebooks/pdfs"
      );
      ebook.pdfUrl = uploadResPdf.url;
      ebook.pdf_id = uploadResPdf.fileKey;
    }

    if (title) ebook.title = title;
    if (numberOfChapters !== undefined) ebook.numberOfChapters = Number(numberOfChapters);
    if (maxQuestionsPerChapter !== undefined) ebook.maxQuestionsPerChapter = Number(maxQuestionsPerChapter);
    if (amount !== undefined) ebook.amount = Number(amount);

    await ebook.save();

    return res.status(200).json({
      success: true,
      message: "eBook updated successfully",
      ebook,
    });
  } catch (error) {
    console.error("Error editing ebook:", error);
    next(error);
  }
};
