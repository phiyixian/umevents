import { db } from '../config/firebase.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const { role, limit = 50, page = 1 } = req.query;

    let query = db.collection('users');

    if (role) {
      query = query.where('role', '==', role);
    }

    const snapshot = await query.limit(parseInt(limit)).get();
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      uid: doc.id,
      ...doc.data()
    }));

    res.json({ users, total: users.length });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userDoc = await db.collection('users').doc(id).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    delete userData.password;

    res.json({ user: { id: userDoc.id, ...userData } });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['student', 'club', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    await db.collection('users').doc(id).update({
      role,
      updatedAt: new Date()
    });

    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const getClubMembers = async (req, res, next) => {
  try {
    const { clubId } = req.params;
    const userId = req.user.uid;

    // Get club info
    const clubDoc = await db.collection('users').doc(clubId).get();
    if (!clubDoc.exists) {
      return res.status(404).json({ error: 'Club not found' });
    }

    const clubData = clubDoc.data();

    // Check authorization
    if (clubData.uid !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get club events
    const eventsSnapshot = await db.collection('events')
      .where('organizerId', '==', clubId)
      .get();

    const eventIds = eventsSnapshot.docs.map(doc => doc.id);

    // Get unique members (users who bought tickets to club events)
    const membersSnapshot = await db.collection('tickets')
      .where('eventId', 'in', eventIds.slice(0, 10)) // Firestore 'in' limit is 10
      .get();

    const userIds = [...new Set(membersSnapshot.docs.map(doc => doc.data().userId))];

    const members = [];
    for (const uid of userIds) {
      const userDoc = await db.collection('users').doc(uid).get();
      if (userDoc.exists) {
        members.push({
          uid,
          ...userDoc.data()
        });
      }
    }

    res.json({ members, total: members.length });
  } catch (error) {
    next(error);
  }
};

export const followUser = async (req, res, next) => {
  try {
    const { id: followeeId } = req.params;
    const followerId = req.user.uid;

    if (followeeId === followerId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if already following
    const followDoc = await db.collection('follows')
      .where('followerId', '==', followerId)
      .where('followeeId', '==', followeeId)
      .limit(1)
      .get();

    if (!followDoc.empty) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    await db.collection('follows').add({
      followerId,
      followeeId,
      createdAt: new Date()
    });

    res.json({ message: 'Successfully followed user' });
  } catch (error) {
    next(error);
  }
};

export const unfollowUser = async (req, res, next) => {
  try {
    const { id: followeeId } = req.params;
    const followerId = req.user.uid;

    const followDoc = await db.collection('follows')
      .where('followerId', '==', followerId)
      .where('followeeId', '==', followeeId)
      .limit(1)
      .get();

    if (followDoc.empty) {
      return res.status(404).json({ error: 'Not following this user' });
    }

    await db.collection('follows').doc(followDoc.docs[0].id).delete();

    res.json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    next(error);
  }
};

