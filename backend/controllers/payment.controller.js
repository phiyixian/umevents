import { db } from '../config/firebase.js';
import axios from 'axios';
import { createBill, getBillStatus, calculateSplitPayment, createCategory } from '../config/toyyibpay.js';

/**
 * Platform fee configuration
 */
const PLATFORM_FEE_PERCENTAGE = 5; // 5% platform fee

/**
 * Initiate ToyyibPay payment for ticket purchase
 */
export const initiateTicketPayment = async (req, res, next) => {
  try {
    const { eventId, quantity = 1 } = req.body;
    const userId = req.user.uid;

    // Get user data for billing
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(400).json({ error: 'User profile not found. Please complete your profile before purchasing.' });
    }
    const userData = userDoc.data();

    // Get event details
    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventData = eventDoc.data();

    if (!eventData.organizerId) {
      return res.status(400).json({ error: 'Event is missing organizer information' });
    }

    // Check if event is still available
    if (eventData.status !== 'published') {
      return res.status(400).json({ error: 'Event is not available for purchase' });
    }

    // Check capacity
    if (eventData.ticketsSold + quantity > eventData.capacity) {
      return res.status(400).json({ error: 'Insufficient tickets available' });
    }

    // Check if user already has CONFIRMED tickets for this event
    // Allow retry if only pending_payment tickets exist
    const existingTickets = await db.collection('tickets')
      .where('eventId', '==', eventId)
      .where('userId', '==', userId)
      .where('status', '==', 'confirmed')
      .get();

    if (!existingTickets.empty) {
      return res.status(400).json({ error: 'You have already purchased tickets for this event' });
    }

    // Calculate total and split payment
    const totalAmount = eventData.ticketPrice * quantity;
    const split = calculateSplitPayment(totalAmount);

    // Helper function to create tickets
    const createTicketsHelper = async (status = 'pending_payment') => {
      const tickets = [];
      for (let i = 0; i < quantity; i++) {
        const ticketData = {
          eventId,
          userId,
          status,
          purchaseDate: new Date(),
          price: eventData.ticketPrice,
          totalAmount: eventData.ticketPrice * quantity,
          qrCode: null,
          checkedIn: false,
          checkedInAt: null
        };

        const ticketRef = await db.collection('tickets').add(ticketData);
        tickets.push({ id: ticketRef.id, ...ticketData });
      }
      return tickets;
    };

    // For free events (price = 0), create and auto-confirm tickets without payment
    if (totalAmount === 0 || eventData.ticketPrice === 0) {
      const tickets = await createTicketsHelper('confirmed');
      // Update free tickets to have no paymentId
      for (const ticket of tickets) {
        await db.collection('tickets').doc(ticket.id).update({
          paymentId: null // No payment needed
        });
      }

      // Update event tickets sold atomically
      const eventRef = db.collection('events').doc(eventId);
      await db.runTransaction(async (t) => {
        const snap = await t.get(eventRef);
        if (!snap.exists) return;
        const curr = snap.data() || {};
        const currentSold = Number(curr.ticketsSold || 0);
        t.update(eventRef, {
          ticketsSold: currentSold + quantity
        });
      });

      return res.status(201).json({
        message: 'Free tickets confirmed successfully',
        paymentId: null,
        totalAmount: 0,
        tickets: tickets.map(t => ({ id: t.id, status: 'confirmed' }))
      });
    }

    // Get organizer payment settings (with fallback by email if missing)
    let organizerId = eventData.organizerId;
    let organizerDoc = organizerId ? await db.collection('users').doc(organizerId).get() : null;
    if (!organizerDoc || !organizerDoc.exists) {
      // Fallback: find by organizerEmail
      if (eventData.organizerEmail) {
        const snap = await db.collection('users').where('email', '==', eventData.organizerEmail).limit(1).get();
        if (!snap.empty) {
          organizerDoc = snap.docs[0];
          organizerId = organizerDoc.id;
          // Persist back to event for future requests
          await db.collection('events').doc(eventId).update({ organizerId });
        }
      }
    }
    if (!organizerDoc || !organizerDoc.exists) {
      return res.status(400).json({ error: 'Organizer not found', hint: 'Ensure event has organizerId or organizerEmail matches a user.' });
    }
    const organizerData = organizerDoc.data() || {};
    
    const paymentMethod = (eventData.paymentMethod || 'toyyibpay').toLowerCase(); // Default to ToyyibPay

    // If manual payment (QR code), create tickets first, then payment record
    if (paymentMethod === 'manual_qr' || paymentMethod === 'manual') {
      const tickets = await createTicketsHelper('pending_payment');
      const ticketIds = tickets.map(t => t.id);
      
      // Create payment record for manual payment
    const paymentData = {
      userId,
      ticketIds,
        eventId,
        organizerId: eventData.organizerId,
      amount: totalAmount,
        platformFee: split.platformFee,
        organizerAmount: split.organizerAmount,
        totalAmount,
        status: 'pending_manual',
        paymentMethod: 'manual_qr',
        billCode: null,
        billURL: null,
        organizerQRCode: eventData.organizerQRCode, // Store QR code from event
      createdAt: new Date(),
      processedAt: null
    };

    const paymentRef = await db.collection('payments').add(paymentData);

      return res.status(201).json({
        message: 'Manual payment initiated',
      paymentId: paymentRef.id,
        totalAmount,
        split,
        paymentMethod: 'manual_qr',
        qrCode: eventData.organizerQRCode,
        instructions: eventData.paymentInstructions || 'Scan the QR code to complete payment'
      });
    }

    // ToyyibPay integration
    if (!organizerData.categoryCode || organizerData.toyyibpayEnabled !== true) {
      return res.status(400).json({ 
        error: 'Organizer ToyyibPay not configured',
        details: {
          categoryCode: organizerData.categoryCode || null,
          toyyibpayEnabled: organizerData.toyyibpayEnabled || false
        },
        hint: 'Ask admin to Approve + Enable ToyyibPay for this club in Admin Verification page.'
      });
    }

    const billAmount = Math.round(totalAmount * 100); // Convert to cents

    // Validate required user information for ToyyibPay
    if (!userData.phoneNumber || userData.phoneNumber.trim() === '') {
      return res.status(400).json({ 
        error: 'Phone number is required for payment',
        hint: 'Please update your profile with a valid phone number before purchasing tickets. You can update it in your Profile settings.'
      });
    }

    // Validate email
    if (!userData.email || userData.email.trim() === '') {
      return res.status(400).json({ 
        error: 'Email address is required for payment',
        hint: 'Please ensure your account has a valid email address.'
      });
    }

    // Create ToyyibPay bill with split payment
    let billResponse;
    try {
      billResponse = await createBill({
        categoryCode: organizerData.categoryCode,
        billName: `${eventData.title} - Ticket Purchase`,
        billDescription: `Purchase of ${quantity} ticket(s) for ${eventData.title}`,
        billPriceSetting: 1, // 1 = fixed price (required for split payment, 0 = dynamic)
        billAmount,
        billReturnUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success?eventId=${eventId}`,
        billCallbackUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/toyyibpay/callback`,
        billTo: userData.name || 'User',
        billEmail: userData.email.trim(),
        billPhone: userData.phoneNumber.trim(),
        billSplitPayment: '0', // Disabled - all payments go to admin account, split tracked in DB
        billSplitPaymentArgs: '', // Split payment handled manually/separately
        billPaymentChannel: '0', // All payment methods
        billContentEmail: 'Thank you for purchasing the ticket!'
      });
    } catch (e) {
      // Payment bill creation failed - no tickets created, so nothing to clean up
      const reason = e.response?.data || e.message || 'Unknown error creating ToyyibPay bill';
      return res.status(400).json({ 
        error: 'Failed to create payment bill', 
        reason,
        ...(process.env.NODE_ENV !== 'production' ? {
          debug: {
            categoryCode: organizerData.categoryCode || null,
            amount_cents: billAmount,
            apiUrl: process.env.TOYYIBPAY_API_URL || 'https://dev.toyyibpay.com/index.php/api'
          }
        } : {})
      });
    }

    // Check if bill was created successfully - BillCode presence indicates success
    if (billResponse && (billResponse.BillCode || billResponse.Status === 'Success' || billResponse.status === 'success')) {
      const BillCode = billResponse.BillCode;
      const BillURL = billResponse.BillURL || `https://${process.env.TOYYIBPAY_API_URL?.includes('dev') ? 'dev.' : ''}toyyibpay.com/${BillCode}`;
      
      if (!BillCode) {
        return res.status(500).json({ 
          error: 'Failed to create payment bill', 
          reason: 'BillCode missing from response',
          debug: { response: billResponse }
        });
      }

      // Only NOW create tickets after successful payment bill creation
      // If payment fails later, tickets will remain pending_payment (handled in callback)
      const tickets = await createTicketsHelper('pending_payment');

      // Create payment record
      const ticketIds = tickets.map(t => t.id);
      const paymentData = {
        userId,
        ticketIds,
        eventId,
        organizerId: eventData.organizerId,
        amount: totalAmount,
        platformFee: split.platformFee,
        organizerAmount: split.organizerAmount,
        totalAmount,
        status: 'pending',
        paymentMethod: 'toyyibpay',
        billCode: BillCode,
        billURL: BillURL,
        createdAt: new Date(),
        processedAt: null
      };

      const paymentRef = await db.collection('payments').add(paymentData);

      return res.status(201).json({
        message: 'Payment initiated successfully',
      paymentId: paymentRef.id,
        totalAmount,
        split,
        billCode: BillCode,
        paymentUrl: BillURL,
        qrCodeUrl: `https://toyyibpay.com/payment/${BillCode}` // QR code URL
      });
    } else {
      const reason = billResponse?.Message || billResponse?.msg || billResponse || 'Unknown ToyyibPay response';
      return res.status(400).json({ 
        error: 'Failed to create payment bill', 
        reason,
        ...(process.env.NODE_ENV !== 'production' ? {
          debug: {
            response: billResponse,
            categoryCode: organizerData.categoryCode || null
          }
        } : {})
      });
    }
  } catch (error) {
    console.error('Payment initiation error:', error);
    next(error);
  }
};

