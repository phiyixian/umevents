import { auth, db } from '../config/firebase.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userDoc = await db.collection('users').doc(req.user.uid).get();
      const userData = userDoc.data() || {};

      // Allow admin by email override via env
      const adminEmails = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean);
      const isEmailAdmin = req.user.email && adminEmails.includes(req.user.email.toLowerCase());
      const effectiveRole = isEmailAdmin ? 'admin' : userData.role;

      if (!roles.includes(effectiveRole)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.user.role = effectiveRole;
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({ error: 'Authorization failed' });
    }
  };
};

