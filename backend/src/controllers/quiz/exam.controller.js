import { Exam } from "../../models/quiz/exam.model.js";
import { Quiz } from "../../models/quiz/quiz.model.js";
import { QuizQuestion } from "../../models/quiz/quiz.question.model.js";
import { QuizResult } from "../../models/quiz/quizResult.model.js";
import { User } from "../../models/user.model.js";
import { Course } from "../../models/course.model.js";
import { uploadToZata as uploadToB2, deleteFromZata as deleteFromB2 } from "../../config/zata.js";
import jwt from "jsonwebtoken";
import { ENV } from "../../config/env.js";
import { Order } from "../../models/order.model.js";
import bcryptjs from "bcryptjs";
import { syncUserCourseExpiry } from "../../utils/courseExpiry.js";

// 1. Create a new Exam
export const createExam = async (req, res, next) => {
  try {
    const { title, description, category, price } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Exam title is required",
      });
    }

    let logoUrl = "";
    let logoId = "";

    if (req.file) {
      const file = req.file;
      const uploadRes = await uploadToB2(
        file.buffer,
        file.originalname,
        file.mimetype,
        "exams/logos"
      );
      logoUrl = uploadRes.url;
      logoId = uploadRes.fileKey;
    }

    const newExam = new Exam({
      title: title.trim(),
      description: description ? description.trim() : "",
      category: category ? category.trim() : "",
      price: Math.max(0, Number(price) || 0),
      logoUrl,
      logoId,
    });

    await newExam.save();

    return res.status(201).json({
      success: true,
      message: "Exam created successfully",
      exam: newExam,
    });
  } catch (error) {
    console.error("Error creating exam:", error);
    next(error);
  }
};

// 2. Get all Exams with Quiz count
export const getExams = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    const exams = await Exam.find(filter).sort({ createdAt: -1 }).lean();

    if (!exams.length) {
      return res.status(200).json({
        success: true,
        exams: [],
        count: 0,
      });
    }

    const examIds = exams.map((e) => e._id);
    const examTitles = exams.map((e) => e.title);

    const counts = await Quiz.aggregate([
      {
        $match: {
          $or: [
            { examId: { $in: examIds } },
            { nameOfExam: { $in: examTitles } },
          ],
        },
      },
      {
        $group: {
          _id: { $ifNull: ["$examId", "$nameOfExam"] },
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = new Map();
    counts.forEach((c) => {
      if (c._id) {
        countMap.set(c._id.toString(), c.count);
      }
    });

    // Count enrolled students per exam
    const enrolledCounts = await User.aggregate([
      { $match: { purchasedExams: { $in: examIds } } },
      { $unwind: "$purchasedExams" },
      { $match: { purchasedExams: { $in: examIds } } },
      { $group: { _id: "$purchasedExams", count: { $sum: 1 } } },
    ]);
    const enrolledMap = new Map();
    enrolledCounts.forEach((c) => {
      if (c._id) enrolledMap.set(c._id.toString(), c.count);
    });

    const examsWithCounts = exams.map((exam) => ({
      ...exam,
      totalQuizzes:
        countMap.get(exam._id.toString()) ||
        countMap.get(exam.title) ||
        0,
      enrolled: enrolledMap.get(exam._id.toString()) || 0,
    }));

    return res.status(200).json({
      success: true,
      exams: examsWithCounts,
      count: examsWithCounts.length,
    });
  } catch (error) {
    console.error("Error getting exams:", error);
    next(error);
  }
};

// 3. Get Single Exam by ID with its Quizzes
export const getExamById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findById(id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // Find quizzes under this exam (support both examId and legacy nameOfExam)
    const quizzes = await Quiz.find({
      $or: [{ examId: exam._id }, { nameOfExam: exam.title }],
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      exam,
      quizzes,
      quizCount: quizzes.length,
    });
  } catch (error) {
    console.error("Error getting exam by id:", error);
    next(error);
  }
};

// 4. Update Exam
export const updateExam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, category, price, isLocked } = req.body;

    const existingExam = await Exam.findById(id);
    if (!existingExam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (category !== undefined) updateData.category = category.trim();
    if (price !== undefined) updateData.price = Math.max(0, Number(price) || 0);
    if (isLocked !== undefined) updateData.isLocked = Boolean(isLocked);

    // If a new logo file is uploaded
    if (req.file) {
      if (existingExam.logoId) {
        try {
          await deleteFromB2(existingExam.logoId);
        } catch (e) {
          console.error("Error deleting old exam logo:", e);
        }
      }

      const file = req.file;
      const uploadRes = await uploadToB2(
        file.buffer,
        file.originalname,
        file.mimetype,
        "exams/logos"
      );
      updateData.logoUrl = uploadRes.url;
      updateData.logoId = uploadRes.fileKey;
    }

    const updatedExam = await Exam.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Exam updated successfully",
      exam: updatedExam,
    });
  } catch (error) {
    console.error("Error updating exam:", error);
    next(error);
  }
};

