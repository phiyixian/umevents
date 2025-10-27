import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  getClubMembers,
  followUser,
  unfollowUser
} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(authenticate);

// Public user routes
router.get('/:id', getUserById);

// Admin routes
router.get('/', authorize('admin'), getAllUsers);
router.put('/:id/role', authorize('admin'), updateUserRole);

// Social features
router.post('/:id/follow', followUser);
router.delete('/:id/unfollow', unfollowUser);

// Club routes
router.get('/club/:clubId/members', authorize('club', 'admin'), getClubMembers);

export default router;

