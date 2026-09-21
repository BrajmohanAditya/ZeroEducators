import express from "express";
import {
  Register,
  Login,
  getUser,
  logout,
  verifyOTP,
  googleLogin,
  changePassword,
  forgotPassword,
  resetPasswordWithOtp,
  getStreamToken,
} from "../controllers/user.controllers.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";

const userRoute = express.Router();

userRoute.post("/register", Register);
userRoute.post("/login", Login);
userRoute.post("/logout", logout);
userRoute.get("/getUser", isLoggedIn, getUser);
userRoute.post("/verify-otp", verifyOTP);
userRoute.post("/google", googleLogin);
userRoute.post("/change-password", isLoggedIn, changePassword);
userRoute.post("/forgot-password", forgotPassword);
userRoute.post("/reset-password", resetPasswordWithOtp);
userRoute.post("/stream-token", getStreamToken);




export default userRoute;
