import { useState, useEffect } from 'react';

function WelcomePopup({ onClose, onLogin }) {
  const [isVisible, setIsVisible] = useState(true);

  // Close popup when ESC key is pressed
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Add a small delay before calling onClose to allow animation to complete
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div className="welcome-popup-overlay" onClick={handleClose}>
      <div className="welcome-popup" onClick={(e) => e.stopPropagation()}>
        <button className="welcome-popup-close" onClick={handleClose}>×</button>
        
        <div className="welcome-popup-content">
          <h2>👋 Velkommen til <strong>TimeSculpt</strong></h2>
          
          <div className="welcome-popup-section">
            <h3>🚀 <strong>Slik kommer du i gang:</strong></h3>
            <ol>
              <li>Klikk på <strong>+ Ny</strong> i toppmenyen</li>
              <li>Gi tidslinjen en <strong>tittel</strong>, og velg <strong>start- og sluttdato</strong></li>
              <li><strong>Lag hendelser</strong> på menyen til venstre og plasser dem på tidslinjen</li>
              <li><strong>Logg inn</strong> for å lagre arbeidet ditt</li>
            </ol>
          </div>
          
          <div className="welcome-popup-section">
            <p>Trenger du hjelp? Sjekk ut <a href="https://support.timesculpt.no/tutorials" target="_blank" rel="noopener noreferrer">videoguidene våre</a> eller <a href="mailto:timesculpt.post@gmail.com">ta kontakt med oss</a> direkte!⏳💫</p>
          </div>
          
          <div className="welcome-popup-buttons">
            <button className="welcome-popup-button primary" onClick={onLogin}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              Logg inn
            </button>
            <button className="welcome-popup-button secondary" onClick={handleClose}>
              Kom i gang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WelcomePopup;