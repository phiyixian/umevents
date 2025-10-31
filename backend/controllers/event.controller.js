import { db } from '../config/firebase.js';

// Utility function to convert Firestore Timestamps to ISO strings
const convertEventDates = (event) => {
  const converted = { ...event };
  
  // Convert startDate
  if (converted.startDate) {
    if (converted.startDate.toDate && typeof converted.startDate.toDate === 'function') {
      converted.startDate = converted.startDate.toDate().toISOString();
    } else if (converted.startDate.seconds) {
      converted.startDate = new Date(converted.startDate.seconds * 1000).toISOString();
    } else if (converted.startDate._seconds) {
      converted.startDate = new Date(converted.startDate._seconds * 1000).toISOString();
    } else if (converted.startDate instanceof Date) {
      converted.startDate = converted.startDate.toISOString();
    }
  }
  
  // Convert endDate
  if (converted.endDate) {
    if (converted.endDate.toDate && typeof converted.endDate.toDate === 'function') {
      converted.endDate = converted.endDate.toDate().toISOString();
    } else if (converted.endDate.seconds) {
      converted.endDate = new Date(converted.endDate.seconds * 1000).toISOString();
    } else if (converted.endDate._seconds) {
      converted.endDate = new Date(converted.endDate._seconds * 1000).toISOString();
    } else if (converted.endDate instanceof Date) {
      converted.endDate = converted.endDate.toISOString();
    }
  }
  
  // Convert createdAt
  if (converted.createdAt) {
    if (converted.createdAt.toDate && typeof converted.createdAt.toDate === 'function') {
      converted.createdAt = converted.createdAt.toDate().toISOString();
    } else if (converted.createdAt.seconds) {
      converted.createdAt = new Date(converted.createdAt.seconds * 1000).toISOString();
    } else if (converted.createdAt._seconds) {
      converted.createdAt = new Date(converted.createdAt._seconds * 1000).toISOString();
    } else if (converted.createdAt instanceof Date) {
      converted.createdAt = converted.createdAt.toISOString();
    }
  }
  
  // Convert updatedAt
  if (converted.updatedAt) {
    if (converted.updatedAt.toDate && typeof converted.updatedAt.toDate === 'function') {
      converted.updatedAt = converted.updatedAt.toDate().toISOString();
    } else if (converted.updatedAt.seconds) {
      converted.updatedAt = new Date(converted.updatedAt.seconds * 1000).toISOString();
    } else if (converted.updatedAt._seconds) {
      converted.updatedAt = new Date(converted.updatedAt._seconds * 1000).toISOString();
    } else if (converted.updatedAt instanceof Date) {
      converted.updatedAt = converted.updatedAt.toISOString();
    }
  }
  
  return converted;
};

export const createEvent = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    // Check if user is authorized to create events (club or admin)
    if (userData.role !== 'club' && userData.role !== 'admin') {
      return res.status(403).json({ error: 'Only clubs can create events' });
    }

    // Check if club is verified
    const isClubVerified = userData.isClubVerified || userData.verificationStatus === 'approved';
    if (userData.role === 'club' && !isClubVerified) {
      return res.status(403).json({ error: 'Club not verified yet' });
    }

    const {
      title,
      description,
      category,
      startDate,
      endDate,
      location,
      venue,
      ticketPrice,
      capacity,
      imageUrl,
      imageUrls, // Array of image URLs
      tags,
      socialMediaPostUrl, // Social media embed URL
      whatsappGroupLink = '',
      customFields = [],
      paymentMethod = 'toyyibpay', // toyyibpay or manual_qr
      organizerQRCode = '', // For manual QR payment
      paymentInstructions = '' // Instructions for manual payment
    } = req.body;

    const eventData = {
      title,
      description,
      category,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location,
      venue,
      ticketPrice: parseFloat(ticketPrice),
      capacity: parseInt(capacity),
      imageUrls: imageUrls || [], // Array of all images
      imageUrl: (imageUrls && imageUrls.length > 0 ? imageUrls[0] : ''), // Always use first image as showcase
      tags: tags || [],
      socialMediaPostUrl: socialMediaPostUrl || '',
      whatsappGroupLink,
      customFields: Array.isArray(customFields) ? customFields : [],
      organizerId: userId,
      organizerName: userData.name || userData.clubName,
      organizerEmail: userData.email,
      organizerLogoUrl: userData.logoUrl || '',
      ticketsSold: 0,
      revenue: 0,
      status: 'published', // published, draft, cancelled, completed
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      ratings: {
        average: 0,
        count: 0
      },
      paymentMethod,
      organizerQRCode,
      paymentInstructions
    };

    const eventRef = await db.collection('events').add(eventData);
    
    // Fetch the created event to convert dates
    const createdEventDoc = await eventRef.get();
    const createdEvent = convertEventDates({ id: eventRef.id, ...createdEventDoc.data() });

    res.status(201).json({ 
      message: 'Event created successfully',
      eventId: eventRef.id,
      event: createdEvent
    });
  } catch (error) {
    next(error);
  }
};

