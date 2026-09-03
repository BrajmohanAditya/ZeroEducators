import mongoose from "mongoose";

const quizResultSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    totalScore: { type: Number, required: true },
    correctCount: { type: Number, required: true },
    wrongCount: { type: Number, required: true },
    unattemptedCount: { type: Number, required: true },
    userAnswers: { type: Object, required: true }, // This saves their selected options dictionary!
  },
  { timestamps: true },
);

export const QuizResult = mongoose.model("QuizResult", quizResultSchema);
