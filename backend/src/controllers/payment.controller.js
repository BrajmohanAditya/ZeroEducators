import { razorpay } from "../config/razorpay.js";
import { Course } from "../models/course.model.js";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import crypto from "crypto";

export const createCheckOutSession = async (req, res, next) => {
  try {
    const { products } = req.body;

    if (!products) {
      return res.status(401).json({
        message: "Please provide course",
      });
    }

    const courseId = products._id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(401).json({
        message: "Course not found",
      });
    }

    // 1. Order Options banayein
    const options = {
      amount: Math.round(course.amount * 100), // Amount ko paise mein convert karna zaroori hai
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,

      notes: {
        userId: req.user._id.toString(),
        courseId: courseId.toString(),
        coursePrice: course.amount.toString(),
      },
    };

    // 2. Razorpay se order create karein
    const order = await razorpay.orders.create(options);

    // 3. Frontend ko response bhejein
    return res.status(201).json({
      success: true,
      order: order, // Ye order object hume frontend par chahiye hoga
    });

    // FRONTEND URL = http://localhost:5173
  } catch (error) {
    next(error);
  }
};

// Ye file ke sabse upar import karna zaroori hai

export const checkoutSuccess = async (req, res, next) => {
  try {
    const { paymentId, orderId, signature } = req.body;

    if (!paymentId || !orderId || !signature) {
      return res.status(401).json({ message: "Payment Data not found" });
    }

    const existingOrder = await Order.findOne({
      razorpayPaymentId: paymentId,
    });

    if (existingOrder) {
      return res.status(201).json({ message: "Order already created" });
    }

    // 2. Signature Verify karna (Razorpay Security - Yeh zaroori hai!)
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.Live_RAZORPAY_Key_Secret) // Apni .env file mein RAZORPAY_SECRET zaroor daalein
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== signature) {
      return res
        .status(400)
        .json({ message: "Payment verification failed (Invalid Signature)" });
    }

    // 3. Razorpay se order fetch karke notes (courseId, userId) nikalna
    const session = await razorpay.orders.fetch(orderId);

    if (session.status === "paid") {
      const courseId = session.notes.courseId; // Razorpay mein 'notes' hota hai 'metadata' nahi
      const userId = session.notes.userId;

      const newOrder = new Order({
        user: userId,
        course: courseId,
        totalAmount: session.amount / 100, // amount_total nahi hota
        razorpayPaymentId: paymentId, // Unique id ki tarah ise use kar rahe hain
      });

      await newOrder.save();

      await User.findByIdAndUpdate(userId, {
        $push: { purchasedCourse: courseId },
      });

      return res.status(201).json({
        message: "Payment successful",
        orderId: newOrder._id,
      });
    }

    return res.status(401).json({ message: "Payment failed at gateway" });
  } catch (error) {
    next(error);
  }
};
