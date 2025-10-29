import express from 'express';
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getMyEvents,
  searchEvents,
  getEventsByOrganizerPublic
} from '../controllers/event.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllEvents);
router.get('/search', searchEvents);
router.get('/:id', getEventById);
router.get('/by-organizer/:clubId', getEventsByOrganizerPublic);

// Protected routes - students can create events for their clubs
router.post('/', authenticate, createEvent);
router.get('/my/events', authenticate, getMyEvents);
router.put('/:id', authenticate, updateEvent);
router.delete('/:id', authenticate, deleteEvent);

export default router;

