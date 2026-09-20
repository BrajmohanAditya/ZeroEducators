import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";
import { User } from "../models/user.model.js";

export const isLoggedIn = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.query?.token;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No Token Provided" });
    }

    const verifyToken = jwt.verify(token, ENV.JWT_SECRET);

    if (!verifyToken) {
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }

    const user = await User.findById(verifyToken.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Unauthorized - User Not Found" });
    }

    req.user = user;
    next();
  } catch (error) {
    // Clear the expired or invalid cookie so the browser doesn't keep sending it
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Session expired, please login again", success: false });
    }

    return res
      .status(401)
      .json({ message: "Unauthorized - Invalid token", success: false });
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    if (req.user && req.user.role === "admin") {
      next();
    } else {
      return res
        .status(403)
        .json({ message: "Forbidden - Admin Access Required" });
    }
  } catch (error) {
    console.log(`error in admin route ${error}`);
    return res.status(500).json({ message: "Internal server error" });
  }
};
