// src/components/auth/Register.jsx
import { useState } from 'react';
import { sendRegistrationLink, storePasswordTemporarily } from '../../firebase';

function Register({ onClose, switchToLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setError('Passordene matcher ikke');
    }
    
    if (password.length < 6) {
      return setError('Passordet må være minst 6 tegn');
    }
    
    try {
      setError('');
      setLoading(true);
      
      // Store password temporarily for use after email verification
      storePasswordTemporarily(email, password);
      
      // Send registration link
      const result = await sendRegistrationLink(email);
      
      if (result.success) {
        setVerificationSent(true);
        setVerificationMessage(result.message);
      }
    } catch (err) {
      // Improved error handling with specific messages for different error codes
      if (err.code === 'auth/quota-exceeded') {
        setError('Vi har nådd vår dagskvote for å sende e-poster. Vennligst prøv igjen senere eller bruk en annen innloggingsmetode.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Ugyldig e-postadresse');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('E-postadressen er allerede i bruk');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('E-postlenke-innlogging er ikke aktivert i Firebase Console. Kontakt administrator.');
      } else if (err.code === 'auth/unauthorized-continue-uri') {
        setError('Domenet ditt er ikke godkjent i Firebase Console. Kontakt administrator.');
      } else {
        setError('Kunne ikke sende registreringslenke. Vennligst prøv igjen senere.');
        console.error('Error sending registration link:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  // If verification sent, show verification message
  if (verificationSent) {
    return (
      <div className="auth-form">
        <h2>Bekreft e-postadressen din</h2>
        
        <div className="verification-sent">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          
          <p className="verification-message">{verificationMessage}</p>
          
          <p className="verification-note">
            Vi har sendt en e-post til <strong>{email}</strong> med en lenke for å fullføre registreringen din.
            Klikk på lenken for å opprette kontoen din.
          </p>
          
          <p className="verification-note">
            Hvis du ikke finner e-posten i innboksen din, sjekk spam-mappen din.
            Lenken er gyldig i 24 timer.
          </p>
          
          <div className="verification-actions">
            <button 
              onClick={switchToLogin} 
              className="back-btn"
            >
              Gå til innlogging
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <h2>Registrer en konto</h2>
      
      {error && <div className="auth-error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="register-email">E-post</label>
          <input 
            id="register-email"
            type="email" 
            placeholder="Din e-post" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="register-password">Passord</label>
          <input 
            id="register-password"
            type="password" 
            placeholder="Minst 6 tegn" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="register-confirm-password">Bekreft passord</label>
          <input 
            id="register-confirm-password"
            type="password" 
            placeholder="Gjenta passord" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required 
          />
        </div>
        
        <button type="submit" disabled={loading} className="auth-submit-btn">
          {loading ? 'Sender...' : 'Opprett konto'}
        </button>
      </form>
      
      <div className="auth-footer">
        Har du allerede en konto? <button onClick={switchToLogin} className="auth-link">Logg inn</button>
      </div>
    </div>
  );
}

export default Register;