export const getAllEvents = async (req, res, next) => {
  try {
    const { category, status, limit = 50, page = 1 } = req.query;
    let query = db.collection('events');

    if (category) {
      query = query.where('category', '==', category);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    // Order by start date
    query = query.orderBy('startDate', 'asc');

    const snapshot = await query.limit(parseInt(limit)).get();
    const events = snapshot.docs.map(doc => 
      convertEventDates({ id: doc.id, ...doc.data() })
    );

    res.json({ events, total: events.length });
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eventDoc = await db.collection('events').doc(id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Increment view count
    await db.collection('events').doc(id).update({
      views: (eventDoc.data().views || 0) + 1,
      updatedAt: new Date()
    });

    const eventData = eventDoc.data();
    const convertedEvent = convertEventDates({ id: eventDoc.id, ...eventData });
    res.json({ event: convertedEvent });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const eventDoc = await db.collection('events').doc(id).get();
    
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventData = eventDoc.data();

    // Check authorization
    if (eventData.organizerId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this event' });
    }

    // Normalize and validate incoming fields
    const {
      title,
      description,
      category,
      startDate,
      endDate,
      location,
      venue,
      ticketPrice,
      capacity,
      imageUrl,
      imageUrls,
      tags,
      socialMediaPostUrl,
      whatsappGroupLink,
      customFields,
      paymentMethod,
      organizerQRCode,
      paymentInstructions
    } = req.body;

    const updates = { updatedAt: new Date() };

    if (typeof title === 'string') updates.title = title;
    if (typeof description === 'string') updates.description = description;
    if (typeof category === 'string') updates.category = category;
    if (startDate) updates.startDate = new Date(startDate);
    if (endDate) updates.endDate = new Date(endDate);
    if (typeof location === 'string') updates.location = location;
    if (typeof venue === 'string') updates.venue = venue;
    if (ticketPrice !== undefined) updates.ticketPrice = parseFloat(ticketPrice);
    if (capacity !== undefined) updates.capacity = parseInt(capacity);
    // Always set imageUrl from first image in imageUrls array
    if (Array.isArray(imageUrls)) {
      updates.imageUrls = imageUrls;
      updates.imageUrl = imageUrls.length > 0 ? imageUrls[0] : '';
    } else if (typeof imageUrl === 'string') {
      // Fallback: if only imageUrl provided (legacy), create array
      updates.imageUrl = imageUrl;
      if (!eventData.imageUrls || eventData.imageUrls.length === 0) {
        updates.imageUrls = [imageUrl];
      }
    }
    if (Array.isArray(tags)) updates.tags = tags; // already split on client
    if (typeof socialMediaPostUrl === 'string') updates.socialMediaPostUrl = socialMediaPostUrl;
    if (typeof whatsappGroupLink === 'string') updates.whatsappGroupLink = whatsappGroupLink;
    if (Array.isArray(customFields)) updates.customFields = customFields;
    if (typeof paymentMethod === 'string') updates.paymentMethod = paymentMethod;
    if (typeof organizerQRCode === 'string') updates.organizerQRCode = organizerQRCode;
    if (typeof paymentInstructions === 'string') updates.paymentInstructions = paymentInstructions;

    await db.collection('events').doc(id).update(updates);

    const updatedDoc = await db.collection('events').doc(id).get();
    const convertedEvent = convertEventDates({ id, ...updatedDoc.data() });
    res.json({ message: 'Event updated successfully', event: convertedEvent });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const eventDoc = await db.collection('events').doc(id).get();
    
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventData = eventDoc.data();

    // Check authorization
    if (eventData.organizerId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this event' });
    }

    // Soft delete by marking as cancelled
    await db.collection('events').doc(id).update({
      status: 'cancelled',
      updatedAt: new Date()
    });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getEventsByOrganizerPublic = async (req, res, next) => {
  try {
    const { clubId } = req.params;
    const snapshot = await db.collection('events')
      .where('organizerId', '==', clubId)
      .get();

    const events = snapshot.docs
      .map(doc => convertEventDates({ id: doc.id, ...doc.data() }))
      .filter(ev => ev.status !== 'cancelled');

    res.json({ events });
  } catch (error) {
    next(error);
  }
};
export const getMyEvents = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    
    // Get events without orderBy to avoid needing a composite index
    const snapshot = await db.collection('events')
      .where('organizerId', '==', userId)
      .get();

    let events = snapshot.docs.map(doc => 
      convertEventDates({ id: doc.id, ...doc.data() })
    );

    // Sort by startDate client-side (now using ISO strings)
    events.sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateA - dateB;
    });

    res.json({ events, total: events.length });
  } catch (error) {
    next(error);
  }
};

export const searchEvents = async (req, res, next) => {
  try {
    const { q, category, minPrice, maxPrice } = req.query;

    let query = db.collection('events');

    if (category) {
      query = query.where('category', '==', category);
    }

    // Note: Full-text search requires Cloud Functions or Algolia
    // This is a simplified version
    const snapshot = await query.get();
    let events = snapshot.docs.map(doc => 
      convertEventDates({ id: doc.id, ...doc.data() })
    );

    // Client-side filtering for search term
    if (q) {
      const searchTerm = q.toLowerCase();
      events = events.filter(event => 
        event.title.toLowerCase().includes(searchTerm) ||
        event.description.toLowerCase().includes(searchTerm) ||
        event.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    if (minPrice) {
      events = events.filter(event => event.ticketPrice >= parseFloat(minPrice));
    }

    if (maxPrice) {
      events = events.filter(event => event.ticketPrice <= parseFloat(maxPrice));
    }

    res.json({ events, total: events.length });
  } catch (error) {
    next(error);
  }
};

