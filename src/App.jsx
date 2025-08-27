import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Timeline from './components/Timeline';
import LayoutManager from './components/LayoutManager';
import { useAuth } from './contexts/AuthContext.jsx';
import { useTheme } from './contexts/ThemeContext.jsx';
import AuthModal from './components/auth/AuthModal';
import MobileWarning from './components/MobileWarning';
import useAutoSave from './hooks/useAutoSave'; // Import the new hook

import { generateTimelineEvents } from './services/aiTimelineService';

// Import styles
import './styles/base.css';
import './styles/timeline.css';
import './styles/ui-components.css';
import './styles/auth.css';
import './styles/topbar.css';
import './styles/mobile-warning.css';
import './styles/theme-toggle.css';

import './styles/sidebarinfo.css';
import './styles/event-colors.css';
import './styles/text-to-timeline.css';
import './styles/topbar-timeline-form.css';
import './styles/prompt-processing.css';
import './styles/privacy-toggle.css';
import './styles/topbar-privacy.css';
import './styles/layout-manager.css';
import './styles/welcome-screen.css';
import './styles/EventContextMenu.css';  // Add this line

function App() {
  const { isAuthenticated, authChanged, currentUser, logOut } = useAuth();
  const { darkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Add state for interval markers
  const [showIntervals, setShowIntervals] = useState(true);
  const [intervalCount, setIntervalCount] = useState(5);
  const [intervalType, setIntervalType] = useState('even');
  
  // Add state for processing prompt-generated timelines
  const [isProcessingPrompt, setIsProcessingPrompt] = useState(false);
  
  // Add state for privacy setting
  const [isPublic, setIsPublic] = useState(false);
  
  // Auto-save states
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Add state for tracking save errors (like reaching limit)
  const [saveError, setSaveError] = useState('');
  
  // Add state for shortcut notification
  const [shortcutNotification, setShortcutNotification] = useState(null);
  
  // State for copied URL notification
  const [showCopiedNotification, setShowCopiedNotification] = useState(false);
  
  // Set this to false to disable the welcome popup
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  
  // State for timeline list refresh trigger
  const [timelineListRefreshTrigger, setTimelineListRefreshTrigger] = useState(0);
  
  const [timelineData, setTimelineData] = useState({
    start: null,
    end: null,
    title: '',
    events: [],
    orientation: 'horizontal',
    backgroundColor: 'white',
    timelineColor: '#007bff',
    timelineThickness: 2,
    showIntervals: true,
    intervalCount: 5,
    intervalType: 'even',
    intervalSettings: {
      show: true,
      count: 5,
      type: 'even'
    },
    isPublic: false
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Auto-save function
  const autoSaveTimeline = async (data) => {
    // Don't save if there's no meaningful data or if it's not saved initially
    if (!data || !data.title || !data.id || data.events.length === 0) {
      return;
    }

    try {
      setIsSaving(true);
      
      // Make sure interval settings are included
      const intervalSettings = {
        show: showIntervals,
        count: intervalCount,
        type: intervalType
      };
      
      const dataToSave = {
        ...data,
        showIntervals: intervalSettings.show,
        intervalCount: intervalSettings.count,
        intervalType: intervalSettings.type,
        intervalSettings: intervalSettings,
        isPublic: isPublic
      };
      
      // Import API functions dynamically
      const api = await import('./api');
      const result = await api.updateTimeline(dataToSave.id, dataToSave);
      
      if (result.success) {
        setLastSaved(Date.now());
        setHasUnsavedChanges(false);
        setSaveError('');
        console.log('Auto-saved timeline at:', new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveError(error.message);
      setHasUnsavedChanges(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Set up auto-save with dependencies that should trigger saving
  useAutoSave(
    timelineData, 
    autoSaveTimeline, 
    2000, // 2 second delay
    [
      timelineData?.events, 
      timelineData?.title, 
      timelineData?.start, 
      timelineData?.end,
      showIntervals,
      intervalCount,
      intervalType,
      isPublic
    ]
  );

  // Check for timelineId in URL parameters when component mounts
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const timelineId = searchParams.get('timelineId');
    
    if (timelineId) {
      loadSpecificTimeline(timelineId);
    }
  }, [location.search]);

  // Open and close auth modal
  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  // Close welcome popup
  const closeWelcomePopup = () => {
    setShowWelcomePopup(false);
  };

  // Handle logout
  const handleLogout = async () => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm('Du har ulagrede endringer som lagres automatisk. Er du sikker på at du vil logge ut?');
      if (!confirm) {
        return;
      }
    }
    
    try {
      await logOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
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
        
        // Set privacy setting
        setIsPublic(timeline.isPublic || false);
        
        // Ensure welcome popup is hidden when timeline is loaded
        setShowWelcomePopup(false);
        setHasUnsavedChanges(false);
        
        // Set last saved time if available
        if (timeline.updatedAt) {
          setLastSaved(new Date(timeline.updatedAt).getTime());
        }
      }
    } catch (error) {
      console.error('Error loading timeline:', error);
      alert(`Kunne ikke laste tidslinjen: ${error.message}`);
      // If error is about private timeline, navigate to home
      if (error.message.includes('privat')) {
        navigate('/');
      }
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
        timelineColor: '#007bff',
        timelineThickness: 2,
        showIntervals: true,
        intervalCount: 5,
        intervalType: 'even',
        intervalSettings: {
          show: true,
          count: 5,
          type: 'even'
        },
        isPublic: false
      });
      
      // Reset interval settings
      setShowIntervals(true);
      setIntervalCount(5);
      setIntervalType('even');
      
      // Reset privacy setting
      setIsPublic(false);
      
      // Also reset unsaved changes
      setHasUnsavedChanges(false);
      setLastSaved(null);
    }
  }, [isAuthenticated, authChanged]);

  // Update welcome popup based on authentication status and timeline data
  useEffect(() => {
    // Keep welcome popup hidden regardless of state changes
    setShowWelcomePopup(false);
  }, [isAuthenticated, timelineData]);

  // Handle privacy toggle
  const handlePrivacyChange = (isPublicValue) => {
    setIsPublic(isPublicValue);
    setTimelineData(prev => ({
      ...prev,
      isPublic: isPublicValue
    }));
    
    // Mark as having unsaved changes (auto-save will handle it)
    setHasUnsavedChanges(true);
    
    // Show notification about the privacy change
    if (isPublicValue) {
      showShortcutNotification('Tidslinjen er nå offentlig og kan deles');
    } else {
      showShortcutNotification('Tidslinjen er nå privat');
    }
  };

  // Copy share URL to clipboard
  const handleCopyShareUrl = () => {
    if (!timelineData.id) return;
    
    const shareUrl = `${window.location.origin}/?timelineId=${timelineData.id}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setShowCopiedNotification(true);
        setTimeout(() => setShowCopiedNotification(false), 2000);
        showShortcutNotification('Lenke kopiert til utklippstavle!');
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
      });
  };

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

  // Update interval settings
  const updateIntervalSettings = (settings) => {
    // Extract settings from parameter object
    const { showIntervals: show, intervalCount: count, intervalType: type } = settings;
    
    // Update the state
    if (show !== undefined) setShowIntervals(show);
    if (count !== undefined) setIntervalCount(count);
    if (type !== undefined) setIntervalType(type);
    
    // Mark changes as unsaved (auto-save will handle it)
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
  
// I App.jsx, erstatt createTimeline funksjonen med denne:

const createTimeline = async (data) => {
  // Check for unsaved changes before creating new timeline
  if (hasUnsavedChanges) {
    const confirm = window.confirm('Du har ulagrede endringer som lagres automatisk. Er du sikker på at du vil opprette en ny tidslinje?');
    if (!confirm) {
      return; // User cancelled, don't create a new timeline
    }
  }
  
  // Reset privacy setting for new timeline (always private by default)
  setIsPublic(false);
  
  // Ensure sidebar is shown by default for new timelines
  setIsSidebarCollapsed(false);
  
  // Check if this timeline was generated from a prompt
  if (data.generatedFromPrompt && data.promptText) {
    try {
      setIsProcessingPrompt(true);
      
      console.log('🚀 AI-generert tidslinje mottatt:', data);
      console.log('📊 Antall events:', data.events?.length);
      
      // OpenAI har allerede generert alle events - bare sett dem direkte!
      const newTimelineData = {
        ...data,
        showIntervals: showIntervals,
        intervalCount: intervalCount,
        intervalType: intervalType,
        intervalSettings: {
          show: showIntervals,
          count: intervalCount,
          type: intervalType
        },
        isPublic: false // Default to private
      };
      
      setTimelineData(newTimelineData);
      setShowWelcomePopup(false);
      setHasUnsavedChanges(true);
      setSaveError('');
      
      console.log('✅ Timeline satt med', newTimelineData.events.length, 'events');
      
      // IKKE kall generateTimelineEvents igjen - OpenAI har allerede generert alt!
      
    } catch (error) {
      console.error('Error processing prompt timeline:', error);
      alert('Kunne ikke behandle AI-generert tidslinje: ' + error.message);
      
      // Fallback to empty timeline
      const fallbackTimelineData = {
        ...data,
        events: [], // Empty events as fallback
        showIntervals: showIntervals,
        intervalCount: intervalCount,
        intervalType: intervalType,
        intervalSettings: {
          show: showIntervals,
          count: intervalCount,
          type: intervalType
        },
        isPublic: false
      };
      
      setTimelineData(fallbackTimelineData);
      setShowWelcomePopup(false);
      setHasUnsavedChanges(false);
      
    } finally {
      setIsProcessingPrompt(false);
    }
  } else {
    // Regular timeline creation (non-AI)
    const newTimelineData = {
      ...data,
      showIntervals: showIntervals,
      intervalCount: intervalCount,
      intervalType: intervalType,
      intervalSettings: {
        show: showIntervals,
        count: intervalCount,
        type: intervalType
      },
      isPublic: false // Default to private
    };
    
    setTimelineData(newTimelineData);
    setHasUnsavedChanges(true);
    setShowWelcomePopup(false);
    setSaveError('');
  }
};
  // Update timeline data (for editing title and dates)
  const updateTimelineData = (updatedTimeline) => {
    // Mark changes as unsaved (auto-save will handle it)
    setHasUnsavedChanges(true);
    setTimelineData(updatedTimeline);
    setSaveError(''); // Clear any save errors
  };

  // Add event to the timeline
  const addEvent = (event) => {
    // Mark changes as unsaved (auto-save will handle it)
    setHasUnsavedChanges(true);
    setTimelineData(prevData => ({
      ...prevData,
      events: [...prevData.events, event]
    }));
    setSaveError(''); // Clear any save errors
  };
  
  // Manual save function (for initial save when timeline doesn't have ID yet)
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
      
      setIsSaving(true);
      
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
        intervalSettings: intervalSettings,
        // Include privacy setting
        isPublic: isPublic
      };
      
      // Import API functions dynamically to avoid circular dependencies
      const api = await import('./api');
      let result;
      
      // Check if timeline already has an ID (it's an existing timeline)
      if (dataToSave.id) {
        // Update existing timeline
        result = await api.updateTimeline(dataToSave.id, dataToSave);
        if (result.success) {
          setHasUnsavedChanges(false);
          setLastSaved(Date.now());
          setSaveError('');
          
          // Show success notification
          showShortcutNotification('Tidslinjen ble lagret');
          
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
          setHasUnsavedChanges(false);
          setLastSaved(Date.now());
          setSaveError('');
          
          // Show success notification
          showShortcutNotification('Tidslinjen ble opprettet og auto-lagring aktivert');
          
          // Update URL with the new timeline ID
          navigate(`/?timelineId=${result.timelineId}`, { replace: true });
          
          // Trigger the timeline list to refresh
          setTimelineListRefreshTrigger(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Feil ved lagring av tidslinje:', error);
      setSaveError(error.message);

      // Check if error is about timeline limit
      if (error.message.includes('grensen på 10 tidslinjer')) {
        alert(`${error.message} Vennligst gå til 'Mine tidslinjer' og slett en tidslinje før du prøver igjen.`);
      } else {
        alert(`Kunne ikke lagre tidslinjen: ${error.message}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Load timeline from Firebase with unsaved changes check
  const handleLoadTimeline = (timeline) => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm('Du har ulagrede endringer som lagres automatisk. Er du sikker på at du vil laste en annen tidslinje?');
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
      
      // Set privacy setting
      setIsPublic(timeline.isPublic || false);
      
      setShowWelcomePopup(false); // Hide welcome popup when a timeline is loaded
      
      // Set last saved time if available
      if (timeline.updatedAt) {
        setLastSaved(new Date(timeline.updatedAt).getTime());
      }
      
      // Update URL with the timeline ID
      navigate(`/?timelineId=${timeline.id}`, { replace: true });
    } else {
      console.error('Lastet tidslinje mangler ID');
      setTimelineData(timeline); // Still load but log warning
    }
  };
  
  // Modified timeline data setter to track changes
  const setTimelineDataWithTracking = (newData) => {
    // Mark as having unsaved changes (auto-save will handle it)
    setHasUnsavedChanges(true);
    // Update the timeline data
    setTimelineData(newData);
    setSaveError(''); // Clear any save errors
  };

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
      {/* Welcome popup is disabled because showWelcomePopup is set to false */}
      {showWelcomePopup && !isAuthenticated && (
        <WelcomePopup onClose={closeWelcomePopup} onLogin={openAuthModal} />
      )}
      
      {/* Add the Mobile Warning Component */}
      <MobileWarning />
      
      <Topbar 
        timelineData={timelineData} 
        onLogin={openAuthModal}
        onLogout={handleLogout}
        onLoadTimeline={handleLoadTimeline}
        onCreateTimeline={createTimeline}
        onSaveTimeline={saveTimeline}
        onUpdateTimeline={updateTimelineData}
        hasUnsavedChanges={hasUnsavedChanges || isSaving}
        lastSaved={lastSaved}
        saveError={saveError}
        isPublic={isPublic}
        onPrivacyChange={handlePrivacyChange}
        currentUser={currentUser}
        isAuthenticated={isAuthenticated}
      />
      
      {/* Use the LayoutManager to handle conditional rendering */}
      <LayoutManager
        timelineData={timelineData}
        onLogin={openAuthModal}
        isSidebarCollapsed={isSidebarCollapsed}
        onCreateTimeline={createTimeline}  
        sidebar={
          <Sidebar 
            isCollapsed={isSidebarCollapsed}
            toggleSidebar={toggleSidebar}
            createTimeline={createTimeline}
            addEvent={addEvent}
            saveTimeline={saveTimeline}
            timelineData={timelineData}
            onLogin={openAuthModal}
            onLoadTimeline={handleLoadTimeline}
            onCreateTimeline={createTimeline}
            hasUnsavedChanges={hasUnsavedChanges}
            timelineListRefreshTrigger={timelineListRefreshTrigger}
          />
        }
        timelineContent={
          <main className="main-content main-content-with-topbar">
            <Timeline 
              timelineData={timelineData}
              setTimelineData={setTimelineDataWithTracking}
              showIntervals={showIntervals}
              intervalCount={intervalCount}
              intervalType={intervalType}
              onUpdateIntervalSettings={updateIntervalSettings}
            />
          </main>
        }
      >
        {/* Authentication Modal */}
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
      </LayoutManager>
    </div>
  );
}

export default App;