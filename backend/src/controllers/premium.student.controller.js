import cloudinary from "../config/cloudinary.js";
import { PremiumStudent } from "../models/premium.student.schema.js";

// @desc    Create a Premium Student
// @route   POST /api/premiumStudent/create
export const createPremiumStudent = async (req, res, next) => {
  try {
    const { name, batch, phoneNo, amountPaid, amountRemain, feeStatus } = req.body;
    const file = req.file;

    if (!name || !batch || !phoneNo) {
      return res.status(400).json({ success: false, message: "Required fields are missing" });
    }

    let imageUrl = "";
    let imageId = "";

    if (file) {
      const base64 = `data:${req.file.mimetype};base64,${file.buffer.toString("base64")}`;
      const uploadRes = await cloudinary.uploader.upload(base64, {
        folder: "Akash_Academy_Premium_Students",
        timeout: 120000,
      });
      imageUrl = uploadRes.secure_url;
      imageId = uploadRes.public_id;
    }

    const newStudent = new PremiumStudent({
      name,
      batch,
      phoneNo,
      amountPaid: amountPaid || 0,
      amountRemain: amountRemain || 0,
      feeStatus: feeStatus || "unpaid",
      imageUrl,
      imageId,
    });

    await newStudent.save();

    return res.status(201).json({
      success: true,
      message: "Student created successfully",
      student: newStudent,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all Premium Students
// @route   GET /api/premiumStudent/all
export const getPremiumStudents = async (req, res, next) => {
  try {
    const students = await PremiumStudent.find({}).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      students,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a Premium Student
// @route   PUT /api/premiumStudent/:id
export const updatePremiumStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, batch, phoneNo, amountPaid, amountRemain, feeStatus } = req.body;
    const file = req.file;

    const student = await PremiumStudent.findById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    if (name) student.name = name;
    if (batch) student.batch = batch;
    if (phoneNo) student.phoneNo = phoneNo;
    if (amountPaid !== undefined) student.amountPaid = amountPaid;
    if (amountRemain !== undefined) student.amountRemain = amountRemain;
    if (feeStatus) student.feeStatus = feeStatus;

    if (file) {
      if (student.imageId) {
        try {
            await cloudinary.uploader.destroy(student.imageId);
        } catch (e) {
            console.error("Error deleting old image:", e);
        }
      }
      const base64 = `data:${req.file.mimetype};base64,${file.buffer.toString("base64")}`;
      const uploadRes = await cloudinary.uploader.upload(base64, {
        folder: "Akash_Academy_Premium_Students",
        timeout: 120000,
      });
      student.imageUrl = uploadRes.secure_url;
      student.imageId = uploadRes.public_id;
    }

    await student.save();

    return res.status(200).json({
      success: true,
      message: "Student updated successfully",
      student,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a Premium Student
// @route   DELETE /api/premiumStudent/:id
export const deletePremiumStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await PremiumStudent.findById(id);

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    if (student.imageId) {
        try {
            await cloudinary.uploader.destroy(student.imageId);
        } catch (e) {
            console.error("Error deleting image:", e);
        }
    }

    await PremiumStudent.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
