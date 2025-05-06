import { useAuth } from '../contexts/AuthContext';
import '../styles/layout-manager.css';
import '../styles/welcome-screen.css';

/**
 * WelcomeScreen component displays different welcome messages 
 * based on user authentication status
 */
function WelcomeScreen({ onLogin }) {
  const { isAuthenticated, currentUser } = useAuth();

  // Display personalized welcome for authenticated users
  if (isAuthenticated && currentUser) {
    return (
      <div className="welcome-container authenticated">
        <h2>Velkommen tilbake, {currentUser.displayName || 'bruker'}!</h2>
        <p>
          Du kan opprette en ny tidslinje ved å klikke på <strong>+ Ny Tidslinje</strong> knappen i topmenyen,
          eller velge en eksisterende tidslinje fra 
        </p>
        
        <div className="welcome-actions">
          <button className="welcome-create-btn" onClick={() => window.location.href = '/tidslinjer'}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Mitt arkiv
          </button>

<p><strong>eller</strong></p>         
          <button className="welcome-explore-btn" onClick={() => window.location.href = '/utforsk'}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            Utforsk tidslinjer
          </button>
        </div>
      </div>
    );
  }
  
  // Display welcome message for guests
  return (
    <div className="welcome-container guest">
      <div className="welcome-content">
        <h3>🚀 <strong>Slik kommer du i gang:</strong></h3>
        <ol>
          <li>Klikk på <strong>+ Ny Tidslinje</strong> i toppmenyen</li>
          <li>Ta i bruk AI</li>
          <li>eller lag den helt selv:
            <ul>
              <li>Gi tidslinjen en tittel, og velg start- og sluttdato</li>
              <li>Lag hendelser på menyen til venstre og plasser dem på tidslinjen</li>
            </ul>
          </li>
          <li><strong>Logg inn</strong> for å lagre arbeidet ditt</li>
        </ol>
      
        <div className="welcome-help-section">
          <p>Trenger du hjelp? Sjekk ut <a href="https://support.timesculpt.no/tutorials" target="_blank" rel="noopener noreferrer">videoguidene våre</a> eller <a href="mailto:timesculpt.post@gmail.com">ta kontakt med oss</a> direkte!⏳💫</p>
        </div>
      </div>
      
      <div className="welcome-actions">
       
      </div>
    </div>
  );
}

export default WelcomeScreen;