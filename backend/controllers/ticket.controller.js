import { db } from '../config/firebase.js';
import QRCode from 'qrcode';

// Mock QR code generation for development
const generateQRCodeDataURL = async (data) => {
  // In development, return a mock QR code image
  // In production, this should be properly generated
  return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;
};

export const purchaseTicket = async (req, res, next) => {
  try {
    const { eventId, quantity = 1 } = req.body;
    const userId = req.user.uid;

    // Get event details
    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventData = eventDoc.data();

    // Check if event is still available
    if (eventData.status !== 'published') {
      return res.status(400).json({ error: 'Event is not available for purchase' });
    }

    // Check capacity
    if (eventData.ticketsSold + quantity > eventData.capacity) {
      return res.status(400).json({ error: 'Insufficient tickets available' });
    }

    // Check if user already purchased for this event
    const existingTickets = await db.collection('tickets')
      .where('eventId', '==', eventId)
      .where('userId', '==', userId)
      .get();

    if (!existingTickets.empty) {
      return res.status(400).json({ error: 'You have already purchased tickets for this event' });
    }

    // Create ticket records
    const tickets = [];
    for (let i = 0; i < quantity; i++) {
      const ticketData = {
        eventId,
        userId,
        status: 'pending_payment', // pending_payment, confirmed, cancelled, used
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

    // Calculate total amount
    const totalAmount = eventData.ticketPrice * quantity;

    res.status(201).json({ 
      message: 'Tickets reserved',
      tickets,
      totalAmount,
      event: {
        id: eventId,
        title: eventData.title
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMyTickets = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    // Avoid composite index requirement by removing orderBy and sorting in memory
    const snapshot = await db.collection('tickets')
      .where('userId', '==', userId)
      .get();

    const tickets = [];
    
    for (const doc of snapshot.docs) {
      const ticketData = doc.data();
      
      // Get event details
      let event = null;
      if (ticketData.eventId) {
        const eventDoc = await db.collection('events').doc(ticketData.eventId).get();
        if (eventDoc.exists) {
          const eventData = eventDoc.data();
          event = {
            id: eventDoc.id,
            ...eventData,
            // Convert Firestore timestamps to ISO strings for serialization
            startDate: eventData.startDate?.toDate ? eventData.startDate.toDate().toISOString() : eventData.startDate,
            endDate: eventData.endDate?.toDate ? eventData.endDate.toDate().toISOString() : eventData.endDate,
            createdAt: eventData.createdAt?.toDate ? eventData.createdAt.toDate().toISOString() : eventData.createdAt,
            updatedAt: eventData.updatedAt?.toDate ? eventData.updatedAt.toDate().toISOString() : eventData.updatedAt
          };
        }
      }
      
      // Convert ticket dates as well
      const ticket = {
        id: doc.id,
        ...ticketData,
        purchaseDate: ticketData.purchaseDate?.toDate ? ticketData.purchaseDate.toDate().toISOString() : ticketData.purchaseDate,
        checkedInAt: ticketData.checkedInAt?.toDate ? ticketData.checkedInAt.toDate().toISOString() : ticketData.checkedInAt,
        event
      };
      
      tickets.push(ticket);
    }

    // Sort by purchaseDate desc in memory
    tickets.sort((a, b) => {
      const ta = new Date(a.purchaseDate || 0).getTime();
      const tb = new Date(b.purchaseDate || 0).getTime();
      return tb - ta;
    });

    res.json({ tickets, total: tickets.length });
  } catch (error) {
    console.error('Error in getMyTickets:', error);
    next(error);
  }
};

export const getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const ticketDoc = await db.collection('tickets').doc(id).get();
    
    if (!ticketDoc.exists) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticketData = ticketDoc.data();

    // Check authorization
    if (ticketData.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to view this ticket' });
    }

    // Get event details
    const eventDoc = await db.collection('events').doc(ticketData.eventId).get();

    res.json({
      ticket: {
        id: ticketDoc.id,
        ...ticketData,
        event: eventDoc.exists ? { id: eventDoc.id, ...eventDoc.data() } : null
      }
    });
  } catch (error) {
    next(error);
  }
};

export const validateTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    // Check if user is event organizer or admin
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    const ticketDoc = await db.collection('tickets').doc(id).get();
    if (!ticketDoc.exists) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticketData = ticketDoc.data();

    // Get event to check organizer
    const eventDoc = await db.collection('events').doc(ticketData.eventId).get();
    const eventData = eventDoc.data();

    if (eventData.organizerId !== userId && userData.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to validate tickets' });
    }

    // Check if ticket is already used
    if (ticketData.checkedIn) {
      return res.json({ 
        valid: true, 
        message: 'Ticket already checked in',
        checkedInAt: ticketData.checkedInAt 
      });
    }

    // Mark as checked in
    await db.collection('tickets').doc(id).update({
      checkedIn: true,
      checkedInAt: new Date(),
      status: 'used'
    });

    res.json({ 
      valid: true, 
      message: 'Ticket validated and checked in successfully' 
    });
  } catch (error) {
    next(error);
  }
};

export const generateQRCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const ticketDoc = await db.collection('tickets').doc(id).get();
    
    if (!ticketDoc.exists) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticketData = ticketDoc.data();

    if (ticketData.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to view this QR code' });
    }

    // Generate QR code if not exists
    if (!ticketData.qrCode) {
      const qrData = JSON.stringify({
        ticketId: id,
        eventId: ticketData.eventId,
        userId: ticketData.userId
      });

      let qrCode;
      try {
        qrCode = await QRCode.toDataURL(qrData);
      } catch (error) {
        // Fallback to mock QR code
        qrCode = await generateQRCodeDataURL(qrData);
      }

      await db.collection('tickets').doc(id).update({
        qrCode
      });

      return res.json({ qrCode });
    }

    res.json({ qrCode: ticketData.qrCode });
  } catch (error) {
    next(error);
  }
};

