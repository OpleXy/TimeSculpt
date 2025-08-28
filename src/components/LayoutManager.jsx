import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import WelcomeScreen from './WelcomeScreen';
import '../styles/layout-manager.css';
import '../styles/welcome-screen.css';

/**
 * LayoutManager handles conditional rendering of UI elements based on 
 * authentication status and timeline state.
 * Updated to remove sidebar functionality and show full-width content.
 */
function LayoutManager({ 
  timelineData, 
  onLogin, 
  onCreateTimeline,
  timelineContent, 
  children 
}) {
  const { isAuthenticated, currentUser } = useAuth();
  const [showWelcomeContent, setShowWelcomeContent] = useState(true);
  
  // Determine if there is a valid timeline with basic required fields
  const hasValidTimeline = timelineData && 
                          timelineData.title && 
                          timelineData.start && 
                          timelineData.end;

  useEffect(() => {
    // Update UI display logic when authentication or timeline data changes
    if (hasValidTimeline) {
      // There is an active timeline with required fields
      setShowWelcomeContent(false);
    } else {
      // No active timeline or missing required fields
      setShowWelcomeContent(true);
    }
  }, [hasValidTimeline, timelineData]);

  return (
    <div className="layout-container">
      {/* Main content area - always takes 100% width (no sidebar) */}
      <div className="main-content-area full-width">
        {/* Show welcome screen or timeline content */}
        {showWelcomeContent ? (
          <WelcomeScreen 
            onLogin={onLogin} 
            onCreateTimeline={onCreateTimeline} 
          />
        ) : (
          timelineContent
        )}
        
        {/* Always render children (e.g., Topbar, modals, etc.) */}
        {children}
      </div>
    </div>
  );
}

export default LayoutManager;