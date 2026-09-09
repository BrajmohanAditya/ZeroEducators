import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
    },
    nameOfExam: {
      // Banking, SSC , Railway (kept for backward compatibility or populated from Exam)
      type: String,
      trim: true,
    },
    logoUrl: {
      type: String,
    },
    logoId: {
      type: String,
    },
    quizName: {
      // Set 1 , Set 2
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: Number,
      required: true, // Duration in minutes
    },
    negativeMark: {
      type: Number,
      required: true,
      default: 0, // e.g. 0.25
    },
    section: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        totalQuestions: {
          type: Number,
          required: true,
        },
      },
    ],
    totalNoOfQueation: {
      type: Number,
      required: true,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    isLocked: {
      type: Boolean,
      default: true,
    },
    price: {
      type: Number,
      default: 0, // 0 means Free
      min: 0,
    },
    quizType: {
      type: String,
      enum: ["Free", "Paid"],
      default: "Free",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Quiz = mongoose.model("Quiz", quizSchema);
