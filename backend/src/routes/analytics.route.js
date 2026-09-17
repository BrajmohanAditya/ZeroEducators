import express from "express";
import { isLoggedIn, isAdmin } from "../middlewares/auth.middleware.js";
import { getAdminAnalytics } from "../controllers/analytics.controller.js";

const analyticsRoute = express.Router();

analyticsRoute.get("/overview", isLoggedIn, isAdmin, getAdminAnalytics);

export default analyticsRoute;
