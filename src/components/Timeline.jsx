import { useRef, useEffect, useState, useCallback } from 'react';
import TimelineEvent from './TimelineEvent';
import EventEditModal from './EventEditModal';
import TimelineContextMenu from './TimelineContextMenu';
import EventDetailPanel from './EventDetailPanel';
import BackgroundManager from './BackgroundManager';
import TimelineIntervals from './TimelineIntervals';
import CreateEventModal from './CreateEventModal'; // Ny import
import { setDocumentTitle } from '../services/documentTitleService';

function Timeline({ 
  timelineData, 
  setTimelineData,
  showIntervals = true,
  intervalCount = 5,
  intervalType = 'even',
  onUpdateIntervalSettings,
  isViewingMode = false // Ny prop for visningsmodus
}) {
  const timelineRef = useRef(null);
  const containerRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [translatePos, setTranslatePos] = useState({ x: 280, y: 125 });
  const [zoom, setZoom] = useState(0.7);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingEventIndex, setEditingEventIndex] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  
  // States for handling click-to-create events
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalPosition, setCreateModalPosition] = useState({ x: 0, y: 0 });
  const [createEventDate, setCreateEventDate] = useState(null);
  
  // States for hover date display
  const [showHoverDate, setShowHoverDate] = useState(false);
  const [hoverDate, setHoverDate] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (timelineData && timelineData.title) {
      setDocumentTitle(timelineData.title);
    } else {
      setDocumentTitle('Hjem');
    }
  }, [timelineData?.title]);
  
  // State for context menu and styling
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [backgroundColor, setBackgroundColor] = useState('white');
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(null);
  
  // State for timeline color and thickness
  const [timelineColor, setTimelineColor] = useState('#007bff');
  const [timelineThickness, setTimelineThickness] = useState(2);
  
  // State for interval markers - initialize with props but maintain locally
  const [localShowIntervals, setLocalShowIntervals] = useState(showIntervals);
  const [localIntervalCount, setLocalIntervalCount] = useState(intervalCount);
  const [localIntervalType, setLocalIntervalType] = useState(intervalType);
  
  // State to track last clicked event for z-index ordering
  const [lastClickedEvent, setLastClickedEvent] = useState(null);
  
  // Update local state when props change
  useEffect(() => {
    setLocalShowIntervals(showIntervals);
    setLocalIntervalCount(intervalCount);
    setLocalIntervalType(intervalType);
  }, [showIntervals, intervalCount, intervalType]);
  
  // Funksjon for å formatere dato
  const formatDate = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return '';
    }
    
    try {
      return date.toLocaleDateString('no-NO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      // Manuell formatering som fallback
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    }
  };
  
  // Håndter hover over tidslinjen for å vise dato - kun i redigeringsmodus
  const handleTimelineMouseMove = (e) => {
    // Ikke vis hover-dato i visningsmodus
    if (isViewingMode) return;
    
    // Bare vis hoverdate når musen er over selve tidslinjelinjen
    if (e.target.classList.contains('timeline-line')) {
      // Sikre at tidslinjen har start og slutt dato
      if (!timelineData.start || !timelineData.end) {
        return;
      }
      
      // Sikre at start og slutt er gyldige datoobjekter
      const startDate = timelineData.start instanceof Date ? 
        timelineData.start : 
        new Date(timelineData.start);
        
      const endDate = timelineData.end instanceof Date ?
        timelineData.end :
        new Date(timelineData.end);
      
      // Sjekk om datoene er gyldige
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return;
      }
      
      // Beregn dato basert på museposisjon
      const rect = e.target.getBoundingClientRect();
      let hoverPos = { x: e.clientX, y: e.clientY };
      let hoverDt;
      
      if (timelineData.orientation === 'horizontal') {
        // For horisontal tidslinje, bruk x-koordinaten
        const hoverX = e.clientX - rect.left;
        const hoverPercentage = hoverX / rect.width;
        
        // Beregn dato basert på prosentandel
        const timeRange = endDate.getTime() - startDate.getTime();
        const timestamp = startDate.getTime() + (timeRange * hoverPercentage);
        hoverDt = new Date(timestamp);
        
      } else {
        // For vertikal tidslinje, bruk y-koordinaten
        const hoverY = e.clientY - rect.top;
        const hoverPercentage = hoverY / rect.height;
        
        // Beregn dato basert på prosentandel
        const timeRange = endDate.getTime() - startDate.getTime();
        const timestamp = startDate.getTime() + (timeRange * hoverPercentage);
        hoverDt = new Date(timestamp);
      }
      
      // Ekstra validering av den beregnede datoen
      if (!hoverDt || isNaN(hoverDt.getTime())) {
        return;
      }
      
      setHoverDate(hoverDt);
      setHoverPosition(hoverPos);
      setShowHoverDate(true);
    } else {
      setShowHoverDate(false);
    }
  };
  
  // Skjul hover-datoen når musen forlater tidslinjen
  const handleTimelineMouseLeave = () => {
    if (isViewingMode) return;
    setShowHoverDate(false);
  };
  
  // Håndter klikk på tidslinjen for å opprette ny hendelse - kun i redigeringsmodus
  const handleTimelineLineClick = (e) => {
    // Ikke tillat hendelsesopprettelse i visningsmodus
    if (isViewingMode) return;
    
    // Bare utløs på direkte klikk på tidslinje-linjen
    if (e.target.classList.contains('timeline-line')) {
      e.stopPropagation();
      
      // Sjekk om tidslinjen har start og slutt dato
      if (!timelineData.start || !timelineData.end) {
        // Ikke gjør noe hvis tidslinjen ikke er initialisert
        return;
      }
      
      // Sikre at start og slutt er gyldige datoobjekter
      const startDate = timelineData.start instanceof Date ? 
        timelineData.start : 
        new Date(timelineData.start);
        
      const endDate = timelineData.end instanceof Date ?
        timelineData.end :
        new Date(timelineData.end);
      
      // Sjekk om datoene er gyldige
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('Ugyldige tidslinje-datoer:', { start: timelineData.start, end: timelineData.end });
        return; // Ikke fortsett hvis datoene er ugyldige
      }
      
      // Beregn posisjon for modalen
      const rect = e.target.getBoundingClientRect();
      let clickPosition;
      let clickDate;
      
      if (timelineData.orientation === 'horizontal') {
        // For horisontal tidslinje, bruk x-koordinaten
        const clickX = e.clientX - rect.left;
        const clickPercentage = clickX / rect.width;
        clickPosition = { x: e.clientX, y: e.clientY };
        
        // Beregn dato basert på prosentandel
        const timeRange = endDate.getTime() - startDate.getTime();
        const timestamp = startDate.getTime() + (timeRange * clickPercentage);
        clickDate = new Date(timestamp);
        
      } else {
        // For vertikal tidslinje, bruk y-koordinaten
        const clickY = e.clientY - rect.top;
        const clickPercentage = clickY / rect.height;
        clickPosition = { x: e.clientX, y: e.clientY };
        
        // Beregn dato basert på prosentandel
        const timeRange = endDate.getTime() - startDate.getTime();
        const timestamp = startDate.getTime() + (timeRange * clickPercentage);
        clickDate = new Date(timestamp);
      }
      
      // Ekstra validering av den beregnede datoen
      if (!clickDate || isNaN(clickDate.getTime())) {
        console.error('Kunne ikke beregne gyldig dato fra klikk');
        clickDate = new Date(); // Bruk nåværende dato som fallback
      }
      
      console.log('Beregnet dato fra klikk:', clickDate.toISOString());
      
      setCreateEventDate(clickDate);
      setCreateModalPosition(clickPosition);
      setShowCreateModal(true);
    }
  };
  
  // Funksjon for å legge til en ny hendelse fra modalen - kun i redigeringsmodus
  const addNewEvent = (newEvent) => {
    if (isViewingMode) return;
    
    // Legg til den nye hendelsen i tidslinjens events-array
    const updatedEvents = [...timelineData.events, newEvent];
    
    // Oppdater tidslinje-dataen
    setTimelineData({
      ...timelineData,
      events: updatedEvents
    });
  };
  
  // Callback for when a background image is loaded
  const handleBackgroundLoaded = useCallback((imageUrl) => {
    setBackgroundImageUrl(imageUrl);
  }, []);
  
  // Set up timeline interactions
  useEffect(() => {
    const timeline = timelineRef.current;
    const container = containerRef.current;
    
    if (!timeline || !container) return;
    
    // Explicitly set transform-origin to ensure consistent behavior for zooming
    timeline.style.transformOrigin = 'top left';
    
    // Update timeline transform with consistent values
    const updateTransform = () => {
      timeline.style.transform = `translate3d(${translatePos.x}px, ${translatePos.y}px, 0) scale(${zoom})`;
    };
    
    // Initial transform update
    updateTransform();
    
    // Zoom towards mouse position on wheel
    const handleWheel = (e) => {
      if (e.target.closest('.event-detail-panel')) return;
      
      e.preventDefault();
      
      const scaleFactor = 1.1;
      const isZoomIn = e.deltaY < 0;
      
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const currentZoom = zoom;
      
      let newZoom;
      if (isZoomIn) {
        newZoom = currentZoom * scaleFactor;
      } else {
        newZoom = currentZoom / scaleFactor;
      }
      
      // Clamp zoom within reasonable bounds
      newZoom = Math.max(0.5, Math.min(3, newZoom));
      
      // Calculate world coordinates based on current transform
      const worldX = (mouseX - translatePos.x) / currentZoom;
      const worldY = (mouseY - translatePos.y) / currentZoom;
      
      // Calculate new screen coordinates to maintain mouse position
      const newTranslateX = mouseX - worldX * newZoom;
      const newTranslateY = mouseY - worldY * newZoom;
      
      setZoom(newZoom);
      setTranslatePos({
        x: newTranslateX,
        y: newTranslateY
      });
    };
    
    // Pan on mouse down
    const handleMouseDown = (e) => {
      if (e.button !== 0) return;
      
      if (e.target !== containerRef.current && 
          e.target !== timelineRef.current && 
          !e.target.classList.contains('timeline-line')) {
        return;
      }
      
      setIsPanning(true);
      setStartPos({
        x: e.clientX - translatePos.x,
        y: e.clientY - translatePos.y
      });
      container.style.cursor = 'grabbing';
    };
    
    // Update pan position on mouse move
    const handleMouseMove = (e) => {
      if (!isPanning) return;
      
      setTranslatePos({
        x: e.clientX - startPos.x,
        y: e.clientY - startPos.y
      });
    };
    
    // End panning on mouse up
    const handleMouseUp = () => {
      setIsPanning(false);
      container.style.cursor = 'default';
    };
    
    // Reset view on double click and center the timeline
    const handleDoubleClick = (e) => {
      if (e.target === containerRef.current || 
          e.target === timelineRef.current || 
          e.target.classList.contains('timeline-line')) {
        
        const rect = container.getBoundingClientRect();
        const defaultZoom = 0.7;
        
        // Calculate center position of the container
        const containerCenterX = rect.width / 2;
        const containerCenterY = rect.height / 2;
        
        // Get the timeline element dimensions
        const timelineRect = timeline.getBoundingClientRect();
        // Use current scale to get accurate dimensions
        const timelineWidth = timelineRect.width / zoom;
        const timelineHeight = timelineRect.height / zoom;
        
        // Calculate the position to center the timeline
        let newTranslateX, newTranslateY;
        
        if (timelineData.orientation === 'horizontal') {
          // For horizontal timeline, center horizontally and put the line in the middle vertically
          newTranslateX = containerCenterX - (timelineWidth / 2) * defaultZoom;
          newTranslateY = containerCenterY - (timelineHeight / 2) * defaultZoom;
        } else {
          // For vertical timeline, center vertically and put the line in the middle horizontally
          newTranslateX = containerCenterX - (timelineWidth / 2) * defaultZoom;
          newTranslateY = containerCenterY - (timelineHeight / 2) * defaultZoom;
        }
        
        setZoom(defaultZoom);
        setTranslatePos({
          x: newTranslateX,
          y: newTranslateY
        });
      }
    };
    
    // Add event listeners
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('dblclick', handleDoubleClick);
    
    // Clean up event listeners
    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('dblclick', handleDoubleClick);
    };
  }, [isPanning, startPos, translatePos, zoom, timelineData]);

  // Handle event dragging with 2D movement - kun i redigeringsmodus
  const handleEventDrag = (index, xOffset, yOffset) => {
    if (isViewingMode) return;
    
    const newEvents = [...timelineData.events];
    
    newEvents[index] = {
      ...newEvents[index],
      xOffset: xOffset,
      yOffset: yOffset,
      offset: yOffset // Keep for backward compatibility
    };
    
    setTimelineData({
      ...timelineData,
      events: newEvents
    });
  };
  
  // Handle event editing and bring to front - kun i redigeringsmodus
  const handleEditEvent = (event, index) => {
    if (isViewingMode) return;
    
    setEditingEvent({...event, index});
    setEditingEventIndex(index);
    setLastClickedEvent(index);
    setShowDetailPanel(false);
  };
  
  // Handle showing event details in the side panel
  const handleShowEventDetail = (event, index) => {
    // Allow showing event details in viewing mode
    if (showDetailPanel) {
      setDetailEvent({...event, index});
    } else {
      setDetailEvent({...event, index});
      setShowDetailPanel(true);
    }
  };
  
  // Handle closing the detail panel
  const handleCloseDetailPanel = () => {
    setShowDetailPanel(false);
  };
  
  // Handle event deletion - kun i redigeringsmodus
  const handleDeleteEvent = (event, index) => {
    if (isViewingMode) return;
    
    setEventToDelete(index);
    setShowConfirmDelete(true);
    setLastClickedEvent(index);
  };
  
  // Save edited event - kun i redigeringsmodus
  const handleSaveEvent = (updatedEvent) => {
    if (isViewingMode) return;
    if (editingEventIndex === null) return;
    
    const newEvents = [...timelineData.events];
    
    const currentEvent = newEvents[editingEventIndex];
    newEvents[editingEventIndex] = {
      ...updatedEvent,
      xOffset: currentEvent.xOffset || 0,
      yOffset: currentEvent.yOffset || currentEvent.offset || 0,
      offset: currentEvent.yOffset || currentEvent.offset || 0
    };
    
    setTimelineData({
      ...timelineData,
      events: newEvents
    });
    
    setEditingEvent(null);
    setEditingEventIndex(null);
  };
  
  // Delete event from modal with confirmation - kun i redigeringsmodus
  const handleDeleteFromModal = (event, index) => {
    if (isViewingMode) return;
    
    setEditingEvent(null);
    setEditingEventIndex(null);
    setShowDetailPanel(false);
    setEventToDelete(index !== undefined ? index : editingEventIndex);
    setShowConfirmDelete(true);
  };
  
  // Confirm delete event - kun i redigeringsmodus
  const confirmDeleteEvent = () => {
    if (isViewingMode) return;
    if (eventToDelete === null) return;
    
    const newEvents = [...timelineData.events];
    newEvents.splice(eventToDelete, 1);
    
    setTimelineData({
      ...timelineData,
      events: newEvents
    });
    
    setShowConfirmDelete(false);
    setEventToDelete(null);
    
    if (detailEvent && detailEvent.index === eventToDelete) {
      setShowDetailPanel(false);
    }
    
    if (lastClickedEvent === eventToDelete) {
      setLastClickedEvent(null);
    } 
    else if (lastClickedEvent > eventToDelete) {
      setLastClickedEvent(lastClickedEvent - 1);
    }
  };
  
  // Handle right click to show context menu - kun i redigeringsmodus
  const handleContextMenu = (e) => {
    if (isViewingMode) return;
    
    e.preventDefault();
    
    if (e.target === containerRef.current || e.target === timelineRef.current || e.target.classList.contains('timeline-line')) {
      setMenuPosition({ x: e.clientX, y: e.clientY });
      setShowContextMenu(true);
    }
  };
  
  // Handle click on timeline background to reset last clicked event
  const handleTimelineClick = (e) => {
    if (e.target === containerRef.current || e.target === timelineRef.current || e.target.classList.contains('timeline-line')) {
      setLastClickedEvent(null);
    }
  };
  
  // Handle color selection for background - kun i redigeringsmodus
  const handleColorSelect = (color) => {
    if (isViewingMode) return;
    
    if (color === 'none') {
      setBackgroundColor(null);
    } else {
      setBackgroundColor(color);
      setBackgroundImage(null);
      setBackgroundImageUrl(null);
    }
    
    setTimelineData({
      ...timelineData,
      backgroundColor: color === 'none' ? null : color,
      backgroundImage: null
    });
  };
  
  // Handle timeline style selection (color & thickness) - kun i redigeringsmodus
  const handleStyleSelect = (style) => {
    if (isViewingMode) return;
    
    if (style.color !== undefined) {
      setTimelineColor(style.color);
      
      setTimelineData({
        ...timelineData,
        timelineColor: style.color
      });
    }
    
    if (style.thickness !== undefined) {
      setTimelineThickness(style.thickness);
      
      setTimelineData({
        ...timelineData,
        timelineThickness: style.thickness
      });
    }
    
    // Add this block to handle orientation
    if (style.orientation !== undefined) {
      setTimelineData({
        ...timelineData,
        orientation: style.orientation
      });
    }
  };
  
  // Handle background image selection - kun i redigeringsmodus
  const handleBackgroundImageSelect = (imageName) => {
    if (isViewingMode) return;
    
    if (imageName) {
      setBackgroundImage(imageName);
      setBackgroundColor(null);
      
      setTimelineData({
        ...timelineData,
        backgroundImage: imageName,
        backgroundColor: null
      });
    } else {
      setBackgroundImage(null);
      setBackgroundImageUrl(null);
      setBackgroundColor('white');
      
      setTimelineData({
        ...timelineData,
        backgroundImage: null,
        backgroundColor: 'white'
      });
    }
  };
  
  // Handle interval toggle from context menu - kun i redigeringsmodus
  const handleIntervalToggle = (shouldShow) => {
    if (isViewingMode) return;
    
    // Update local state
    setLocalShowIntervals(shouldShow);
    
    // Important: Update all state locations consistently
    setTimelineData({
      ...timelineData,
      showIntervals: shouldShow,
      intervalSettings: {
        ...(timelineData.intervalSettings || {}),
        show: shouldShow
      }
    });
    
    if (onUpdateIntervalSettings) {
      onUpdateIntervalSettings({
        showIntervals: shouldShow,
        intervalCount: localIntervalCount,
        intervalType: localIntervalType
      });
    }
  };
  
  // Handle interval count change from context menu - kun i redigeringsmodus
  const handleIntervalCountChange = (count) => {
    if (isViewingMode) return;
    
    // Force update the local state with the new count
    setLocalIntervalCount(count);
    
    // Update the timelineData to include this setting
    setTimelineData({
      ...timelineData,
      intervalCount: count, // Add this property to the timelineData object
      intervalSettings: {
        ...(timelineData.intervalSettings || {}),
        count: count
      }
    });
    
    // Always call parent update function if it exists
    if (onUpdateIntervalSettings) {
      onUpdateIntervalSettings({
        showIntervals: localShowIntervals,
        intervalCount: count,
        intervalType: localIntervalType
      });
    }
  };
  
  // Handle interval type change from context menu - kun i redigeringsmodus
  const handleIntervalTypeChange = (type) => {
    if (isViewingMode) return;
    
    // Update local state
    setLocalIntervalType(type);
    
    // Update the timelineData to include this setting
    setTimelineData({
      ...timelineData,
      intervalType: type,
      intervalSettings: {
        ...(timelineData.intervalSettings || {}),
        type: type
      }
    });
    
    // Always call parent update function if it exists
    if (onUpdateIntervalSettings) {
      onUpdateIntervalSettings({
        showIntervals: localShowIntervals,
        intervalCount: localIntervalCount,
        intervalType: type
      });
    }
  };
  
  // Close context menu
  const closeContextMenu = () => {
    setShowContextMenu(false);
  };
  
  // Set styling from timelineData when it changes
  useEffect(() => {
    if (timelineData.backgroundColor) {
      setBackgroundColor(timelineData.backgroundColor);
      setBackgroundImage(null);
      setBackgroundImageUrl(null);
    } else if (timelineData.backgroundImage) {
      setBackgroundImage(timelineData.backgroundImage);
      setBackgroundColor(null);
    } else {
      setBackgroundColor('white');
      setBackgroundImage(null);
      setBackgroundImageUrl(null);
    }
    
    if (timelineData.timelineColor) {
      setTimelineColor(timelineData.timelineColor);
    }
    
    if (timelineData.timelineThickness) {
      setTimelineThickness(timelineData.timelineThickness);
    }
    
    // Check all possible locations for interval settings - UPDATED
    if (timelineData.showIntervals !== undefined) {
      setLocalShowIntervals(timelineData.showIntervals);
    } else if (timelineData.intervalSettings?.show !== undefined) {
      setLocalShowIntervals(timelineData.intervalSettings.show);
    }
    
    if (timelineData.intervalCount !== undefined) {
      setLocalIntervalCount(timelineData.intervalCount);
    } else if (timelineData.intervalSettings?.count !== undefined) {
      setLocalIntervalCount(timelineData.intervalSettings.count);
    }
    
    if (timelineData.intervalType !== undefined) {
      setLocalIntervalType(timelineData.intervalType);
    } else if (timelineData.intervalSettings?.type !== undefined) {
      setLocalIntervalType(timelineData.intervalSettings.type);
    }
    
    setShowDetailPanel(false);
  }, [timelineData]);
  
  // Generate the CSS styles for the timeline line
  const getTimelineLineStyle = () => {
    const baseStyle = {
      backgroundColor: timelineColor
    };
    
    if (timelineThickness) {
      if (timelineData.orientation === 'horizontal') {
        baseStyle.height = `${timelineThickness}px`;
      } else {
        baseStyle.width = `${timelineThickness}px`;
      }
    }
    
    return baseStyle;
  };
  
  // Get container style including background color or image
  const getContainerStyle = () => {
    const baseStyle = {};
    
    if (backgroundImageUrl) {
      baseStyle.backgroundImage = `url(${backgroundImageUrl})`;
      baseStyle.backgroundSize = 'cover';
      baseStyle.backgroundPosition = 'center';
    } else if (backgroundColor) {
      baseStyle.backgroundColor = backgroundColor;
    } else {
      baseStyle.backgroundColor = 'white';
    }
    
    return baseStyle;
  };
  
  // Return early if no timeline data
  if (!timelineData.start || !timelineData.end) {
    return (
      <>
        <BackgroundManager 
          backgroundImage={backgroundImage} 
          onBackgroundLoaded={handleBackgroundLoaded}
        />
        
        <div 
          id="timelineContainer" 
          className="timeline-container" 
          ref={containerRef}
          onContextMenu={isViewingMode ? undefined : handleContextMenu}
          onClick={handleTimelineClick}
          style={getContainerStyle()}
        >
          <div id="timeline" className="timeline" ref={timelineRef}>
            <div className="timeline-line" style={getTimelineLineStyle()}></div>
          </div>
          
          {/* Only show context menu in edit mode */}
          {showContextMenu && !isViewingMode && (
            <TimelineContextMenu
            position={menuPosition}
            onColorSelect={handleColorSelect}
            onStyleSelect={handleStyleSelect}
            onBackgroundImageSelect={handleBackgroundImageSelect}
            onClose={closeContextMenu}
            currentColor={timelineColor}
            currentThickness={timelineThickness}
            currentBackgroundColor={backgroundColor}
            currentBackgroundImage={backgroundImage}
            showIntervals={localShowIntervals}
            intervalCount={localIntervalCount}
            intervalType={localIntervalType}
            onIntervalToggle={handleIntervalToggle}
            onIntervalCountChange={handleIntervalCountChange}
            onIntervalTypeChange={handleIntervalTypeChange}
            timelineData={timelineData}
            isVertical={timelineData.orientation === 'vertical'} // Add this
          
            />
          )}
        </div>
      </>
    );
  }
  
  return (
    <>
      <BackgroundManager 
        backgroundImage={backgroundImage} 
        onBackgroundLoaded={handleBackgroundLoaded}
      />
      
      <div 
        id="timelineContainer" 
        className={`timeline-container ${showDetailPanel ? 'with-detail-panel' : ''}`}
        ref={containerRef}
        onContextMenu={isViewingMode ? undefined : handleContextMenu}
        onClick={handleTimelineClick}
        style={getContainerStyle()}
      >
        <div 
          id="timeline" 
          className={`timeline ${timelineData.orientation}`} 
          ref={timelineRef}
        >
          {/* Tidslinjeelement med klikk og hover-funksjonalitet - kun i redigeringsmodus */}
          <div 
            className="timeline-line" 
            style={getTimelineLineStyle()} 
            onClick={isViewingMode ? undefined : handleTimelineLineClick}
            onMouseMove={isViewingMode ? undefined : handleTimelineMouseMove}
            onMouseLeave={isViewingMode ? undefined : handleTimelineMouseLeave}
          ></div>

          <TimelineIntervals 
            timelineData={timelineData}
            intervalCount={localIntervalCount}
            showIntervals={localShowIntervals}
            intervalType={localIntervalType}
          />
          
          {timelineData.events.map((event, index) => {
            const totalDuration = timelineData.end - timelineData.start;
            const eventPosition = event.date - timelineData.start;
            const positionPercentage = (eventPosition / totalDuration) * 100;
            
            return (
              <TimelineEvent
                key={index}
                event={event}
                index={index}
                orientation={timelineData.orientation}
                positionPercentage={positionPercentage}
                onDrag={isViewingMode ? () => {} : handleEventDrag}
                onEdit={isViewingMode ? () => {} : handleEditEvent}
                onDelete={isViewingMode ? () => {} : handleDeleteEvent}
                zoom={zoom}
                timelineColor={timelineColor}
                timelineThickness={timelineThickness}
                setLastClickedEvent={setLastClickedEvent}
                lastClickedEvent={lastClickedEvent}
                onShowDetail={handleShowEventDetail}
                isViewingMode={isViewingMode} // Pass viewing mode to events
              />
            );
          })}
        </div>
        
        {/* Vis hoverdato når musen er over tidslinjen - kun i redigeringsmodus */}
        {showHoverDate && !isViewingMode && (
          <div className="timeline-hover-date" style={{
            position: 'absolute',
            top: hoverPosition.y - 35,
            left: hoverPosition.x,
            transform: 'translateX(-50%)'
          }}>
            {formatDate(hoverDate)}
          </div>
        )}
        
        {/* Only show context menu in edit mode */}
        {showContextMenu && !isViewingMode && (
          <TimelineContextMenu
            position={menuPosition}
            onColorSelect={handleColorSelect}
            onStyleSelect={handleStyleSelect}
            onBackgroundImageSelect={handleBackgroundImageSelect}
            onClose={closeContextMenu}
            currentColor={timelineColor}
            currentThickness={timelineThickness}
            currentBackgroundColor={backgroundColor}
            currentBackgroundImage={backgroundImage}
            showIntervals={localShowIntervals}
            intervalCount={localIntervalCount}
            intervalType={localIntervalType}
            onIntervalToggle={handleIntervalToggle}
            onIntervalCountChange={handleIntervalCountChange}
            onIntervalTypeChange={handleIntervalTypeChange}
            timelineData={timelineData}
          />
        )}
        
        <EventDetailPanel 
          event={detailEvent}
          isOpen={showDetailPanel}
          onClose={handleCloseDetailPanel}
          onEdit={isViewingMode ? undefined : handleEditEvent}
          onDelete={isViewingMode ? undefined : handleDeleteFromModal}
          isViewingMode={isViewingMode} // Pass viewing mode to detail panel
        />
        
        {/* Only show edit modal in edit mode */}
        {editingEvent && !isViewingMode && (
          <EventEditModal 
            event={editingEvent}
            onSave={handleSaveEvent}
            onDelete={handleDeleteFromModal}
            onClose={() => {
              setEditingEvent(null);
              setEditingEventIndex(null);
            }}
          />
        )}
        
        {/* Only show delete confirmation in edit mode */}
        {showConfirmDelete && !isViewingMode && (
          <div className="modal-overlay">
            <div className="delete-confirmation-modal">
              <h3>Bekreft sletting</h3>
              <p>Er du sikker på at du vil slette denne hendelsen? Denne handlingen kan ikke angres.</p>
              <div className="modal-buttons">
                <button 
                  className="cancel-btn" 
                  onClick={() => {
                    setShowConfirmDelete(false);
                    setEventToDelete(null);
                  }}
                >
                  Avbryt
                </button>
                <button 
                  className="delete-btn" 
                  onClick={confirmDeleteEvent}
                >
                  Slett
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* CreateEventModal for hendelsesopprettelse ved klikk - kun i redigeringsmodus */}
        {!isViewingMode && (
          <CreateEventModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSave={addNewEvent}
            position={createModalPosition}
            date={createEventDate}
            timelineColor={timelineColor}
          />
        )}
      </div>
    </>
  );
}

export default Timeline;