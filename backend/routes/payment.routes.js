import express from 'express';
import {
  initiateTicketPayment,
  handleToyyibPayCallback,
  getPaymentStatus,
  getOrganizerFinance,
  updateClubPaymentSettings,
  applyToyyibPayForClub,
  approveToyyibPayForClub
} from '../controllers/payment.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { paymentLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Ticket purchase payment (protected)
router.post('/tickets/purchase', authenticate, paymentLimiter, initiateTicketPayment);
router.get('/status/:paymentId', authenticate, getPaymentStatus);

// ToyyibPay callback (webhook - no auth)
router.post('/toyyibpay/callback', handleToyyibPayCallback);

// Club/Organizer routes
router.get('/finance', authenticate, getOrganizerFinance);
router.put('/settings', authenticate, updateClubPaymentSettings);

// ToyyibPay application flow
router.post('/toyyibpay/apply', authenticate, applyToyyibPayForClub);
router.post('/toyyibpay/approve/:clubId', authenticate, authorize('admin'), approveToyyibPayForClub);

export default router;

