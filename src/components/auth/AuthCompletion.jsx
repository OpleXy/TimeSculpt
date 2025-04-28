// src/components/auth/AuthCompletion.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeRegistration, isRegistrationCompletionLink } from '../../firebase';

function AuthCompletion() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const completeAuth = async () => {
      if (!isRegistrationCompletionLink()) {
        setError('Ikke en gyldig registreringslenke.');
        setLoading(false);
        return;
      }

      try {
        const result = await completeRegistration();
        if (result.success) {
          setSuccess(true);
          
          // Redirect to home page after successful registration
          setTimeout(() => {
            navigate('/');
          }, 2000);
        }
      } catch (err) {
        if (err.message) {
          setError(err.message);
        } else {
          setError('Det oppstod en feil under registreringen. Vennligst prøv igjen senere.');
        }
        console.error('Registration completion error:', err);
      } finally {
        setLoading(false);
      }
    };

    completeAuth();
  }, [navigate]);

  return (
    <div className="auth-completion-container">
      <div className="auth-form">
        <h2>Fullfører registrering</h2>
        
        <div className="verification-sent">
          {loading && (
            <>
              <div className="auth-loading">Fullfører registreringen...</div>
              <p>Vennligst vent mens vi setter opp kontoen din.</p>
            </>
          )}
          
          {error && (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              <p className="auth-error">{error}</p>
              <div className="verification-actions">
                <button 
                  onClick={() => navigate('/login')} 
                  className="back-btn"
                >
                  Gå til innlogging
                </button>
              </div>
            </>
          )}
          
          {success && (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <p className="auth-success">Registreringen er fullført! Du er nå logget inn.</p>
              <p>Du blir videresendt til forsiden...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthCompletion;