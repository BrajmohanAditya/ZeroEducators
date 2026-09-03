import express from 'express';
import { createHeroItem, getHeroItems, deleteHeroItem } from '../controllers/hero.controller.js';
import upload from '../middlewares/multer.js'; // Use your existing multer setup
import { isAdmin, isLoggedIn } from '../middlewares/auth.middleware.js'; // Add your auth middleware if you have it

const router = express.Router();

router.get('/', getHeroItems);


router.post('/', upload.single('image'), isLoggedIn, isAdmin, createHeroItem);

router.delete('/:id', isLoggedIn, isAdmin, deleteHeroItem);

export default router;
