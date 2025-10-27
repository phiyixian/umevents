import express from 'express';
import {
  initiatePayment,
  handlePaymentCallback,
  getPaymentStatus,
  refundPayment
} from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.js';
import { paymentLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Protected routes
router.post('/initiate', authenticate, paymentLimiter, initiatePayment);
router.get('/status/:paymentId', authenticate, getPaymentStatus);

// Webhook routes (no auth required for security validation)
router.post('/callback', handlePaymentCallback);
router.post('/webhook/toyyibpay', handlePaymentCallback);
router.post('/webhook/billplz', handlePaymentCallback);

// Admin only routes
router.post('/refund/:paymentId', authenticate, refundPayment);

export default router;

