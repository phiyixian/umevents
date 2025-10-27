import express from 'express';
import {
  getEventAnalytics,
  getClubAnalytics,
  getAdminAnalytics,
  getPlatformStats,
  getTopEvents
} from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(authenticate);

// Club analytics
router.get('/club/:clubId', authorize('club', 'admin'), getClubAnalytics);

// Event analytics
router.get('/event/:eventId', authorize('club', 'admin'), getEventAnalytics);

// Platform analytics (admin only)
router.get('/platform', authorize('admin'), getPlatformStats);
router.get('/platform/top-events', authorize('admin'), getTopEvents);

export default router;

