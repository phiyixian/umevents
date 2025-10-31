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
    const { eventId, quantity = 1, customResponses = {} } = req.body;
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
      return res.status(400).json({ error: 'You already have confirmed tickets for this event' });
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
          checkedInAt: null,
          customResponses: customResponses || {},
          whatsappJoined: false
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
      // Try to find organizer by email if organizerId doesn't exist
      if (eventData.organizerEmail) {
        const organizerByEmailSnapshot = await db.collection('users')
          .where('email', '==', eventData.organizerEmail)
          .where('role', '==', 'club')
          .limit(1)
          .get();

        if (!organizerByEmailSnapshot.empty) {
          organizerDoc = organizerByEmailSnapshot.docs[0];
          organizerId = organizerDoc.id;
          // Update event with correct organizerId
          await db.collection('events').doc(eventId).update({ organizerId });
        }
      }

      if (!organizerDoc || !organizerDoc.exists) {
        return res.status(400).json({ 
          error: 'Organizer not found',
          hint: 'The event organizer could not be found in the system.'
        });
      }
    }

    const organizerData = organizerDoc.data();

    // Check if organizer has ToyyibPay configured (for paid events)
    if (!organizerData.categoryCode) {
      return res.status(400).json({ 
        error: 'Organizer payment method not configured',
        hint: 'The organizer has not set up their payment method. Please contact the organizer.'
      });
    }

    // Validate user data for ToyyibPay (requires phone and email)
    if (!userData.phoneNumber || !userData.phoneNumber.trim()) {
      return res.status(400).json({ 
        error: 'Phone number required',
        hint: 'Please update your profile with a phone number before purchasing tickets.'
      });
    }

    if (!userData.email || !userData.email.trim()) {
      return res.status(400).json({ 
        error: 'Email address required',
        hint: 'Please ensure your account has a valid email address.'
      });
    }

    // Create tickets first (they'll be pending_payment until payment succeeds)
    const tickets = await createTicketsHelper('pending_payment');
    const ticketIds = tickets.map(t => t.id);

    // Create payment record FIRST to get paymentId for billExternalReferenceNo
    const tempPaymentData = {
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
      createdAt: new Date(),
      processedAt: null
    };

    const paymentRef = await db.collection('payments').add(tempPaymentData);
    const paymentId = paymentRef.id;

    // Convert totalAmount to cents for ToyyibPay API
    const billAmount = Math.round(totalAmount * 100);

    // Create ToyyibPay bill with paymentId as external reference
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
        billExternalReferenceNo: paymentId, // Pass paymentId so callback receives it as order_id
        billSplitPayment: '0', // Disabled - all payments go to admin account, split tracked in DB
        billSplitPaymentArgs: '', // Split payment handled manually/separately
        billPaymentChannel: '0', // All payment methods
        billContentEmail: 'Thank you for purchasing the ticket!'
      });
    } catch (e) {
      // Payment bill creation failed - clean up tickets and payment record
      for (const ticketId of ticketIds) {
        await db.collection('tickets').doc(ticketId).delete();
      }
      await paymentRef.delete();
      
      let reason = e.response?.data || e.message || 'Unknown error creating ToyyibPay bill';
      let hint = '';
      if (e.code === 'TOYYIBPAY_SECRET_MISSING' || /userSecretKey/i.test(String(reason))) {
        hint = 'Server is missing TOYYIBPAY_SECRET_KEY. Set it in Cloud Run env vars.';
      }
      return res.status(400).json({ 
        error: 'Failed to create payment bill', 
        reason,
        hint,
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
        // Clean up on failure
        for (const ticketId of ticketIds) {
          await db.collection('tickets').doc(ticketId).delete();
        }
        await paymentRef.delete();
        
        return res.status(500).json({ 
          error: 'Failed to create payment bill', 
          reason: 'BillCode missing from response',
          debug: { response: billResponse }
        });
      }

      // Update payment record with billCode and billURL
      await paymentRef.update({
        billCode: BillCode,
        billURL: BillURL
      });

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
      // Bill creation failed - clean up
      for (const ticketId of ticketIds) {
        await db.collection('tickets').doc(ticketId).delete();
      }
      await paymentRef.delete();
      
      return res.status(500).json({ 
        error: 'Failed to create payment bill',
        reason: billResponse || 'Unknown error'
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
    // ToyyibPay callback sends: refno, status (1=success, 2=pending, 3=fail), reason, billcode, order_id, amount, transaction_time
    const { 
      orderId,
      order_id, // External payment reference (our paymentId that we passed as billExternalReferenceNo)
      refno, // Payment reference no
      billcode, // Bill code
      status, // Payment status: '1'=success, '2'=pending, '3'=fail
      reason, // Reason for the status
      amount, // Payment amount (in cents)
      transaction_time // Datetime of transaction
    } = req.body;

    console.log('ToyyibPay callback received:', req.body);
    console.log('Callback params:', { orderId, order_id, refno, billcode, status, reason, amount, transaction_time });

    // Use order_id from ToyyibPay (this should be our paymentId)
    // If not available, find by billcode
    let actualOrderId = orderId || order_id;

    // Try to find payment record by orderId first
    let paymentDoc = null;
    if (actualOrderId) {
      paymentDoc = await db.collection('payments').doc(actualOrderId).get();
    }

    // If not found by orderId, try to find by billcode
    if ((!paymentDoc || !paymentDoc.exists) && billcode) {
      console.log('Payment not found by orderId, searching by billcode:', billcode);
      const paymentsSnapshot = await db.collection('payments')
        .where('billCode', '==', billcode)
        .limit(1)
        .get();
      
      if (!paymentsSnapshot.empty) {
        paymentDoc = paymentsSnapshot.docs[0];
        actualOrderId = paymentDoc.id;
        console.log('Found payment by billcode:', actualOrderId);
      }
    }

    if (!paymentDoc || !paymentDoc.exists) {
      console.error('Payment not found by orderId or billcode:', { orderId, order_id, billcode });
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (!actualOrderId) {
      actualOrderId = paymentDoc.id;
    }

    const paymentData = paymentDoc.data();
    
    // If payment is already completed, return success (idempotency)
    if (paymentData.status === 'completed') {
      console.log(`Payment ${actualOrderId} already processed, skipping duplicate callback`);
      return res.json({ 
        success: true,
        message: 'Payment already processed' 
      });
    }
    
    // Validate required payment data
    if (!paymentData.eventId || !paymentData.ticketIds || !Array.isArray(paymentData.ticketIds)) {
      console.error(`Invalid payment data for ${actualOrderId}:`, paymentData);
      return res.status(400).json({ error: 'Invalid payment data' });
    }
    
    // Update payment status based on ToyyibPay status
    // status: '1' = success, '2' = pending, '3' = fail
    // Handle various status formats (string '1', number 1, or 'success')
    const statusValue = String(status || '').trim();
    const statusNum = Number(status);
    const isSuccess = statusValue === '1' || statusValue === 'success' || statusNum === 1;
    
    console.log(`Payment status check: status="${status}" (type: ${typeof status}), statusValue="${statusValue}", statusNum=${statusNum}, isSuccess=${isSuccess}`);
    
    if (isSuccess) {
      const incrementTickets = paymentData.ticketIds.length;
      const totalAmount = Number(paymentData.totalAmount || paymentData.amount || 0);

      // Use a transaction to ensure all updates happen atomically
      const batch = db.batch();
    
    // Update payment status
      const paymentRef = db.collection('payments').doc(actualOrderId);
      batch.update(paymentRef, {
        status: 'completed',
        processedAt: new Date(),
        transactionId: refno || null, // Use refno as transaction ID
        toyStatus: status,
        toyRefno: refno,
        toyReason: reason || null,
        completedAt: new Date(),
        transactionTime: transaction_time || null,
        receivedAmount: amount ? Number(amount) / 100 : null // Convert from cents to RM
      });

      // Update all tickets to paid status (payment successful, ticket is paid)
      console.log(`Updating ${paymentData.ticketIds.length} tickets to paid status:`, paymentData.ticketIds);
      for (const ticketId of paymentData.ticketIds) {
        const ticketRef = db.collection('tickets').doc(ticketId);
        batch.update(ticketRef, {
          status: 'paid', // Status: paid (payment successful but pending confirmation)
          paymentId: actualOrderId,
          paidAt: new Date(),
          confirmedAt: null // Will be set when ticket is confirmed
        });
        console.log(`  - Updating ticket ${ticketId} to paid status`);
      }

      // Commit batch update for payment and tickets
      try {
        await batch.commit();
        console.log('Batch commit successful - tickets updated to paid');
        
        // Verify tickets were updated
      for (const ticketId of paymentData.ticketIds) {
          const verifyTicket = await db.collection('tickets').doc(ticketId).get();
          if (verifyTicket.exists) {
            const ticketData = verifyTicket.data();
            console.log(`Ticket ${ticketId} status: ${ticketData.status}, paymentId: ${ticketData.paymentId}`);
          }
        }
      } catch (batchError) {
        console.error('Batch commit failed:', batchError);
        throw batchError;
      }

      // Atomically update event totals (ticketsSold and revenue)
      const eventRef = db.collection('events').doc(paymentData.eventId);
      await db.runTransaction(async (t) => {
        const snap = await t.get(eventRef);
        if (!snap.exists) {
          console.error(`Event ${paymentData.eventId} not found for payment ${actualOrderId}`);
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

      console.log(`Payment ${actualOrderId} processed successfully: ${incrementTickets} tickets paid, RM${totalAmount} added to event ${paymentData.eventId}`);

      return res.json({ 
        success: true,
        message: 'Payment processed successfully',
        ticketsConfirmed: incrementTickets,
        eventId: paymentData.eventId
      });
    } else {
      // Payment failed or pending - log for debugging
      console.log(`Payment NOT successful. Status: "${status}", Status value: "${statusValue}", Status num: ${statusNum}`);
      console.log(`Full callback body:`, JSON.stringify(req.body, null, 2));
      
      // If status is '2' (pending), don't mark as failed yet - just log
      if (statusValue === '2' || statusNum === 2 || statusValue === 'pending') {
        console.log(`Payment is still pending, not updating status yet`);
        return res.json({ 
          success: false,
          message: 'Payment is still pending' 
        });
      }
      
      // Payment failed - keep tickets as pending_payment for retry
      await db.collection('payments').doc(actualOrderId).update({
        status: 'failed',
        processedAt: new Date(),
        transactionId: refno || null,
        toyStatus: status,
        toyRefno: refno,
        toyReason: reason || null
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

    // If payment is still pending, check ToyyibPay API directly to see if it's been paid
    if (paymentData.status === 'pending' && paymentData.billCode) {
      console.log(`Payment ${paymentId} is still pending, checking ToyyibPay API for status...`);
      console.log(`BillCode: ${paymentData.billCode}, PaymentId: ${paymentId}`);
      
      try {
        const statusResponse = await getBillStatus(paymentData.billCode, paymentId);
        console.log('ToyyibPay status response (full):', JSON.stringify(statusResponse, null, 2));
        
        // ToyyibPay getBillTransactions returns different formats:
        // - Could be an array of transactions
        // - Could be an object with transactions array
        // - Could be a single transaction object
        let transactions = [];
        if (Array.isArray(statusResponse)) {
          transactions = statusResponse;
        } else if (statusResponse?.transactions && Array.isArray(statusResponse.transactions)) {
          transactions = statusResponse.transactions;
        } else if (statusResponse && typeof statusResponse === 'object') {
          transactions = [statusResponse];
        }
        
        console.log(`Found ${transactions.length} transaction(s) in response`);
        
        // Check each transaction - if ANY has status 1 (paid), payment is successful
        let isPaid = false;
        let paidTransaction = null;
        
        for (const txn of transactions) {
          console.log('Checking transaction:', JSON.stringify(txn, null, 2));
          
          // Check multiple possible status field names
          const statusFields = [
            txn?.billpaymentStatus,
            txn?.paymentStatus,
            txn?.status,
            txn?.billStatus,
            txn?.payment_status,
            statusResponse?.billpaymentStatus, // Check root level too
            statusResponse?.paymentStatus,
            statusResponse?.status
          ];
          
          for (const statusValue of statusFields) {
            if (statusValue === undefined || statusValue === null) continue;
            
            const statusStr = String(statusValue).trim();
            const statusNum = Number(statusValue);
            
            // Status '1' or 1 means success/paid
            if (statusStr === '1' || statusNum === 1 || statusStr.toLowerCase() === 'success' || statusStr.toLowerCase() === 'paid') {
              isPaid = true;
              paidTransaction = txn || statusResponse;
              console.log(`✅ Payment found to be PAID! Status value: "${statusValue}" (type: ${typeof statusValue})`);
              break;
            }
          }
          
          if (isPaid) break;
        }
        
        if (!isPaid) {
          console.log('❌ Payment status not found as paid in ToyyibPay response');
          console.log('Available status fields:', Object.keys(statusResponse || {}));
        }
        
        if (isPaid && paymentData.ticketIds && Array.isArray(paymentData.ticketIds)) {
          console.log(`Payment ${paymentId} found to be paid via ToyyibPay API, updating status...`);
          
          // Update payment status to completed
          const batch = db.batch();
          const paymentRef = db.collection('payments').doc(paymentId);
          batch.update(paymentRef, {
            status: 'completed',
            processedAt: new Date(),
            completedAt: new Date(),
            toyStatus: paidTransaction?.billpaymentStatus || paidTransaction?.paymentStatus || paidTransaction?.status,
            toyRefno: paidTransaction?.refno || paidTransaction?.refNo || null,
            transactionId: paidTransaction?.refno || paidTransaction?.refNo || null,
            transactionTime: paidTransaction?.transaction_time || null,
            receivedAmount: paidTransaction?.amount ? Number(paidTransaction.amount) / 100 : null
          });
          
          // Update all tickets to paid status
    for (const ticketId of paymentData.ticketIds) {
            const ticketRef = db.collection('tickets').doc(ticketId);
            batch.update(ticketRef, {
              status: 'paid',
              paymentId: paymentId,
              paidAt: new Date(),
              confirmedAt: null
            });
          }
          
          await batch.commit();
          
          // Update event totals
          const eventRef = db.collection('events').doc(paymentData.eventId);
          await db.runTransaction(async (t) => {
            const snap = await t.get(eventRef);
            if (snap.exists) {
              const curr = snap.data() || {};
              const currentSold = Number(curr.ticketsSold || 0);
              const currentRevenue = Number(curr.revenue || 0);
              const totalAmount = Number(paymentData.totalAmount || paymentData.amount || 0);
              
              t.update(eventRef, {
                ticketsSold: currentSold + paymentData.ticketIds.length,
                revenue: currentRevenue + totalAmount,
                updatedAt: new Date()
              });
            }
          });
          
          console.log(`Payment ${paymentId} status updated to completed via ToyyibPay API check`);
          
          // Refresh payment data after update
          const updatedPaymentDoc = await db.collection('payments').doc(paymentId).get();
          paymentData = updatedPaymentDoc.data();
        }
      } catch (statusCheckError) {
        console.error(`Error checking ToyyibPay status for payment ${paymentId}:`, statusCheckError);
        // Don't fail the request, just log the error and continue
      }
    }

    // If payment is completed but tickets are still pending_payment, sync them
    if (paymentData.status === 'completed' && paymentData.ticketIds && Array.isArray(paymentData.ticketIds)) {
      // Check if any tickets are still pending_payment
      const ticketChecks = await Promise.all(
        paymentData.ticketIds.map(async (ticketId) => {
          const ticketDoc = await db.collection('tickets').doc(ticketId).get();
          if (ticketDoc.exists) {
            const ticketData = ticketDoc.data();
            if (ticketData.status === 'pending_payment') {
              return ticketId; // This ticket needs updating
            }
          }
          return null;
        })
      );

      const ticketsToUpdate = ticketChecks.filter(id => id !== null);
      
      // If there are tickets to update, update them now
      if (ticketsToUpdate.length > 0) {
        console.log(`Syncing ${ticketsToUpdate.length} tickets that are still pending_payment for completed payment ${paymentId}`);
        const batch = db.batch();
        
        for (const ticketId of ticketsToUpdate) {
          const ticketRef = db.collection('tickets').doc(ticketId);
          batch.update(ticketRef, {
            status: 'paid',
            paymentId: paymentId,
            paidAt: paymentData.completedAt || new Date(),
            confirmedAt: null
          });
        }
        
        await batch.commit();
        console.log(`Synced ${ticketsToUpdate.length} tickets to paid status`);
      }
    }

    // Prevent caching to ensure fresh status checks during polling
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({ payment: { id: paymentDoc.id, ...paymentData } });
  } catch (error) {
    console.error('Error getting payment status:', error);
    next(error);
  }
};

/**
 * Get user's transaction history
 */
export const getMyTransactions = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    // Query without orderBy to avoid composite index requirement - we'll sort in memory
    const paymentsSnapshot = await db.collection('payments')
      .where('userId', '==', userId)
      .get();

    const transactions = [];
    for (const doc of paymentsSnapshot.docs) {
      const paymentData = doc.data();
      
      // Get event details
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

      const transaction = {
        id: doc.id,
        totalAmount: paymentData.totalAmount || paymentData.amount || 0,
        status: paymentData.status || 'pending',
        method: paymentData.paymentMethod || 'toyyibpay',
        transactionId: paymentData.transactionId,
        billcode: paymentData.billCode,
        ticketIds: paymentData.ticketIds || [],
        ticketCount: paymentData.ticketIds?.length || 0,
        createdAt: paymentData.createdAt?.toDate ? paymentData.createdAt.toDate().toISOString() : paymentData.createdAt,
        completedAt: paymentData.completedAt?.toDate ? paymentData.completedAt.toDate().toISOString() : paymentData.completedAt,
        event
      };
      
      transactions.push(transaction);
    }

    // Sort by createdAt desc in memory (in case orderBy didn't work)
    transactions.sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return tb - ta;
    });

    res.json({ transactions });
  } catch (error) {
    console.error('Error getting transactions:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details
    });
    next(error);
  }
};

/**
 * Get organizer finance dashboard data
 */
export const getOrganizerFinance = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    
    if (req.user.role !== 'club') {
      return res.status(403).json({ error: 'Only club organizers can access finance dashboard' });
    }

    // Get all events by this organizer
    const eventsSnapshot = await db.collection('events')
      .where('organizerId', '==', userId)
      .get();

    const events = [];
    for (const eventDoc of eventsSnapshot.docs) {
      const eventData = eventDoc.data();
      
      // Get payments for this event
      const paymentsSnapshot = await db.collection('payments')
        .where('eventId', '==', eventDoc.id)
        .where('status', '==', 'completed')
        .get();

      let totalRevenue = 0;
      let totalPlatformFee = 0;
      let totalTicketsSold = 0;
      
      for (const paymentDoc of paymentsSnapshot.docs) {
    const paymentData = paymentDoc.data();
        const amount = Number(paymentData.totalAmount || paymentData.amount || 0);
        totalRevenue += amount;
        totalPlatformFee += Number(paymentData.platformFee || 0);
        totalTicketsSold += paymentData.ticketIds?.length || 0;
      }

      events.push({
        id: eventDoc.id,
        title: eventData.title,
        startDate: eventData.startDate?.toDate ? eventData.startDate.toDate().toISOString() : eventData.startDate,
        ticketsSold: eventData.ticketsSold || 0,
        capacity: eventData.capacity || 0,
        ticketPrice: eventData.ticketPrice || 0,
        totalRevenue,
        totalPlatformFee,
        organizerAmount: totalRevenue - totalPlatformFee
      });
    }

    res.json({ events });
  } catch (error) {
    console.error('Error getting organizer finance:', error);
    next(error);
  }
};

/**
 * Update club payment settings
 */
export const updateClubPaymentSettings = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    
    if (req.user.role !== 'club') {
      return res.status(403).json({ error: 'Only club organizers can update payment settings' });
    }

    const { paymentMethod, qrCodeImageUrl, categoryCode } = req.body;

    const updateData = {
      paymentMethod: paymentMethod || 'toyyibpay',
      updatedAt: new Date()
    };

    if (qrCodeImageUrl) {
      updateData.qrCodeImageUrl = qrCodeImageUrl;
    }

    if (categoryCode) {
      updateData.categoryCode = categoryCode;
    }

    await db.collection('users').doc(userId).update(updateData);

    res.json({ message: 'Payment settings updated successfully' });
  } catch (error) {
    console.error('Error updating payment settings:', error);
    next(error);
  }
};

