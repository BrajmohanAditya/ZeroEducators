import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";
import { User } from "../models/user.model.js";

export const isLoggedIn = async (req, res, next) => {
  try {
    const token = req.cookies.token;

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
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
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
