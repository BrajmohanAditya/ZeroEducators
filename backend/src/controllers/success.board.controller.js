import cloudinary from "../config/cloudinary.js";
import { SuccessBoard } from "../models/success.board.model.js";

// @desc    Create a Success Board Student
// @route   POST /api/successBoard/create
export const createSuccessBoard = async (req, res, next) => {
  try {
    const { name, exam, rank, year, story } = req.body;
    const file = req.file;

    if (!name || !exam || !year) {
      return res.status(400).json({ success: false, message: "Required fields are missing" });
    }

    let imageUrl = "";
    let imageId = "";

    if (file) {
      const base64 = `data:${req.file.mimetype};base64,${file.buffer.toString("base64")}`;
      const uploadRes = await cloudinary.uploader.upload(base64, {
        folder: "Akash_Academy_Success_Board",
        timeout: 120000,
      });
      imageUrl = uploadRes.secure_url;
      imageId = uploadRes.public_id;
    }

    const newStudent = new SuccessBoard({
      name,
      exam,
      rank,
      year,
      story,
      imageUrl,
      imageId,
    });

    await newStudent.save();

    return res.status(201).json({
      success: true,
      message: "Student added to success board",
      student: newStudent,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all Success Board Students
// @route   GET /api/successBoard/all
export const getSuccessBoard = async (req, res, next) => {
  try {
    const students = await SuccessBoard.find({}).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      students,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a Success Board Student
// @route   PUT /api/successBoard/:id
export const updateSuccessBoard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, exam, rank, year, story } = req.body;
    const file = req.file;

    const student = await SuccessBoard.findById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    if (name) student.name = name;
    if (exam) student.exam = exam;
    if (rank) student.rank = rank;
    if (year) student.year = year;
    if (story) student.story = story;

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
        folder: "Akash_Academy_Success_Board",
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

// @desc    Delete a Success Board Student
// @route   DELETE /api/successBoard/:id
export const deleteSuccessBoard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await SuccessBoard.findById(id);

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

    await SuccessBoard.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