/**
 * Handle ToyyibPay callback
 */
export const handleToyyibPayCallback = async (req, res, next) => {
  try {
    const { 
      orderId, 
      paymentId, 
      billcode,
      transaction_id,
      status
    } = req.body;

    console.log('ToyyibPay callback received:', req.body);

    // Find payment record
    const paymentDoc = await db.collection('payments').doc(orderId).get();
    if (!paymentDoc.exists) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const paymentData = paymentDoc.data();
    
    // If payment is already completed, return success (idempotency)
    if (paymentData.status === 'completed') {
      console.log(`Payment ${orderId} already processed, skipping duplicate callback`);
      return res.json({ 
        success: true,
        message: 'Payment already processed' 
      });
    }
    
    // Validate required payment data
    if (!paymentData.eventId || !paymentData.ticketIds || !Array.isArray(paymentData.ticketIds)) {
      console.error(`Invalid payment data for ${orderId}:`, paymentData);
      return res.status(400).json({ error: 'Invalid payment data' });
    }
    
    // Update payment status based on ToyyibPay status
    if (status === '1' || status === 'success') {
      const incrementTickets = paymentData.ticketIds.length;
      const totalAmount = Number(paymentData.totalAmount || paymentData.amount || 0);

      // Use a transaction to ensure all updates happen atomically
      const batch = db.batch();

      // Update payment status
      const paymentRef = db.collection('payments').doc(orderId);
      batch.update(paymentRef, {
        status: 'completed',
        processedAt: new Date(),
        transactionId: transaction_id,
        toyStatus: status,
        completedAt: new Date()
      });

      // Update all tickets to paid status (payment successful, ticket is paid)
      for (const ticketId of paymentData.ticketIds) {
        const ticketRef = db.collection('tickets').doc(ticketId);
        batch.update(ticketRef, {
          status: 'paid', // Status: paid (payment successful but pending confirmation)
          paymentId: orderId,
          paidAt: new Date(),
          confirmedAt: null // Will be set when ticket is confirmed
        });
      }

      // Commit batch update for payment and tickets
      await batch.commit();

      // Atomically update event totals (ticketsSold and revenue)
      const eventRef = db.collection('events').doc(paymentData.eventId);
      await db.runTransaction(async (t) => {
        const snap = await t.get(eventRef);
        if (!snap.exists) {
          console.error(`Event ${paymentData.eventId} not found for payment ${orderId}`);
          throw new Error('Event not found');
        }
        const curr = snap.data() || {};
        const currentSold = Number(curr.ticketsSold || 0);
        const currentRevenue = Number(curr.revenue || 0);
        
        console.log(`Updating event ${paymentData.eventId}: ticketsSold ${currentSold} -> ${currentSold + incrementTickets}, revenue ${currentRevenue} -> ${currentRevenue + totalAmount}`);
        
        t.update(eventRef, {
          ticketsSold: currentSold + incrementTickets,
          revenue: currentRevenue + totalAmount,
          updatedAt: new Date()
        });
      });

      console.log(`Payment ${orderId} processed successfully: ${incrementTickets} tickets confirmed, RM${totalAmount} added to event ${paymentData.eventId}`);

      return res.json({ 
        success: true,
        message: 'Payment processed successfully',
        ticketsConfirmed: incrementTickets,
        eventId: paymentData.eventId
      });
    } else {
      // Payment failed - keep tickets as pending_payment for retry
      await db.collection('payments').doc(orderId).update({
        status: 'failed',
        processedAt: new Date(),
        transactionId: transaction_id,
        toyStatus: status
      });

      // Tickets remain in pending_payment status, user can retry payment
      // Do NOT increment ticketsSold or confirm tickets

      return res.json({ 
        success: false,
        message: 'Payment failed - tickets remain pending. Please retry payment.' 
      });
    }
  } catch (error) {
    console.error('Callback processing error:', error);
    next(error);
  }
};

