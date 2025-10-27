import express from 'express';
import {
  purchaseTicket,
  getMyTickets,
  getTicketById,
  validateTicket,
  generateQRCode
} from '../controllers/ticket.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Protected routes
router.post('/purchase', authenticate, purchaseTicket);
router.get('/my', authenticate, getMyTickets);
router.get('/:id', authenticate, getTicketById);
router.post('/:id/validate', authenticate, validateTicket);
router.get('/:id/qr', authenticate, generateQRCode);

export default router;

