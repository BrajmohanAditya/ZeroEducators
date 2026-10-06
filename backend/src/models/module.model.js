import mongoose from "mongoose";

// How many modules in one course ?? -> 10
// How many videos in one module ?? -> 10

const moduleSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Courses",
    },
    Video: {
      type: String,
      required: true,
    },
    Video_id: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    bunnyGuid: {
      type: String,
    },
    bunnyStatus: {
      type: String,
    },
    originalZataVideo: {
      type: String,
    },
    originalZataVideoId: {
      type: String,
    },
  },
  { timestamps: true },
);

export const Modules = mongoose.model("Modules", moduleSchema);
