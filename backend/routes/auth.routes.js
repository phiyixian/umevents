import express from 'express';
import { 
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  requestClubVerification
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/request-club-verification', requestClubVerification);

// Protected routes
router.get('/profile', authenticate, getUserProfile);
router.put('/profile', authenticate, updateUserProfile);

export default router;

