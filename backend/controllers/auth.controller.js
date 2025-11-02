import { db, auth } from '../config/firebase.js';

export const selectRole = async (req, res, next) => {
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

export const registerUser = async (req, res, next) => {
  try {
    const { email, password, name, role = 'student', studentId, faculty, phoneNumber, clubName, clubDescription, verificationStatus, logoUrl } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Validate UM email (only for email/password registration, not Google)
    // Allow any email for Google sign-ins
    if (password && !email.endsWith('@siswa.um.edu.my') && !email.endsWith('@um.edu.my') && !email.endsWith('@gmail.com')) {
      // For now, allow any email but recommend UM email
      console.log('Warning: Non-UM email detected');
    }

    // Create Firebase user
    let userCredential;
    try {
      userCredential = await auth.createUser({
        email,
        password,
        displayName: name,
        emailVerified: false
      });
    } catch (firebaseError) {
      console.error('Firebase user creation error:', firebaseError);
      if (firebaseError.code === 'auth/email-already-exists') {
        return res.status(400).json({ error: 'Email already registered' });
      }
      throw firebaseError;
    }

    // Create user document in Firestore
    const userData = {
      uid: userCredential.uid,
      email,
      name,
      role,
      phoneNumber,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add role-specific fields
    if (role === 'student') {
      if (studentId) userData.studentId = studentId;
      if (faculty) userData.faculty = faculty;
    } else if (role === 'club') {
      if (clubName) userData.clubName = clubName;
      if (clubDescription) userData.clubDescription = clubDescription;
      if (logoUrl) userData.logoUrl = logoUrl;
      userData.verificationStatus = verificationStatus || 'pending';
      userData.isClubVerified = false;
    }

    try {
      await db.collection('users').doc(userCredential.uid).set(userData);
    } catch (firestoreError) {
      console.error('Firestore error:', firestoreError);
      // If Firestore save fails, try to delete the Firebase user to maintain consistency
      try {
        await auth.deleteUser(userCredential.uid);
      } catch (deleteError) {
        console.error('Failed to cleanup Firebase user:', deleteError);
      }
      throw firestoreError;
    }

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
    console.error('Registration error:', error);
    const errorMessage = error.message || 'Registration failed';
    return res.status(error.status || 500).json({ 
      error: typeof errorMessage === 'string' ? errorMessage : 'Registration failed' 
    });
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

export const getPublicClubInfo = async (req, res, next) => {
  try {
    const { clubId } = req.params;
    const docRef = await db.collection('users').doc(clubId).get();
    if (docRef.exists) {
      const data = docRef.data();
      const publicClub = {
        id: docRef.id,
        clubName: data.clubName || data.name || 'Club',
        clubDescription: data.clubDescription || '',
        email: data.email || '',
        phoneNumber: data.phoneNumber || '',
        logoUrl: data.logoUrl || ''
      };
      return res.json({ club: publicClub });
    }

    // Fallback: if the id refers to a club verification request, expose basic info
    const reqDoc = await db.collection('clubVerificationRequests').doc(clubId).get();
    if (reqDoc.exists) {
      const r = reqDoc.data();
      const publicClub = {
        id: r.userId || clubId,
        clubName: r.clubName || 'Club',
        clubDescription: r.clubDescription || '',
        email: r.clubEmail || '',
        phoneNumber: '',
        logoUrl: r.clubLogo || ''
      };
      return res.json({ club: publicClub });
    }

    return res.status(404).json({ error: 'Club not found' });
  } catch (error) {
    next(error);
  }
};

export const getAllPublicClubs = async (req, res, next) => {
  try {
    const snapshot = await db.collection('users')
      .where('role', '==', 'club')
      .get();

    const clubs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        clubName: data.clubName || data.name || 'Club',
        clubDescription: data.clubDescription || '',
        email: data.email || '',
        phoneNumber: data.phoneNumber || '',
        logoUrl: data.logoUrl || ''
      };
    });

    res.json({ clubs });
  } catch (error) {
    next(error);
  }
};

export const updateUserProfile = async (req, res, next) => {
  try {
    const { name, studentId, faculty, phoneNumber, bio, clubName, clubDescription, contactPerson, logoUrl, major, degree, currentSemester, dietaryRequirement } = req.body;
    
    const updates = {
      updatedAt: new Date()
    };

    // Student fields
    if (name !== undefined) updates.name = name;
    if (studentId !== undefined) updates.studentId = studentId; // Allow empty string to clear
    if (faculty !== undefined) updates.faculty = faculty;
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;
    if (bio) updates.bio = bio;
    if (major !== undefined) updates.major = major;
    if (degree !== undefined) updates.degree = degree;
    if (currentSemester !== undefined) updates.currentSemester = currentSemester;
    if (dietaryRequirement !== undefined) updates.dietaryRequirement = dietaryRequirement;

    // Club fields
    if (clubName) updates.clubName = clubName;
    if (clubDescription) updates.clubDescription = clubDescription;
    if (contactPerson) updates.name = contactPerson;
    if (logoUrl) updates.logoUrl = logoUrl;

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

export const listClubVerificationRequests = async (req, res, next) => {
  try {
    // 1) Load explicit club verification requests (legacy/new flow)
    const requestsSnap = await db.collection('clubVerificationRequests').get();
    const explicitRequests = requestsSnap.docs.map(doc => ({ id: doc.id, type: 'club_verification', ...doc.data() }));

    // 2) Load clubs with pending verification (no explicit request doc)
    const usersPendingSnap = await db.collection('users')
      .where('role', '==', 'club')
      .where('verificationStatus', '==', 'pending')
      .get();

    const synthesizedClubRequests = usersPendingSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id, // userId used as request id (handled by approve fallback)
        type: 'club_verification',
        userId: doc.id,
        clubId: doc.id,
        clubName: data.clubName || data.name || 'Club',
        clubDescription: data.clubDescription || '',
        clubEmail: data.email || '',
        clubLogo: data.logoUrl || '',
        status: 'pending',
        submittedAt: data.createdAt || new Date(),
      };
    });

    // 3) Load ToyyibPay application pending
    const toyyibPendingSnap = await db.collection('users')
      .where('role', '==', 'club')
      .where('toyyibpayApplicationStatus', '==', 'pending')
      .get();

    const toyyibpayRequests = toyyibPendingSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id, // userId
        type: 'toyyibpay',
        userId: doc.id,
        clubId: doc.id,
        clubName: data.clubName || data.name || 'Club',
        clubDescription: data.clubDescription || '',
        clubEmail: data.email || '',
        clubLogo: data.logoUrl || '',
        status: 'pending',
        submittedAt: data.updatedAt || data.createdAt || new Date(),
      };
    });

    // Merge and return
    const requests = [...explicitRequests, ...synthesizedClubRequests, ...toyyibpayRequests];
    res.json({ requests });
  } catch (error) {
    next(error);
  }
};

