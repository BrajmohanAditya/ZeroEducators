import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      default: "percentage",
      required: true,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscountLimit: {
      type: Number,
      default: null, // For percentage discount cap (e.g. max ₹500 off)
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    applicableCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ], // Empty means all courses
    startDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    maxTotalUses: {
      type: Number,
      default: null, // null means unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    maxUsesPerUser: {
      type: Number,
      default: 1,
    },
    usedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        usedAt: {
          type: Date,
          default: Date.now,
        },
        orderId: {
          type: String,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Helper method to check if a coupon is valid for a given user, course, and amount
couponSchema.methods.isValidFor = function ({ userId, courseId, amount }) {
  const now = new Date();

  if (!this.isActive) {
    return { valid: false, message: "This coupon is currently inactive" };
  }

  if (this.startDate && now < new Date(this.startDate)) {
    return { valid: false, message: "This coupon is not active yet" };
  }

  if (this.expiryDate && now > new Date(this.expiryDate)) {
    return { valid: false, message: "This coupon has expired" };
  }

  if (this.maxTotalUses && this.usedCount >= this.maxTotalUses) {
    return { valid: false, message: "Coupon usage limit has been reached" };
  }

  if (this.minOrderAmount && amount < this.minOrderAmount) {
    return {
      valid: false,
      message: `Minimum order amount of ₹${this.minOrderAmount} required to use this coupon`,
    };
  }

  if (this.applicableCourses && this.applicableCourses.length > 0) {
    const isApplicable = this.applicableCourses.some(
      (cId) => cId.toString() === courseId.toString()
    );
    if (!isApplicable) {
      return { valid: false, message: "This coupon is not applicable on this course" };
    }
  }

  if (userId && this.usedBy && this.usedBy.length > 0) {
    const userUses = this.usedBy.filter(
      (entry) => entry.userId && entry.userId.toString() === userId.toString()
    ).length;
    if (userUses >= this.maxUsesPerUser) {
      return {
        valid: false,
        message: "You have already reached the maximum usage limit for this coupon",
      };
    }
  }

  return { valid: true };
};

// Helper method to calculate exact discount amount
couponSchema.methods.calculateDiscount = function (amount) {
  let discount = 0;
  if (this.discountType === "percentage") {
    discount = Math.round((Number(amount) * Number(this.discountAmount)) / 100);
    if (this.maxDiscountLimit && discount > Number(this.maxDiscountLimit)) {
      discount = Number(this.maxDiscountLimit);
    }
  } else if (this.discountType === "flat") {
    discount = Number(this.discountAmount);
  }

  // Discount cannot exceed the course amount
  if (discount > Number(amount)) {
    discount = Number(amount);
  }

  const finalAmount = Math.max(0, Number(amount) - discount);

  return {
    discountAmount: discount,
    finalAmount,
  };
};

export const Coupon = mongoose.model("Coupon", couponSchema);
