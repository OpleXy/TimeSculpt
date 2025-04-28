// src/components/auth/AppleSignIn.jsx
import { useState, useEffect } from 'react';
import { signInWithApple } from '../../firebase';

function AppleSignIn({ onClose }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Automatically trigger sign-in when component mounts
  useEffect(() => {
    handleAppleSignIn();
  }, []);

  const handleAppleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithApple();
      onClose(); // Close the modal after successful login
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, not an error
        setError('');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Multiple popups, not an error
        setError('');
      } else {
        setError('Kunne ikke logge inn med Apple. Vennligst prøv igjen senere.');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>Logg inn med Apple</h2>
      
      {error && <div className="auth-error">{error}</div>}
      
      <div className="oauth-signin-container">
        {loading ? (
          <div className="auth-loading">Logger inn med Apple...</div>
        ) : (
          <button 
            onClick={handleAppleSignIn} 
            className="apple-signin-button oauth-signin-button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <path d="M16.496 17.943a5.35 5.35 0 01-.54 1.076 4.93 4.93 0 01-.78.95 1.546 1.546 0 01-1.035.382 2.58 2.58 0 01-.949-.226 2.815 2.815 0 00-1.088-.225 2.9 2.9 0 00-1.127.226 2.424 2.424 0 01-.896.214 1.464 1.464 0 01-1.057-.403 5.168 5.168 0 01-.802-.985 6.614 6.614 0 01-.827-1.663 6.18 6.18 0 01-.315-1.95c0-.736.159-1.371.475-1.899.249-.427.585-.764 1.008-1.01.422-.246.879-.372 1.368-.372.426 0 .789.097 1.081.287.219.137.51.34.88.607.127.097.297.148.51.148.194-.009.364-.06.516-.149.315-.229.581-.411.799-.546.323-.194.704-.298 1.143-.312.606.013 1.13.176 1.572.487a3.256 3.256 0 00-1.95 2.978c.014.817.307 1.511.882 2.08.247.245.524.427.828.546a2.571 2.571 0 01-.403 1.022zm-3.258-14.94c0 .443-.111.857-.33 1.241a3.25 3.25 0 01-.884 1.013 2.88 2.88 0 01-.75.382 3.11 3.11 0 01-.81.132c-.016-.443.1-.873.343-1.292.243-.42.56-.776.951-1.066a3.8 3.8 0 01.757-.442c.252-.103.49-.158.711-.166.011.071.012.132.012.198z" fill="#000"/>
            </svg>
            <span>Prøv igjen</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default AppleSignIn;