import cloudinary from "../config/cloudinary.js";
import { ENV } from "../config/env.js";
import { Course } from "../models/course.model.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { User } from "../models/user.model.js";
import { Modules } from "../models/module.model.js";

const genAi = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);
const model = genAi.getGenerativeModel({ model: "gemini-2.5-flash" });

export const createCourse = async (req, res) => {
  try {
    const { title, description, amount, duration } = req.body;
    const thumbnail = req.file;
    if (!title || !description || !amount) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    let imageUrl = "";
    const base64 = `data:${req.file.mimetype};base64,${thumbnail.buffer.toString("base64")}`;

    const uploadRes = await cloudinary.uploader.upload(base64, {
      folder: "Akash Acadmy",
    });
    imageUrl = uploadRes.secure_url;

    const imageId = uploadRes.public_id;

    const newCourse = await Course({
      userId: req.user._id,
      title,
      description,
      amount,
      duration,
      thumbnail: imageUrl,
      thumbnail_id: imageId,
    });

    await newCourse.save();
    return res.status(201).json({
      success: true,
      message: "Course created successfully",
    });
  } catch (error) {
    console.log(`error from create course.${error}`);
  }
};

// ai search fiture
export const getCourse = async (req, res) => {
  try {
    const { search } = req.query;
    if (!search || search.trim() === "") {
      const allCourses = await Course.find({});
      return res.status(200).json({
        success: true,
        courses: allCourses,
        count: allCourses.length,
      });
    }

    const prompt = `you are a intelligent assistant for a learning management 
        platform system. A user is searching for courses. analyze the query and 
        return the most relevant keyword from these catogeries. 

        - Banking 
        - Insurance
        - Accounting
        - Finance

        only reply with one keyword that best matches the query no explanation 

        user query: ${search}
        `;

    const result = await model.generateContent(prompt);
    const aiText =
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text
        ?.trim()
        .replace(/['"*+-]/g, "") || "";

    const searchTerm = aiText || search;

    const mongoQuery = {
      $or: [
        { title: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
      ],
    };

    const courses = await Course.find(mongoQuery).lean();

    return res.status(200).json({
      success: true,
      courses,
      searchTerm: search,
      count: courses.length,
    });
  } catch (error) {
    console.log(`error from get courses.${error}`);
  }
};

export const getSingleCourse = async (req, res) => {
  try {
    const courseId = req.params.id;

    const course = await Course.findById(courseId)
      .populate("userId")
      .populate("modules");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }
    return res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    console.log(`error from getsingle course.${error}`);
  }
};

/*
 user ne 4 course purchase kiye lekin ab user jo hai woh kisi ek course se padhna
 chahta hai toh user kisi ek course koi padhen k liye selecte karega toh uske liye
 humne getpurchase course ka controller create kiye hai yeh apko ek single course
 provide karega from purchased course

*/

export const getSinglePurchasedCourse = async (req, res) => {
  try {
    const courseId = req.params.id;

    if (!courseId) {
      return res.status(401).json({
        message: "course not found",
      });
    }

    const purchasedOrder = await Course.findById(courseId).populate("modules");

    if (!purchasedOrder) {
      return res.status(401).json({
        message: "Course not found",
      });
    }

    return res.status(201).json(purchasedOrder);
  } catch (error) {}
};

export const getAllPurchasedCourse = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId)
      .select("-password")
      .populate("purchasedCourse");

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    return res.status(201).json(user);
  } catch (error) {
    console.log(error);
  }
};

export const deleteCourse = async (req, res, next) => {
  try {
    const courseId = req.params.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    if (course.thumbnail_id) {
      await cloudinary.uploader.destroy(course.thumbnail_id);
    }
    const modules = await Modules.find({ courseId: courseId });

    for (let i = 0; i < modules.length; i++) {
      if (modules[i].Video_id) {
        // Video udhane ke liye resource_type batana zaruri hai
        await cloudinary.uploader.destroy(modules[i].Video_id, {
          resource_type: "video",
        });
      }
    }

    await Modules.deleteMany({ courseId: courseId });
    const deletedCourse = await Course.findByIdAndDelete(courseId);

    if (!deletedCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Course and all its modules deleted completely!",
    });
  } catch (error) {
    next(error);
  }
};

export const editCourse = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const { title, description, amount, duration } = req.body;
    const thumbnail = req.file;

    const course = await Course.findById(courseId);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    // Agar naya thumbnail upload kiya hai toh purana delete karke naya upload karo
    if (thumbnail) {
      if (course.thumbnail_id) {
        await cloudinary.uploader.destroy(course.thumbnail_id);
      }
      const base64 = `data:${thumbnail.mimetype};base64,${thumbnail.buffer.toString("base64")}`;
      const uploadRes = await cloudinary.uploader.upload(base64, {
        folder: "Akash Acadmy",
      });
      course.thumbnail = uploadRes.secure_url;
      course.thumbnail_id = uploadRes.public_id;
    }

    if (title) course.title = title;
    if (description) course.description = description;
    if (amount) course.amount = amount;
    if (duration !== undefined) course.duration = duration;

    await course.save();
    return res
      .status(200)
      .json({ success: true, message: "Course updated successfully" });
  } catch (error) {
    return next(error);
  }
};
