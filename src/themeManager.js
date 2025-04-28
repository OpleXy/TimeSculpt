// src/themeManager.js
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

/**
 * Theme Manager for handling user theme preferences
 * Saves theme preferences to Firestore when user is logged in
 */

// Collection reference
const USERS_COLLECTION = 'users';

/**
 * Get user theme preference from Firestore
 * @param {string} userId - User's ID
 * @returns {Promise<boolean|null>} - Theme preference (true for dark, false for light, or null)
 */
export const getUserThemePreference = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      // Return the darkMode setting if it exists, otherwise null
      return userData.darkMode !== undefined ? userData.darkMode : null;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user theme preference:', error);
    return null;
  }
};

/**
 * Save user theme preference to Firestore
 * @param {string} userId - User's ID
 * @param {boolean} darkMode - Theme preference (true for dark, false for light)
 * @returns {Promise<boolean>} - Success status
 */
export const saveUserThemePreference = async (userId, darkMode) => {
  try {
    if (!userId) {
      console.error('Cannot save theme preference: No user ID provided');
      return false;
    }
    
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Update existing user document
      await updateDoc(userRef, {
        darkMode: darkMode,
        updatedAt: new Date()
      });
    } else {
      // Create new user document
      await setDoc(userRef, {
        userId: userId,
        darkMode: darkMode,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error saving user theme preference:', error);
    return false;
  }
};