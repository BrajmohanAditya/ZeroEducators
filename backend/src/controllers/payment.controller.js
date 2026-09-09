import {
  createCashfreeOrder,
  fetchCashfreeOrder,
  fetchCashfreeOrderPayments,
} from "../config/cashfree.js";
import { Course } from "../models/course.model.js";
import { Exam } from "../models/quiz/exam.model.js";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import { ENV } from "../config/env.js";

export const createCheckOutSession = async (req, res, next) => {
  try {
    const { products } = req.body;

    if (!products) {
      return res.status(400).json({
        message: "Please provide course",
      });
    }

    const courseId = products._id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    // If course is Free, enroll user directly without Payment Gateway!
    if (Number(course.amount) === 0 || course.isFree) {
      const user = await User.findById(req.user._id);
      const alreadyEnrolled = user?.purchasedCourse?.some(
        (id) => id.toString() === courseId.toString()
      );

      if (!alreadyEnrolled) {
        await User.findByIdAndUpdate(req.user._id, {
          $addToSet: { purchasedCourse: courseId },
        });

        const freeOrder = new Order({
          user: req.user._id,
          course: courseId,
          totalAmount: 0,
          paymentId: `FREE_${Date.now()}`,
          orderId: `FREE_ORDER_${Date.now()}`,
          paymentGateway: "free",
        });
        await freeOrder.save();
      }

      return res.status(200).json({
        success: true,
        isFree: true,
        courseId,
        message: alreadyEnrolled
          ? "You are already enrolled in this course!"
          : "Enrolled in free course successfully!",
      });
    }

    // Determine price based on selected pricing plan if available
    const planId = req.body.planId || products.planId;
    const planDuration = req.body.planDuration || products.planDuration;
    let orderAmount = Number(course.amount);
    let chosenPlan = null;

    if (course.pricingPlans && course.pricingPlans.length > 0) {
      if (planId) {
        chosenPlan = course.pricingPlans.find(
          (p) => p._id.toString() === planId.toString()
        );
      }
      if (!chosenPlan && planDuration) {
        chosenPlan = course.pricingPlans.find((p) => p.duration === planDuration);
      }
      if (!chosenPlan) {
        chosenPlan = course.pricingPlans[0];
      }
      orderAmount = Number(chosenPlan.price);
    }

    // Fetch user details for Cashfree customer_details
    const user = await User.findById(req.user._id);
    const orderId = `order_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    // Sanitize phone number (Cashfree requires a valid 10-digit number)
    let phone = user?.mobileNo ? String(user.mobileNo).replace(/\D/g, "") : "";
    if (phone.length > 10) {
      phone = phone.slice(-10);
    }
    if (phone.length < 10) {
      phone = "9999999999";
    }

    const durationLabel = chosenPlan?.duration || course.duration || "Standard";

    const order = await createCashfreeOrder({
      orderId,
      orderAmount: orderAmount,
      currency: "INR",
      customerDetails: {
        customerId: req.user._id.toString(),
        name: user?.name || "Zero Educator Student",
        email: user?.email || "student@zeroeducators.com",
        phone: phone,
      },
      orderMeta: {
        return_url: `${ENV.CLIENT_URL}/SinglePurchasedCourse/${courseId}`,
      },
      orderNote: `Course purchase: ${course.title} [${durationLabel}] (ID: ${courseId})`,
    });

    return res.status(201).json({
      success: true,
      order: {
        orderId: order.order_id,
        paymentSessionId: order.payment_session_id,
        orderAmount: order.order_amount,
        orderCurrency: order.order_currency,
        courseId: courseId,
        planDuration: durationLabel,
      },
    });
  } catch (error) {
    console.error("Error creating Cashfree checkout session:", error);
    next(error);
  }
};

export const checkoutSuccess = async (req, res, next) => {
  try {
    const { orderId, courseId: providedCourseId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    // Check if order already exists in database
    const existingOrder = await Order.findOne({ orderId });
    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: "Order already processed",
        orderId: existingOrder._id,
        courseId: existingOrder.course,
      });
    }

    // Fetch order status from Cashfree API
    const cfOrder = await fetchCashfreeOrder(orderId);

    if (!cfOrder || cfOrder.order_status !== "PAID") {
      return res.status(400).json({
        message: `Payment not completed. Current status: ${cfOrder?.order_status || "UNKNOWN"}`,
      });
    }

    const userId = req.user._id;
    let courseId = providedCourseId;

    // If courseId not directly provided, try to extract from order_note
    if (!courseId && cfOrder.order_note) {
      const match = cfOrder.order_note.match(/ID:\s*([a-f0-9]{24})/i);
      if (match) {
        courseId = match[1];
      }
    }

    if (!courseId) {
      return res.status(400).json({ message: "Associated course not found for this order" });
    }

    // Fetch payment details to get cf_payment_id
    let paymentId = `cf_${orderId}`;
    try {
      const payments = await fetchCashfreeOrderPayments(orderId);
      if (Array.isArray(payments) && payments.length > 0) {
        const successPayment = payments.find((p) => p.payment_status === "SUCCESS") || payments[0];
        if (successPayment?.cf_payment_id) {
          paymentId = String(successPayment.cf_payment_id);
        }
      }
    } catch (paymentFetchError) {
      console.warn("Could not fetch individual payment details:", paymentFetchError);
    }

    let planDuration = req.body.planDuration;
    if (!planDuration && cfOrder.order_note) {
      const planMatch = cfOrder.order_note.match(/\[(.*?)\]/);
      if (planMatch) {
        planDuration = planMatch[1];
      }
    }

    const newOrder = new Order({
      user: userId,
      course: courseId,
      totalAmount: cfOrder.order_amount,
      planDuration: planDuration || "",
      orderId: orderId,
      paymentId: paymentId,
      paymentGateway: "cashfree",
    });

    await newOrder.save();

    await User.findByIdAndUpdate(userId, {
      $addToSet: { purchasedCourse: courseId },
    });

    return res.status(201).json({
      success: true,
      message: "Payment successful! Course unlocked.",
      orderId: newOrder._id,
      courseId: courseId,
    });
  } catch (error) {
    console.error("Error verifying Cashfree checkout success:", error);
    next(error);
  }
};

export const createExamCheckOutSession = async (req, res, next) => {
  try {
    const { examId } = req.body;

    if (!examId) {
      return res.status(400).json({ message: "Please provide exam ID" });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    const userId = req.user._id;
    const user = await User.findById(userId);

    // Check if already purchased
    const alreadyPurchased = user?.purchasedExams?.some(
      (id) => id.toString() === examId.toString()
    );

    if (alreadyPurchased) {
      return res.status(200).json({
        success: true,
        alreadyPurchased: true,
        examId,
        message: "You have already unlocked this exam package!",
      });
    }

    // If Exam price is 0 (Free exam), unlock directly without gateway
    if (!exam.price || Number(exam.price) === 0) {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { purchasedExams: examId },
      });

      const freeOrder = new Order({
        user: userId,
        exam: examId,
        orderType: "exam",
        totalAmount: 0,
        paymentId: `FREE_EXAM_${Date.now()}`,
        orderId: `FREE_EXAM_ORDER_${Date.now()}`,
        paymentGateway: "free",
      });
      await freeOrder.save();

      return res.status(200).json({
        success: true,
        isFree: true,
        examId,
        message: "Exam unlocked successfully!",
      });
    }

    const orderAmount = Number(exam.price);
    const orderId = `exam_ord_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    let phone = user?.mobileNo ? String(user.mobileNo).replace(/\D/g, "") : "";
    if (phone.length > 10) phone = phone.slice(-10);
    if (phone.length < 10) phone = "9999999999";

    const order = await createCashfreeOrder({
      orderId,
      orderAmount,
      currency: "INR",
      customerDetails: {
        customerId: user._id.toString(),
        name: user.name || "Student",
        email: user.email || "student@example.com",
        phone: phone,
      },
      orderNote: `Exam Package: ${exam.title} (ID: ${examId})`,
    });

    return res.status(200).json({
      success: true,
      order: {
        orderId,
        paymentSessionId: order.payment_session_id,
        examId,
        amount: orderAmount,
      },
    });
  } catch (error) {
    console.error("Error creating Exam checkout session:", error);
    next(error);
  }
};

