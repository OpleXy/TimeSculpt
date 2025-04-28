// src/components/auth/FacebookSignIn.jsx
import { useState, useEffect } from 'react';
import { signInWithFacebook } from '../../firebase';

function FacebookSignIn({ onClose }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Automatically trigger sign-in when component mounts
  useEffect(() => {
    handleFacebookSignIn();
  }, []);

  const handleFacebookSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithFacebook();
      onClose(); // Close the modal after successful login
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, not an error
        setError('');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Multiple popups, not an error
        setError('');
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        setError('Denne e-postadressen er allerede knyttet til en annen konto. Prøv å logge inn med en annen metode.');
      } else {
        setError('Kunne ikke logge inn med Facebook. Vennligst prøv igjen senere.');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>Logg inn med Facebook</h2>
      
      {error && <div className="auth-error">{error}</div>}
      
      <div className="oauth-signin-container">
        {loading ? (
          <div className="auth-loading">Logger inn med Facebook...</div>
        ) : (
          <button 
            onClick={handleFacebookSignIn} 
            className="facebook-signin-button oauth-signin-button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <path fill="#1877F2" d="M20.007,3H3.993C3.445,3,3,3.445,3,3.993v16.013C3,20.555,3.445,21,3.993,21h8.621v-6.971h-2.346v-2.717h2.346V9.31c0-2.325,1.42-3.591,3.494-3.591c0.993,0,1.847,0.074,2.096,0.107v2.43l-1.438,0.001c-1.128,0-1.346,0.536-1.346,1.323v1.734h2.69l-0.35,2.717h-2.34V21h4.587C20.555,21,21,20.555,21,20.007V3.993C21,3.445,20.555,3,20.007,3z" />
            </svg>
            <span>Prøv igjen</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default FacebookSignIn;