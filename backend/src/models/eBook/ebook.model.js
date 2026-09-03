import mongoose from "mongoose";

const ebookSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  numberOfChapters: {
    type: Number,
    required: true,
    default: 0,
  },
  maxQuestionsPerChapter: {
    type: Number,
    required: true,
    default: 0,
  },
  thumbnail: {
    type: String, // Cover image URL
  },
  thumbnail_id: {
    type: String,
  },
  pdfUrl: {
    type: String, // PDF URL
  },
  pdf_id: {
    type: String,
  },
  amount: {
    type: Number,
    required: true,
    default: 0,
  }
}, { timestamps: true });

export const Ebook = mongoose.model("Ebook", ebookSchema);
