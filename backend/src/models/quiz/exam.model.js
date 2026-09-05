import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    logoUrl: {
      type: String,
      default: "",
    },
    logoId: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "",
      trim: true,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Exam = mongoose.model("Exam", examSchema);
