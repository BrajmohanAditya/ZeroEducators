import mongoose from "mongoose";

const qualifiedMentorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    experience: {
      type: String,
      trim: true,
    },
    qualifications: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    imageId: {
      type: String, // Useful for deleting from Cloudinary later
      default: "",
    },
  },
  { timestamps: true }
);

export const QualifiedMentor = mongoose.model(
  "QualifiedMentor",
  qualifiedMentorSchema
);
