import { uploadToZata as uploadToB2, deleteFromZata as deleteFromB2 } from "../config/zata.js";
import { ENV } from "../config/env.js";
import { Course } from "../models/course.model.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { User } from "../models/user.model.js";
import { Order } from "../models/order.model.js";
import { Modules } from "../models/module.model.js";
import bcryptjs from "bcryptjs";
import fs from "fs";
import { moduleUploadProgressMap } from "./module.controller.js";

const genAi = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);
const model = genAi.getGenerativeModel({ model: "gemini-2.5-flash" });

export const createCourse = async (req, res, next) => {
  try {
    const { title, description, amount, duration, isFree, courseType, pricingPlans } = req.body;
    const thumbnail = req.file;

    let parsedPricingPlans = [];
    if (pricingPlans) {
      try {
        parsedPricingPlans = typeof pricingPlans === "string" ? JSON.parse(pricingPlans) : pricingPlans;
        if (Array.isArray(parsedPricingPlans)) {
          parsedPricingPlans = parsedPricingPlans
            .filter((p) => p && p.duration && p.price !== undefined && p.price !== "")
            .map((p) => ({
              duration: String(p.duration).trim(),
              price: Number(p.price),
              label: p.label ? String(p.label).trim() : "",
            }));
        }
      } catch (err) {
        console.warn("Failed to parse pricingPlans:", err);
      }
    }

    const freeCourse = isFree === true || isFree === "true" || Number(amount) === 0;
    let finalAmount = freeCourse ? 0 : Number(amount);

    if (parsedPricingPlans.length > 0 && !freeCourse) {
      finalAmount = parsedPricingPlans[0].price;
    }

    if (!title || !description || (finalAmount === undefined && !freeCourse && parsedPricingPlans.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and price or pricing plans are required",
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

    const finalDuration =
      duration ||
      (parsedPricingPlans.length > 0
        ? parsedPricingPlans.map((p) => p.duration).join(" / ")
        : "");

    const newCourse = new Course({
      userId: req.user._id,
      title,
      description,
      amount: finalAmount,
      isFree: freeCourse,
      duration: finalDuration,
      pricingPlans: freeCourse ? [] : parsedPricingPlans,
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

    const coursesWithEnrolled = await Promise.all(
      courses.map(async (c) => {
        try {
          const enrolledCount = await User.countDocuments({
            purchasedCourse: c._id,
          });
          return { ...c, enrolled: enrolledCount };
        } catch {
          return { ...c, enrolled: 0 };
        }
      })
    );

    return res.status(200).json({
      success: true,
      courses: coursesWithEnrolled,
      searchTerm: search,
      count: coursesWithEnrolled.length,
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
      try {
        await deleteFromB2(course.thumbnail_id);
      } catch (e) {
        console.error("Error deleting course thumbnail:", e);
      }
    }

    // 1. Delete all Subject & Chapter PDFs and Videos from S3
    if (course.subjects && course.subjects.length > 0) {
      for (const subject of course.subjects) {
        if (subject.chapters && subject.chapters.length > 0) {
          for (const chapter of subject.chapters) {
            // Delete chapter PDFs
            if (chapter.pdfs && chapter.pdfs.length > 0) {
              for (const pdf of chapter.pdfs) {
                if (pdf.pdf_id) {
                  try {
                    await deleteFromB2(pdf.pdf_id);
                  } catch (e) {
                    console.error("Error deleting chapter pdf:", e);
                  }
                }
              }
            }

            // Delete chapter Videos
            if (chapter.videos && chapter.videos.length > 0) {
              for (const video of chapter.videos) {
                if (video.Video_id) {
                  try {
                    await deleteFromB2(video.Video_id);
                  } catch (e) {
                    console.error("Error deleting chapter video:", e);
                  }
                }
                if (video.moduleId) {
                  await Modules.findByIdAndDelete(video.moduleId);
                }
              }
            }
          }
        }
      }
    }

    // 2. Delete legacy topic PDFs and Videos from S3
    if (course.topics && course.topics.length > 0) {
      for (const topic of course.topics) {
        if (topic.pdfs && topic.pdfs.length > 0) {
          for (const pdf of topic.pdfs) {
            if (pdf.pdf_id) {
              try {
                await deleteFromB2(pdf.pdf_id);
              } catch (e) {
                console.error("Error deleting topic pdf:", e);
              }
            }
          }
        }
        if (topic.videos && topic.videos.length > 0) {
          for (const video of topic.videos) {
            if (video.Video_id) {
              try {
                await deleteFromB2(video.Video_id);
              } catch (e) {
                console.error("Error deleting topic video:", e);
              }
            }
            if (video.moduleId) {
              await Modules.findByIdAndDelete(video.moduleId);
            }
          }
        }
      }
    }

    // 3. Clean up any remaining Modules belonging to this course
    const remainingModules = await Modules.find({ courseId: courseId });
    for (const mod of remainingModules) {
      if (mod.Video_id) {
        try {
          await deleteFromB2(mod.Video_id);
        } catch (e) {
          console.error("Error deleting module video:", e);
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
    const { title, description, amount, duration, isFree, courseType, pricingPlans } = req.body;
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

    let parsedPricingPlans = undefined;
    if (pricingPlans !== undefined) {
      try {
        parsedPricingPlans = typeof pricingPlans === "string" ? JSON.parse(pricingPlans) : pricingPlans;
        if (Array.isArray(parsedPricingPlans)) {
          parsedPricingPlans = parsedPricingPlans
            .filter((p) => p && p.duration && p.price !== undefined && p.price !== "")
            .map((p) => ({
              duration: String(p.duration).trim(),
              price: Number(p.price),
              label: p.label ? String(p.label).trim() : "",
            }));
        }
      } catch (err) {
        console.warn("Failed to parse pricingPlans in editCourse:", err);
      }
    }

    const freeCourse = isFree === true || isFree === "true" || Number(amount) === 0;

    if (title) course.title = title;
    if (description) course.description = description;

    if (freeCourse) {
      course.isFree = true;
      course.amount = 0;
      course.pricingPlans = [];
    } else {
      if (parsedPricingPlans !== undefined) {
        course.pricingPlans = parsedPricingPlans;
        if (parsedPricingPlans.length > 0) {
          course.amount = parsedPricingPlans[0].price;
          course.duration = parsedPricingPlans.map((p) => p.duration).join(" / ");
        }
      } else if (amount !== undefined) {
        course.amount = Number(amount);
      }
      if (isFree !== undefined) course.isFree = false;
    }

    if (duration !== undefined && (!parsedPricingPlans || parsedPricingPlans.length === 0)) {
      course.duration = duration;
    }

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

    // Delete all Videos inside this topic from S3 and DB
    if (topic.videos && topic.videos.length > 0) {
      for (const video of topic.videos) {
        if (video.Video_id) {
          await deleteFromB2(video.Video_id);
        }
        if (video.moduleId) {
          await Modules.findByIdAndDelete(video.moduleId);
          course.modules.pull(video.moduleId);
        }
      }
    }

    course.topics.pull(topicId);
    await course.save();

    return res.status(200).json({
      success: true,
      message: "Topic and associated contents deleted successfully",
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

// Add Video to a Topic
export const addVideoToTopic = async (req, res, next) => {
  let tempFilePath = null;
  const uploadId = req.body.uploadId;
  try {
    const { courseId, topicId } = req.params;
    const { title } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({ success: false, message: "Video title is required" });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please select a video file to upload" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const topic = course.topics.id(topicId);
    if (!topic) {
      return res.status(404).json({ success: false, message: "Topic not found" });
    }

    tempFilePath = req.file.path;
    const fileSize = req.file.size || (tempFilePath ? fs.statSync(tempFilePath).size : 0);

    if (uploadId) {
      moduleUploadProgressMap.set(uploadId, {
        status: "saving_to_cloud",
        loaded: 0,
        total: fileSize,
        percent: 0,
      });
    }

    // Upload to Zata S3 using multipart chunked upload with live progress callback
    const { url: videoUrl, fileKey: videoId } = await uploadToB2(
      tempFilePath || req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      "courseModule",
      (loaded, total) => {
        if (uploadId) {
          const totalBytes = total || fileSize || 1;
          const percent = Math.min(100, Math.round((loaded * 100) / totalBytes));
          moduleUploadProgressMap.set(uploadId, {
            status: "saving_to_cloud",
            loaded,
            total: totalBytes,
            percent,
          });
        }
      }
    );

    // Remove temporary file from local disk after upload
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlink(tempFilePath, (err) => {
        if (err) console.error("Error removing temp video file:", err);
      });
      tempFilePath = null;
    }

    // Create a Modules entry for streaming and permissions
    const moduleDoc = await Modules.create({
      courseId,
      title: title.trim(),
      Video: videoUrl,
      Video_id: videoId,
    });

    if (!topic.videos) {
      topic.videos = [];
    }

    topic.videos.push({
      title: title.trim(),
      Video: videoUrl,
      Video_id: videoId,
      moduleId: moduleDoc._id,
      createdAt: new Date(),
    });

    // Also link module to course.modules for complete backward compatibility
    course.modules.push(moduleDoc._id);

    await course.save();

    if (uploadId) {
      moduleUploadProgressMap.set(uploadId, {
        status: "completed",
        loaded: fileSize,
        total: fileSize,
        percent: 100,
        module: moduleDoc,
      });
      setTimeout(() => {
        moduleUploadProgressMap.delete(uploadId);
      }, 3 * 60 * 1000);
    }

    return res.status(201).json({
      success: true,
      message: "Video added to topic successfully",
      course,
      video: topic.videos[topic.videos.length - 1],
    });
  } catch (error) {
    if (uploadId) {
      moduleUploadProgressMap.set(uploadId, {
        status: "error",
        message: error.message || "Failed to upload video to topic",
      });
    }

    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (err) {
        console.error("Error cleaning up temp video on failure:", err);
      }
    }

    next(error);
  }
};

// Delete Video from a Topic
export const deleteVideoFromTopic = async (req, res, next) => {
  try {
    const { courseId, topicId, videoId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const topic = course.topics.id(topicId);
    if (!topic) {
      return res.status(404).json({ success: false, message: "Topic not found" });
    }

    const video = topic.videos.id(videoId);
    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found in topic" });
    }

    // Delete from S3
    if (video.Video_id) {
      await deleteFromB2(video.Video_id);
    }

    // Delete associated Modules document if exists
    if (video.moduleId) {
      await Modules.findByIdAndDelete(video.moduleId);
      course.modules.pull(video.moduleId);
    } else {
      await Modules.findOneAndDelete({ Video_id: video.Video_id });
    }

    topic.videos.pull(videoId);
    await course.save();

    return res.status(200).json({
      success: true,
      message: "Video deleted successfully from topic",
      course,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// SUBJECT & CHAPTER ARCHITECTURE CONTROLLERS
// ==========================================

// Add Subject to a Course
export const addSubject = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { subjectName } = req.body;

    if (!subjectName || subjectName.trim() === "") {
      return res.status(400).json({ success: false, message: "Subject name is required" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    if (!course.subjects) {
      course.subjects = [];
    }

    course.subjects.push({
      subjectName: subjectName.trim(),
      chapters: [],
    });

    await course.save();
    return res.status(201).json({
      success: true,
      message: "Subject added successfully",
      course,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Subject and all its Chapters, Videos, and PDFs
export const deleteSubject = async (req, res, next) => {
  try {
    const { courseId, subjectId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const subject = course.subjects.id(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    // Clean up all chapters inside this subject
    if (subject.chapters && subject.chapters.length > 0) {
      for (const chapter of subject.chapters) {
        // Delete all PDFs
        if (chapter.pdfs && chapter.pdfs.length > 0) {
          for (const pdf of chapter.pdfs) {
            if (pdf.pdf_id) {
              await deleteFromB2(pdf.pdf_id);
            }
          }
        }

        // Delete all Videos
        if (chapter.videos && chapter.videos.length > 0) {
          for (const video of chapter.videos) {
            if (video.Video_id) {
              await deleteFromB2(video.Video_id);
            }
            if (video.moduleId) {
              await Modules.findByIdAndDelete(video.moduleId);
              course.modules.pull(video.moduleId);
            } else if (video.Video_id) {
              await Modules.findOneAndDelete({ Video_id: video.Video_id });
            }
          }
        }
      }
    }

    course.subjects.pull(subjectId);
    await course.save();

    return res.status(200).json({
      success: true,
      message: "Subject and all associated chapters deleted successfully",
      course,
    });
  } catch (error) {
    next(error);
  }
};

// Add Chapter to a Subject
export const addChapter = async (req, res, next) => {
  try {
    const { courseId, subjectId } = req.params;
    const { chapterName } = req.body;

    if (!chapterName || chapterName.trim() === "") {
      return res.status(400).json({ success: false, message: "Chapter name is required" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const subject = course.subjects.id(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    if (!subject.chapters) {
      subject.chapters = [];
    }

    subject.chapters.push({
      chapterName: chapterName.trim(),
      videos: [],
      pdfs: [],
    });

    await course.save();
    return res.status(201).json({
      success: true,
      message: "Chapter added successfully to subject",
      course,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Chapter and its Videos & PDFs
export const deleteChapter = async (req, res, next) => {
  try {
    const { courseId, subjectId, chapterId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const subject = course.subjects.id(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    const chapter = subject.chapters.id(chapterId);
    if (!chapter) {
      return res.status(404).json({ success: false, message: "Chapter not found" });
    }

    // Clean up PDFs
    if (chapter.pdfs && chapter.pdfs.length > 0) {
      for (const pdf of chapter.pdfs) {
        if (pdf.pdf_id) {
          await deleteFromB2(pdf.pdf_id);
        }
      }
    }

    // Clean up Videos
    if (chapter.videos && chapter.videos.length > 0) {
      for (const video of chapter.videos) {
        if (video.Video_id) {
          await deleteFromB2(video.Video_id);
        }
        if (video.moduleId) {
          await Modules.findByIdAndDelete(video.moduleId);
          course.modules.pull(video.moduleId);
        } else if (video.Video_id) {
          await Modules.findOneAndDelete({ Video_id: video.Video_id });
        }
      }
    }

    subject.chapters.pull(chapterId);
    await course.save();

    return res.status(200).json({
      success: true,
      message: "Chapter and its contents deleted successfully",
      course,
    });
  } catch (error) {
    next(error);
  }
};

// Add PDF to a Chapter
export const addPdfToChapter = async (req, res, next) => {
  try {
    const { courseId, subjectId, chapterId } = req.params;
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

    const subject = course.subjects.id(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    const chapter = subject.chapters.id(chapterId);
    if (!chapter) {
      return res.status(404).json({ success: false, message: "Chapter not found" });
    }

    const uploadRes = await uploadToB2(
      pdfFile.buffer,
      pdfFile.originalname,
      pdfFile.mimetype || "application/pdf",
      "courses/pdfs"
    );

    if (!chapter.pdfs) {
      chapter.pdfs = [];
    }

    chapter.pdfs.push({
      title: title.trim(),
      pdfUrl: uploadRes.url,
      pdf_id: uploadRes.fileKey,
    });

    await course.save();

    return res.status(201).json({
      success: true,
      message: "PDF uploaded successfully to chapter",
      course,
    });
  } catch (error) {
    next(error);
  }
};

// Delete PDF from a Chapter
export const deletePdfFromChapter = async (req, res, next) => {
  try {
    const { courseId, subjectId, chapterId, pdfId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const subject = course.subjects.id(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    const chapter = subject.chapters.id(chapterId);
    if (!chapter) {
      return res.status(404).json({ success: false, message: "Chapter not found" });
    }

    const pdf = chapter.pdfs.id(pdfId);
    if (pdf && pdf.pdf_id) {
      await deleteFromB2(pdf.pdf_id);
    }

    chapter.pdfs.pull(pdfId);
    await course.save();

    return res.status(200).json({
      success: true,
      message: "PDF deleted successfully from chapter",
      course,
    });
  } catch (error) {
    next(error);
  }
};

// Add Video to a Chapter (with multipart progress tracking)
export const addVideoToChapter = async (req, res, next) => {
  let tempFilePath = null;
  const uploadId = req.body.uploadId;
  try {
    const { courseId, subjectId, chapterId } = req.params;
    const { title } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({ success: false, message: "Video title is required" });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please select a video file to upload" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const subject = course.subjects.id(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    const chapter = subject.chapters.id(chapterId);
    if (!chapter) {
      return res.status(404).json({ success: false, message: "Chapter not found" });
    }

    tempFilePath = req.file.path;
    const fileSize = req.file.size || (tempFilePath ? fs.statSync(tempFilePath).size : 0);

    if (uploadId) {
      moduleUploadProgressMap.set(uploadId, {
        status: "saving_to_cloud",
        loaded: 0,
        total: fileSize,
        percent: 0,
      });
    }

    // Upload to Zata S3 using multipart chunked upload with live progress callback
    const { url: videoUrl, fileKey: videoId } = await uploadToB2(
      tempFilePath || req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      "courseModule",
      (loaded, total) => {
        if (uploadId) {
          const totalBytes = total || fileSize || 1;
          const percent = Math.min(100, Math.round((loaded * 100) / totalBytes));
          moduleUploadProgressMap.set(uploadId, {
            status: "saving_to_cloud",
            loaded,
            total: totalBytes,
            percent,
          });
        }
      }
    );

    // Remove temporary file from local disk after upload
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlink(tempFilePath, (err) => {
        if (err) console.error("Error removing temp video file:", err);
      });
      tempFilePath = null;
    }

    // Create a Modules entry for streaming and permissions
    const moduleDoc = await Modules.create({
      courseId,
      title: title.trim(),
      Video: videoUrl,
      Video_id: videoId,
    });

    if (!chapter.videos) {
      chapter.videos = [];
    }

    chapter.videos.push({
      title: title.trim(),
      Video: videoUrl,
      Video_id: videoId,
      moduleId: moduleDoc._id,
      createdAt: new Date(),
    });

    // Also link module to course.modules for complete backward compatibility
    course.modules.push(moduleDoc._id);

    await course.save();

    if (uploadId) {
      moduleUploadProgressMap.set(uploadId, {
        status: "completed",
        loaded: fileSize,
        total: fileSize,
        percent: 100,
        module: moduleDoc,
      });
      setTimeout(() => {
        moduleUploadProgressMap.delete(uploadId);
      }, 3 * 60 * 1000);
    }

    return res.status(201).json({
      success: true,
      message: "Video added to chapter successfully",
      course,
      video: chapter.videos[chapter.videos.length - 1],
    });
  } catch (error) {
    if (uploadId) {
      moduleUploadProgressMap.set(uploadId, {
        status: "error",
        message: error.message || "Failed to upload video to chapter",
      });
    }

    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (err) {
        console.error("Error cleaning up temp video on failure:", err);
      }
    }

    next(error);
  }
};

// Delete Video from a Chapter
export const deleteVideoFromChapter = async (req, res, next) => {
  try {
    const { courseId, subjectId, chapterId, videoId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const subject = course.subjects.id(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    const chapter = subject.chapters.id(chapterId);
    if (!chapter) {
      return res.status(404).json({ success: false, message: "Chapter not found" });
    }

    const video = chapter.videos.id(videoId);
    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found in chapter" });
    }

    // Delete from S3
    if (video.Video_id) {
      await deleteFromB2(video.Video_id);
    }

    // Delete associated Modules document if exists
    if (video.moduleId) {
      await Modules.findByIdAndDelete(video.moduleId);
      course.modules.pull(video.moduleId);
    } else {
      await Modules.findOneAndDelete({ Video_id: video.Video_id });
    }

    chapter.videos.pull(videoId);
    await course.save();

    return res.status(200).json({
      success: true,
      message: "Video deleted successfully from chapter",
      course,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN COURSE GRANT & ENROLLMENT CONTROLLERS
// ==========================================

// Search users for course enrollment
export const searchUsersForEnrollment = async (req, res, next) => {
  try {
    const { query, courseId } = req.query;

    if (!query || query.trim() === "") {
      return res.status(200).json({ success: true, users: [] });
    }

    const trimmed = query.trim();
    const isNum = /^\d+$/.test(trimmed);

    const conditions = [
      { name: { $regex: trimmed, $options: "i" } },
      { email: { $regex: trimmed, $options: "i" } },
    ];

    if (isNum) {
      conditions.push({ mobileNo: Number(trimmed) });
    }

    const users = await User.find({ $or: conditions })
      .select("_id name email mobileNo role purchasedCourse createdAt")
      .limit(15)
      .lean();

    const formattedUsers = users.map((u) => {
      const isEnrolled = courseId
        ? u.purchasedCourse?.some((p) => p.toString() === courseId.toString())
        : false;
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        mobileNo: u.mobileNo,
        role: u.role,
        isEnrolled,
        totalPurchased: u.purchasedCourse?.length || 0,
      };
    });

    return res.status(200).json({
      success: true,
      users: formattedUsers,
    });
  } catch (error) {
    next(error);
  }
};

// Grant / assign course to any user (existing or new)
export const grantCourseAccess = async (req, res, next) => {
  try {
    const { courseId, userId, email, name, mobileNo, planDuration } = req.body;

    if (!courseId) {
      return res.status(400).json({ success: false, message: "Course ID is required" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    let user = null;

    if (userId) {
      user = await User.findById(userId);
    } else if (email) {
      user = await User.findOne({ email: email.trim().toLowerCase() });
    }

    // If user does not exist, auto-create a student account
    if (!user) {
      if (!name || !email || !mobileNo) {
        return res.status(400).json({
          success: false,
          message: "User not found. Please provide Name, Email, and Mobile Number to auto-create user account.",
        });
      }

      const defaultPassword = "User@" + Math.floor(1000 + Math.random() * 9000);
      const hashedPassword = await bcryptjs.hash(defaultPassword, 10);

      user = await User.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        mobileNo: Number(String(mobileNo).replace(/\D/g, "")),
        password: hashedPassword,
        isVerified: true,
        purchasedCourse: [],
      });
    }

    // Check if user already has access
    const isAlreadyEnrolled = user.purchasedCourse?.some(
      (id) => id.toString() === courseId.toString()
    );

    if (isAlreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: `${user.name} already has access to ${course.title}`,
      });
    }

    // Add course to user's purchasedCourse
    await User.findByIdAndUpdate(user._id, {
      $addToSet: { purchasedCourse: courseId },
    });

    // Record an order for audit trail
    const orderId = `ADMIN_ORDER_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const paymentId = `ADMIN_${Date.now()}`;

    const order = new Order({
      user: user._id,
      course: courseId,
      totalAmount: 0,
      planDuration: planDuration || course.duration || "Lifetime Access",
      paymentGateway: "admin_grant",
      orderId,
      paymentId,
    });
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Course "${course.title}" granted successfully to ${user.name} (${user.email})!`,
      student: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobileNo: user.mobileNo,
        enrolledAt: order.createdAt,
        planDuration: order.planDuration,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Revoke course access from user
export const revokeCourseAccess = async (req, res, next) => {
  try {
    const { courseId, userId } = req.body;

    if (!courseId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Course ID and User ID are required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Remove course from purchasedCourse
    await User.findByIdAndUpdate(userId, {
      $pull: { purchasedCourse: courseId },
    });

    return res.status(200).json({
      success: true,
      message: `Course access revoked from ${user.name}`,
    });
  } catch (error) {
    next(error);
  }
};

// Get list of enrolled students for a specific course
export const getCourseEnrolledStudents = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId).select("title");
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Find all users who have this courseId in purchasedCourse
    const users = await User.find({ purchasedCourse: courseId })
      .select("_id name email mobileNo createdAt")
      .lean();

    // Fetch orders for this course to enrich with enrollment details
    const orders = await Order.find({ course: courseId })
      .select("user planDuration paymentGateway createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const ordersByUser = new Map();
    for (const ord of orders) {
      const uId = ord.user?.toString();
      if (uId && !ordersByUser.has(uId)) {
        ordersByUser.set(uId, ord);
      }
    }

    const students = users.map((u) => {
      const order = ordersByUser.get(u._id.toString());
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        mobileNo: u.mobileNo,
        enrolledAt: order?.createdAt || u.createdAt,
        planDuration: order?.planDuration || "Standard",
        grantType: order?.paymentGateway === "admin_grant" ? "Admin Granted" : order?.paymentGateway === "free" ? "Free Enrolled" : "Paid Order",
      };
    });

    return res.status(200).json({
      success: true,
      courseTitle: course.title,
      students,
      count: students.length,
    });
  } catch (error) {
    next(error);
  }
};


