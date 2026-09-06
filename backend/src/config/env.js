import {configDotenv} from 'dotenv'

configDotenv({});

export const ENV = {
  MONGO_URI: process.env.MONGO_URI,
  PORT: process.env.PORT,
  JWT_SECRET: process.env.JWT_SECRET,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  CLIENT_URL: process.env.CLIENT_URL,
  CASHFREE_APP_ID: process.env.CASHFREE_APP_ID,
  CASHFREE_SECRET_KEY: process.env.CASHFREE_SECRET_KEY,
  CASHFREE_ENV: process.env.CASHFREE_ENV || "PRODUCTION",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  Resend_api_key: process.env.Resend_api_key,
  ZATA_ACCESS_KEY: process.env.ZATA_ACCESS_KEY,
  ZATA_SECRET_KEY: process.env.ZATA_SECRET_KEY,
  ZATA_BUCKET_NAME: process.env.ZATA_BUCKET_NAME,
  ZATA_ENDPOINT: process.env.ZATA_ENDPOINT,
  ZATA_REGION: process.env.ZATA_REGION,
};