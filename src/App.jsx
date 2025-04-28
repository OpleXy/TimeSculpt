import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Timeline from './components/Timeline';
import { useAuth } from './contexts/AuthContext.jsx';
import { useTheme } from './contexts/ThemeContext.jsx';
import AuthModal from './components/auth/AuthModal';
import MobileWarning from './components/MobileWarning';
import WelcomePopup from './components/WelcomePopup';
import { generateTimelineEvents } from './services/aiTimelineService';

import './styles/base.css';
import './styles/timeline.css';
import './styles/ui-components.css';
import './styles/auth.css';
import './styles/topbar.css';
import './styles/pages.css';
import './styles/mobile-warning.css';
import './styles/theme-toggle.css';
import './styles/welcome-popup.css';
import './styles/sidebarinfo.css';
import './styles/event-colors.css';
import './styles/text-to-timeline.css';
import './styles/topbar-timeline-form.css';
import './styles/prompt-processing.css';

function App() {
  const { isAuthenticated, authChanged } = useAuth();
  const { darkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Add state for interval markers
  const [showIntervals, setShowIntervals] = useState(true);
  const [intervalCount, setIntervalCount] = useState(5);
  // Add state for interval type
  const [intervalType, setIntervalType] = useState('even');
  
  // Add state for processing prompt-generated timelines
  const [isProcessingPrompt, setIsProcessingPrompt] = useState(false);
  
  useEffect(() => {
    // Check for timelineId in URL parameters when component mounts
    const searchParams = new URLSearchParams(location.search);
    const timelineId = searchParams.get('timelineId');
    
    if (timelineId) {
      loadSpecificTimeline(timelineId);
    }
  }, [location.search]);

  
  // Add state for tracking unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // Add state for tracking save errors (like reaching limit)
  const [saveError, setSaveError] = useState('');
  // Add state for shortcut notification
  const [shortcutNotification, setShortcutNotification] = useState(null);
  
  const [timelineData, setTimelineData] = useState({
    start: null,
    end: null,
    title: '',
    events: [],
    orientation: 'horizontal',
    backgroundColor: 'white',
    timelineColor: '#007bff',   // Default timeline color
    timelineThickness: 2,       // Default timeline thickness
    // Add interval settings to timeline data
    showIntervals: true,
    intervalCount: 5,
    intervalType: 'even',
    intervalSettings: {
      show: true,
      count: 5,
      type: 'even'
    }
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showWelcomeContent, setShowWelcomeContent] = useState(true);
  const [showWelcomePopup, setShowWelcomePopup] = useState(true); // New state for popup
  const [timelineListRefreshTrigger, setTimelineListRefreshTrigger] = useState(0);

  // Open and close auth modal
  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  // Close welcome popup
  const closeWelcomePopup = () => {
    setShowWelcomePopup(false);
  };

  // Load a specific timeline by ID
  const loadSpecificTimeline = async (timelineId) => {
    try {
      const api = await import('./api');
      const timeline = await api.loadTimeline(timelineId);
      
      if (timeline) {
        setTimelineData(timeline);
        
        // Load interval settings from timeline data if they exist
        if (timeline.intervalSettings) {
          setShowIntervals(timeline.intervalSettings.show);
          setIntervalCount(timeline.intervalSettings.count);
          setIntervalType(timeline.intervalSettings.type || timeline.intervalType || 'even');
        } else {
          // Direct properties as fallback
          if (timeline.showIntervals !== undefined) setShowIntervals(timeline.showIntervals);
          if (timeline.intervalCount !== undefined) setIntervalCount(timeline.intervalCount);
          if (timeline.intervalType !== undefined) setIntervalType(timeline.intervalType);
        }
        
        setShowWelcomeContent(false);
        setShowWelcomePopup(false); // Also hide popup
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Error loading timeline:', error);
      alert(`Kunne ikke laste tidslinjen: ${error.message}`);
    }
  };

  // Reset timeline when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear the timeline data when logged out
      setTimelineData({
        start: null,
        end: null,
        title: '',
        events: [],
        orientation: 'horizontal',
        backgroundColor: 'white',
        timelineColor: '#007bff',   // Default timeline color
        timelineThickness: 2,       // Default timeline thickness
        showIntervals: true,
        intervalCount: 5,
        intervalType: 'even',
        intervalSettings: {
          show: true,
          count: 5,
          type: 'even'
        }
      });
      
      // Reset interval settings
      setShowIntervals(true);
      setIntervalCount(5);
      setIntervalType('even');
      
      // Also reset unsaved changes
      setHasUnsavedChanges(false);
      
      // Set showWelcomeContent to true when logged out
      setShowWelcomeContent(true);
      setShowWelcomePopup(true); // Also show popup
    }
  }, [isAuthenticated, authChanged]);

  // Update welcome content and popup based on authentication status and timeline data
  useEffect(() => {
    if (isAuthenticated) {
      setShowWelcomeContent(false); // Never show welcome content when logged in
      setShowWelcomePopup(false); // Never show popup when logged in
    } else if (timelineData.title && timelineData.start && timelineData.end) {
      setShowWelcomeContent(false); // Hide welcome content if there's an active timeline
      setShowWelcomePopup(false); // Hide popup if there's an active timeline
    } else {
      setShowWelcomeContent(true); // Show welcome content when not logged in and no timeline
      // Keep popup state as is (don't set to true here to prevent it from reappearing)
    }
  }, [isAuthenticated, timelineData]);

  // Add keyboard shortcut for saving (s key)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if 's' key is pressed and the user isn't in a text input or textarea
      if (e.key === 's' && 
          !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) &&
          !document.activeElement.isContentEditable) {
        
        // Prevent the browser's default "Save" action
        e.preventDefault();
        
        // Only trigger save if there are unsaved changes and a timeline exists
        if (hasUnsavedChanges && timelineData.title && timelineData.events.length > 0) {
          saveTimeline();
          
          // Show a brief keyboard shortcut notification
          showShortcutNotification('Lagret med tastatursnarveien (S)');
        }
      }
    };

    // Add the event listener to the window
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasUnsavedChanges, timelineData]);

  // Function to show shortcut notification
  const showShortcutNotification = (message) => {
    setShortcutNotification(message);
    
    // Auto-hide the notification after 2 seconds
    setTimeout(() => {
      setShortcutNotification(null);
    }, 2000);
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Update interval settings - updated to handle type parameter
  const updateIntervalSettings = (show, count, type) => {
    // Update the state
    if (show !== undefined) setShowIntervals(show);
    if (count !== undefined) setIntervalCount(count);
    if (type !== undefined) setIntervalType(type);
    
    // Mark changes as unsaved
    setHasUnsavedChanges(true);
    
    // Update the timeline data with new settings
    setTimelineData(prevData => {
      const newIntervalSettings = {
        show: show !== undefined ? show : prevData.intervalSettings?.show || true,
        count: count !== undefined ? count : prevData.intervalSettings?.count || 5,
        type: type !== undefined ? type : prevData.intervalSettings?.type || 'even'
      };
      
      return {
        ...prevData,
        // Include individual properties for backward compatibility
        showIntervals: newIntervalSettings.show,
        intervalCount: newIntervalSettings.count,
        intervalType: newIntervalSettings.type,
        // Store settings in a single object
        intervalSettings: newIntervalSettings
      };
    });
    
    setSaveError(''); // Clear any save errors
  };
  
  // Create timeline with the provided data
  const createTimeline = async (data) => {
    // Check for unsaved changes before creating new timeline
    if (hasUnsavedChanges) {
      const confirm = window.confirm('Du har ulagrede endringer. Er du sikker på at du vil opprette en ny tidslinje? Ulagrede endringer vil gå tapt.');
      if (!confirm) {
        return; // User cancelled, don't create a new timeline
      }
    }
    
    // Check if this timeline was generated from a prompt and needs events
    if (data.generatedFromPrompt && data.promptText) {
      try {
        setIsProcessingPrompt(true);
        
        // Create the timeline first without events
        const newTimelineData = {
          ...data,
          showIntervals: showIntervals,
          intervalCount: intervalCount,
          intervalType: intervalType,
          intervalSettings: {
            show: showIntervals,
            count: intervalCount,
            type: intervalType
          }
        };
        
        setTimelineData(newTimelineData);
        setShowWelcomeContent(false);
        setShowWelcomePopup(false);
        
        // Now generate events based on the prompt
        const generatedEvents = await generateTimelineEvents(data.promptText, data.start, data.end);
        
        // Add the generated events to the timeline
        setTimelineData(prev => ({
          ...prev,
          events: generatedEvents
        }));
        
        // Mark as having unsaved changes since we've added events
        setHasUnsavedChanges(true);
        setSaveError('');
        
      } catch (error) {
        console.error('Error processing prompt timeline:', error);
        alert('Kunne ikke generere hendelser fra prompten. Tidslinjen er opprettet uten hendelser.');
        
        // Still create the timeline but without events
        const newTimelineData = {
          ...data,
          showIntervals: showIntervals,
          intervalCount: intervalCount,
          intervalType: intervalType,
          intervalSettings: {
            show: showIntervals,
            count: intervalCount,
            type: intervalType
          }
        };
        
        setTimelineData(newTimelineData);
        setShowWelcomeContent(false);
        setShowWelcomePopup(false);
        setHasUnsavedChanges(false);
        
      } finally {
        setIsProcessingPrompt(false);
      }
    } else {
      // Regular timeline creation (original code)
      const newTimelineData = {
        ...data,
        showIntervals: showIntervals,
        intervalCount: intervalCount,
        intervalType: intervalType,
        intervalSettings: {
          show: showIntervals,
          count: intervalCount,
          type: intervalType
        }
      };
      
      setTimelineData(newTimelineData);
      setHasUnsavedChanges(false);
      setShowWelcomeContent(false);
      setShowWelcomePopup(false);
      setSaveError('');
    }
  };

  // Update timeline data (for editing title and dates)
  const updateTimelineData = (updatedTimeline) => {
    // Mark changes as unsaved
    setHasUnsavedChanges(true);
    setTimelineData(updatedTimeline);
    setSaveError(''); // Clear any save errors
  };

  // Add event to the timeline
  const addEvent = (event) => {
    // Mark changes as unsaved
    setHasUnsavedChanges(true);
    setTimelineData(prevData => ({
      ...prevData,
      events: [...prevData.events, event]
    }));
    setSaveError(''); // Clear any save errors
  };
  
  const saveTimeline = async () => {
    try {
      // Basic validation
      if (!timelineData.title || !timelineData.start || !timelineData.end) {
        alert('Vennligst opprett en tidslinje først');
        return;
      }
      
      if (timelineData.events.length === 0) {
        alert('Legg til minst én hendelse i tidslinjen');
        return;
      }
      
      // Make sure interval settings are included in the data as a single object
      const intervalSettings = {
        show: showIntervals,
        count: intervalCount,
        type: intervalType
      };
      
      const dataToSave = {
        ...timelineData,
        // Include individual properties for backward compatibility
        showIntervals: intervalSettings.show,
        intervalCount: intervalSettings.count,
        intervalType: intervalSettings.type,
        // Store settings in a single object
        intervalSettings: intervalSettings
      };
      
      // Import API functions dynamically to avoid circular dependencies
      const api = await import('./api');
      let result;
      
      // Check if timeline already has an ID (it's an existing timeline)
      if (dataToSave.id) {
        // Update existing timeline
        result = await api.updateTimeline(dataToSave.id, dataToSave);
        if (result.success) {
          setHasUnsavedChanges(false); // Reset unsaved changes flag
          setSaveError(''); // Clear any save errors
          
          // Trigger the timeline list to refresh
          setTimelineListRefreshTrigger(prev => prev + 1);
        }
      } else {
        // Create new timeline
        result = await api.saveTimeline(dataToSave);
        if (result.success) {
          // Update the timeline data with the new ID
          setTimelineData(prevData => ({
            ...prevData,
            id: result.timelineId
          }));
          setHasUnsavedChanges(false); // Reset unsaved changes flag
          setSaveError(''); // Clear any save errors
          
          // Update URL with the new timeline ID
          navigate(`/?timelineId=${result.timelineId}`, { replace: true });
          
          // Trigger the timeline list to refresh
          setTimelineListRefreshTrigger(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Feil ved lagring av tidslinje:', error);
      setSaveError(error.message); // Store the error message

      // Check if error is about timeline limit
      if (error.message.includes('grensen på 3 tidslinjer')) {
        alert(`${error.message} Vennligst gå til 'Mine tidslinjer' og slett en tidslinje før du prøver igjen.`);
      } else {
        alert(`Kunne ikke lagre tidslinjen: ${error.message}`);
      }
    }
  };    

  // Load timeline from Firebase with unsaved changes check
  const handleLoadTimeline = (timeline) => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm('Du har ulagrede endringer. Er du sikker på at du vil laste en annen tidslinje? Ulagrede endringer vil gå tapt.');
      if (!confirm) {
        return; // User cancelled, don't load the new timeline
      }
    }
    
    // Load the timeline
    loadTimelineData(timeline);
    
    // Reset unsaved changes flag
    setHasUnsavedChanges(false);
    setSaveError(''); // Clear any save errors
  };
  
  // Load timeline from Firebase (original function)
  const loadTimelineData = (timeline) => {
    // Preserve the ID when loading an existing timeline
    if (timeline && timeline.id) {
      setTimelineData(timeline);
      
      // Load interval settings from timeline data
      if (timeline.intervalSettings) {
        setShowIntervals(timeline.intervalSettings.show);
        setIntervalCount(timeline.intervalSettings.count);
        setIntervalType(timeline.intervalSettings.type || timeline.intervalType || 'even');
      } else {
        // Direct properties as fallback
        if (timeline.showIntervals !== undefined) setShowIntervals(timeline.showIntervals);
        if (timeline.intervalCount !== undefined) setIntervalCount(timeline.intervalCount);
        if (timeline.intervalType !== undefined) setIntervalType(timeline.intervalType);
      }
      
      setShowWelcomeContent(false); // Hide welcome content when a timeline is loaded
      setShowWelcomePopup(false); // Hide welcome popup when a timeline is loaded
      
      // Update URL with the timeline ID
      navigate(`/?timelineId=${timeline.id}`, { replace: true });
    } else {
      console.error('Lastet tidslinje mangler ID');
      setTimelineData(timeline); // Still load but log warning
    }
  };
  
  // Modified timeline data setter to track changes
  const setTimelineDataWithTracking = (newData) => {
    // Mark as having unsaved changes
    setHasUnsavedChanges(true);
    // Update the timeline data
    setTimelineData(newData);
    setSaveError(''); // Clear any save errors
  };

  return (
    <div className="app-container">
      {/* Display welcome popup */}
      {showWelcomePopup && !isAuthenticated && (
        <WelcomePopup onClose={closeWelcomePopup} onLogin={openAuthModal} />
      )}
      
      {/* Add the Mobile Warning Component */}
      <MobileWarning />
      
      <Topbar 
        timelineData={timelineData} 
        onLogin={openAuthModal}
        onLoadTimeline={handleLoadTimeline} // Use the function that checks for unsaved changes
        onCreateTimeline={createTimeline}
        onSaveTimeline={saveTimeline}
        onUpdateTimeline={updateTimelineData}
        hasUnsavedChanges={hasUnsavedChanges}
        saveError={saveError} // Pass save error to show in UI if needed
      />
      
      <main className="main-content main-content-with-topbar">
        <Timeline 
          timelineData={timelineData}
          setTimelineData={setTimelineDataWithTracking} // Use function that tracks changes
          showIntervals={showIntervals}
          intervalCount={intervalCount}
          intervalType={intervalType}
          onUpdateIntervalSettings={updateIntervalSettings}
        />
      </main>

      <Sidebar 
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={toggleSidebar}
        createTimeline={createTimeline}
        addEvent={addEvent}
        saveTimeline={saveTimeline}
        timelineData={timelineData}
        onLogin={openAuthModal}
        onLoadTimeline={handleLoadTimeline}
        hasUnsavedChanges={hasUnsavedChanges} // Pass unsaved changes flag
        showWelcomeContent={false} // Always set to false since we're using popup instead
        saveError={saveError} // Pass save error to display in sidebar
        timelineListRefreshTrigger={timelineListRefreshTrigger}
        // Pass interval settings to sidebar
        showIntervals={showIntervals}
        intervalCount={intervalCount}
        intervalType={intervalType}
        onUpdateIntervalSettings={updateIntervalSettings}
      />

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={closeAuthModal} 
      />
      
      {/* Prompt processing overlay */}
      {isProcessingPrompt && (
        <div className="prompt-processing-overlay">
          <div className="prompt-processing-modal">
            <div className="loading-spinner"></div>
            <h3>Genererer tidslinje...</h3>
            <p>Analyserer tekst og oppretter hendelser basert på prompten din.</p>
          </div>
        </div>
      )}
      
      {/* Shortcut notification toast */}
      {shortcutNotification && (
        <div className="shortcut-notification">
          {shortcutNotification}
        </div>
      )}
    </div>
  );
}

export default App;