import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { CategoryBar } from './src/models/categoryBar.model.js';

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');
  const count = await CategoryBar.countDocuments();
  console.log('CategoryBar count:', count);
  const items = await CategoryBar.find().populate('courses', 'title');
  console.log(JSON.stringify(items.map(i => ({ title: i.title, order: i.order, coursesCount: i.courses.length, isActive: i.isActive })), null, 2));
  await mongoose.disconnect();
}
test().catch(console.error);

