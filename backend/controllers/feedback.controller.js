import { db } from '../config/firebase.js';

/**
 * Submit feedback
 * Public endpoint - anyone can submit feedback
 */
export const submitFeedback = async (req, res, next) => {
  try {
    const { name, email, subject, message, rating, type } = req.body;

    // Validate required fields
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Optional: validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Create feedback document
    const feedbackData = {
      name: name?.trim() || 'Anonymous',
      email: email?.trim() || null,
      subject: subject?.trim() || 'General Feedback',
      message: message.trim(),
      rating: rating || null, // Optional: 1-5 rating
      type: type || 'general', // general, bug, feature, complaint, praise
      userId: req.user?.uid || null, // If user is logged in, link to their account
      status: 'new', // new, read, archived
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const feedbackRef = await db.collection('feedbacks').add(feedbackData);

    res.status(201).json({
      message: 'Feedback submitted successfully. Thank you!',
      feedbackId: feedbackRef.id
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    next(error);
  }
};

/**
 * Get all feedbacks (admin only)
 */
export const getAllFeedbacks = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can view feedbacks' });
    }

    const { status, type, limit = 50 } = req.query;

    let query = db.collection('feedbacks');

    if (status) {
      query = query.where('status', '==', status);
    }

    if (type) {
      query = query.where('type', '==', type);
    }

    // Order by createdAt desc
    query = query.orderBy('createdAt', 'desc').limit(parseInt(limit));

    const snapshot = await query.get();

    const feedbacks = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      feedbacks.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt
      });
    });

    res.json({ feedbacks });
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    next(error);
  }
};

/**
 * Update feedback status (admin only)
 */
export const updateFeedbackStatus = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update feedback status' });
    }

    const { feedbackId } = req.params;
    const { status } = req.body;

    const validStatuses = ['new', 'read', 'archived'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: new, read, or archived' });
    }

    await db.collection('feedbacks').doc(feedbackId).update({
      status,
      updatedAt: new Date()
    });

    res.json({ message: 'Feedback status updated successfully' });
  } catch (error) {
    console.error('Error updating feedback status:', error);
    next(error);
  }
};

/**
 * Delete feedback (admin only)
 */
export const deleteFeedback = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete feedbacks' });
    }

    const { feedbackId } = req.params;

    await db.collection('feedbacks').doc(feedbackId).delete();

    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    next(error);
  }
};

