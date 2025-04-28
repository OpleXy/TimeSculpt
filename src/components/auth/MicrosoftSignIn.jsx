// src/components/auth/MicrosoftSignIn.jsx
import { useState, useEffect } from 'react';
import { signInWithMicrosoft } from '../../firebase';

function MicrosoftSignIn({ onClose }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Automatically trigger sign-in when component mounts
  useEffect(() => {
    handleMicrosoftSignIn();
  }, []);

  const handleMicrosoftSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithMicrosoft();
      onClose(); // Close the modal after successful login
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, not an error
        setError('');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Multiple popups, not an error
        setError('');
      } else {
        setError('Kunne ikke logge inn med Microsoft. Vennligst prøv igjen senere.');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>Logg inn med Microsoft</h2>
      
      {error && <div className="auth-error">{error}</div>}
      
      <div className="oauth-signin-container">
        {loading ? (
          <div className="auth-loading">Logger inn med Microsoft...</div>
        ) : (
          <button 
            onClick={handleMicrosoftSignIn} 
            className="microsoft-signin-button oauth-signin-button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 23 23">
              <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
              <path fill="#f35325" d="M1 1h10v10H1z"/>
              <path fill="#81bc06" d="M12 1h10v10H12z"/>
              <path fill="#05a6f0" d="M1 12h10v10H1z"/>
              <path fill="#ffba08" d="M12 12h10v10H12z"/>
            </svg>
            <span>Prøv igjen</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default MicrosoftSignIn;