// 5. Delete Exam (and all its quizzes & questions)
export const deleteExam = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedExam = await Exam.findByIdAndDelete(id);
    if (!deletedExam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // Delete exam logo from B2
    if (deletedExam.logoId) {
      try {
        await deleteFromB2(deletedExam.logoId);
      } catch (e) {
        console.error("Error deleting exam logo from B2:", e);
      }
    }

    // Find and delete all child quizzes
    const childQuizzes = await Quiz.find({
      $or: [{ examId: deletedExam._id }, { nameOfExam: deletedExam.title }],
    });

    const quizIds = childQuizzes.map((q) => q._id);

    // Delete all quiz results for these quizzes
    if (quizIds.length > 0) {
      await QuizResult.deleteMany({ quiz: { $in: quizIds } });
    }

    for (const quiz of childQuizzes) {
      if (quiz.logoId) {
        try {
          await deleteFromB2(quiz.logoId);
        } catch (e) {
          console.error("Error deleting quiz logo:", e);
        }
      }
      // Delete questions for this quiz
      await QuizQuestion.deleteMany({ quizId: quiz._id });
    }

    await Quiz.deleteMany({
      $or: [{ examId: deletedExam._id }, { nameOfExam: deletedExam.title }],
    });

    return res.status(200).json({
      success: true,
      message: "Exam and all associated quizzes deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting exam:", error);
    next(error);
  }
};

// 6. Toggle Exam Lock
export const toggleExamLock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findById(id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    exam.isLocked = !exam.isLocked;
    await exam.save();

    return res.status(200).json({
      success: true,
      message: `Exam ${exam.isLocked ? "locked" : "unlocked"} successfully`,
      exam,
    });
  } catch (error) {
    console.error("Error toggling exam lock:", error);
    next(error);
  }
};

// 7. Get logged-in user's purchased exams (supports guests gracefully)
export const getMyPurchasedExams = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.query?.token;
    if (!token) {
      return res.status(200).json({
        success: true,
        purchasedExams: [],
        purchasedExamIds: [],
        isAdmin: false,
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, ENV.JWT_SECRET || process.env.JWT_SECRET);
    } catch {
      return res.status(200).json({
        success: true,
        purchasedExams: [],
        purchasedExamIds: [],
        isAdmin: false,
      });
    }

    const userId = decoded?.userId || decoded?.id;
    if (!userId) {
      return res.status(200).json({
        success: true,
        purchasedExams: [],
        purchasedExamIds: [],
        isAdmin: false,
      });
    }

    await syncUserCourseExpiry(userId);

    const user = await User.findById(userId)
      .select("purchasedExams purchasedCourse role")
      .populate("purchasedExams");

    if (!user) {
      return res.status(200).json({
        success: true,
        purchasedExams: [],
        purchasedExamIds: [],
        isAdmin: false,
      });
    }

    const directPurchasedExams = (user.purchasedExams || []).map((e) =>
      e.toObject ? e.toObject() : e
    );
    const directExamIds = directPurchasedExams.map((e) =>
      e._id ? e._id.toString() : e.toString()
    );

    // Dynamic course-linked exams
    const userCourseIds = (user.purchasedCourse || []).map((c) =>
      c._id ? c._id : c
    );

    let linkedExams = [];
    if (userCourseIds.length > 0) {
      linkedExams = await Exam.find({
        linkedCourses: { $in: userCourseIds },
      }).lean();
    }

    const mergedPurchasedExams = [...directPurchasedExams];
    const linkedExamIds = [];

    for (const le of linkedExams) {
      const leIdStr = le._id.toString();
      linkedExamIds.push(leIdStr);
      if (!directExamIds.includes(leIdStr)) {
        mergedPurchasedExams.push({
          ...le,
          accessSource: "course_linked",
        });
      }
    }

    const allPurchasedExamIds = Array.from(
      new Set([...directExamIds, ...linkedExamIds])
    );

    return res.status(200).json({
      success: true,
      purchasedExams: mergedPurchasedExams,
      purchasedExamIds: allPurchasedExamIds,
      isAdmin: user.role === "admin",
    });
  } catch (error) {
    console.error("Error getting purchased exams:", error);
    next(error);
  }
};

