import mongoose from "mongoose";

const successBoardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    exam: {
      type: String,
      required: true,
      trim: true,
    },
    rank: {
      type: String,
      trim: true,
    },
    year: {
      type: String,
      required: true,
      trim: true,
    },
    story: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    imageId: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const SuccessBoard = mongoose.model("SuccessBoard", successBoardSchema);
