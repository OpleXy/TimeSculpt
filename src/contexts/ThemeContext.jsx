import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import { getUserProfile, updateUserTheme } from '../userAPI';

// Create a context for theme management
const ThemeContext = createContext();

// Default theme when no user is logged in
const DEFAULT_THEME = false; // false = light mode

export const ThemeProvider = ({ children }) => {
  const { currentUser, isAuthenticated, authChanged } = useAuth();
  
  // Initialize with default theme
  const [darkMode, setDarkMode] = useState(DEFAULT_THEME);
  
  // Track if preference has been synced from Firebase
  const [synced, setSynced] = useState(false);
  
  // Add a state to track pending theme updates
  const [pendingUpdate, setPendingUpdate] = useState(null);

  // First priority: Load user theme from Firebase when authentication changes
  useEffect(() => {
    const loadUserTheme = async () => {
      if (isAuthenticated && currentUser) {
        try {
          console.log('Loading theme for user:', currentUser.uid);
          const userProfile = await getUserProfile();
          
          if (userProfile && userProfile.darkMode !== undefined) {
            console.log('Found user theme preference:', userProfile.darkMode);
            setDarkMode(userProfile.darkMode);
          } else {
            console.log('No saved theme preference found for user');
          }
          
          // Mark as synced
          setSynced(true);
          
          // Apply any pending update that came in while we were syncing
          if (pendingUpdate !== null) {
            console.log('Applying pending theme update:', pendingUpdate);
            saveThemeToFirebase(pendingUpdate);
            setPendingUpdate(null);
          }
        } catch (error) {
          console.error('Error loading user theme preference:', error);
          setSynced(true); // Still mark as synced to avoid infinite loop
        }
      } else {
        // If no user is authenticated, reset to default theme
        console.log('No authenticated user, resetting to default theme');
        setDarkMode(DEFAULT_THEME);
        setSynced(false);
      }
    };
    
    loadUserTheme();
  }, [isAuthenticated, currentUser, authChanged]);

  // Apply theme class to body whenever darkMode changes
  useEffect(() => {
    // Apply or remove dark-mode class from document body
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);
  
  // Function to save theme to Firebase
  const saveThemeToFirebase = async (themeValue) => {
    if (isAuthenticated && currentUser) {
      try {
        console.log('Saving theme to Firebase:', themeValue);
        await updateUserTheme(themeValue, currentUser.uid);
        console.log('Theme saved successfully');
      } catch (error) {
        console.error('Error saving theme to Firebase:', error);
      }
    }
  };

  // Toggle dark mode function - now with improved Firebase saving
  const toggleDarkMode = () => {
    setDarkMode(prevMode => {
      const newMode = !prevMode;
      
      // If synced with Firebase, save immediately
      if (isAuthenticated && currentUser && synced) {
        saveThemeToFirebase(newMode);
      } 
      // If not yet synced, queue the update
      else if (isAuthenticated && currentUser) {
        console.log('Queuing theme update for when sync completes:', newMode);
        setPendingUpdate(newMode);
      }
      
      return newMode;
    });
  };

  // Debug info to help troubleshoot
  console.log('ThemeContext state:', { 
    darkMode, 
    synced, 
    isAuthenticated, 
    hasCurrentUser: !!currentUser,
    pendingUpdate 
  });

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, synced }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;