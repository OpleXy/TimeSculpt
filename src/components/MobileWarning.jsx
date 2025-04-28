import React, { useState, useEffect } from 'react';

function MobileWarning() {
  const [isMobile, setIsMobile] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  
  useEffect(() => {
    // Check if user is on mobile device
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setShowWarning(mobile);
    };
    
    // Run check on component mount
    checkMobile();
    
    // Add resize event listener
    window.addEventListener('resize', checkMobile);
    
    // Clean up event listener
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close warning function
  const closeWarning = () => {
    setShowWarning(false);
  };

  if (!showWarning) return null;

  return (
    <div className="mobile-warning-overlay">
      <div className="mobile-warning-content">
        <button className="mobile-warning-close" onClick={closeWarning}>×</button>
        <div className="mobile-warning-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <h2>Mobilversjon under utvikling</h2>
        <p>Vi jobber med å optimalisere applikasjonen for mobile enheter. For best mulig opplevelse, vennligst bruk en datamaskin.</p>
        <button className="mobile-warning-button" onClick={closeWarning}>
          Fortsett likevel
        </button>
      </div>
    </div>
  );
}

export default MobileWarning;