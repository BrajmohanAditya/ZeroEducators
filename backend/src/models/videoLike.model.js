import mongoose from "mongoose";

const videoLikeSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    videoId: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee 1 like per user per video
videoLikeSchema.index({ videoId: 1, user: 1 }, { unique: true });

export const VideoLike = mongoose.model("VideoLike", videoLikeSchema);
