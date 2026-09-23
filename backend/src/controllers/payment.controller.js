import {
  createCashfreeOrder,
  fetchCashfreeOrder,
  fetchCashfreeOrderPayments,
} from "../config/cashfree.js";
import { Course } from "../models/course.model.js";
import { Exam } from "../models/quiz/exam.model.js";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import { Coupon } from "../models/coupon.model.js";
import { ENV } from "../config/env.js";
import { calculatePlanExpiry } from "../utils/courseExpiry.js";

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

    const originalAmount = orderAmount;
    let discountAmount = 0;
    let appliedCoupon = null;

    // Handle Coupon Code if provided
    const couponCode = req.body.couponCode || products.couponCode;
    if (couponCode && typeof couponCode === "string" && couponCode.trim() !== "") {
      const cleanCode = couponCode.trim().toUpperCase();
      appliedCoupon = await Coupon.findOne({ code: cleanCode });

      if (!appliedCoupon) {
        return res.status(404).json({
          message: "Invalid coupon code",
        });
      }

      const check = appliedCoupon.isValidFor({
        userId: req.user._id,
        courseId,
        amount: originalAmount,
      });

      if (!check.valid) {
        return res.status(400).json({
          message: check.message,
        });
      }

      const discountResult = appliedCoupon.calculateDiscount(originalAmount);
      discountAmount = discountResult.discountAmount;
      orderAmount = discountResult.finalAmount;
    }

    const durationLabel = chosenPlan?.duration || course.duration || "Standard";

    // If coupon gives 100% discount (final amount = 0), enroll immediately!
    if (orderAmount <= 0) {
      const user = await User.findById(req.user._id);
      const alreadyEnrolled = user?.purchasedCourse?.some(
        (id) => id.toString() === courseId.toString()
      );

      if (!alreadyEnrolled) {
        await User.findByIdAndUpdate(req.user._id, {
          $addToSet: { purchasedCourse: courseId },
        });

        const couponOrder = new Order({
          user: req.user._id,
          course: courseId,
          totalAmount: 0,
          originalAmount,
          discountAmount,
          couponCode: appliedCoupon?.code,
          couponId: appliedCoupon?._id,
          planDuration: durationLabel,
          expiresAt: calculatePlanExpiry(durationLabel, new Date()),
          paymentId: `COUPON_FREE_${Date.now()}`,
          orderId: `COUPON_ORDER_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
          paymentGateway: "coupon_free",
        });
        await couponOrder.save();

        if (appliedCoupon) {
          appliedCoupon.usedCount = (appliedCoupon.usedCount || 0) + 1;
          appliedCoupon.usedBy.push({
            userId: req.user._id,
            orderId: couponOrder.orderId,
          });
          await appliedCoupon.save();
        }
      }

      return res.status(200).json({
        success: true,
        isFree: true,
        courseId,
        message: alreadyEnrolled
          ? "You are already enrolled in this course!"
          : "Coupon applied! Course unlocked for free!",
      });
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
      orderNote: `Course purchase: ${course.title} [${durationLabel}] (ID: ${courseId}) [COUPON:${appliedCoupon ? appliedCoupon.code : "NONE"}]`,
    });

    const isProduction = (ENV.CASHFREE_ENV || "PRODUCTION").toUpperCase() === "PRODUCTION";
    const mode = isProduction ? "production" : "sandbox";
    const host = req.get("host") || "zeroeducators.com";
    const protocol = host.includes("localhost") || host.includes("10.0.2.2") ? "http" : "https";
    const checkoutUrl = `${protocol}://${host}/api/payment/pay?session=${order.payment_session_id}&order_id=${order.order_id}&course_id=${courseId}&mode=${mode}`;

    return res.status(201).json({
      success: true,
      order: {
        orderId: order.order_id,
        paymentSessionId: order.payment_session_id,
        checkoutUrl: checkoutUrl,
        orderAmount: order.order_amount,
        orderCurrency: order.order_currency,
        courseId: courseId,
        planDuration: durationLabel,
        couponCode: appliedCoupon?.code || null,
        discountAmount,
        originalAmount,
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

    // Extract and record coupon usage if applied
    let couponCode = req.body.couponCode;
    if (!couponCode && cfOrder.order_note) {
      const couponMatch = cfOrder.order_note.match(/\[COUPON:(.*?)\]/);
      if (couponMatch && couponMatch[1] !== "NONE") {
        couponCode = couponMatch[1];
      }
    }

    let couponObj = null;
    let discountAmount = 0;
    let originalAmount = Number(cfOrder.order_amount);

    if (couponCode && typeof couponCode === "string" && couponCode.trim() !== "") {
      couponObj = await Coupon.findOne({ code: couponCode.trim().toUpperCase() });
      if (couponObj) {
        couponObj.usedCount = (couponObj.usedCount || 0) + 1;
        couponObj.usedBy.push({
          userId,
          orderId,
          usedAt: new Date(),
        });
        await couponObj.save();

        if (couponObj.discountType === "flat") {
          discountAmount = Number(couponObj.discountAmount);
          originalAmount = Number(cfOrder.order_amount) + discountAmount;
        } else if (couponObj.discountType === "percentage") {
          const discountPct = Number(couponObj.discountAmount);
          if (discountPct < 100) {
            originalAmount = Math.round(Number(cfOrder.order_amount) / (1 - discountPct / 100));
            discountAmount = originalAmount - Number(cfOrder.order_amount);
          }
        }
      }
    }

    const newOrder = new Order({
      user: userId,
      course: courseId,
      totalAmount: cfOrder.order_amount,
      originalAmount: originalAmount || cfOrder.order_amount,
      discountAmount: discountAmount || 0,
      couponCode: couponObj?.code || "",
      couponId: couponObj?._id || null,
      planDuration: planDuration || "",
      expiresAt: calculatePlanExpiry(planDuration, new Date()),
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

    const isProduction = (ENV.CASHFREE_ENV || "PRODUCTION").toUpperCase() === "PRODUCTION";
    const mode = isProduction ? "production" : "sandbox";
    const host = req.get("host") || "zeroeducators.com";
    const protocol = host.includes("localhost") || host.includes("10.0.2.2") ? "http" : "https";
    const checkoutUrl = `${protocol}://${host}/api/payment/pay?session=${order.payment_session_id}&order_id=${orderId}&exam_id=${examId}&mode=${mode}`;

    return res.status(200).json({
      success: true,
      order: {
        orderId,
        paymentSessionId: order.payment_session_id,
        checkoutUrl: checkoutUrl,
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

/**
 * Direct Cashfree Hosted Checkout Webpage
 * Opened directly by the mobile app or browser without SDK setup needed on the client.
 */
export const renderCheckoutPage = (req, res) => {
  const { session, mode = "production" } = req.query;

  if (!session) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Invalid Payment Session</title></head>
      <body style="font-family:sans-serif; background:#0f172a; color:#f87171; text-align:center; padding:40px;">
        <h2>Payment Session Missing</h2>
        <p style="color:#94a3b8;">Please restart enrollment from the Zero Educators app.</p>
      </body>
      </html>
    `);
  }

  const safeSession = String(session).replace(/[^a-zA-Z0-9_\-]/g, "");
  const safeMode = mode === "sandbox" ? "sandbox" : "production";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Zero Educators - Secure Checkout</title>
  <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: radial-gradient(circle at top center, #1e293b, #0f172a);
      color: #ffffff;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: rgba(30, 41, 59, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 36px 24px;
      max-width: 400px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .brand {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 24px;
    }
    .brand-text {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #10b981;
    }
    .spinner {
      width: 52px;
      height: 52px;
      border: 4px solid rgba(16, 185, 129, 0.2);
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 16px auto;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .heading {
      font-size: 18px;
      font-weight: 700;
      color: #f8fafc;
      margin-bottom: 8px;
    }
    .desc {
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.5;
    }
    .pill {
      display: inline-block;
      margin-top: 18px;
      padding: 6px 14px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 999px;
      color: #34d399;
      font-size: 12px;
      font-weight: 600;
    }
    .error-box {
      margin-top: 16px;
      padding: 12px;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 12px;
      color: #fca5a5;
      font-size: 13px;
      display: none;
    }
    .btn {
      margin-top: 16px;
      padding: 12px 24px;
      background: #10b981;
      color: #022c22;
      font-weight: 700;
      font-size: 14px;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      display: none;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">
      <span class="brand-text">Zero Educators</span>
    </div>
    <div class="spinner" id="spinner"></div>
    <div class="heading" id="statusHead">Opening Payment Gateway...</div>
    <div class="desc" id="statusDesc">Redirecting to Cashfree (UPI / Cards / Netbanking). Please wait...</div>
    <div class="pill">🔒 100% Secure &amp; Official Gateway</div>
    <div class="error-box" id="errBox"></div>
    <button class="btn" id="retryBtn" onclick="launchCashfree()">Tap to Continue</button>
  </div>

  <script>
    const sessionId = "${safeSession}";
    const mode = "${safeMode}";

    function launchCashfree() {
      const errBox = document.getElementById('errBox');
      const retryBtn = document.getElementById('retryBtn');
      const spinner = document.getElementById('spinner');
      errBox.style.display = 'none';
      retryBtn.style.display = 'none';
      spinner.style.display = 'block';

      if (!window.Cashfree) {
        spinner.style.display = 'none';
        errBox.textContent = 'Cashfree gateway failed to load. Please check internet and retry.';
        errBox.style.display = 'block';
        retryBtn.style.display = 'inline-block';
        return;
      }

      try {
        const cashfree = window.Cashfree({ mode: mode });
        cashfree.checkout({
          paymentSessionId: sessionId,
          redirectTarget: '_self'
        }).then(function(res) {
          if (res?.error) {
            spinner.style.display = 'none';
            errBox.textContent = res.error.message || 'Payment initiation error.';
            errBox.style.display = 'block';
            retryBtn.style.display = 'inline-block';
          }
        }).catch(function(err) {
          spinner.style.display = 'none';
          errBox.textContent = err?.message || 'Failed to open payment gateway.';
          errBox.style.display = 'block';
          retryBtn.style.display = 'inline-block';
        });
      } catch (e) {
        spinner.style.display = 'none';
        errBox.textContent = e?.message || 'Unexpected error.';
        errBox.style.display = 'block';
        retryBtn.style.display = 'inline-block';
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', launchCashfree);
    } else {
      launchCashfree();
    }
  </script>
</body>
</html>`;

  return res.type("html").send(html);
};

