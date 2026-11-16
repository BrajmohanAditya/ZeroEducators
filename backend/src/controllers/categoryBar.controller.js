import { CategoryBar } from "../models/categoryBar.model.js";
import "../models/course.model.js";

/**
 * Public: Get all active categories with populated courses for the navigation bar
 */
export const getActiveCategoryBars = async (req, res) => {
  try {
    const categories = await CategoryBar.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .populate({
        path: "courses",
        match: { isDeleted: { $ne: true } },
        select: "title amount pricingPlans courseType isBundle thumbnail isFree duration",
      })
      .lean();

    return res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Error fetching category bars:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch category navigation items",
      error: error.message,
    });
  }
};

/**
 * Admin: Get all category bars (including inactive)
 */
export const getAllCategoryBarsAdmin = async (req, res) => {
  try {
    const categories = await CategoryBar.find()
      .sort({ order: 1, createdAt: 1 })
      .populate({
        path: "courses",
        select: "title amount pricingPlans courseType isBundle thumbnail isFree duration isDeleted",
      })
      .lean();

    return res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Error fetching admin category bars:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch category navigation items for admin",
      error: error.message,
    });
  }
};

/**
 * Admin: Create a new category bar item
 */
export const createCategoryBar = async (req, res) => {
  try {
    const { title, order = 0, courses = [], isActive = true } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category Title is required",
      });
    }

    const newCategory = new CategoryBar({
      title: title.trim(),
      order: Number(order) || 0,
      courses: Array.isArray(courses) ? courses : [],
      isActive: Boolean(isActive),
    });

    await newCategory.save();

    const populated = await CategoryBar.findById(newCategory._id)
      .populate({
        path: "courses",
        select: "title amount pricingPlans courseType isBundle thumbnail isFree duration",
      })
      .lean();

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      category: populated,
    });
  } catch (error) {
    console.error("Error creating category bar:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create category",
      error: error.message,
    });
  }
};

/**
 * Admin: Update an existing category bar item
 */
export const updateCategoryBar = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, order, courses, isActive } = req.body;

    const category = await CategoryBar.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (title !== undefined) category.title = title.trim();
    if (order !== undefined) category.order = Number(order) || 0;
    if (courses !== undefined) category.courses = Array.isArray(courses) ? courses : [];
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    await category.save();

    const populated = await CategoryBar.findById(category._id)
      .populate({
        path: "courses",
        select: "title amount pricingPlans courseType isBundle thumbnail isFree duration",
      })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category: populated,
    });
  } catch (error) {
    console.error("Error updating category bar:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update category",
      error: error.message,
    });
  }
};

/**
 * Admin: Delete a category bar item
 */
export const deleteCategoryBar = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await CategoryBar.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category bar:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete category",
      error: error.message,
    });
  }
};
