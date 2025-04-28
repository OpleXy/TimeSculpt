import { db, auth } from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';

// Collection references
const USERS_COLLECTION = 'users';

/**
 * Get user profile from Firestore
 * @param {string} userId - User's ID (optional, defaults to current user)
 * @returns {Promise<Object|null>} User data or null if not found
 */
export const getUserProfile = async (userId = null) => {
  try {
    // If no userId provided, use the current user
    if (!userId) {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('getUserProfile: No authenticated user');
        return null;
      }
      userId = currentUser.uid;
    }

    console.log(`getUserProfile: Getting profile for user ${userId}`);

    // Get user document from Firestore
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      console.log('getUserProfile: User document exists');
      return {
        id: userDoc.id,
        ...userDoc.data()
      };
    }
    
    console.log('getUserProfile: User document does not exist');
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Update or create user profile in Firestore
 * @param {Object} userData - User data to update
 * @param {string} userId - User's ID (optional, defaults to current user)
 * @returns {Promise<Object>} Response indicating success
 */
export const updateUserProfile = async (userData, userId = null) => {
  try {
    // If no userId provided, use the current user
    if (!userId) {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('updateUserProfile: No authenticated user');
        throw new Error('No authenticated user');
      }
      userId = currentUser.uid;
    }

    console.log(`updateUserProfile: Updating profile for user ${userId}`, userData);

    // Reference to the user document
    const userRef = doc(db, USERS_COLLECTION, userId);
    
    // Check if the user document exists
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      console.log('updateUserProfile: User document exists, updating');
      // Update existing user document
      await updateDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp()
      });
    } else {
      console.log('updateUserProfile: User document does not exist, creating');
      // Create new user document
      await setDoc(userRef, {
        ...userData,
        userId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    console.log('updateUserProfile: Update successful');
    return {
      success: true,
      userId
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Update user theme preference in Firestore
 * @param {boolean} darkMode - Theme preference (true for dark, false for light)
 * @param {string} userId - User's ID (optional, defaults to current user)
 * @returns {Promise<Object>} Response indicating success
 */
export const updateUserTheme = async (darkMode, userId = null) => {
  try {
    console.log(`updateUserTheme: Setting theme to ${darkMode} for user ${userId || 'current user'}`);
    return await updateUserProfile({ darkMode }, userId);
  } catch (error) {
    console.error('Error updating user theme:', error);
    throw error;
  }
};

export default {
  getUserProfile,
  updateUserProfile,
  updateUserTheme
};