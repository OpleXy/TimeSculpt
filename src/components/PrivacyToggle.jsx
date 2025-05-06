// src/components/PrivacyToggle.jsx
import { useState, useEffect } from 'react';
import { updateTimelinePrivacy } from '../api';
import { useAuth } from '../contexts/AuthContext';

/**
 * A reusable privacy toggle component that displays a switch for public/private
 * status and handles the state update
 */
function PrivacyToggle({ timelineId, isPublic, onChange, className = '' }) {
  const [isPublicState, setIsPublicState] = useState(isPublic || false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();
  
  // Update local state when prop changes
  useEffect(() => {
    setIsPublicState(isPublic || false);
  }, [isPublic]);
  
  const togglePrivacy = async () => {
    if (!isAuthenticated) {
      setError('Du må være logget inn for å endre personverninnstillingene');
      return;
    }
    
    if (!timelineId) {
      setError('Tidslinjen må lagres før du kan endre personverninnstillingene');
      return;
    }
    
    try {
      setIsUpdating(true);
      setError('');
      
      const newPrivacyState = !isPublicState;
      const result = await updateTimelinePrivacy(timelineId, newPrivacyState);
      
      if (result.success) {
        setIsPublicState(newPrivacyState);
        
        // Call the onChange callback if provided
        if (onChange) {
          onChange(newPrivacyState);
        }
      }
    } catch (err) {
      console.error('Error updating privacy settings:', err);
      setError('Kunne ikke oppdatere personverninnstillingene. Prøv igjen senere.');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Globe icon for public
  const GlobeIcon = () => (
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
      style={{ marginRight: '8px' }}
    >
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
  );
  
  // Lock icon for private
  const LockIcon = () => (
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
      style={{ marginRight: '8px' }}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );
  
  return (
    <div className={`privacy-toggle-container ${className}`}>
      <div className="privacy-toggle">
        <label className="privacy-toggle-label">
          <span className="privacy-status">
            {isPublicState ? (
              <><GlobeIcon /> Offentlig</>
            ) : (
              <><LockIcon /> Privat</>
            )}
          </span>
          <span className="toggle-switch">
            <input
              type="checkbox"
              checked={isPublicState}
              onChange={togglePrivacy}
              disabled={isUpdating || !timelineId}
            />
            <span className="slider"></span>
          </span>
        </label>
      </div>
      
      {error && <div className="privacy-toggle-error">{error}</div>}
      
      <div className="privacy-info">
        {isPublicState ? (
          <p>Offentlig: Alle kan se denne tidslinjen via en delt lenke</p>
        ) : (
          <p>Privat: Bare du kan se denne tidslinjen</p>
        )}
      </div>
    </div>
  );
}

export default PrivacyToggle;