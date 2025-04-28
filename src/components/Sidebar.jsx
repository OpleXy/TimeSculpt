import { useState, useEffect, useRef, useCallback } from 'react';
import EventForm from './EventForm';
import TimelineList from './TimelineList';
import TimelineCommandInput from './TimelineCommandInput';
import { useAuth } from '../contexts/AuthContext';
import '../styles/sidebar.css';
import '../styles/timeline-command-input.css';

function Sidebar({ 
  isCollapsed, 
  toggleSidebar, 
  addEvent, 
  saveTimeline, 
  timelineData, 
  onLogin, 
  onLoadTimeline, 
  onCreateTimeline,
  hasUnsavedChanges,
  showWelcomeContent,
  timelineListRefreshTrigger
}) {
  const [showEventInput, setShowEventInput] = useState(false);
  const { isAuthenticated } = useAuth();
  
  // State for resizable sidebar - use a proper initial value calculation
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    // Try to get from localStorage first
    const savedWidth = localStorage.getItem('sidebarWidth');
    if (savedWidth) return parseInt(savedWidth);
    
    // Fall back to CSS variable or default
    try {
      const cssVar = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width');
      return cssVar ? parseInt(cssVar) : 280;
    } catch (e) {
      // Handle case when document is not available (SSR)
      return 280;
    }
  });
  
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);
  const resizerRef = useRef(null);
  
  // Show event form if timeline has title, start and end dates
  useEffect(() => {
    if (timelineData.title && timelineData.start && timelineData.end) {
      setShowEventInput(true);
    } else {
      setShowEventInput(false);
    }
  }, [timelineData]);

  // Define handlers with useCallback to maintain reference stability
  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;
      
    // Calculate new width (respecting min and max values)
    const newWidth = Math.max(250, Math.min(500, e.clientX));
    
    // Update CSS variable for immediate effect
    document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
    
    // Update state
    setSidebarWidth(newWidth);
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    if (!isResizing) return;
    
    setIsResizing(false);
    
    // Save the sidebar width preference to localStorage
    localStorage.setItem('sidebarWidth', sidebarWidth.toString());
  }, [isResizing, sidebarWidth]);

  const handleMouseDown = useCallback((e) => {
    // Prevent any default behavior
    e.preventDefault();
    
    // Set resizing flag
    setIsResizing(true);
  }, []);

  // Set up event listeners
  useEffect(() => {
    // Add global mouse move and up handlers when isResizing is true
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Add a class to the body to prevent text selection during resize
      document.body.classList.add('resize-active');
      
      // Clean up listeners when isResizing changes to false
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.classList.remove('resize-active');
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);
  
  // Set up resizer mousedown listener
  useEffect(() => {
    // Set initial width from state
    document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
    
    // Add mousedown listener to resizer element
    const resizer = resizerRef.current;
    if (resizer) {
      resizer.addEventListener('mousedown', handleMouseDown);
      
      // Clean up listener on component unmount
      return () => {
        resizer.removeEventListener('mousedown', handleMouseDown);
      };
    }
  }, [handleMouseDown, sidebarWidth]);

  // Handle event addition
  const handleEventAdd = (eventData) => {
    addEvent(eventData);
  };

  // Handle save button click
  const handleSave = () => {
    if (!isAuthenticated) {
      // If not logged in, prompt to login first
      alert('Du må være logget inn for å lagre tidslinjer');
      onLogin();
      return;
    }
    
    // Check if the timeline has all required fields
    if (!timelineData.title || !timelineData.start || !timelineData.end) {
      alert('Vennligst opprett en fullstendig tidslinje først');
      return;
    }
    
    if (timelineData.events.length === 0) {
      alert('Legg til minst én hendelse i tidslinjen');
      return;
    }
    
    // Call the save function from props
    saveTimeline();
  };

  // Icons
  const SaveIcon = () => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="18" 
      height="18" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
      <polyline points="17 21 17 13 7 13 7 21"></polyline>
      <polyline points="7 3 7 8 15 8"></polyline>
    </svg>
  );

  const LoginIcon = () => (
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
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
      <polyline points="10 17 15 12 10 7"/>
      <line x1="15" y1="12" x2="3" y2="12"/>
    </svg>
  );

  const ArrowDownIcon = () => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <polyline points="19 12 12 19 5 12"></polyline>
    </svg>
  );

  const SidebarToggleIcon = () => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="18" 
      height="18" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
    >
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  );

  const DragHandleIcon = () => (
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
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );

  return (
    <nav 
      ref={sidebarRef}
      className={`z-sidebar with-topbar ${isCollapsed ? 'collapsed' : ''} ${isResizing ? 'resizing' : ''}`}
      style={{ width: `${sidebarWidth}px` }}
    >
      <div className="sidebar-content" style={{ overflowY: 'auto', overflowX: 'hidden', height: '100%' }}>
        {/* SECTION 1: New Timeline Guide (Empty State) */}
        {!showEventInput && !isAuthenticated && (
          <div className="new-button-guide">
            <div className="guide-arrow">
              <ArrowDownIcon />
            </div>
            <h4>✨ Kom i gang med din første tidslinje</h4>
            <p>Klikk på <strong>+ Ny</strong>-knappen i toppmenyen for å starte!</p>
          </div>
        )}
        
        {/* SECTION 2: Timeline Creation Tools - Always show when timeline exists */}
        {showEventInput && (
          <>
            {/* Timeline Command Input - Always at the top when a timeline exists */}
            <TimelineCommandInput 
              timelineData={timelineData}
              addEvent={addEvent}
            />
          
            {/* Always show Event Form */}
            <EventForm 
              onAddEvent={handleEventAdd} 
              timelineStart={timelineData.start} 
              timelineEnd={timelineData.end} 
            />
              
            {/* Save button */}
            <button 
              className="save-timeline-btn sidebar-save-btn"
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              title={hasUnsavedChanges ? "Lagre endringer" : "Ingen endringer å lagre"}
            >
              <SaveIcon />
              <span>Lagre</span>
            </button>
          </>
        )}
        
        {/* SECTION 3: User Timelines */}
        {isAuthenticated && (
          <TimelineList 
            onLoadTimeline={onLoadTimeline}
            hasUnsavedChanges={hasUnsavedChanges}
            refreshTrigger={timelineListRefreshTrigger}
          />
        )}
        
        {/* SECTION 4: Login Prompt */}
        {!isAuthenticated && !showEventInput && (
          <div className="sidebar-login-prompt">
            <h4>🔐 Tilgang til dine tidslinjer</h4>
            <p><strong>Logg inn</strong> for å lagre, redigere og komme tilbake til tidslinjene dine når som helst.</p>
            <button 
              className="login-button-sidebar" 
              onClick={onLogin}
            >
              <LoginIcon />
              Logg inn
            </button>
          </div>
        )}
      </div>
      
      {/* Sidebar resizer */}
      <div 
        ref={resizerRef}
        className="sidebar-resizer"
        title="Dra for å endre bredde"
      >
        <DragHandleIcon />
      </div>
      
      {/* Sidebar toggle button */}
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        <SidebarToggleIcon />
      </button>
    </nav>
  );
}

export default Sidebar;