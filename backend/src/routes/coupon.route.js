import express from "express";
import { isLoggedIn, isAdmin } from "../middlewares/auth.middleware.js";
import {
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  validateCoupon,
} from "../controllers/coupon.controller.js";

const couponRoute = express.Router();

// User Route (Requires login to validate user-specific usage)
couponRoute.post("/validate", isLoggedIn, validateCoupon);

// Admin Routes
couponRoute.get("/admin/all", isLoggedIn, isAdmin, getAllCoupons);
couponRoute.post("/admin/create", isLoggedIn, isAdmin, createCoupon);
couponRoute.put("/admin/:id", isLoggedIn, isAdmin, updateCoupon);
couponRoute.patch("/admin/:id/toggle", isLoggedIn, isAdmin, toggleCouponStatus);
couponRoute.delete("/admin/:id", isLoggedIn, isAdmin, deleteCoupon);

export default couponRoute;