// 8. Search users for Exam enrollment
export const searchUsersForExamEnrollment = async (req, res, next) => {
  try {
    const { query, examId } = req.query;

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
      .select("_id name email mobileNo role purchasedExams createdAt")
      .limit(15)
      .lean();

    const formattedUsers = users.map((u) => {
      const isEnrolled = examId
        ? u.purchasedExams?.some((p) => p.toString() === examId.toString())
        : false;
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        mobileNo: u.mobileNo,
        role: u.role,
        isEnrolled,
        totalPurchased: u.purchasedExams?.length || 0,
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

// 9. Grant / assign exam to any student (existing or new)
export const grantExamAccess = async (req, res, next) => {
  try {
    const { examId, userId, email, name, mobileNo, planDuration } = req.body;

    if (!examId) {
      return res.status(400).json({ success: false, message: "Exam ID is required" });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
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
        purchasedExams: [],
      });
    }

    // Check if user already has access
    const isAlreadyEnrolled = user.purchasedExams?.some(
      (id) => id.toString() === examId.toString()
    );

    if (isAlreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: `${user.name} already has access to ${exam.title}`,
      });
    }

    // Add exam to user's purchasedExams
    await User.findByIdAndUpdate(user._id, {
      $addToSet: { purchasedExams: examId },
    });

    // Record an order for audit trail
    const orderId = `ADMIN_EXAM_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const paymentId = `ADMIN_${Date.now()}`;

    const order = new Order({
      user: user._id,
      exam: examId,
      orderType: "exam",
      totalAmount: 0,
      planDuration: planDuration || "Lifetime Access",
      paymentGateway: "admin_grant",
      orderId,
      paymentId,
    });
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Exam "${exam.title}" granted successfully to ${user.name} (${user.email})!`,
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

// 10. Revoke exam access from student
export const revokeExamAccess = async (req, res, next) => {
  try {
    const { examId, userId } = req.body;

    if (!examId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Exam ID and User ID are required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Remove exam from purchasedExams
    await User.findByIdAndUpdate(userId, {
      $pull: { purchasedExams: examId },
    });

    // Mark any associated orders as revoked
    await Order.updateMany(
      { user: userId, exam: examId },
      { $set: { paymentGateway: "revoked", expiresAt: new Date(0) } }
    );

    return res.status(200).json({
      success: true,
      message: `Exam access revoked from ${user.name}`,
    });
  } catch (error) {
    next(error);
  }
};

// 11. Get list of enrolled students for a specific exam
export const getExamEnrolledStudents = async (req, res, next) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId).select("title");
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    // Find all users who have this examId in purchasedExams
    const users = await User.find({ purchasedExams: examId })
      .select("_id name email mobileNo createdAt")
      .lean();

    // Fetch orders for this exam to enrich with enrollment details
    const orders = await Order.find({ exam: examId })
      .select("user planDuration expiresAt paymentGateway createdAt")
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
        planDuration: order?.planDuration || "Lifetime Access",
        expiresAt: order?.expiresAt || null,
        grantType: !order
          ? "Direct Enrolled"
          : order.paymentGateway === "admin_grant"
          ? "Admin Granted"
          : order.paymentGateway === "free"
          ? "Free Enrolled"
          : "Paid Order",
      };
    });

    return res.status(200).json({
      success: true,
      examTitle: exam.title,
      students,
      count: students.length,
    });
  } catch (error) {
    next(error);
  }
};

