import { uploadToZata as uploadToB2, deleteFromZata as deleteFromB2 } from "../config/zata.js";
import { QualifiedMentor } from "../models/qualifiedMentors.js";

// @desc    Create a Qualified Mentor
// @route   POST /api/mentor/create
export const createQualifiedMentor = async (req, res, next) => {
  try {
    const { name, subject, experience, qualifications } = req.body;
    const file = req.file;

    if (!name || !subject || !qualifications) {
      return res.status(400).json({ success: false, message: "Required fields are missing" });
    }

    let imageUrl = "";
    let imageId = "";

    if (file) {
      const uploadRes = await uploadToB2(
        file.buffer,
        file.originalname,
        file.mimetype,
        "mentors"
      );
      imageUrl = uploadRes.url;
      imageId = uploadRes.fileKey;
    }

    const newMentor = new QualifiedMentor({
      name,
      subject,
      experience,
      qualifications,
      imageUrl,
      imageId,
    });

    await newMentor.save();

    return res.status(201).json({
      success: true,
      message: "Mentor added successfully",
      mentor: newMentor,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all Qualified Mentors
// @route   GET /api/mentor/all
export const getQualifiedMentors = async (req, res, next) => {
  try {
    const mentors = await QualifiedMentor.find({}).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      mentors,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a Qualified Mentor
// @route   PUT /api/mentor/:id
export const updateQualifiedMentor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, subject, experience, qualifications } = req.body;
    const file = req.file;

    const mentor = await QualifiedMentor.findById(id);
    if (!mentor) {
      return res.status(404).json({ success: false, message: "Mentor not found" });
    }

    if (name) mentor.name = name;
    if (subject) mentor.subject = subject;
    if (experience) mentor.experience = experience;
    if (qualifications) mentor.qualifications = qualifications;

    if (file) {
      if (mentor.imageId) {
        try {
          await deleteFromB2(mentor.imageId);
        } catch (e) {
          console.error("Error deleting old image:", e);
        }
      }
      const uploadRes = await uploadToB2(
        file.buffer,
        file.originalname,
        file.mimetype,
        "mentors"
      );
      mentor.imageUrl = uploadRes.url;
      mentor.imageId = uploadRes.fileKey;
    }

    await mentor.save();

    return res.status(200).json({
      success: true,
      message: "Mentor updated successfully",
      mentor,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a Qualified Mentor
// @route   DELETE /api/mentor/:id
export const deleteQualifiedMentor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const mentor = await QualifiedMentor.findById(id);

    if (!mentor) {
      return res.status(404).json({ success: false, message: "Mentor not found" });
    }

    if (mentor.imageId) {
      try {
        await deleteFromB2(mentor.imageId);
      } catch (e) {
        console.error("Error deleting image:", e);
      }
    }

    await QualifiedMentor.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Mentor deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