export const approveClubVerificationRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const requestRef = db.collection('clubVerificationRequests').doc(requestId);
    const requestDoc = await requestRef.get();

    let userIdToApprove = null;
    if (requestDoc.exists) {
      const data = requestDoc.data();
      userIdToApprove = data.userId;
      await requestRef.update({
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: req.user.uid
      });
    } else {
      // Fallback: requestId is actually the userId (synthesized list entry)
      userIdToApprove = requestId;
    }

    await db.collection('users').doc(userIdToApprove).update({
      verificationStatus: 'approved',
      isClubVerified: true,
      updatedAt: new Date()
    });

    res.json({ message: 'Club verification approved' });
  } catch (error) {
    next(error);
  }
};

export const rejectClubVerificationRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const requestRef = db.collection('clubVerificationRequests').doc(requestId);
    const requestDoc = await requestRef.get();

    let userIdToReject = null;
    if (requestDoc.exists) {
      const data = requestDoc.data();
      userIdToReject = data.userId;
      await requestRef.update({
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedBy: req.user.uid
      });
    } else {
      // Fallback: requestId is actually the userId
      userIdToReject = requestId;
    }

    await db.collection('users').doc(userIdToReject).update({
      verificationStatus: 'rejected',
      isClubVerified: false,
      updatedAt: new Date()
    });

    res.json({ message: 'Club verification rejected' });
  } catch (error) {
    next(error);
  }
};

