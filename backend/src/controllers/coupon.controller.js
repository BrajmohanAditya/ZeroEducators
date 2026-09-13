import { Coupon } from "../models/coupon.model.js";
import { Course } from "../models/course.model.js";

// ==========================================
// ADMIN: Create New Coupon
// ==========================================
export const createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      description,
      discountType,
      discountAmount,
      maxDiscountLimit,
      minOrderAmount,
      applicableCourses,
      startDate,
      expiryDate,
      maxTotalUses,
      maxUsesPerUser,
      isActive,
    } = req.body;

    if (!code || !discountType || discountAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: "Code, discount type, and discount amount are required",
      });
    }

    const cleanCode = code.trim().toUpperCase();

    const existingCoupon = await Coupon.findOne({ code: cleanCode });
    if (existingCoupon) {
      return res.status(409).json({
        success: false,
        message: `A coupon with code "${cleanCode}" already exists`,
      });
    }

    const coupon = new Coupon({
      code: cleanCode,
      description: description?.trim() || "",
      discountType,
      discountAmount: Number(discountAmount),
      maxDiscountLimit: maxDiscountLimit ? Number(maxDiscountLimit) : null,
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
      applicableCourses: Array.isArray(applicableCourses) ? applicableCourses : [],
      startDate: startDate ? new Date(startDate) : new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      maxTotalUses: maxTotalUses ? Number(maxTotalUses) : null,
      maxUsesPerUser: maxUsesPerUser ? Number(maxUsesPerUser) : 1,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    await coupon.save();

    return res.status(201).json({
      success: true,
      message: `Coupon "${cleanCode}" created successfully`,
      coupon,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN: Get All Coupons
// ==========================================
export const getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find()
      .populate("applicableCourses", "title thumbnail")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      coupons,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN: Update Coupon
// ==========================================
export const updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      code,
      description,
      discountType,
      discountAmount,
      maxDiscountLimit,
      minOrderAmount,
      applicableCourses,
      startDate,
      expiryDate,
      maxTotalUses,
      maxUsesPerUser,
      isActive,
    } = req.body;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    if (code && code.trim().toUpperCase() !== coupon.code) {
      const existing = await Coupon.findOne({ code: code.trim().toUpperCase() });
      if (existing && existing._id.toString() !== id) {
        return res.status(409).json({
          success: false,
          message: `Coupon code "${code.trim().toUpperCase()}" is already in use`,
        });
      }
      coupon.code = code.trim().toUpperCase();
    }

    if (description !== undefined) coupon.description = description.trim();
    if (discountType !== undefined) coupon.discountType = discountType;
    if (discountAmount !== undefined) coupon.discountAmount = Number(discountAmount);
    if (maxDiscountLimit !== undefined)
      coupon.maxDiscountLimit = maxDiscountLimit ? Number(maxDiscountLimit) : null;
    if (minOrderAmount !== undefined)
      coupon.minOrderAmount = minOrderAmount ? Number(minOrderAmount) : 0;
    if (applicableCourses !== undefined)
      coupon.applicableCourses = Array.isArray(applicableCourses) ? applicableCourses : [];
    if (startDate !== undefined) coupon.startDate = startDate ? new Date(startDate) : new Date();
    if (expiryDate !== undefined) coupon.expiryDate = expiryDate ? new Date(expiryDate) : null;
    if (maxTotalUses !== undefined)
      coupon.maxTotalUses = maxTotalUses ? Number(maxTotalUses) : null;
    if (maxUsesPerUser !== undefined)
      coupon.maxUsesPerUser = maxUsesPerUser ? Number(maxUsesPerUser) : 1;
    if (isActive !== undefined) coupon.isActive = Boolean(isActive);

    await coupon.save();

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN: Toggle Coupon Active Status
// ==========================================
export const toggleCouponStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    return res.status(200).json({
      success: true,
      message: `Coupon is now ${coupon.isActive ? "active" : "inactive"}`,
      coupon,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN: Delete Coupon
// ==========================================
export const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Coupon "${coupon.code}" deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// USER: Validate & Check Coupon Discount
// ==========================================
export const validateCoupon = async (req, res, next) => {
  try {
    const { code, courseId, planId, planDuration } = req.body;
    const userId = req.user?._id;

    if (!code || code.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Please enter a coupon code",
      });
    }

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required",
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Determine base price based on course pricing plan
    let originalAmount = Number(course.amount);
    if (course.pricingPlans && course.pricingPlans.length > 0) {
      let plan = null;
      if (planId) {
        plan = course.pricingPlans.find((p) => p._id.toString() === planId.toString());
      }
      if (!plan && planDuration) {
        plan = course.pricingPlans.find((p) => p.duration === planDuration);
      }
      if (!plan) {
        plan = course.pricingPlans[0];
      }
      originalAmount = Number(plan.price);
    }

    const cleanCode = code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: cleanCode });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code",
      });
    }

    // Check validity
    const check = coupon.isValidFor({
      userId,
      courseId,
      amount: originalAmount,
    });

    if (!check.valid) {
      return res.status(400).json({
        success: false,
        message: check.message,
      });
    }

    const { discountAmount, finalAmount } = coupon.calculateDiscount(originalAmount);

    return res.status(200).json({
      success: true,
      message: `Coupon "${coupon.code}" applied successfully! You save ₹${discountAmount}.`,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountAmount: coupon.discountAmount,
      },
      originalAmount,
      discountAmount,
      finalAmount,
    });
  } catch (error) {
    next(error);
  }
};
