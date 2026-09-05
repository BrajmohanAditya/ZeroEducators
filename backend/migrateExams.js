import mongoose from "mongoose";
import { connectDB } from "./src/config/db.js";
import { Exam } from "./src/models/quiz/exam.model.js";
import { Quiz } from "./src/models/quiz/quiz.model.js";

const migrate = async () => {
  try {
    console.log("Connecting to DB...");
    await connectDB();

    const quizzes = await Quiz.find({});
    console.log(`Found ${quizzes.length} total quizzes.`);

    const examMap = new Map();

    for (const quiz of quizzes) {
      if (!quiz.nameOfExam) continue;

      let exam = examMap.get(quiz.nameOfExam);
      if (!exam) {
        exam = await Exam.findOne({ title: quiz.nameOfExam });
        if (!exam) {
          exam = await Exam.create({
            title: quiz.nameOfExam,
            logoUrl: quiz.logoUrl || "",
            logoId: quiz.logoId || "",
            category: quiz.nameOfExam,
          });
          console.log(`Created new Exam: "${exam.title}" with ID: ${exam._id}`);
        }
        examMap.set(quiz.nameOfExam, exam);
      }

      if (!quiz.examId) {
        quiz.examId = exam._id;
        await quiz.save();
        console.log(`Linked Quiz "${quiz.quizName}" to Exam "${exam.title}"`);
      }
    }

    console.log("Migration complete!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
};

migrate();
