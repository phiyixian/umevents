import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
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
      toast.error(error.message);
      throw error;
    }
  };

  const register = async (email, password, userData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      toast.success('Account created successfully!');
      return userCredential;
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('Logged in with Google!');
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast.success('Logged out successfully!');
    } catch (error) {
      toast.error(error.message);
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

