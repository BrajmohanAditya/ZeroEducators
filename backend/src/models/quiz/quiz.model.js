import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
  {
    nameOfExam: {
      // Banking, SSC , Railway
      type: String,
      required: true,
      trim: true,
    },
    logoUrl: {
      type: String,
      required: true,
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
      default: true, // Default 'true' rakhein taaki test bante hi galti se live na ho jaye
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