/**
 * Get payment status
 */
export const getPaymentStatus = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    const paymentDoc = await db.collection('payments').doc(paymentId).get();
    
    if (!paymentDoc.exists) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const paymentData = paymentDoc.data();

    // Prevent caching to ensure fresh status checks during polling
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({ payment: { id: paymentDoc.id, ...paymentData } });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's transaction history
 */
export const getMyTransactions = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    // Get all payments made by this user
    // Sort in memory to avoid composite index requirement
    const paymentsSnapshot = await db.collection('payments')
      .where('userId', '==', userId)
      .get();

    const transactions = [];
    
    for (const paymentDoc of paymentsSnapshot.docs) {
      const paymentData = paymentDoc.data();
      
      // Get event details if available
      let event = null;
      if (paymentData.eventId) {
        const eventDoc = await db.collection('events').doc(paymentData.eventId).get();
        if (eventDoc.exists) {
          const eventData = eventDoc.data();
          event = {
            id: eventDoc.id,
            title: eventData.title,
            startDate: eventData.startDate?.toDate ? eventData.startDate.toDate().toISOString() : eventData.startDate
          };
        }
      }

      // Get ticket IDs if available
      const ticketIds = paymentData.ticketIds || [];

      transactions.push({
        id: paymentDoc.id,
        status: paymentData.status,
        totalAmount: paymentData.totalAmount || paymentData.amount || 0,
        method: paymentData.method || 'toyyibpay',
        transactionId: paymentData.transactionId,
        billcode: paymentData.billcode,
        createdAt: paymentData.createdAt?.toDate ? paymentData.createdAt.toDate().toISOString() : paymentData.createdAt,
        completedAt: paymentData.completedAt?.toDate ? paymentData.completedAt.toDate().toISOString() : paymentData.completedAt,
        processedAt: paymentData.processedAt?.toDate ? paymentData.processedAt.toDate().toISOString() : paymentData.processedAt,
        event,
        ticketIds,
        ticketCount: ticketIds.length
      });
    }

    // Sort by createdAt desc in memory
    transactions.sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return tb - ta;
    });

    res.json({ transactions, total: transactions.length });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    next(error);
  }
};

