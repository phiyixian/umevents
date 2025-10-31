import express from 'express';
import {
  submitFeedback,
  getAllFeedbacks,
  updateFeedbackStatus,
  deleteFeedback
} from '../controllers/feedback.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public route - anyone can submit feedback
router.post('/', submitFeedback);

// Admin routes - require authentication and admin role
router.get('/', authenticate, authorize('admin'), getAllFeedbacks);
router.patch('/:feedbackId/status', authenticate, authorize('admin'), updateFeedbackStatus);
router.delete('/:feedbackId', authenticate, authorize('admin'), deleteFeedback);

export default router;

