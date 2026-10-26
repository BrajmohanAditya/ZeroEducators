import express from "express";
import { isAdmin, isLoggedIn } from "../../middlewares/auth.middleware.js";
import upload from "../../middlewares/multer.js";
import {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
  toggleExamLock,
  getMyPurchasedExams,
  searchUsersForExamEnrollment,
  grantExamAccess,
  revokeExamAccess,
  getExamEnrolledStudents,
  updateExamStudentExpiry,
  getExamLinkedCourses,
  updateExamLinkedCourses,
} from "../../controllers/quiz/exam.controller.js";

const examRoute = express.Router();

examRoute.post("/create", isLoggedIn, isAdmin, upload.single("logo"), createExam);
examRoute.get("/all", getExams);
examRoute.get("/my-purchased-exams", getMyPurchasedExams);
examRoute.get("/single/:id", getExamById);
examRoute.put("/update/:id", isLoggedIn, isAdmin, upload.single("logo"), updateExam);
examRoute.delete("/delete/:id", isLoggedIn, isAdmin, deleteExam);
examRoute.patch("/toggle-lock/:id", isLoggedIn, isAdmin, toggleExamLock);

// Admin Exam Grant & Enrollment Routes
examRoute.get("/admin/users/search", isLoggedIn, isAdmin, searchUsersForExamEnrollment);
examRoute.post("/admin/grant-access", isLoggedIn, isAdmin, grantExamAccess);
examRoute.post("/admin/revoke-access", isLoggedIn, isAdmin, revokeExamAccess);
examRoute.get("/admin/:examId/enrolled-students", isLoggedIn, isAdmin, getExamEnrolledStudents);
examRoute.put("/admin/update-student-expiry", isLoggedIn, isAdmin, updateExamStudentExpiry);

// Admin Dynamic Course Linking Routes
examRoute.get("/admin/:examId/linked-courses", isLoggedIn, isAdmin, getExamLinkedCourses);
examRoute.put("/admin/link-courses", isLoggedIn, isAdmin, updateExamLinkedCourses);

export default examRoute;
