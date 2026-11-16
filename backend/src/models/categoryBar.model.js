import mongoose from "mongoose";

const categoryBarSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
  },
  { timestamps: true }
);

categoryBarSchema.index({ isActive: 1, order: 1 });

export const CategoryBar = mongoose.model("CategoryBar", categoryBarSchema);
export default CategoryBar;
