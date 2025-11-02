import express from 'express';
import {
  initiateTicketPayment,
  handleToyyibPayCallback,
  getPaymentStatus,
  getMyTransactions,
  getOrganizerFinance,
  updateClubPaymentSettings,
  applyToyyibPayForClub,
  approveToyyibPayForClub
} from '../controllers/payment.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { paymentLimiter, paymentStatusLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Ticket purchase payment (protected)
router.post('/tickets/purchase', authenticate, paymentLimiter, initiateTicketPayment);
// Payment status check - more lenient rate limiting for polling
router.get('/status/:paymentId', authenticate, paymentStatusLimiter, getPaymentStatus);
// User transaction history
router.get('/transactions/my', authenticate, getMyTransactions);

// ToyyibPay callback (webhook - no auth)
router.post('/toyyibpay/callback', handleToyyibPayCallback);

// Club/Organizer routes
router.get('/finance', authenticate, getOrganizerFinance);
router.put('/settings', authenticate, authorize('club'), updateClubPaymentSettings);

// ToyyibPay application flow
router.post('/toyyibpay/apply', authenticate, applyToyyibPayForClub);
router.post('/toyyibpay/approve/:clubId', authenticate, authorize('admin'), approveToyyibPayForClub);

export default router;

