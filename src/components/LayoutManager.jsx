import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import WelcomeScreen from './WelcomeScreen';
import '../styles/layout-manager.css';
import '../styles/welcome-screen.css';

/**
 * LayoutManager handles conditional rendering of UI elements based on 
 * authentication status and timeline state.
 * Updated to always show sidebar when a timeline exists with required fields.
 */
function LayoutManager({ 
  timelineData, 
  onLogin, 
  onCreateTimeline, // <-- Denne må være i parameterlisten
  isSidebarCollapsed, 
  sidebar, 
  timelineContent, 
  children 
}) {
  const { isAuthenticated, currentUser } = useAuth();
  const [showSidebar, setShowSidebar] = useState(false);
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
      
      // Always show sidebar for valid timelines, regardless of edit permissions
      // This ensures editing tools appear immediately when creating a new timeline
      setShowSidebar(true);
    } else {
      // No active timeline or missing required fields
      setShowWelcomeContent(true);
      setShowSidebar(false);
    }
  }, [hasValidTimeline, timelineData]);

  return (
    <div className="layout-container">
      {/* Conditional sidebar - shown whenever there's a valid timeline */}
      {showSidebar && sidebar}
      
      {/* Main content area - always takes 100% width */}
      <div 
        className={`main-content-area ${showSidebar ? 'with-sidebar' : 'full-width'} ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}
      >
        {/* Show welcome screen or timeline content */}
        {showWelcomeContent ? (
          <WelcomeScreen 
          onLogin={onLogin} 
          onCreateTimeline={onCreateTimeline} />
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