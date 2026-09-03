import mongoose from "mongoose";

const paidStudentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String, // To store Cloudinary URL
      required: false,
    },
    imageId: {
      type: String, // To delete from Cloudinary if needed
      required: false,
    },
    batch: {
      type: String,
      required: true,
    },
    phoneNo: {
      type: String,
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
      default: 0,
    },
    amountRemain: {
      type: Number,
      required: true,
      default: 0,
    },
    feeStatus: {
      type: String,
      enum: ["paid", "unpaid"],
      default: "unpaid",
      required: true,
    },
  },
  { timestamps: true }
);

export const PremiumStudent = mongoose.model("PremiumStudent", paidStudentSchema);
