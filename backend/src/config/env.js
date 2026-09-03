import {configDotenv} from 'dotenv'

configDotenv({});

export const ENV = {
  MONGO_URI: process.env.MONGO_URI,
  PORT: process.env.PORT,
  JWT_SECRET: process.env.JWT_SECRET,
  CLOUDINARY_NAME: process.env.CLOUDINARY_NAME,
  CLOUDINARY_API: process.env.CLOUDINARY_API,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  CLIENT_URL: process.env.CLIENT_URL,
  RAZORPAY_KEY_ID: process.env.Live_RAZORPAY_API_Key,
  RAZORPAY_KEY_SECRET: process.env.Live_RAZORPAY_Key_Secret,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  Resend_api_key:process.env.Resend_api_key,
};