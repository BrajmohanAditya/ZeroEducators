import {configDotenv} from 'dotenv'

configDotenv({});

export const ENV = {
  MONGO_URI: process.env.MONGO_URI,
  PORT: process.env.PORT,
  JWT_SECRET: process.env.JWT_SECRET,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  CLIENT_URL: process.env.CLIENT_URL,
  RAZORPAY_KEY_ID: process.env.Live_RAZORPAY_API_Key,
  RAZORPAY_KEY_SECRET: process.env.Live_RAZORPAY_Key_Secret,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  Resend_api_key: process.env.Resend_api_key,
  B2_KEY_ID: process.env.B2_KEY_ID,
  B2_APPLICATION_KEY: process.env.B2_APPLICATION_KEY,
  B2_BUCKET_NAME: process.env.B2_BUCKET_NAME,
  B2_ENDPOINT: process.env.B2_ENDPOINT,
  B2_REGION: process.env.B2_REGION,
};