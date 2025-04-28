import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { setDocumentTitle } from '../services/documentTitleService'; // Import the service

function NotFound() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);
  const [showRickroll, setShowRickroll] = useState(false);
  
  // Set document title when component mounts
  useEffect(() => {
    setDocumentTitle('Side ikke funnet');
  }, []);
  
  // Automatically redirect to home page after 10 seconds
  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      navigate('/', { replace: true });
    }, 10000);
    
    // Handle countdown
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) clearInterval(countdownInterval);
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearTimeout(redirectTimer);
      clearInterval(countdownInterval);
    };
  }, [navigate]);

  // Handle rickroll
  const handleRickroll = (e) => {
    e.preventDefault();
    setShowRickroll(true);
    setTimeout(() => {
      window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    }, 500);
  };

  return (
    <Layout>
      <div className="page-fullwidth-container">
        <div className="not-found-container">
          <div className="not-found-content">
            <h1>😕 404</h1>
            <h2>Oisann!</h2>
            <p><strong>Siden finnes ikke.</strong> Vi fant ikke det du lette etter.</p>
            <p>Du blir sendt tilbake til forsiden om <strong>{countdown} sekunder</strong> – eller du kan trykke på knappen under for å gå dit med én gang.</p>
            
            {showRickroll ? (
              <p className="loading-redirect">Omdirigerer...</p>
            ) : (
              <div className="not-found-actions">
                <button 
                  className="go-home-btn"
                  onClick={() => navigate('/')}
                >
                  🔙 Gå til forsiden
                </button>
                <button 
                  className="find-page-btn"
                  onClick={handleRickroll}
                >
                  🔍 Hjelp meg å finne siden
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default NotFound;