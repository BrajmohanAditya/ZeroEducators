import mongoose from "mongoose";

const heroSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["upcoming_exam", "banner"],
      required: true,
    },
    title: {
      type: String, // Used for Exam Name, or optional Banner title
    },
    imageUrl: {
      type: String, // Used for Exam Icon or Banner Image
      required: true,
    },
    imageId: {
      type: String, // To delete from Cloudinary
    },
  },
  { timestamps: true }
);

export const Hero = mongoose.model("Hero", heroSchema);
