import express from "express";
import { isAdmin, isLoggedIn } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.js";
import { videoUpload, formatUploadError } from "../middlewares/videoUpload.js";
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
  addSubject,
  deleteSubject,
  addChapter,
  deleteChapter,
  addPdfToChapter,
  deletePdfFromChapter,
  addVideoToChapter,
  deleteVideoFromChapter,
  searchUsersForEnrollment,
  grantCourseAccess,
  revokeCourseAccess,
  getCourseEnrolledStudents,
  streamCoursePdf,
  copyCourse,
} from "../controllers/course.controller.js";

const courseRoute = express.Router();
courseRoute.post(
  "/createCourse",
  isLoggedIn,
  isAdmin,
  upload.single("thumbnail"),
  createCourse,
);
courseRoute.post(
  "/copy-course",
  isLoggedIn,
  isAdmin,
  upload.single("thumbnail"),
  copyCourse,
);
courseRoute.get("/getCourse", getCourse);
courseRoute.get("/getSingleCourse/:id", getSingleCourse);
courseRoute.get("/getAllPurchasedCourse", isLoggedIn, getAllPurchasedCourse);
courseRoute.get(
  "/getSinglePurchasedCourse/:id",
  isLoggedIn,
  getSinglePurchasedCourse,
);
courseRoute.get("/stream-pdf/:courseId/:pdfId", isLoggedIn, streamCoursePdf);
courseRoute.delete("/deleteCourse/:id", isLoggedIn, isAdmin, deleteCourse);
courseRoute.put("/editCourse/:id", isLoggedIn, isAdmin, upload.single("thumbnail"), editCourse);

// Admin Course Grant & Enrollment Routes
courseRoute.get("/admin/users/search", isLoggedIn, isAdmin, searchUsersForEnrollment);
courseRoute.post("/admin/grant-access", isLoggedIn, isAdmin, grantCourseAccess);
courseRoute.post("/admin/revoke-access", isLoggedIn, isAdmin, revokeCourseAccess);
courseRoute.get("/admin/:courseId/enrolled-students", isLoggedIn, isAdmin, getCourseEnrolledStudents);

// Topic Management Routes (Legacy Compatibility)
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
          message: formatUploadError(err),
        });
      }
      next();
    });
  },
  addVideoToTopic
);
courseRoute.delete("/:courseId/topic/:topicId/video/:videoId", isLoggedIn, isAdmin, deleteVideoFromTopic);

// ==============================================
// Subject & Chapter Architecture Routes
// ==============================================

// Subject Routes
courseRoute.post("/:courseId/subject", isLoggedIn, isAdmin, addSubject);
courseRoute.delete("/:courseId/subject/:subjectId", isLoggedIn, isAdmin, deleteSubject);

// Chapter Routes
courseRoute.post("/:courseId/subject/:subjectId/chapter", isLoggedIn, isAdmin, addChapter);
courseRoute.delete("/:courseId/subject/:subjectId/chapter/:chapterId", isLoggedIn, isAdmin, deleteChapter);

// Chapter PDF Routes
courseRoute.post(
  "/:courseId/subject/:subjectId/chapter/:chapterId/pdf",
  isLoggedIn,
  isAdmin,
  upload.single("pdf"),
  addPdfToChapter
);
courseRoute.delete(
  "/:courseId/subject/:subjectId/chapter/:chapterId/pdf/:pdfId",
  isLoggedIn,
  isAdmin,
  deletePdfFromChapter
);

// Chapter Video Routes
courseRoute.post(
  "/:courseId/subject/:subjectId/chapter/:chapterId/video",
  isLoggedIn,
  isAdmin,
  (req, res, next) => {
    videoUpload.single("video")(req, res, (err) => {
      if (err) {
        console.error("Multer video upload error:", err);
        return res.status(400).json({
          message: formatUploadError(err),
        });
      }
      next();
    });
  },
  addVideoToChapter
);
courseRoute.delete(
  "/:courseId/subject/:subjectId/chapter/:chapterId/video/:videoId",
  isLoggedIn,
  isAdmin,
  deleteVideoFromChapter
);

export default courseRoute;

