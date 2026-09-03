import fs from "fs";
import mongoose from "mongoose";
import { connectDB } from "./src/config/db.js";
import { QuizQuestion } from "./src/models/quiz/quiz.question.model.js";

const seedData = async () => {
  try {
    // 1. Connect to MongoDB
    console.log("Connecting to Database...");
    await connectDB();

    // 2. Read and Parse JSON file
    console.log("Reading quize.json file...");
    const rawData = fs.readFileSync("./quize.json", "utf-8");
    const questions = JSON.parse(rawData);

    if (!Array.isArray(questions) || questions.length === 0) {
      console.error("Error: quize.json must be a non-empty array.");
      process.exit(1);
    }

    console.log(`Parsed ${questions.length} questions. Starting validation...`);

    // Basic structure validation to prevent bad seeds
    for (const q of questions) {
      if (!q.quizId) {
        throw new Error("Missing 'quizId' in one of the questions.");
      }
      if (!q.sectionName) {
        throw new Error("Missing 'sectionName' in one of the questions.");
      }
      if (!q.questionText) {
        throw new Error("Missing 'questionText' in one of the questions.");
      }
      if (!Array.isArray(q.options) || q.options.length === 0) {
        throw new Error("Questions must contain a non-empty 'options' array.");
      }
      
      const hasCorrect = q.options.some(opt => opt.isCorrect === true);
      if (!hasCorrect) {
        throw new Error(`Question "${q.questionText.substring(0, 30)}..." has no correct option selected.`);
      }
    }

    console.log("Validation passed. Uploading to database...");

    // 3. Insert questions into the database
    const result = await QuizQuestion.insertMany(questions);
    console.log(`Success! Successfully inserted ${result.length} quiz questions.`);

    // 4. Disconnect from database and exit
    await mongoose.disconnect();
    console.log("Database disconnected. Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed with error:", error);
    process.exit(1);
  }
};

seedData();
