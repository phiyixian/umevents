import { db, auth } from '../config/firebase.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export const registerUser = async (req, res, next) => {
  try {
    const { email, password, name, role = 'student', studentId, faculty, phoneNumber } = req.body;

    // Validate UM email
    if (!email.endsWith('@siswa.um.edu.my') && !email.endsWith('@um.edu.my')) {
      return res.status(400).json({ error: 'Please use a valid UM email address' });
    }

    // Create Firebase user
    const userCredential = await auth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: false
    });

    // Create user document in Firestore
    const userData = {
      uid: userCredential.uid,
      email,
      name,
      role: role === 'club' ? 'student' : role, // Default to student, request club separately
      studentId,
      faculty,
      phoneNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
      isClubVerified: role === 'club' ? false : undefined,
      clubName: role === 'club' ? req.body.clubName : undefined
    };

    await db.collection('users').doc(userCredential.uid).set(userData);

    res.status(201).json({ 
      message: 'User registered successfully',
      user: {
        uid: userCredential.uid,
        email,
        name,
        role: userData.role
      }
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    res.json({ 
      message: 'Login successful',
      note: 'Login handled by Firebase Auth on frontend'
    });
  } catch (error) {
    next(error);
  }
};

export const getUserProfile = async (req, res, next) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    delete userData.password; // Don't send password

    res.json({ user: userData });
  } catch (error) {
    next(error);
  }
};

export const updateUserProfile = async (req, res, next) => {
  try {
    const { name, faculty, phoneNumber, bio } = req.body;
    
    const updates = {
      ...(name && { name }),
      ...(faculty && { faculty }),
      ...(phoneNumber && { phoneNumber }),
      ...(bio && { bio }),
      updatedAt: new Date()
    };

    await db.collection('users').doc(req.user.uid).update(updates);

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const requestClubVerification = async (req, res, next) => {
  try {
    const { clubName, clubDescription, clubLogo, clubEmail } = req.body;
    const userId = req.user?.uid || req.body.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const requestData = {
      userId,
      clubName,
      clubDescription,
      clubLogo,
      clubEmail,
      status: 'pending',
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null
    };

    await db.collection('clubVerificationRequests').add(requestData);

    // Update user to pending club status
    await db.collection('users').doc(userId).update({
      clubName,
      isClubVerified: false,
      clubVerificationStatus: 'pending'
    });

    res.status(201).json({ 
      message: 'Club verification request submitted successfully' 
    });
  } catch (error) {
    next(error);
  }
};

