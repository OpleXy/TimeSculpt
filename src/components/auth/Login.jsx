// src/components/auth/Login.jsx
import { useState } from 'react';
import { loginWithEmail, sendRegistrationLink } from '../../firebase';

function Login({ onClose, switchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await loginWithEmail(email, password);
      onClose(); // Close the modal after successful login
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Feil e-post eller passord. Vennligst prøv igjen.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('For mange forsøk. Prøv igjen senere.');
      } else if (err.code === 'auth/user-disabled') {
        setError('Denne kontoen er deaktivert.');
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        // User might have registered with a different method
        setError('Denne e-postadressen er allerede i bruk med en annen innloggingsmetode.');
      } else {
        setError('Kunne ikke logge inn. Sjekk e-post og passord.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setResendLoading(true);
      await sendRegistrationLink(email);
      setResendSuccess(true);
    } catch (err) {
      console.error('Error resending verification:', err);
      setError('Kunne ikke sende ny bekreftelseslenke. Vennligst prøv igjen senere.');
    } finally {
      setResendLoading(false);
    }
  };

  // Show verification needed message
  if (needsVerification) {
    return (
      <div className="auth-form">
        <h2>E-postbekreftelse nødvendig</h2>
        
        <div className="verification-sent">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          
          <p className="verification-message">
            Du må bekrefte e-postadressen din før du kan logge inn.
          </p>
          
          <p className="verification-note">
            Vi har sendt en e-post til <strong>{email}</strong> med en bekreftelseslenke.
            Klikk på lenken i e-posten for å bekrefte e-postadressen din og aktiver kontoen.
          </p>
          
          {resendSuccess ? (
            <div className="auth-success">
              Ny bekreftelseslenke er sendt! Sjekk e-posten din.
            </div>
          ) : (
            <div className="verification-actions">
              <button 
                onClick={handleResendVerification} 
                className="resend-btn"
                disabled={resendLoading}
              >
                {resendLoading ? 'Sender...' : 'Send ny bekreftelseslenke'}
              </button>
              
              <button 
                onClick={() => setNeedsVerification(false)} 
                className="back-btn"
              >
                Tilbake til innlogging
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <h2>Logg inn med e-post</h2>
      
      {error && <div className="auth-error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">E-post</label>
          <input 
            id="email"
            type="email" 
            placeholder="Din e-post" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Passord</label>
          <input 
            id="password"
            type="password" 
            placeholder="Ditt passord" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </div>
        
        <button type="submit" disabled={loading} className="auth-submit-btn">
          {loading ? 'Logger inn...' : 'Logg inn'}
        </button>
      </form>
      
      <div className="auth-footer">
        Har du ikke en konto? <button onClick={switchToRegister} className="auth-link">Registrer deg</button>
      </div>
    </div>
  );
}

export default Login;