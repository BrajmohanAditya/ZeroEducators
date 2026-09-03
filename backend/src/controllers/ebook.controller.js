import cloudinary from "../config/cloudinary.js";
import { Ebook } from "../models/eBook/ebook.model.js";

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
      const base64Img = `data:${thumbnailFile.mimetype};base64,${thumbnailFile.buffer.toString("base64")}`;
      const uploadResImg = await cloudinary.uploader.upload(base64Img, {
        folder: "TejasDefence/ebooks/thumbnails",
      });
      imageUrl = uploadResImg.secure_url;
      imageId = uploadResImg.public_id;
    }

    // Upload PDF
    const pdfFile = req.files?.["pdf"]?.[0];
    if (pdfFile) {
      const base64Pdf = `data:${pdfFile.mimetype};base64,${pdfFile.buffer.toString("base64")}`;
      const uploadResPdf = await cloudinary.uploader.upload(base64Pdf, {
        folder: "TejasDefence/ebooks/pdfs",
        resource_type: "raw", // PDFs are raw files
      });
      pdfUrl = uploadResPdf.secure_url;
      pdfId = uploadResPdf.public_id;
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

    // Delete thumbnail from Cloudinary
    if (ebook.thumbnail_id) {
      await cloudinary.uploader.destroy(ebook.thumbnail_id);
    }

    // Delete PDF from Cloudinary
    if (ebook.pdf_id) {
      await cloudinary.uploader.destroy(ebook.pdf_id, {
        resource_type: "raw", // Raw resource type is required for deleting non-image uploads
      });
    }

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
        await cloudinary.uploader.destroy(ebook.thumbnail_id);
      }
      const base64Img = `data:${thumbnailFile.mimetype};base64,${thumbnailFile.buffer.toString("base64")}`;
      const uploadResImg = await cloudinary.uploader.upload(base64Img, {
        folder: "TejasDefence/ebooks/thumbnails",
      });
      ebook.thumbnail = uploadResImg.secure_url;
      ebook.thumbnail_id = uploadResImg.public_id;
    }

    // Handle PDF update
    const pdfFile = req.files?.["pdf"]?.[0];
    if (pdfFile) {
      if (ebook.pdf_id) {
        await cloudinary.uploader.destroy(ebook.pdf_id, {
          resource_type: "raw",
        });
      }
      const base64Pdf = `data:${pdfFile.mimetype};base64,${pdfFile.buffer.toString("base64")}`;
      const uploadResPdf = await cloudinary.uploader.upload(base64Pdf, {
        folder: "TejasDefence/ebooks/pdfs",
        resource_type: "raw",
      });
      ebook.pdfUrl = uploadResPdf.secure_url;
      ebook.pdf_id = uploadResPdf.public_id;
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