/**
 * Apply for ToyyibPay (club submits application)
 */
export const applyToyyibPayForClub = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    
    if (req.user.role !== 'club') {
      return res.status(403).json({ error: 'Only clubs can apply for ToyyibPay' });
    }

    await db.collection('users').doc(userId).update({
      toyyibpayApplicationStatus: 'pending',
      updatedAt: new Date()
    });

    res.json({ message: 'ToyyibPay application submitted successfully. Awaiting admin approval.' });
  } catch (error) {
    console.error('Error applying for ToyyibPay:', error);
    next(error);
  }
};

/**
 * Approve ToyyibPay for club (admin only)
 */
export const approveToyyibPayForClub = async (req, res, next) => {
  try {
    const { clubId } = req.params;
    
    const clubDoc = await db.collection('users').doc(clubId).get();
    if (!clubDoc.exists) {
      return res.status(404).json({ error: 'Club not found' });
    }

    const clubData = clubDoc.data();
    if (clubData.role !== 'club') {
      return res.status(400).json({ error: 'User is not a club' });
    }

    // Create ToyyibPay category for this club
    let categoryCode;
    try {
      const categoryResponse = await createCategory({
        catname: `${clubData.name || 'Club'} - UMEvents`,
        catdescription: `ToyyibPay category for ${clubData.name || 'Club'} on UMEvents platform`
      });

      if (!categoryResponse.CategoryCode) {
        throw new Error('CategoryCode not received from ToyyibPay');
      }

      categoryCode = categoryResponse.CategoryCode;
    } catch (categoryError) {
      console.error('Error creating ToyyibPay category:', categoryError);
      const reason = categoryError.response?.data || categoryError.message || 'Unknown error';
      return res.status(500).json({ 
        error: 'Failed to create ToyyibPay category',
        reason
      });
    }

    // Update club with category code and approval status
    await db.collection('users').doc(clubId).update({
      categoryCode,
      toyyibpayApplicationStatus: 'approved',
      toyyibpayEnabled: true,
      updatedAt: new Date()
    });

    res.json({ 
      message: 'ToyyibPay approved and category created successfully',
      categoryCode
    });
  } catch (error) {
    console.error('Error approving ToyyibPay:', error);
    next(error);
  }
};