/**
 * Get organizer's finance dashboard
 */
export const getOrganizerFinance = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    // Get all events by this organizer
    const eventsSnapshot = await db.collection('events')
      .where('organizerId', '==', userId)
      .get();

    const events = [];
    let totalRevenue = 0;
    let totalPlatformFee = 0;

    for (const eventDoc of eventsSnapshot.docs) {
      const eventData = eventDoc.data();
      
      // Get payments for this event
      const paymentsSnapshot = await db.collection('payments')
        .where('eventId', '==', eventDoc.id)
        .where('status', '==', 'completed')
        .get();

      let eventRevenue = 0;
      let eventFee = 0;

      paymentsSnapshot.forEach(paymentDoc => {
    const paymentData = paymentDoc.data();
        eventRevenue += paymentData.organizerAmount || 0;
        eventFee += paymentData.platformFee || 0;
      });

      events.push({
        id: eventDoc.id,
        title: eventData.title,
        ticketsSold: eventData.ticketsSold || 0,
        revenue: eventRevenue,
        platformFee: eventFee
      });

      totalRevenue += eventRevenue;
      totalPlatformFee += eventFee;
    }

    res.json({
      summary: {
        totalRevenue,
        totalPlatformFee,
        netRevenue: totalRevenue,
        totalEvents: events.length
      },
      events
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update club payment settings
 */
export const updateClubPaymentSettings = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { 
      categoryCode, 
      toyyibpayEnabled, 
      paymentMethod = 'toyyibpay',
      qrCodeImageUrl 
    } = req.body;

    const updateData = {};
    
    if (categoryCode !== undefined) updateData.categoryCode = categoryCode;
    if (toyyibpayEnabled !== undefined) updateData.toyyibpayEnabled = toyyibpayEnabled;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (qrCodeImageUrl !== undefined) updateData.qrCodeImageUrl = qrCodeImageUrl;

    updateData.updatedAt = new Date();

    await db.collection('users').doc(userId).update(updateData);

    res.json({ 
      message: 'Payment settings updated successfully',
      settings: updateData 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Club applies for ToyyibPay (admin-owned account). Marks request as pending.
 */
export const applyToyyibPayForClub = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    await db.collection('users').doc(userId).update({
      toyyibpayApplicationStatus: 'pending',
      toyyibpayEnabled: false,
      updatedAt: new Date()
    });

    res.json({ message: 'ToyyibPay application submitted. Await admin approval.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin approves ToyyibPay for a club and creates a ToyyibPay category via admin account.
 */
export const approveToyyibPayForClub = async (req, res, next) => {
  try {
    const { clubId } = req.params;

    const clubDoc = await db.collection('users').doc(clubId).get();
    if (!clubDoc.exists) {
      return res.status(404).json({ error: 'Club not found' });
    }

    const clubData = clubDoc.data();

    // Create a ToyyibPay category for this club under admin account
    const categoryName = `UMEvents - ${clubData.clubName || clubData.name || clubId}`;
    let resp;
    try {
      resp = await createCategory({
        catname: categoryName,
        catdescription: `Collection for ${clubData.clubName || clubId}`
      });
    } catch (e) {
      const reason = e.response?.data || e.message || 'Unknown error';
      return res.status(500).json({ error: 'Failed to create ToyyibPay category', reason });
    }

    if (!resp || !resp.CategoryCode) {
      return res.status(500).json({ error: 'Failed to create ToyyibPay category', reason: resp });
    }

    await db.collection('users').doc(clubId).update({
      categoryCode: resp.CategoryCode,
      toyyibpayEnabled: true,
      toyyibpayApplicationStatus: 'approved',
      updatedAt: new Date()
    });

    res.json({ message: 'ToyyibPay approved and category created', categoryCode: resp.CategoryCode });
  } catch (error) {
    console.error('approveToyyibPayForClub error:', error);
    next(error);
  }
};

export default {
  initiateTicketPayment,
  handleToyyibPayCallback,
  getPaymentStatus,
  getOrganizerFinance,
  updateClubPaymentSettings,
  applyToyyibPayForClub,
  approveToyyibPayForClub
};
