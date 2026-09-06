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
    orderId: {
      type: String,
      unique: true,
      sparse: true,
    },
    paymentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    paymentGateway: {
      type: String,
      default: "cashfree",
    },
    razorpayPaymentId: {
      type: String,
      sparse: true,
    },
  },
  { timestamps: true },
);

export const Order = mongoose.model("Order", orderSchema);
