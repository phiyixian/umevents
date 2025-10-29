import express from 'express';
import { 
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  requestClubVerification,
  selectRole,
  listClubVerificationRequests,
  approveClubVerificationRequest,
  rejectClubVerificationRequest,
  getPublicClubInfo,
  getAllPublicClubs
} from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes
router.post('/role', authLimiter, selectRole);
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/request-club-verification', requestClubVerification);

// Protected routes
router.get('/profile', authenticate, getUserProfile);
router.put('/profile', authenticate, updateUserProfile);

// Admin: club verification management
router.get('/club-verification-requests', authenticate, authorize('admin'), listClubVerificationRequests);
router.put('/club-verification-requests/:requestId/approve', authenticate, authorize('admin'), approveClubVerificationRequest);
router.put('/club-verification-requests/:requestId/reject', authenticate, authorize('admin'), rejectClubVerificationRequest);

// Public club info
router.get('/public/clubs', getAllPublicClubs);
router.get('/public/club/:clubId', getPublicClubInfo);

export default router;

