import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
    },
    razorpayPaymentId: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true },
);

export const Order = mongoose.model("Order", orderSchema);
