import express from "express";
import { isAdmin, isLoggedIn } from "../middlewares/auth.middleware.js";
import { createModule, getUploadProgress, streamModuleVideo } from "../controllers/module.controller.js";
import { videoUpload, formatUploadError } from "../middlewares/videoUpload.js";

const moduleRoute = express.Router();

moduleRoute.get("/progress/:uploadId", getUploadProgress);
moduleRoute.get("/stream/:moduleId", isLoggedIn, streamModuleVideo);

moduleRoute.post(
  "/createModule",
  isLoggedIn,
  isAdmin,
  (req, res, next) => {
    videoUpload.single("video")(req, res, (err) => {
      if (err) {
        console.error("Multer upload error:", err);
        return res.status(400).json({
          message: formatUploadError(err),
        });
      }
      next();
    });
  },
  createModule
);

export default moduleRoute;