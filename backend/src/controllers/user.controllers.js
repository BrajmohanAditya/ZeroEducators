import { User } from "../models/user.model.js";
import { Course } from "../models/course.model.js";
import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import { ENV, isTesterEmail } from "../config/env.js";
import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";
import { sendEmail } from "../config/sendEmail.js";
import { OAuth2Client } from "google-auth-library";
import { syncUserCourseExpiry } from "../utils/courseExpiry.js";
const client = new OAuth2Client(ENV.GOOGLE_CLIENT_ID);

export const Register = async (req, res, next) => {
  try {
    const { name, email, password, mobileNo } = req.body;

    if (!name || !email || !password || !mobileNo) {
      return res.status(401).json({
        message: "All fields are required",
        success: false,
      });
    }

    let user = await User.findOne({ email });

    if (user && user.isVerified) {
      return res.status(401).json({
        message: "User already exists",
        success: false,
      });
    }

    const hashPassword = await bcryptjs.hash(password, 10);
    const otp = otpGenerator.generate(4, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    let newUser;
    if (user) {
      user.name = name;
      user.password = hashPassword;
      user.mobileNo = mobileNo;
      user.otp = otp;
      user.otpExpiry = otpExpiry;

      await user.save(); // UPDATE kiya, Naya create nahi kiya
      newUser = user;
    } else {
      // Ye aapka purana likha hua code hai jab user sach me naya ho
      newUser = await User.create({
        name,
        email,
        mobileNo,
        password: hashPassword,
        otp: otp,
        otpExpiry: otpExpiry,
      });
    }

    await sendEmail(
      email,
      "Zero Educators",
      `Hi ${name},\n\nYour OTP to complete registration is: ${otp}\n\nIt will expire in 10 minute`,
    );

    return res.status(201).json({
      message: `OTP has been sent`,
      success: true,
      user: { _id: newUser._id, email: newUser.email },
    });
  } catch (error) {
    next(error);
  }
};

export const Login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(401).json({
        message: "All fields are required",
        success: false,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
        success: false,
      });
    }

    const isPasswordCorrect = await bcryptjs.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid credentials",
        success: false,
      });
    }

    const token = jwt.sign({ userId: user._id }, ENV.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    // Remove password before sending to frontend
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    // Grant all courses to tester email for Google Play review
    if (isTesterEmail(user.email)) {
      const allCourseIds = await Course.find({ isDeleted: { $ne: true } }).distinct("_id");
      userWithoutPassword.purchasedCourse = allCourseIds;
    }

    if (user.role === "admin") {
      return res.status(201).json({
        message: `welcome ${user.name}`,
        success: true,
        user: userWithoutPassword,
        token,
      });
    }

    return res.status(201).json({
      message: `welcome ${user.name}`,
      success: true,
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Auto-remove expired courses if plan duration has passed
    await syncUserCourseExpiry(userId);

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found",
        success: false,
      });
    }

    let userObj = user.toObject();
    // Grant all courses to tester email for Google Play review
    if (isTesterEmail(user.email)) {
      const allCourseIds = await Course.find({ isDeleted: { $ne: true } }).distinct("_id");
      userObj.purchasedCourse = allCourseIds;
    }

    return res.status(201).json({
      message: "User found",
      success: true,
      user: userObj,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    // Use clearCookie with the exact same options you used in Login/Register
    return res
      .clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      })
      .status(200)
      .json({
        message: "User logged out",
        success: true,
      });
  } catch (error) {
    next(error);
  }
};

