import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, firestore } from '../firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Gamification State (Persisted in LocalStorage for demo)
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('sangatamizh_stats');
    return saved ? JSON.parse(saved) : { gems: 1240, streak: 12 };
  });

  useEffect(() => {
    localStorage.setItem('sangatamizh_stats', JSON.stringify(stats));
  }, [stats]);

  const updateStats = (type) => {
    setStats(prev => {
      if (type === 'song_played') {
        return { ...prev, gems: prev.gems + 10, streak: prev.streak + 0 }; // Add 10 gems per song
      }
      if (type === 'streak') {
        return { ...prev, streak: prev.streak + 1 };
      }
      return prev;
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Fetch from Firestore ('user' collection) - Debugging Enabled
        try {
          console.log("Auth: Fetching profile from Firestore 'user' collection...");
          const userDocRef = doc(firestore, "user", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          let userData = {};
          if (userDocSnap.exists()) {
             userData = userDocSnap.data();
             console.log("Auth: Firestore Data Found:", userData);
          } else {
             console.log("Auth: No Firestore Data Found (New User?)");
          }

          // Merge auth user and db user data
          let finalUser = { ...currentUser, role: 'user', ...userData };

          // ⚡ FORCE ADMIN for Site Owner (Apply AFTER DB fetch) ⚡
          if (currentUser.uid === 'ydj6cFzmgaSemt5XnKA74iDWQwR2') {
            console.log("Auth: Applying Force Admin Override");
            finalUser.role = 'admin';
          }

          setUser(finalUser);
        } catch (error) {
          console.error("Auth: Error fetching user data", error);
          // Fallback if DB fails completely
          const fallbackUser = { ...currentUser, role: currentUser.uid === 'ydj6cFzmgaSemt5XnKA74iDWQwR2' ? 'admin' : 'user' };
          setUser(fallbackUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const register = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const googleSignIn = () => {
    return signInWithPopup(auth, googleProvider);
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, googleSignIn, resetPassword, loading, stats, updateStats }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
