import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Topbar from './components/Topbar';
import Timeline from './components/Timeline';
import LayoutManager from './components/LayoutManager';
import AddEventModal from './components/AddEventModal';
import EditEventModal from './components/EditEventModal';
import { useAuth } from './contexts/AuthContext.jsx';
import { useTheme } from './contexts/ThemeContext.jsx';
import AuthModal from './components/auth/AuthModal';
import MobileWarning from './components/MobileWarning';
import useAutoSave from './hooks/useAutoSave';

import { generateTimelineEvents } from './services/aiTimelineService';

// Import styles
import './styles/base.css';
import './styles/timeline.css';
import './styles/ui-components.css';
import './styles/auth.css';
import './styles/topbar.css';
import './styles/mobile-warning.css';
import './styles/theme-toggle.css';
import './styles/add-event-modal.css';

import './styles/sidebarinfo.css';
import './styles/event-colors.css';
import './styles/text-to-timeline.css';
import './styles/topbar-timeline-form.css';
import './styles/prompt-processing.css';
import './styles/privacy-toggle.css';
import './styles/topbar-privacy.css';
import './styles/layout-manager.css';
import './styles/welcome-screen.css';
import './styles/EventContextMenu.css';

function App() {
  const { isAuthenticated, authChanged, currentUser, logOut } = useAuth();
  const { darkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  
  // Edit Event Modal states - handled globally if needed (usually handled in Timeline)
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);
  
  // Add state for interval markers
  const [showIntervals, setShowIntervals] = useState(true);
  const [intervalCount, setIntervalCount] = useState(5);
  const [intervalType, setIntervalType] = useState('even');
  
  // Add state for processing prompt-generated timelines
  const [isProcessingPrompt, setIsProcessingPrompt] = useState(false);
  
  // Add state for privacy setting
  const [isPublic, setIsPublic] = useState(false);
  
  // Auto-save states with better tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  
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
  
  // Refs for tracking operations
  const saveInProgressRef = useRef(false);
  const lastDataHashRef = useRef('');

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

  // Generate a simple hash for timeline data to detect actual changes
  const generateDataHash = (data) => {
    const relevantData = {
      id: data.id,
      title: data.title,
      start: data.start?.getTime?.() || data.start,
      end: data.end?.getTime?.() || data.end,
      events: data.events?.map(event => ({
        title: event.title,
        date: event.date?.getTime?.() || event.date,
        description: event.description,
        size: event.size,
        color: event.color,
        hasImage: event.hasImage,
        imageUrl: event.imageUrl,
        xOffset: event.xOffset,
        yOffset: event.yOffset
      })),
      showIntervals,
      intervalCount,
      intervalType,
      isPublic
    };
    return JSON.stringify(relevantData);
  };

  // Optimized auto-save function with deduplication
  const autoSaveTimeline = async () => {
    // Don't save if there's no meaningful data or if it's not saved initially
    if (!timelineData || !timelineData.title || !timelineData.id || timelineData.events.length === 0) {
      return;
    }

    // Don't auto-save if manual save is in progress
    if (saveInProgressRef.current || isUploadingImages) {
      console.log('Save operation in progress, skipping auto-save');
      return;
    }

    // Generate hash to check for actual changes
    const currentDataHash = generateDataHash(timelineData);
    if (currentDataHash === lastDataHashRef.current) {
      console.log('No actual changes detected, skipping auto-save');
      return;
    }

    try {
      setIsSaving(true);
      saveInProgressRef.current = true;
      
      // Make sure interval settings are included
      const intervalSettings = {
        show: showIntervals,
        count: intervalCount,
        type: intervalType
      };
      
      const dataToSave = {
        ...timelineData,
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
        lastDataHashRef.current = currentDataHash;
        console.log('Auto-saved timeline at:', new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveError(error.message);
      setHasUnsavedChanges(true);
    } finally {
      setIsSaving(false);
      saveInProgressRef.current = false;
    }
  };

  // Set up auto-save with dependencies that should trigger saving
  useAutoSave(
    timelineData, 
    autoSaveTimeline, 
    3000, // Increased to 3 second delay to reduce conflicts
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

  // Open and close add event modal
  const openAddEventModal = () => setIsAddEventModalOpen(true);
  const closeAddEventModal = () => setIsAddEventModalOpen(false);

  // Edit Event Modal handlers (if needed globally - usually Timeline handles its own)
  const openEditEventModal = (event) => {
    setEventToEdit(event);
    setIsEditEventModalOpen(true);
  };
  
  const closeEditEventModal = () => {
    setIsEditEventModalOpen(false);
    setEventToEdit(null);
  };

  // Function to show shortcut notification
  const showShortcutNotification = (message) => {
    setShortcutNotification(message);
    
    // Auto-hide the notification after 2 seconds
    setTimeout(() => {
      setShortcutNotification(null);
    }, 2000);
  };

  // Handle saving and deleting edited events (if handled globally)
// ERSTATNING for handleSaveEditedEvent funksjonen i App.jsx
// Finn denne funksjonen (linje ~344) og erstatt med denne versjonen:

const handleSaveEditedEvent = (updatedEvent) => {
  if (!eventToEdit || eventToEdit.index === undefined) return;
  
  const newEvents = [...timelineData.events];
  const eventIndex = eventToEdit.index;
  const originalEvent = newEvents[eventIndex];
  
  // FIXED: Preserve ALL existing properties, especially image-related ones
  newEvents[eventIndex] = {
    ...originalEvent, // Start with all original properties
    ...updatedEvent,  // Then apply updates
    
    // Ensure positioning is preserved
    xOffset: originalEvent.xOffset || 0,
    yOffset: originalEvent.yOffset || originalEvent.offset || 0,
    offset: originalEvent.yOffset || originalEvent.offset || 0,
    autoLayouted: originalEvent.autoLayouted || false,
    manuallyPositioned: originalEvent.manuallyPositioned || false,
    
    // CRITICAL: Preserve image properties if they weren't explicitly changed
    hasImage: updatedEvent.hasImage !== undefined ? updatedEvent.hasImage : originalEvent.hasImage,
    imageFile: updatedEvent.imageFile !== undefined ? updatedEvent.imageFile : originalEvent.imageFile,
    imageUrl: updatedEvent.imageUrl !== undefined ? updatedEvent.imageUrl : originalEvent.imageUrl,
    imageStoragePath: updatedEvent.imageStoragePath !== undefined ? updatedEvent.imageStoragePath : originalEvent.imageStoragePath,
    imageFileName: updatedEvent.imageFileName !== undefined ? updatedEvent.imageFileName : originalEvent.imageFileName
  };
  
  setTimelineData({
    ...timelineData,
    events: newEvents
  });
  
  // Mark as having unsaved changes
  setHasUnsavedChanges(true);
  setSaveError('');
  
  // Close the modal
  setIsEditEventModalOpen(false);
  setEventToEdit(null);
  
  // Show success notification
  showShortcutNotification('Hendelse oppdatert');
};

  const handleDeleteEditedEvent = (event, index) => {
    const eventIndex = typeof index === 'number' ? index : eventToEdit?.index;
    if (eventIndex === undefined) return;
    
    const newEvents = [...timelineData.events];
    newEvents.splice(eventIndex, 1);
    
    setTimelineData({
      ...timelineData,
      events: newEvents
    });
    
    // Mark as having unsaved changes
    setHasUnsavedChanges(true);
    setSaveError('');
    
    // Close the modal
    setIsEditEventModalOpen(false);
    setEventToEdit(null);
    
    // Show success notification
    showShortcutNotification('Hendelse slettet');
  };

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
        
        // Update data hash after loading
        lastDataHashRef.current = generateDataHash(timeline);
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
      lastDataHashRef.current = '';
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
    // Track if event has image file for upload monitoring
    if (event.imageFile && event.imageFile instanceof File) {
      setIsUploadingImages(true);
    }
    
    // Mark changes as unsaved (auto-save will handle it)
    setHasUnsavedChanges(true);
    setTimelineData(prevData => ({
      ...prevData,
      events: [...prevData.events, event]
    }));
    setSaveError(''); // Clear any save errors
    
    // Reset upload state after a brief delay
    if (event.imageFile && event.imageFile instanceof File) {
      setTimeout(() => setIsUploadingImages(false), 1000);
    }
  };
  
  // Manual save function (for initial save when timeline doesn't have ID yet)
  const saveTimeline = async () => {
    // Prevent concurrent saves
    if (saveInProgressRef.current || isSaving) {
      console.log('Save already in progress, skipping manual save');
      return;
    }

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
      saveInProgressRef.current = true;
      
      // Check for images being uploaded
      const hasNewImages = timelineData.events.some(event => 
        event.imageFile && event.imageFile instanceof File
      );
      
      if (hasNewImages) {
        setIsUploadingImages(true);
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
          
          // Update data hash after successful save
          lastDataHashRef.current = generateDataHash(dataToSave);
          
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
          const updatedTimeline = {
            ...dataToSave,
            id: result.timelineId
          };
          setTimelineData(updatedTimeline);
          setHasUnsavedChanges(false);
          setLastSaved(Date.now());
          setSaveError('');
          
          // Update data hash after successful save
          lastDataHashRef.current = generateDataHash(updatedTimeline);
          
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
      setIsUploadingImages(false);
      saveInProgressRef.current = false;
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
      
      // Update data hash after loading
      lastDataHashRef.current = generateDataHash(timeline);
    } else {
      console.error('Lastet tidslinje mangler ID');
      setTimelineData(timeline); // Still load but log warning
    }
  };
  
  // Modified timeline data setter to track changes
  const setTimelineDataWithTracking = (newData) => {
    // Check for image uploads in new data
    if (newData.events) {
      const hasNewImages = newData.events.some(event => 
        event.imageFile && event.imageFile instanceof File
      );
      if (hasNewImages) {
        setIsUploadingImages(true);
        // Reset upload state after processing
        setTimeout(() => setIsUploadingImages(false), 2000);
      }
    }
    
    // Mark as having unsaved changes (auto-save will handle it)
    setHasUnsavedChanges(true);
    // Update the timeline data
    setTimelineData(newData);
    setSaveError(''); // Clear any save errors
  };

  // Add class to body when modal is open to prevent scrolling
  useEffect(() => {
    if (isAddEventModalOpen || isEditEventModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isAddEventModalOpen, isEditEventModalOpen]);

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
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
        onCreateTimeline={createTimeline}  
        timelineContent={
          <main className="main-content main-content-with-topbar">
            {/* Timeline Container with Add Event Button */}
            <div className="timeline-wrapper">
              <Timeline 
                timelineData={timelineData}
                setTimelineData={setTimelineDataWithTracking}
                showIntervals={showIntervals}
                intervalCount={intervalCount}
                intervalType={intervalType}
                onUpdateIntervalSettings={updateIntervalSettings}
              />
              
              {/* Add Event Button - positioned in bottom left of timeline container */}
              {timelineData && timelineData.title && timelineData.start && timelineData.end && (
                <button 
                  className={`add-event-floating-btn ${timelineData.events.length === 0 ? 'pulse' : ''}`}
                  onClick={openAddEventModal}
                  title="Legg til ny hendelse"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>Legg til ny hendelse</span>
                </button>
              )}
            </div>
          </main>
        }
      >
        {/* Authentication Modal */}
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={closeAuthModal} 
        />
        
        {/* Add Event Modal - replaces sidebar functionality */}
        <AddEventModal
          isOpen={isAddEventModalOpen}
          onClose={closeAddEventModal}
          addEvent={addEvent}
          saveTimeline={saveTimeline}
          timelineData={timelineData}
          onLogin={openAuthModal}
          onLoadTimeline={handleLoadTimeline}
          onCreateTimeline={createTimeline}
          hasUnsavedChanges={hasUnsavedChanges}
          timelineListRefreshTrigger={timelineListRefreshTrigger}
        />
        
        {/* Edit Event Modal - global handler (usually Timeline handles its own) */}
        <EditEventModal
          isOpen={isEditEventModalOpen}
          onClose={closeEditEventModal}
          onSave={handleSaveEditedEvent}
          onDelete={handleDeleteEditedEvent}
          event={eventToEdit}
          timelineData={timelineData}
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