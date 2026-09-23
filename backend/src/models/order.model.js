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
      required: false,
    },
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: false,
    },
    orderType: {
      type: String,
      enum: ["course", "exam"],
      default: "course",
    },

    totalAmount: {
      type: Number,
      required: true,
    },
    originalAmount: {
      type: Number,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    couponCode: {
      type: String,
    },
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    },
    planDuration: {
      type: String,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    pricingPlanId: {
      type: mongoose.Schema.Types.ObjectId,
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
    },
  },
  { timestamps: true },
);

export const Order = mongoose.model("Order", orderSchema);