export const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res
        .status(400)
        .json({ message: "Email and OTP are required", success: false });
    }

    // 1. Database mein user ko uske email se dhundein
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    // 2. Check karein ki jo OTP aaya hai, kya wo database wale se match karta hai?
    if (user.otp !== String(otp)) {
      return res.status(400).json({ message: "Invalid OTP", success: false });
    }

    // 3. Check karein ki OTP 10 minute ke baad Expire toh nahi ho gaya?
    if (user.otpExpiry < new Date()) {
      return res.status(400).json({
        message: "OTP has expired. Please register again.",
        success: false,
      });
    }

    // 4. Agar OTP sahi hai, toh User ko Verify kardo aur purana OTP hata do
    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save(); // Database me save karo

    // 5. Ab unhe Login karwane ke liye Token (Cookie) de do
    const token = jwt.sign({ userId: user._id }, ENV.JWT_SECRET, {
      expiresIn: "7d",
    });

    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    return res
      .status(200)
      .cookie("token", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      })
      .json({
        message: `Welcome ${user.name}`,
        success: true,
        user: userWithoutPassword,
        token,
      });
  } catch (error) {
    next(error);
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    // 1. Verify the token with Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: ENV.GOOGLE_CLIENT_ID,
    });

    // 2. Extract user info from Google's payload
    const { email, name } = ticket.getPayload();

    // 3. Check if user already exists in your database
    let user = await User.findOne({ email });

    if (!user) {
      // 4. If new user, create them.
      // We give a random password and dummy mobile number to satisfy your schema requirements.
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashPassword = await bcryptjs.hash(randomPassword, 10);

      user = await User.create({
        name,
        email,
        password: hashPassword,
        mobileNo: 0, // Dummy number
        isVerified: true, // Google emails are already verified! No OTP needed.
      });
    }

    // 5. Generate JWT Token
    const jwtToken = jwt.sign({ userId: user._id }, ENV.JWT_SECRET, {
      expiresIn: "7d",
    });

    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    // 6. Set the Cookie and send response
    return res
      .status(200)
      .cookie("token", jwtToken, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      })
      .json({
        message: `Welcome ${user.name}`,
        success: true,
        user: userWithoutPassword,
        token: jwtToken,
      });
  } catch (error) {
    console.error("Google Login Error:", error);
    return res
      .status(500)
      .json({ message: "Google login failed: " + error.message, success: false });
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!newPassword || newPassword.trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check current password if user already has one
    if (user.password) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Please enter your current password",
        });
      }

      const isMatch = await bcryptjs.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password does not match",
        });
      }

      const isSame = await bcryptjs.compare(newPassword, user.password);
      if (isSame) {
        return res.status(400).json({
          success: false,
          message: "New password cannot be the same as your current password",
        });
      }
    }

    const hashPassword = await bcryptjs.hash(newPassword, 10);
    user.password = hashPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully!",
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with this email address",
      });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendEmail(
      user.email,
      "Password Reset OTP - Zero Educators",
      `Hi ${user.name},\n\nYour OTP for resetting your Zero Educators account password is: ${otp}\n\nThis OTP will expire in 10 minutes.\n\nIf you did not request a password reset, please ignore this email.`
    );

    return res.status(200).json({
      success: true,
      message: `OTP has been sent to ${user.email}`,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPasswordWithOtp = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required",
      });
    }

    if (newPassword.trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.otp || user.otp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (!user.otpExpiry || new Date() > new Date(user.otpExpiry)) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    const hashPassword = await bcryptjs.hash(newPassword, 10);
    user.password = hashPassword;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully! You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generates or refreshes a stream authentication token for mobile app playback
 */
export const getStreamToken = async (req, res, next) => {
  try {
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    const bearerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const existingToken = req.cookies?.token || req.query?.token || bearerToken;

    if (existingToken) {
      try {
        const decoded = jwt.verify(existingToken, ENV.JWT_SECRET);
        if (decoded?.userId) {
          const freshToken = jwt.sign({ userId: decoded.userId }, ENV.JWT_SECRET, {
            expiresIn: "7d",
          });
          return res.status(200).json({ success: true, token: freshToken });
        }
      } catch {
        // Fallback to userId validation
      }
    }

    const userId = req.body?.userId || req.query?.userId;
    if (userId && mongoose.isValidObjectId(userId)) {
      const user = await User.findById(userId);
      if (user) {
        const token = jwt.sign({ userId: user._id }, ENV.JWT_SECRET, {
          expiresIn: "7d",
        });
        return res.status(200).json({
          success: true,
          token,
          user: { _id: user._id, name: user.name, role: user.role },
        });
      }
    }

    return res.status(401).json({ success: false, message: "Could not generate stream token" });
  } catch (error) {
    next(error);
  }
};



