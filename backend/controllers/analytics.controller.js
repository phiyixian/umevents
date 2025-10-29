import { db } from '../config/firebase.js';

export const getEventAnalytics = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.uid;

    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventData = eventDoc.data();

    // Check authorization
    if (eventData.organizerId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get tickets data
    const ticketsSnapshot = await db.collection('tickets')
      .where('eventId', '==', eventId)
      .where('status', '==', 'confirmed')
      .get();

    const ticketsData = ticketsSnapshot.docs.map(doc => doc.data());

    // Calculate analytics
    const totalSold = ticketsData.length;
    const capacity = eventData.capacity;
    const attendanceRate = ((totalSold / capacity) * 100).toFixed(2);
    const revenue = eventData.revenue || 0;
    const platformFee = totalSold * 1.00; // RM1 per ticket
    const organizerRevenue = revenue - platformFee;

    // Get user details for demographics
    const demographics = {
      total: totalSold,
      byFaculty: {},
      byGender: {}
    };

    for (const ticket of ticketsData) {
      const userDoc = await db.collection('users').doc(ticket.userId).get();
      const userData = userDoc.data();

      if (userData.faculty) {
        demographics.byFaculty[userData.faculty] = 
          (demographics.byFaculty[userData.faculty] || 0) + 1;
      }

      if (userData.gender) {
        demographics.byGender[userData.gender] = 
          (demographics.byGender[userData.gender] || 0) + 1;
      }
    }

    res.json({
      eventId,
      eventTitle: eventData.title,
      analytics: {
        totalSold,
        capacity,
        attendanceRate: `${attendanceRate}%`,
        revenue: {
          total: revenue,
          platformFee,
          organizerRevenue
        },
        demographics
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getClubAnalytics = async (req, res, next) => {
  try {
    const { clubId } = req.params;
    
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.user.uid;

    // Verify the club is requesting their own analytics
    if (clubId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get club events
    const eventsSnapshot = await db.collection('events')
      .where('organizerId', '==', clubId)
      .get();

    const events = eventsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        startDate: data.startDate,
        endDate: data.endDate,
        capacity: data.capacity,
        ticketsSold: data.ticketsSold || 0,
        ticketPrice: data.ticketPrice || 0,
        revenue: data.revenue || 0
      };
    });

    // Calculate club-wide analytics
    let totalEvents = events.length;
    let totalTicketsSold = 0;
    let totalRevenue = 0;
    let totalRevenueAfterFees = 0;

    for (const event of events) {
      totalTicketsSold += event.ticketsSold || 0;
      totalRevenue += event.revenue || 0;
      totalRevenueAfterFees += (event.revenue || 0) - ((event.ticketsSold || 0) * 1.00);
    }

    res.json({
      clubId,
      events,
      analytics: {
        totalEvents,
        totalTicketsSold,
        totalRevenue,
        totalRevenueAfterFees,
        averageTicketsPerEvent: totalEvents > 0 ? (totalTicketsSold / totalEvents).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error('Error in getClubAnalytics:', error);
    next(error);
  }
};

export const getAdminAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let eventsQuery = db.collection('events');
    if (startDate && endDate) {
      eventsQuery = eventsQuery
        .where('createdAt', '>=', new Date(startDate))
        .where('createdAt', '<=', new Date(endDate));
    }

    const eventsSnapshot = await eventsQuery.get();
    const events = eventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate platform analytics
    let totalEvents = events.length;
    let totalTicketsSold = 0;
    let totalRevenue = 0;
    let totalPlatformFee = 0;
    let categoriesBreakdown = {};
    let topEvents = [];
    let userRegistrationCount = 0;

    // Get user count
    const usersSnapshot = await db.collection('users').get();
    userRegistrationCount = usersSnapshot.size;

    // Process events
    for (const event of events) {
      totalTicketsSold += event.ticketsSold || 0;
      totalRevenue += event.revenue || 0;
      totalPlatformFee += (event.ticketsSold || 0) * 1.00;

      if (event.category) {
        categoriesBreakdown[event.category] = 
          (categoriesBreakdown[event.category] || 0) + 1;
      }
    }

    // Get top 10 events by tickets sold
    topEvents = events
      .sort((a, b) => (b.ticketsSold || 0) - (a.ticketsSold || 0))
      .slice(0, 10)
      .map(event => ({
        id: event.id,
        title: event.title,
        ticketsSold: event.ticketsSold,
        revenue: event.revenue
      }));

    res.json({
      analytics: {
        totalUsers: userRegistrationCount,
        totalEvents,
        totalTicketsSold,
        totalRevenue,
        totalPlatformFee,
        platformRevenue: totalPlatformFee,
        categoriesBreakdown,
        topEvents,
        averageTicketsPerEvent: totalEvents > 0 ? (totalTicketsSold / totalEvents).toFixed(2) : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPlatformStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get events this month and year
    const monthlyEventsSnapshot = await db.collection('events')
      .where('createdAt', '>=', startOfMonth)
      .get();

    const yearlyEventsSnapshot = await db.collection('events')
      .where('createdAt', '>=', startOfYear)
      .get();

    const monthlyEvents = monthlyEventsSnapshot.size;
    const yearlyEvents = yearlyEventsSnapshot.size;

    // Get users
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;

    // Calculate monthly and yearly revenue
    let monthlyRevenue = 0;
    let yearlyRevenue = 0;

    for (const doc of monthlyEventsSnapshot.docs) {
      monthlyRevenue += (doc.data().revenue || 0);
    }

    for (const doc of yearlyEventsSnapshot.docs) {
      yearlyRevenue += (doc.data().revenue || 0);
    }

    res.json({
      stats: {
        totalUsers,
        events: {
          monthly: monthlyEvents,
          yearly: yearlyEvents
        },
        revenue: {
          monthly: monthlyRevenue,
          yearly: yearlyRevenue
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getTopEvents = async (req, res, next) => {
  try {
    const { limit = 10, period = 'all' } = req.query;

    let startDate;
    if (period === 'month') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    let eventsQuery = db.collection('events').orderBy('ticketsSold', 'desc');
    if (startDate) {
      eventsQuery = eventsQuery.where('startDate', '>=', startDate);
    }

    const snapshot = await eventsQuery.limit(parseInt(limit)).get();
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ events });
  } catch (error) {
    next(error);
  }
};

export const getEventParticipants = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.uid;

    // Get event to verify ownership
    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventData = eventDoc.data();
    
    // Check authorization
    if (eventData.organizerId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get all tickets for this event
    const ticketsSnapshot = await db.collection('tickets')
      .where('eventId', '==', eventId)
      .get();

    // Get user details for each ticket
    const participants = [];
    for (const ticketDoc of ticketsSnapshot.docs) {
      const ticketData = ticketDoc.data();
      const userDoc = await db.collection('users').doc(ticketData.userId).get();
      const userData = userDoc.data();

      participants.push({
        ticketId: ticketDoc.id,
        purchaseDate: ticketData.purchaseDate,
        status: ticketData.status,
        studentName: userData.name || 'Unknown',
        studentId: userData.studentId || 'N/A',
        faculty: userData.faculty || 'N/A',
        email: userData.email || 'N/A',
        phoneNumber: userData.phoneNumber || 'N/A'
      });
    }

    res.json({
      eventId,
      eventTitle: eventData.title,
      participants,
      totalParticipants: participants.length
    });
  } catch (error) {
    console.error('Error in getEventParticipants:', error);
    next(error);
  }
};