// 12. Update / extend student's exam expiry date
export const updateExamStudentExpiry = async (req, res, next) => {
  try {
    const { examId, userId, planDuration, expiryDate } = req.body;

    if (!examId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Exam ID and User ID are required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const exam = await Exam.findById(examId).select("title");
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    let parsedExpiry = null;
    if (expiryDate) {
      parsedExpiry = new Date(expiryDate);
      if (isNaN(parsedExpiry.getTime())) {
        parsedExpiry = null;
      }
    }

    let finalPlanDuration = planDuration || "Standard";
    if (!planDuration && parsedExpiry) {
      finalPlanDuration = `Valid till ${parsedExpiry.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`;
    }

    // Ensure exam is in user's purchasedExams
    await User.findByIdAndUpdate(userId, {
      $addToSet: { purchasedExams: examId },
    });

    const existingOrder = await Order.findOne({ user: userId, exam: examId }).sort({
      createdAt: -1,
    });

    if (existingOrder) {
      existingOrder.expiresAt = parsedExpiry;
      existingOrder.planDuration = finalPlanDuration;
      if (existingOrder.paymentGateway === "revoked") {
        existingOrder.paymentGateway = "admin_grant";
      }
      await existingOrder.save();
    } else {
      const orderId = `ADMIN_EXAM_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      const paymentId = `ADMIN_${Date.now()}`;
      await Order.create({
        user: userId,
        exam: examId,
        orderType: "exam",
        totalAmount: 0,
        planDuration: finalPlanDuration,
        expiresAt: parsedExpiry,
        paymentGateway: "admin_grant",
        orderId,
        paymentId,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Updated validity for ${user.name} on "${exam.title}" successfully!`,
      student: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobileNo: user.mobileNo,
        planDuration: finalPlanDuration,
        expiresAt: parsedExpiry,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 13. Get all courses with link status and stats for an exam
export const getExamLinkedCourses = async (req, res, next) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId).select("title linkedCourses");
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    // Fetch all courses
    const courses = await Course.find()
      .select("_id title thumbnail amount isFree duration courseType createdAt")
      .sort({ createdAt: -1 })
      .lean();

    // Aggregate enrolled student counts per course
    const courseIds = courses.map((c) => c._id);
    const enrolledAgg = await User.aggregate([
      { $match: { purchasedCourse: { $in: courseIds } } },
      { $unwind: "$purchasedCourse" },
      { $match: { purchasedCourse: { $in: courseIds } } },
      { $group: { _id: "$purchasedCourse", count: { $sum: 1 } } },
    ]);

    const enrolledMap = new Map();
    enrolledAgg.forEach((item) => {
      if (item._id) enrolledMap.set(item._id.toString(), item.count);
    });

    const linkedCourseIdStrs = (exam.linkedCourses || []).map((id) =>
      id.toString()
    );

    const coursesWithStats = courses.map((c) => ({
      ...c,
      enrolledStudents: enrolledMap.get(c._id.toString()) || 0,
      isLinked: linkedCourseIdStrs.includes(c._id.toString()),
    }));

    // Calculate total distinct eligible students from linked courses
    let totalEligibleStudents = 0;
    if (exam.linkedCourses && exam.linkedCourses.length > 0) {
      totalEligibleStudents = await User.countDocuments({
        purchasedCourse: { $in: exam.linkedCourses },
      });
    }

    return res.status(200).json({
      success: true,
      examTitle: exam.title,
      linkedCourseIds: linkedCourseIdStrs,
      totalEligibleStudents,
      courses: coursesWithStats,
    });
  } catch (error) {
    next(error);
  }
};

// 14. Update linked courses for an exam
export const updateExamLinkedCourses = async (req, res, next) => {
  try {
    const { examId, courseIds } = req.body;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "Exam ID is required",
      });
    }

    if (!Array.isArray(courseIds)) {
      return res.status(400).json({
        success: false,
        message: "courseIds must be an array of course IDs",
      });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    exam.linkedCourses = courseIds;
    await exam.save();

    // Count how many unique students now have access via linked courses
    const totalEligibleStudents =
      courseIds.length > 0
        ? await User.countDocuments({ purchasedCourse: { $in: courseIds } })
        : 0;

    return res.status(200).json({
      success: true,
      message: `Updated linked courses for "${exam.title}" successfully! ${totalEligibleStudents} students now have automatic access.`,
      linkedCourses: exam.linkedCourses,
      totalEligibleStudents,
    });
  } catch (error) {
    next(error);
  }
};

