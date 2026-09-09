import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import {
  createCheckOutSession,
  checkoutSuccess,
  createExamCheckOutSession,
  checkoutExamSuccess,
} from "../controllers/payment.controller.js";

const paymentRoute = express.Router();

paymentRoute.post("/checkout", isLoggedIn, createCheckOutSession);
paymentRoute.post("/checkout-success", isLoggedIn, checkoutSuccess);

paymentRoute.post("/checkout-exam", isLoggedIn, createExamCheckOutSession);
paymentRoute.post("/checkout-exam-success", isLoggedIn, checkoutExamSuccess);

export default paymentRoute;