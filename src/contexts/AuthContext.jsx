// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { auth, authStateListener } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Add a state to track authentication changes for external components
  const [authChanged, setAuthChanged] = useState(false);

  useEffect(() => {
    const unsubscribe = authStateListener((user) => {
      // Detect if auth state changed (login/logout)
      const isAuthStateChanged = !!currentUser !== !!user;
      setCurrentUser(user);
      setLoading(false);
      
      // Notify components when auth state changes
      if (isAuthStateChanged) {
        setAuthChanged(!authChanged);
      }
    });

    return unsubscribe;
  }, [currentUser, authChanged]);

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    authChanged,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}