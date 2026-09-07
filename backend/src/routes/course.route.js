import express from "express";
import { isAdmin, isLoggedIn } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.js";
import { videoUpload } from "../middlewares/videoUpload.js";
import {
  createCourse,
  deleteCourse,
  getAllPurchasedCourse,
  getCourse,
  getSingleCourse,
  getSinglePurchasedCourse,
  editCourse,
  addTopic,
  deleteTopic,
  addPdfToTopic,
  deletePdfFromTopic,
  addVideoToTopic,
  deleteVideoFromTopic,
} from "../controllers/course.controller.js";

const courseRoute = express.Router();
courseRoute.post(
  "/createCourse",
  isLoggedIn,
  isAdmin,
  upload.single("thumbnail"),
  createCourse,
);
courseRoute.get("/getCourse", getCourse);
courseRoute.get("/getSingleCourse/:id", getSingleCourse);
courseRoute.get("/getAllPurchasedCourse", isLoggedIn, getAllPurchasedCourse);
courseRoute.get(
  "/getSinglePurchasedCourse/:id",
  isLoggedIn,
  getSinglePurchasedCourse,
);
courseRoute.delete("/deleteCourse/:id", isLoggedIn, isAdmin, deleteCourse);
courseRoute.put("/editCourse/:id", isLoggedIn, isAdmin, upload.single("thumbnail"), editCourse);

// Topic Management Routes
courseRoute.post("/:courseId/topic", isLoggedIn, isAdmin, addTopic);
courseRoute.delete("/:courseId/topic/:topicId", isLoggedIn, isAdmin, deleteTopic);

// Topic PDF Management Routes
courseRoute.post(
  "/:courseId/topic/:topicId/pdf",
  isLoggedIn,
  isAdmin,
  upload.single("pdf"),
  addPdfToTopic
);
courseRoute.delete("/:courseId/topic/:topicId/pdf/:pdfId", isLoggedIn, isAdmin, deletePdfFromTopic);

// Topic Video Management Routes
courseRoute.post(
  "/:courseId/topic/:topicId/video",
  isLoggedIn,
  isAdmin,
  (req, res, next) => {
    videoUpload.single("video")(req, res, (err) => {
      if (err) {
        console.error("Multer video upload error:", err);
        return res.status(400).json({
          message: err.message || "Video upload failed. Please check the file format and size.",
        });
      }
      next();
    });
  },
  addVideoToTopic
);
courseRoute.delete("/:courseId/topic/:topicId/video/:videoId", isLoggedIn, isAdmin, deleteVideoFromTopic);

export default courseRoute;
