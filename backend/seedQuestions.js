import fs from "fs";
import mongoose from "mongoose";
import { connectDB } from "./src/config/db.js";
import { EbookQuestion } from "./src/models/eBook/ebookQuestion.model.js";

const seedData = async () => {
  try {
    // 1. Connect to MongoDB
    console.log("Connecting to Database...");
    await connectDB();

    // 2. Read and Parse JSON file
    console.log("Reading question.json file...");
    const rawData = fs.readFileSync("./question.json", "utf-8");
    const questions = JSON.parse(rawData);

    if (!Array.isArray(questions) || questions.length === 0) {
      console.error("Error: question.json must be a non-empty array.");
      process.exit(1);
    }

    console.log(`Parsed ${questions.length} questions. Starting upload...`);

    // 3. Insert questions into the database
    const result = await EbookQuestion.insertMany(questions);
    console.log(`Success! Successfully inserted ${result.length} questions.`);

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
