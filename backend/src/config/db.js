import mongoose from 'mongoose';
import { ENV } from './env.js';

export const connectDB = async () => {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    console.log('MongoDB connected');
    try {
      await mongoose.connection.collection('orders').dropIndex('razorpayPaymentId_1');
    } catch {
      // Index does not exist or already dropped
    }
  } catch (error) {
    console.log('MongoDB connection error:', error);
  }
};
