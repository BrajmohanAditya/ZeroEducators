import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { createCheckOutSession, checkoutSuccess } from "../controllers/payment.controller.js";

const paymentRoute = express.Router()

paymentRoute.post('/checkout', isLoggedIn, createCheckOutSession)
paymentRoute.post('/checkout-success', isLoggedIn, checkoutSuccess)



export default paymentRoute