import mongoose from "mongoose";

const quizQuestionSchema = new mongoose.Schema(
  {
    // 1. Link this question to a specific Quiz
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    // 2. Link this question to a specific section (e.g., "Math" or "Reasoning")
    sectionName: {
      type: String,
      required: true,
    },

    // 3. The Question itself
    questionText: {
      type: String,
      required: true,
    },
    questionImage: {
      type: String,
      default: "", // Optional image URL from Cloudinary/S3
    },
    marks: {
      type: Number,
      required: true,
      default: 1, // Defaulting to 1 as seen in your screenshot
    },

    // 4. The Options (We use an array of objects so you can have 4, 5, or however many options you want!)
    optionsInstruction: {
      type: String,
      default: "", // E.g., "Choose the correct answer"
    },
    options: [
      {
        text: {
          type: String,
          required: true,
        },
        image: {
          type: String,
          default: "", // Optional option image
        },
        isCorrect: {
          type: Boolean,
          required: true,
          default: false, // You will set one of the options to true!
        },
      },
    ],

    // 5. The Solution
    solutionExplanation: {
      type: String,
      default: "", // Optional
    },
    solutionImage: {
      type: String,
      default: "", // Optional solution image
    },
  },
  {
    timestamps: true, // Automatically gives us createdAt and updatedAt
  }
);

export const QuizQuestion = mongoose.model("QuizQuestion", quizQuestionSchema);
