import express from "express";
import {
  getActiveCategoryBars,
  getAllCategoryBarsAdmin,
  createCategoryBar,
  updateCategoryBar,
  deleteCategoryBar,
} from "../controllers/categoryBar.controller.js";
import { isLoggedIn, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public route to get active categories with courses
router.get("/", getActiveCategoryBars);

// Admin routes
router.get("/admin/all", isLoggedIn, isAdmin, getAllCategoryBarsAdmin);
router.post("/", isLoggedIn, isAdmin, createCategoryBar);
router.put("/:id", isLoggedIn, isAdmin, updateCategoryBar);
router.delete("/:id", isLoggedIn, isAdmin, deleteCategoryBar);

export default router;

