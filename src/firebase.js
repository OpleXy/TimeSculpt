// src/firebase.js
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  updatePassword,
  updateProfile
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // Add Storage import

const firebaseConfig = {
    apiKey: "AIzaSyCXIIMOjxdjNo4g9A9SVSWENvrXfLv4fyw",
    authDomain: "timesculpt.firebaseapp.com",
    projectId: "timesculpt",
    storageBucket: "timesculpt.firebasestorage.app",
    messagingSenderId: "735883966282",
    appId: "1:735883966282:web:b41f5b9d621725f81073b3",
    measurementId: "G-G3LYZ751DS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // Initialize Storage

// IMPORTANT: The URL here must be whitelisted in the Firebase Console
// Go to: Authentication > Settings > Authorized domains and add your domain
const actionCodeSettings = {
  // URL you want to redirect back to. Must be whitelisted in Firebase Console
  url: window.location.origin + '/auth-complete',
  // This must be true for email link sign-in
  handleCodeInApp: true,
  // Optional iOS settings - remove if not needed
  iOS: {
    bundleId: 'com.yourdomain.app'
  },
  // Optional Android settings - remove if not needed
  android: {
    packageName: 'com.yourdomain.app',
    installApp: true,
    minimumVersion: '12'
  }
};

// OAuth Providers
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

const facebookProvider = new FacebookAuthProvider();
facebookProvider.setCustomParameters({
  'display': 'popup'
});

const microsoftProvider = new OAuthProvider('microsoft.com');
microsoftProvider.setCustomParameters({
  prompt: 'consent',
  tenant: 'common'
});

const appleProvider = new OAuthProvider('apple.com');

// Authentication functions
export const signInWithGoogle = () => {
  return signInWithPopup(auth, googleProvider);
};

export const signInWithFacebook = () => {
  return signInWithPopup(auth, facebookProvider);
};

export const signInWithMicrosoft = () => {
  return signInWithPopup(auth, microsoftProvider);
};

export const signInWithApple = () => {
  return signInWithPopup(auth, appleProvider);
};

// Send registration link via email
export const sendRegistrationLink = async (email, displayName) => {
  try {
    // Store the email and display name locally
    localStorage.setItem('emailForSignUp', email);
    if (displayName) {
      localStorage.setItem('displayNameForSignUp', displayName);
    }
    
    // Send the registration link to the email
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    
    return {
      success: true,
      message: 'En registreringslenke er sendt til din e-post. Klikk på lenken for å fullføre registreringen.'
    };
  } catch (error) {
    console.error('Error sending registration link:', error);
    throw error;
  }
};

// Store password temporarily
export const storePasswordTemporarily = (email, password) => {
  try {
    // Store password temporarily in local storage with email as key
    const encodedPassword = btoa(password); // Simple base64 encoding (not secure for production)
    localStorage.setItem(`pw_temp_${email}`, encodedPassword);
    
    // Set expiry time (24 hours)
    const expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000);
    localStorage.setItem(`pw_temp_${email}_expiry`, expiryTime.toString());
    
    return true;
  } catch (err) {
    console.error('Error storing password temporarily', err);
    return false;
  }
};

// Retrieve stored password
export const getStoredPassword = (email) => {
  try {
    const encodedPassword = localStorage.getItem(`pw_temp_${email}`);
    if (!encodedPassword) return null;
    
    // Check if expired
    const expiryTime = parseInt(localStorage.getItem(`pw_temp_${email}_expiry`) || '0');
    if (expiryTime && new Date().getTime() > expiryTime) {
      // Clear expired items
      localStorage.removeItem(`pw_temp_${email}`);
      localStorage.removeItem(`pw_temp_${email}_expiry`);
      return null;
    }
    
    // Decode password
    const password = atob(encodedPassword);
    return password;
  } catch (err) {
    console.error('Error retrieving stored password', err);
    return null;
  }
};

// Clear stored password
export const clearStoredPassword = (email) => {
  try {
    localStorage.removeItem(`pw_temp_${email}`);
    localStorage.removeItem(`pw_temp_${email}_expiry`);
  } catch (err) {
    console.error('Error clearing stored password', err);
  }
};

// Complete registration process
export const completeRegistration = async () => {
  try {
    // Check if current URL is a sign-in link
    if (!isSignInWithEmailLink(auth, window.location.href)) {
      throw new Error('Ikke en gyldig registreringslenke');
    }
    
    // Get the email from localStorage
    let email = localStorage.getItem('emailForSignUp');
    if (!email) {
      // If no email in storage, we need to ask the user
      throw new Error('E-post mangler. Vennligst oppgi e-postadressen du registrerte deg med.');
    }
    
    // Get the password from storage
    const password = getStoredPassword(email);
    if (!password) {
      throw new Error('Passord mangler eller er utløpt. Vennligst registrer deg på nytt.');
    }
    
    // Get display name if stored
    const displayName = localStorage.getItem('displayNameForSignUp') || '';
    
    // Sign in with email link - this creates the account if it doesn't exist
    const userCredential = await signInWithEmailLink(auth, email, window.location.href);
    
    // Set the password for the new account
    await updatePassword(userCredential.user, password);
    
    // Set display name if provided
    if (displayName) {
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
    }
    
    // Clean up localStorage
    localStorage.removeItem('emailForSignUp');
    localStorage.removeItem('displayNameForSignUp');
    clearStoredPassword(email);
    
    return {
      success: true,
      user: userCredential.user
    };
  } catch (error) {
    console.error('Error completing registration:', error);
    throw error;
  }
};

// Check if current URL is a registration completion link
export const isRegistrationCompletionLink = () => {
  return isSignInWithEmailLink(auth, window.location.href);
};

// Email and password login
export const loginWithEmail = async (email, password) => {
  try {
    // Sign in with email and password
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Return success
    return {
      success: true,
      user: userCredential.user
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    // Sign out the user
    await signOut(auth);
    console.log('User signed out successfully');
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const authStateListener = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Export Storage instance along with auth and db
export { auth, db, storage };