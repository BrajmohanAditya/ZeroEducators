import express from "express";
import {
  createEbook,
  getEbooks,
  getSingleEbook,
  deleteEbook,
  editEbook,
} from "../controllers/ebook.controller.js";
import { isLoggedIn, isAdmin } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.js";

const ebookRoute = express.Router();

ebookRoute.post(
  "/create",
  isLoggedIn,
  isAdmin,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "pdf", maxCount: 1 },
  ]),
  createEbook
);

ebookRoute.get("/all", getEbooks);
ebookRoute.get("/single/:id", getSingleEbook);
ebookRoute.delete("/delete/:id", isLoggedIn, isAdmin, deleteEbook);

ebookRoute.put(
  "/edit/:id",
  isLoggedIn,
  isAdmin,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "pdf", maxCount: 1 },
  ]),
  editEbook
);

export default ebookRoute;
