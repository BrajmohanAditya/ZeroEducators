import { Course } from "../models/course.model.js";
import { Modules } from "../models/module.model.js";
export const createModule = async (req, res) => {
  try {
    const { courseId, title } = req.body;
    if (!courseId || !title) {
      return res.status(401).json({
        message: "Please provide all the details",
      });
    }

    if (!req.file) {
      return res.status(401).json({
        message: "Please provide video",
      });
    }

    const videoUrl = req.file.path;
    const videoId = req.file.filename;

    const module = await Modules.create({
      courseId,
      title,
      Video: videoUrl,
      Video_id: videoId,
    });

    await Course.findByIdAndUpdate(courseId, {
      $push: { modules: module._id },
    });

    return res.status(201).json({
      message: "Module created successfully",
      module,
    });
  } catch (error) {
    console.log(`error from create module, ${error}`);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
