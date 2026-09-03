import express from "express";
import { isAdmin, isLoggedIn } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.js";
import {
  createCourse,
  deleteCourse,
  getAllPurchasedCourse,
  getCourse,
  getSingleCourse,
  getSinglePurchasedCourse,
  editCourse
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

export default courseRoute;