export const checkoutExamSuccess = async (req, res, next) => {
  try {
    const { orderId, examId: providedExamId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const existingOrder = await Order.findOne({ orderId });
    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: "Exam order already processed",
        orderId: existingOrder._id,
        examId: existingOrder.exam,
      });
    }

    const cfOrder = await fetchCashfreeOrder(orderId);

    if (!cfOrder || cfOrder.order_status !== "PAID") {
      return res.status(400).json({
        message: `Payment not completed. Current status: ${cfOrder?.order_status || "UNKNOWN"}`,
      });
    }

    const userId = req.user._id;
    let examId = providedExamId;

    if (!examId && cfOrder.order_note) {
      const match = cfOrder.order_note.match(/ID:\s*([a-f0-9]{24})/i);
      if (match) {
        examId = match[1];
      }
    }

    if (!examId) {
      return res.status(400).json({ message: "Associated exam not found for this order" });
    }

    let paymentId = `cf_${orderId}`;
    try {
      const payments = await fetchCashfreeOrderPayments(orderId);
      if (Array.isArray(payments) && payments.length > 0) {
        const successPayment = payments.find((p) => p.payment_status === "SUCCESS") || payments[0];
        if (successPayment?.cf_payment_id) {
          paymentId = String(successPayment.cf_payment_id);
        }
      }
    } catch (paymentFetchError) {
      console.warn("Could not fetch payment details:", paymentFetchError);
    }

    const newOrder = new Order({
      user: userId,
      exam: examId,
      orderType: "exam",
      totalAmount: cfOrder.order_amount,
      orderId: orderId,
      paymentId: paymentId,
      paymentGateway: "cashfree",
    });

    await newOrder.save();

    await User.findByIdAndUpdate(userId, {
      $addToSet: { purchasedExams: examId },
    });

    return res.status(201).json({
      success: true,
      message: "Payment successful! Exam package unlocked.",
      orderId: newOrder._id,
      examId: examId,
    });
  } catch (error) {
    console.error("Error verifying Cashfree Exam checkout success:", error);
    next(error);
  }
};

