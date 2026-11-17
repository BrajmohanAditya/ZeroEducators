import { uploadToZata as uploadToB2, deleteFromZata as deleteFromB2 } from "../config/zata.js";
import { Hero } from "../models/hero.schema.js";
import { OfferTimer } from "../models/offerTimer.model.js";

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

    const uploadRes = await uploadToB2(
      file.buffer,
      file.originalname,
      file.mimetype,
      "hero"
    );

    const newHeroItem = new Hero({
      type,
      title: title || "", // title is optional for banners
      imageUrl: uploadRes.url,
      imageId: uploadRes.fileKey,
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

// @desc    Get all Hero items (including Offer Timer)
// @route   GET /api/hero
export const getHeroItems = async (req, res) => {
  try {
    const items = await Hero.find({});
    
    // Group upcoming exams and banners
    const upcomingExams = items.filter(item => item.type === "upcoming_exam");
    const banners = items.filter(item => item.type === "banner");

    // Fetch live offer timer if configured
    let offerTimer = await OfferTimer.findOne().sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      upcomingExams,
      banners,
      offerTimer: offerTimer || null,
    });
  } catch (error) {
    console.error("Error getting hero items:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// @desc    Update or create the Offer Timer (Admin)
// @route   PUT /api/hero/timer
export const updateOfferTimer = async (req, res) => {
  try {
    const { title, endDate, targetUrl, isActive } = req.body;

    let timer = await OfferTimer.findOne().sort({ updatedAt: -1 });

    if (!timer) {
      timer = new OfferTimer({
        title: title || "Dussehra Dhamaka",
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 48 * 60 * 60 * 1000),
        targetUrl: targetUrl || "#hero-banner",
        isActive: isActive !== undefined ? isActive : true,
      });
    } else {
      if (title !== undefined) timer.title = title.trim();
      if (endDate !== undefined) timer.endDate = new Date(endDate);
      if (targetUrl !== undefined) timer.targetUrl = targetUrl.trim();
      if (isActive !== undefined) timer.isActive = isActive;
    }

    await timer.save();

    return res.status(200).json({
      success: true,
      message: "Dhamaka offer timer updated successfully",
      offerTimer: timer,
    });
  } catch (error) {
    console.error("Error updating offer timer:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
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

    // Delete image from Backblaze B2
    if (item.imageId) {
      await deleteFromB2(item.imageId);
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
