import { uploadToZata as uploadToB2, deleteFromZata as deleteFromB2 } from "../config/zata.js";
import { ENV } from "../config/env.js";
import { Course } from "../models/course.model.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { User } from "../models/user.model.js";
import { Modules } from "../models/module.model.js";

const genAi = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);
const model = genAi.getGenerativeModel({ model: "gemini-2.5-flash" });

export const createCourse = async (req, res, next) => {
  try {
    const { title, description, amount, duration, isFree, courseType } = req.body;
    const thumbnail = req.file;

    const freeCourse = isFree === true || isFree === "true" || Number(amount) === 0;
    const finalAmount = freeCourse ? 0 : Number(amount);

    if (!title || !description || (amount === undefined && !freeCourse)) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and price are required",
      });
    }
    let imageUrl = "";
    let imageId = "";

    if (thumbnail) {
      const uploadRes = await uploadToB2(
        thumbnail.buffer,
        thumbnail.originalname,
        thumbnail.mimetype,
        "courses"
      );
      imageUrl = uploadRes.url;
      imageId = uploadRes.fileKey;
    }

    const newCourse = new Course({
      userId: req.user._id,
      title,
      description,
      amount: finalAmount,
      isFree: freeCourse,
      duration: duration || "",
      courseType: courseType === "pdf" ? "pdf" : "video",
      thumbnail: imageUrl,
      thumbnail_id: imageId,
    });

    await newCourse.save();
    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      course: newCourse,
    });
  } catch (error) {
    console.log(`error from create course: ${error}`);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create course",
    });
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
      await deleteFromB2(course.thumbnail_id);
    }
    const modules = await Modules.find({ courseId: courseId });

    for (let i = 0; i < modules.length; i++) {
      if (modules[i].Video_id) {
        await deleteFromB2(modules[i].Video_id);
      }
    }

    // Delete topic PDFs from S3 if course has topics
    if (course.topics && course.topics.length > 0) {
      for (const topic of course.topics) {
        if (topic.pdfs && topic.pdfs.length > 0) {
          for (const pdf of topic.pdfs) {
            if (pdf.pdf_id) {
              await deleteFromB2(pdf.pdf_id);
            }
          }
        }
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
      message: "Course and all its content deleted completely!",
    });
  } catch (error) {
    next(error);
  }
};

export const editCourse = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const { title, description, amount, duration, isFree, courseType } = req.body;
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
        await deleteFromB2(course.thumbnail_id);
      }
      const uploadRes = await uploadToB2(
        thumbnail.buffer,
        thumbnail.originalname,
        thumbnail.mimetype,
        "courses"
      );
      course.thumbnail = uploadRes.url;
      course.thumbnail_id = uploadRes.fileKey;
    }

    const freeCourse = isFree === true || isFree === "true" || Number(amount) === 0;

    if (title) course.title = title;
    if (description) course.description = description;
    if (isFree !== undefined || amount !== undefined) {
      course.isFree = freeCourse;
      course.amount = freeCourse ? 0 : Number(amount);
    }
    if (duration !== undefined) course.duration = duration;
    if (courseType && ["video", "pdf"].includes(courseType)) {
      course.courseType = courseType;
    }

    await course.save();
    return res
      .status(200)
      .json({ success: true, message: "Course updated successfully", course });
  } catch (error) {
    return next(error);
  }
};

// Add Topic to a course
export const addTopic = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { topicName } = req.body;

    if (!topicName || topicName.trim() === "") {
      return res.status(400).json({ success: false, message: "Topic name is required" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    course.topics.push({
      topicName: topicName.trim(),
      pdfs: [],
    });

    await course.save();
    return res.status(201).json({
      success: true,
      message: "Topic added successfully",
      course,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Topic and its associated PDFs
export const deleteTopic = async (req, res, next) => {
  try {
    const { courseId, topicId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const topic = course.topics.id(topicId);
    if (!topic) {
      return res.status(404).json({ success: false, message: "Topic not found" });
    }

    // Delete all PDFs inside this topic from S3
    if (topic.pdfs && topic.pdfs.length > 0) {
      for (const pdf of topic.pdfs) {
        if (pdf.pdf_id) {
          await deleteFromB2(pdf.pdf_id);
        }
      }
    }

    course.topics.pull(topicId);
    await course.save();

    return res.status(200).json({
      success: true,
      message: "Topic and associated PDFs deleted successfully",
      course,
    });
  } catch (error) {
    next(error);
  }
};

// Add PDF to a Topic
export const addPdfToTopic = async (req, res, next) => {
  try {
    const { courseId, topicId } = req.params;
    const { title } = req.body;
    const pdfFile = req.file;

    if (!title || title.trim() === "") {
      return res.status(400).json({ success: false, message: "PDF title is required" });
    }
    if (!pdfFile) {
      return res.status(400).json({ success: false, message: "Please select a PDF file" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const topic = course.topics.id(topicId);
    if (!topic) {
      return res.status(404).json({ success: false, message: "Topic not found" });
    }

    const uploadRes = await uploadToB2(
      pdfFile.buffer,
      pdfFile.originalname,
      pdfFile.mimetype || "application/pdf",
      "courses/pdfs"
    );

    topic.pdfs.push({
      title: title.trim(),
      pdfUrl: uploadRes.url,
      pdf_id: uploadRes.fileKey,
    });

    await course.save();

    return res.status(201).json({
      success: true,
      message: "PDF uploaded successfully to topic",
      course,
    });
  } catch (error) {
    next(error);
  }
};

// Delete PDF from a Topic
export const deletePdfFromTopic = async (req, res, next) => {
  try {
    const { courseId, topicId, pdfId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const topic = course.topics.id(topicId);
    if (!topic) {
      return res.status(404).json({ success: false, message: "Topic not found" });
    }

    const pdf = topic.pdfs.id(pdfId);
    if (pdf && pdf.pdf_id) {
      await deleteFromB2(pdf.pdf_id);
    }

    topic.pdfs.pull(pdfId);
    await course.save();

    return res.status(200).json({
      success: true,
      message: "PDF deleted successfully from topic",
      course,
    });
  } catch (error) {
    next(error);
  }
};
