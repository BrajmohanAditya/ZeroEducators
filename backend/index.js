import express from "express";
import { connectDB } from "./src/config/db.js";
import { ENV } from "./src/config/env.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRoute from "./src/routes/user.route.js";
import courseRoute from "./src/routes/course.route.js";
import moduleRoute from "./src/routes/module.route.js";
import paymentRoute from "./src/routes/payment.route.js";
import heroRoutes from "./src/routes/hero.route.js";
import quizRoute from "./src/routes/quiz/quiz.route.js";
import quizQuestionRoute from "./src/routes/quiz/quiz.question.route.js";
import quizResultRoute from "./src/routes/quiz/quizResult.route.js";
import premiumStudentRoute from "./src/routes/premium.student.route.js";
import successBoardRoute from "./src/routes/success.board.route.js";
import qualifiedMentorRoute from "./src/routes/qualifiedMentors.js";
import ebookRoute from "./src/routes/ebook.route.js";
import ebookQuestionRoute from "./src/routes/ebookQuestion.route.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: ENV.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use("/api", userRoute);
app.use("/api/course", courseRoute);
app.use("/api/module", moduleRoute);
app.use("/api/payment", paymentRoute);
app.use("/api/hero", heroRoutes);
app.use("/api/quiz", quizRoute);
app.use("/api/quizQuestion", quizQuestionRoute);
app.use("/api/quizResult", quizResultRoute);
app.use("/api/premiumStudent", premiumStudentRoute);
app.use("/api/successBoard", successBoardRoute);
app.use("/api/mentor", qualifiedMentorRoute);
app.use("/api/ebook", ebookRoute);
app.use("/api/ebookQuestion", ebookQuestionRoute);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Global Error Handling Middleware

app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error for debugging
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({
    success: false,
    message: message,
    stack: ENV.NODE_ENV === "development" ? err.stack : undefined,
  });
});

app.listen(ENV.PORT || 10000, "0.0.0.0", () => {
  console.log(`Server running on port ${ENV.PORT || 10000}`);
  connectDB();
});
