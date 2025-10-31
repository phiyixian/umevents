import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import toast from 'react-hot-toast';
import { useUserStore } from '../store/userStore';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setUserStore } = useUserStore();

  useEffect(() => {
    // Handle redirect result (fallback path when popups are blocked)
    (async () => {
      try {
        const redirectResult = await getRedirectResult(auth);
        if (redirectResult?.user) {
          const selectedRole = sessionStorage.getItem('selectedRole') || 'student';
          // Ensure Firestore doc exists
          const userDoc = await getDoc(doc(db, 'users', redirectResult.user.uid));
          if (!userDoc.exists()) {
            const { doc: document, setDoc } = await import('firebase/firestore');
            const userData = {
              uid: redirectResult.user.uid,
              email: redirectResult.user.email,
              name: redirectResult.user.displayName || 'User',
              photoURL: redirectResult.user.photoURL,
              role: selectedRole,
              provider: 'google',
              ...(selectedRole === 'club' && { verificationStatus: 'pending' }),
              createdAt: new Date(),
              updatedAt: new Date()
            };
            await setDoc(document(db, 'users', redirectResult.user.uid), userData);
            setUserStore({ uid: redirectResult.user.uid, email: redirectResult.user.email, ...userData });
          }
        }
      } catch (e) {
        // Swallow redirect result errors; onAuthStateChanged will still run
        console.error('Google redirect result error:', e);
      }
    })();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get additional user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserStore({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...userData
            });
          } else {
            // First-time Google sign-in - create user document
            if (firebaseUser.providerData[0]?.providerId === 'google.com') {
              try {
                const selectedRole = sessionStorage.getItem('selectedRole') || 'student';
                const userData = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  name: firebaseUser.displayName || 'User',
                  photoURL: firebaseUser.photoURL,
                  role: selectedRole,
                  provider: 'google',
                  ...(selectedRole === 'club' && { verificationStatus: 'pending' }),
                  createdAt: new Date(),
                  updatedAt: new Date()
                };
                
                // Create user document
                const { doc: document, setDoc } = await import('firebase/firestore');
                await setDoc(document(db, 'users', firebaseUser.uid), userData);
                
                setUserStore({
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  ...userData
                });
              } catch (error) {
                console.error('Error creating user document:', error);
                setUser(firebaseUser);
              }
            }
          }
          setUser(firebaseUser);
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
        setUserStore(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [setUserStore]);

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Logged in successfully!');
    } catch (error) {
      const errorMessage = error.message || 'Login failed';
      toast.error(typeof errorMessage === 'string' ? errorMessage : 'Login failed');
      throw error;
    }
  };

  const register = async (email, password, userData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      toast.success('Account created successfully!');
      return userCredential;
    } catch (error) {
      const errorMessage = error.message || 'Registration failed';
      toast.error(typeof errorMessage === 'string' ? errorMessage : 'Registration failed');
      throw error;
    }
  };

  const signInWithGoogle = async (selectedRole) => {
    try {
      if (!selectedRole) {
        throw new Error('Please select your role first');
      }
      // Persist selected role for redirect fallback / first-time doc
      sessionStorage.setItem('selectedRole', selectedRole);

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Ensure Firestore user doc exists
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          const { doc: document, setDoc } = await import('firebase/firestore');
          const userData = {
            uid: user.uid,
            email: user.email,
            name: user.displayName || 'User',
            photoURL: user.photoURL,
            role: selectedRole,
            provider: 'google',
            ...(selectedRole === 'club' && { verificationStatus: 'pending' }),
            createdAt: new Date(),
            updatedAt: new Date()
          };
          await setDoc(document(db, 'users', user.uid), userData);
          setUserStore({ uid: user.uid, email: user.email, ...userData });
        }
        toast.success('Logged in with Google!');
      } catch (popupError) {
        // If popups are blocked or unsupported, fall back to redirect
        if (
          popupError?.code === 'auth/popup-blocked' ||
          popupError?.code === 'auth/popup-closed-by-user' ||
          popupError?.code === 'auth/operation-not-supported-in-this-environment'
        ) {
          await signInWithRedirect(auth, provider);
          return; // Flow continues after redirect
        }
        throw popupError;
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      // Map common Firebase Auth errors to helpful messages
      const code = error?.code;
      let message = 'Failed to sign in with Google';
      if (code === 'auth/unauthorized-domain') {
        message = 'This domain is not authorized for Google sign-in. Add it in Firebase Auth settings > Authorized domains.';
      } else if (code === 'auth/account-exists-with-different-credential') {
        message = 'An account already exists with a different sign-in method. Try email/password or link providers.';
      } else if (code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user') {
        message = 'Sign-in was cancelled. Please try again.';
      } else if (code === 'auth/operation-not-supported-in-this-environment') {
        message = 'This browser blocks popups. We attempted a redirect sign-in. If it didn’t start, enable popups or try another browser.';
      } else if (error?.message) {
        message = error.message;
      }
      toast.error(message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast.success('Logged out successfully!');
    } catch (error) {
      const errorMessage = error.message || 'Logout failed';
      toast.error(typeof errorMessage === 'string' ? errorMessage : 'Logout failed');
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    signInWithGoogle,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

