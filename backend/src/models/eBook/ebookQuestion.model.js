import mongoose from "mongoose";

const ebookQuestionSchema = new mongoose.Schema(
  {
    ebookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ebook",
      required: true,
    },
    chapterNumber: {
      type: Number,
      required: true,
    },
    chapterName: {
      type: String,
    },
    questionText: {
      type: String,
      required: true,
    },
    questionImage: {
      type: String,
      default: "",
    },
    marks: {
      type: Number,
      required: true,
      default: 1,
    },
    optionsInstruction: {
      type: String,
      default: "",
    },
    options: [
      {
        text: {
          type: String,
          required: true,
        },
        image: {
          type: String,
          default: "",
        },
        isCorrect: {
          type: Boolean,
          required: true,
          default: false,
        },
      },
    ],
    solutionExplanation: {
      type: String,
      default: "",
    },
    solutionImage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const EbookQuestion = mongoose.model("EbookQuestion", ebookQuestionSchema);
