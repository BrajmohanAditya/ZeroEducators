import cloudinary from "../config/cloudinary.js";
import { Hero } from "../models/hero.schema.js";

// @desc    Create a new Hero item (Exam or Banner)
// @route   POST /api/hero
export const createHeroItem = async (req, res) => {
  try {
    const { type, title } = req.body;
    const file = req.file; // From multer

    if (!type || !["upcoming_exam", "banner"].includes(type)) {
      return res.status(400).json({ success: false, message: "Valid type (upcoming_exam or banner) is required" });
    }
    
    if (!file) {
        return res.status(400).json({ success: false, message: "Image/Icon file is required" });
    }

    if (type === "upcoming_exam" && !title) {
        return res.status(400).json({ success: false, message: "Exam name (title) is required" });
    }

    // Upload to cloudinary (similar to course.controller.js)
    const base64 = `data:${req.file.mimetype};base64,${file.buffer.toString("base64")}`;
    const uploadRes = await cloudinary.uploader.upload(base64, {
      folder: "Akash_Academy_Hero",
       timeout: 120000,
    });

    const newHeroItem = new Hero({
      type,
      title: title || "", // title is optional for banners
      imageUrl: uploadRes.secure_url,
      imageId: uploadRes.public_id,
    });

    await newHeroItem.save();

    return res.status(201).json({
      success: true,
      message: "Hero item created successfully",
      heroItem: newHeroItem
    });
  } catch (error) {
    console.error("Error creating hero item:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// @desc    Get all Hero items
// @route   GET /api/hero
export const getHeroItems = async (req, res) => {
  try {
    const items = await Hero.find({});
    
    // You can group them here or let frontend handle it
    const upcomingExams = items.filter(item => item.type === "upcoming_exam");
    const banners = items.filter(item => item.type === "banner");

    return res.status(200).json({
      success: true,
      upcomingExams,
      banners
    });
  } catch (error) {
    console.error("Error getting hero items:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// @desc    Delete a Hero item
// @route   DELETE /api/hero/:id
export const deleteHeroItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Hero.findById(id);

    if (!item) {
      return res.status(404).json({ success: false, message: "Hero item not found" });
    }

    // Delete image from cloudinary
    if (item.imageId) {
      await cloudinary.uploader.destroy(item.imageId);
    }

    await Hero.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Hero item deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting hero item:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
