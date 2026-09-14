import mongoose from "mongoose";

const videoCommentSchema = new mongoose.Schema(
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
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1500,
    },
  },
  {
    timestamps: true,
  }
);

// Index for rapid retrieval of latest comments for a video
videoCommentSchema.index({ videoId: 1, createdAt: -1 });

export const VideoComment = mongoose.model("VideoComment", videoCommentSchema);
