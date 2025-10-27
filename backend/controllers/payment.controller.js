import { db } from '../config/firebase.js';
import axios from 'axios';

// Platform transaction fee
const PLATFORM_FEE = 1.00; // RM1 per ticket

export const initiatePayment = async (req, res, next) => {
  try {
    const { ticketIds } = req.body;
    const userId = req.user.uid;

    // Get tickets
    const tickets = [];
    let totalAmount = 0;

    for (const ticketId of ticketIds) {
      const ticketDoc = await db.collection('tickets').doc(ticketId).get();
      if (!ticketDoc.exists) {
        return res.status(404).json({ error: `Ticket ${ticketId} not found` });
      }

      const ticketData = ticketDoc.data();
      if (ticketData.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      if (ticketData.status !== 'pending_payment') {
        return res.status(400).json({ error: `Ticket ${ticketId} is not pending payment` });
      }

      tickets.push({ id: ticketId, ...ticketData });
      totalAmount += ticketData.price;
    }

    // Calculate total with platform fee
    const totalWithFee = totalAmount + (tickets.length * PLATFORM_FEE);

    // Create payment record
    const paymentData = {
      userId,
      ticketIds,
      amount: totalAmount,
      platformFee: tickets.length * PLATFORM_FEE,
      totalAmount: totalWithFee,
      status: 'pending', // pending, processing, completed, failed, refunded
      paymentMethod: 'duitnow', // duitnow, fpx, qr
      createdAt: new Date(),
      processedAt: null
    };

    const paymentRef = await db.collection('payments').add(paymentData);

    // Generate payment request (mock - replace with actual ToyyibPay/Billplz API)
    const paymentRequest = {
      paymentId: paymentRef.id,
      amount: totalWithFee,
      description: `Payment for ${tickets.length} ticket(s)`,
      callbackUrl: `${process.env.APP_URL}/payment/callback`,
      redirectUrl: `${process.env.FRONTEND_URL}/payment/success`,
      // Add ToyyibPay/Billplz specific parameters
      // Example for ToyyibPay:
      // userSecretKey: process.env.TOYYIBPAY_SECRET_KEY,
      // categoryCode: process.env.TOYYIBPAY_CATEGORY_CODE
    };

    res.status(201).json({
      message: 'Payment initiated',
      paymentId: paymentRef.id,
      totalAmount: totalWithFee,
      paymentUrl: `https://secure.toyyibpay.com/payment/${paymentRef.id}`, // Mock URL
      orderid: paymentRef.id
    });
  } catch (error) {
    next(error);
  }
};

export const handlePaymentCallback = async (req, res, next) => {
  try {
    const { 
      orderid, 
      payment_status, 
      billcode,
      transaction_status 
    } = req.body;

    // Find payment record
    const paymentDoc = await db.collection('payments').doc(orderid).get();
    if (!paymentDoc.exists) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const paymentData = paymentDoc.data();
    
    // Update payment status
    if (payment_status === '1' || transaction_status === 'completed') {
      await db.collection('payments').doc(orderid).update({
        status: 'completed',
        processedAt: new Date(),
        billcode,
        transactionStatus: transaction_status
      });

      // Update tickets status
      for (const ticketId of paymentData.ticketIds) {
        await db.collection('tickets').doc(ticketId).update({
          status: 'confirmed',
          paymentId: orderid
        });
      }

      // Update event tickets sold
      for (const ticketId of paymentData.ticketIds) {
        const ticketDoc = await db.collection('tickets').doc(ticketId).get();
        const ticketData = ticketDoc.data();

        const eventDoc = await db.collection('events').doc(ticketData.eventId).get();
        const eventData = eventDoc.data();

        await db.collection('events').doc(ticketData.eventId).update({
          ticketsSold: eventData.ticketsSold + 1,
          revenue: eventData.revenue + ticketData.price
        });
      }
    }

    res.json({ message: 'Payment callback processed' });
  } catch (error) {
    next(error);
  }
};

export const getPaymentStatus = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.uid;

    const paymentDoc = await db.collection('payments').doc(paymentId).get();
    
    if (!paymentDoc.exists) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const paymentData = paymentDoc.data();

    if (paymentData.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({ payment: { id: paymentDoc.id, ...paymentData } });
  } catch (error) {
    next(error);
  }
};

export const refundPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    const paymentDoc = await db.collection('payments').doc(paymentId).get();
    
    if (!paymentDoc.exists) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const paymentData = paymentDoc.data();

    if (paymentData.status !== 'completed') {
      return res.status(400).json({ error: 'Can only refund completed payments' });
    }

    // Mark payment as refunded
    await db.collection('payments').doc(paymentId).update({
      status: 'refunded',
      refundedAt: new Date(),
      refundedBy: req.user.uid
    });

    // Update tickets
    for (const ticketId of paymentData.ticketIds) {
      await db.collection('tickets').doc(ticketId).update({
        status: 'cancelled'
      });
    }

    res.json({ message: 'Payment refunded successfully' });
  } catch (error) {
    next(error);
  }
};

