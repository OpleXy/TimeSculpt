import { useRef, useEffect, useState, useCallback } from 'react';
import TimelineEvent from './TimelineEvent';
import TimelineContextMenu from './TimelineContextMenu';
import EventDetailPanel from './EventDetailPanel';
import BackgroundManager from './BackgroundManager';
import TimelineIntervals from './TimelineIntervals';
import CreateEventModal from './CreateEventModal';
import { setDocumentTitle } from '../services/documentTitleService';

function Timeline({ 
  timelineData, 
  setTimelineData,
  showIntervals = true,
  intervalCount = 5,
  intervalType = 'even',
  onUpdateIntervalSettings
}) {
  const timelineRef = useRef(null);
  const containerRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [translatePos, setTranslatePos] = useState({ x: 280, y: 125 });
  const [zoom, setZoom] = useState(0.7);
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

  // Function to calculate automatic positioning for events to prevent overlap
  const calculateEventPositions = (events, timelineData) => {
    if (!events || events.length === 0) return events;
    
    // Sort events by date first
    const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calculate positions for each event
    const positionedEvents = sortedEvents.map((event, index) => {
      const totalDuration = timelineData.end - timelineData.start;
      const eventPosition = event.date - timelineData.start;
      const positionPercentage = (eventPosition / totalDuration) * 100;
      
      return {
        ...event,
        positionPercentage,
        originalIndex: events.findIndex(e => e === event)
      };
    });
    
    // Auto-position events to prevent overlap
    const VERTICAL_SPACING = 120; // Increased spacing between layers for better separation
    const MIN_HORIZONTAL_DISTANCE = 150; // Minimum horizontal distance to trigger vertical offset
    const BASE_OFFSET = -100; // Increased base position above timeline (100px from timeline)
    
    for (let i = 0; i < positionedEvents.length; i++) {
      const currentEvent = positionedEvents[i];
      let verticalLevel = 0;
      
      // Check for conflicts with previous events
      for (let j = 0; j < i; j++) {
        const prevEvent = positionedEvents[j];
        
        if (timelineData.orientation === 'horizontal') {
          // For horizontal timelines, check horizontal distance
          const horizontalDistance = Math.abs(currentEvent.positionPercentage - prevEvent.positionPercentage);
          const pixelDistance = (horizontalDistance / 100) * 800; // Assume 800px timeline width
          
          if (pixelDistance < MIN_HORIZONTAL_DISTANCE) {
            // Events are too close horizontally, need to offset vertically
            const prevVerticalLevel = Math.floor(Math.abs(prevEvent.autoYOffset || BASE_OFFSET) / VERTICAL_SPACING);
            verticalLevel = Math.max(verticalLevel, prevVerticalLevel + 1);
          }
        } else {
          // For vertical timelines, check vertical distance
          const verticalDistance = Math.abs(currentEvent.positionPercentage - prevEvent.positionPercentage);
          const pixelDistance = (verticalDistance / 100) * 600; // Assume 600px timeline height
          
          if (pixelDistance < MIN_HORIZONTAL_DISTANCE) {
            // Events are too close vertically, need to offset horizontally
            const prevHorizontalLevel = Math.floor(Math.abs(prevEvent.autoXOffset || -40) / VERTICAL_SPACING);
            verticalLevel = Math.max(verticalLevel, prevHorizontalLevel + 1);
          }
        }
      }
      
      // Apply automatic positioning
      if (timelineData.orientation === 'horizontal') {
        currentEvent.autoYOffset = BASE_OFFSET - (verticalLevel * VERTICAL_SPACING);
        currentEvent.autoXOffset = 0; // Reset manual x offset for clean auto-positioning
      } else {
        currentEvent.autoXOffset = -100 - (verticalLevel * VERTICAL_SPACING); // Increased base offset for vertical
        currentEvent.autoYOffset = 0; // Reset manual y offset for clean auto-positioning
      }
    }
    
    // Return events in original order with positioning data
    return events.map(originalEvent => {
      const positionedEvent = positionedEvents.find(pe => 
        events[pe.originalIndex] === originalEvent
      );
      return {
        ...originalEvent,
        autoXOffset: positionedEvent?.autoXOffset || (timelineData.orientation === 'vertical' ? -100 : 0),
        autoYOffset: positionedEvent?.autoYOffset || (timelineData.orientation === 'horizontal' ? BASE_OFFSET : 0)
      };
    });
  };
  
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
  
  // Håndter hover over tidslinjen for å vise dato
  const handleTimelineMouseMove = (e) => {
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
    setShowHoverDate(false);
  };
  
  // Håndter klikk på tidslinjen for å opprette ny hendelse
  const handleTimelineLineClick = (e) => {
    // Bare utløs på direkte klikk på tidslinje-linjen
    if (e.target.classList.contains('timeline-line')) {
      e.stopPropagation();
      
      // Sjekk om tidslinjen har start og slutt dato
      if (!timelineData.start || !timelineData.end) {
        // Ikke gjør noe hvis tidslinjen ikke er initialisiert
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
  
  // Funksjon for å legge til en ny hendelse fra modalen
  const addNewEvent = (newEvent) => {
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

  // Handle event dragging with 2D movement
  const handleEventDrag = (index, xOffset, yOffset) => {
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
  
  // Handle showing event details in the side panel (no longer opens edit modal)
  const handleShowEventDetail = (event, index) => {
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
  
  // Handle event deletion
  const handleDeleteEvent = (event, index) => {
    setEventToDelete(index);
    setShowConfirmDelete(true);
    setLastClickedEvent(index);
  };
  
  // Save edited event from the detail panel
  const handleSaveEventFromPanel = (updatedEvent) => {
    if (!detailEvent || detailEvent.index === undefined) return;
    
    const newEvents = [...timelineData.events];
    const eventIndex = detailEvent.index;
    
    const currentEvent = newEvents[eventIndex];
    newEvents[eventIndex] = {
      ...updatedEvent,
      xOffset: currentEvent.xOffset || 0,
      yOffset: currentEvent.yOffset || currentEvent.offset || 0,
      offset: currentEvent.yOffset || currentEvent.offset || 0
    };
    
    setTimelineData({
      ...timelineData,
      events: newEvents
    });
    
    // Update the detail event to reflect changes
    setDetailEvent({...updatedEvent, index: eventIndex});
  };
  
  // Delete event from detail panel
  const handleDeleteFromPanel = (event, index) => {
    setShowDetailPanel(false);
    setEventToDelete(index !== undefined ? index : detailEvent?.index);
    setShowConfirmDelete(true);
  };
  
  // Confirm delete event
  const confirmDeleteEvent = () => {
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
  
  // Handle right click to show context menu
  const handleContextMenu = (e) => {
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
  
  // Handle color selection for background
  const handleColorSelect = (color) => {
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
  
  // Handle timeline style selection (color & thickness)
  const handleStyleSelect = (style) => {
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
  
  // Handle background image selection
  const handleBackgroundImageSelect = (imageName) => {
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
  
  // Handle interval toggle from context menu - UPDATED for consistent state
  const handleIntervalToggle = (shouldShow) => {
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
  
  // Handle interval count change from context menu
  const handleIntervalCountChange = (count) => {
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
  
  // Handle interval type change from context menu
  const handleIntervalTypeChange = (type) => {
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
    
    // Don't automatically close detail panel when timeline data changes
    // The panel should only close when user explicitly clicks the close button
  }, [timelineData]);
  
  // Calculate timeline duration
  const calculateTimelineDuration = () => {
    if (!timelineData.start || !timelineData.end) return '';
    
    const startDate = timelineData.start instanceof Date ? 
      timelineData.start : 
      new Date(timelineData.start);
    const endDate = timelineData.end instanceof Date ?
      timelineData.end :
      new Date(timelineData.end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '';
    
    // Calculate difference in months
    const years = endDate.getFullYear() - startDate.getFullYear();
    const months = endDate.getMonth() - startDate.getMonth();
    const totalMonths = years * 12 + months;
    
    if (totalMonths === 0) {
      // Same month, calculate days
      const days = Math.abs(endDate.getDate() - startDate.getDate());
      if (days === 0) return 'samme dag';
      return days === 1 ? '1 dag' : `${days} dager`;
    }
    
    const finalYears = Math.floor(totalMonths / 12);
    const finalMonths = totalMonths % 12;
    
    let duration = '';
    if (finalYears > 0) {
      duration += finalYears === 1 ? '1 år' : `${finalYears} år`;
    }
    if (finalMonths > 0) {
      if (duration) duration += ', ';
      duration += finalMonths === 1 ? '1 mnd' : `${finalMonths} mnd`;
    }
    
    return duration || '0 mnd';
  };
  
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
          onContextMenu={handleContextMenu}
          onClick={handleTimelineClick}
          style={getContainerStyle()}
        >
          <div id="timeline" className="timeline" ref={timelineRef}>
            <div className="timeline-line" style={getTimelineLineStyle()}></div>
          </div>
          
          {showContextMenu && (
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
        onContextMenu={handleContextMenu}
        onClick={handleTimelineClick}
        style={getContainerStyle()}
      >
        <div 
          id="timeline" 
          className={`timeline ${timelineData.orientation}`} 
          ref={timelineRef}
        >
          {/* Tidslinjeelement med klikk og hover-funksjonalitet */}
          <div 
            className="timeline-line" 
            style={getTimelineLineStyle()} 
            onClick={handleTimelineLineClick}
            onMouseMove={handleTimelineMouseMove}
            onMouseLeave={handleTimelineMouseLeave}
          ></div>

          <TimelineIntervals 
            timelineData={timelineData}
            intervalCount={localIntervalCount}
            showIntervals={localShowIntervals}
            intervalType={localIntervalType}
          />
          
          {/* Updated events rendering with automatic positioning */}
          {calculateEventPositions(timelineData.events, timelineData).map((event, index) => {
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
                onDrag={handleEventDrag}
                zoom={zoom}
                timelineColor={timelineColor}
                timelineThickness={timelineThickness}
                setLastClickedEvent={setLastClickedEvent}
                lastClickedEvent={lastClickedEvent}
                onShowDetail={handleShowEventDetail}
                autoXOffset={event.autoXOffset || 0}
                autoYOffset={event.autoYOffset || 0}
              />
            );
          })}
        </div>
        
        {/* Vis hoverdato når musen er over tidslinjen */}
        {showHoverDate && (
          <div className="timeline-hover-date" style={{
            position: 'absolute',
            top: hoverPosition.y - 35,
            left: hoverPosition.x,
            transform: 'translateX(-50%)'
          }}>
            {formatDate(hoverDate)}
          </div>
        )}
        
        {showContextMenu && (
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
          onSave={handleSaveEventFromPanel}
          onDelete={handleDeleteFromPanel}
        />
        
        {showConfirmDelete && (
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
        
        {/* Timeline info bar at bottom */}
        <div className="timeline-info-bar">
          <div className="timeline-duration">
            {timelineData.start && timelineData.end && (
              <span>Varighet: {calculateTimelineDuration()}</span>
            )}
          </div>
          <div className="timeline-instructions">
            <strong>Klikk og dra</strong> tidslinjen for å endre view • 
            <strong> Dobbelklikk</strong> for å nullstille • 
            <strong> Høyreklikk</strong> på canvas for å redigere tidslinje • 
            <strong> Høyreklikk</strong> på hendelser for å redigere dem
          </div>
        </div>
        
        {/* CreateEventModal for hendelsesopprettelse ved klikk */}
        <CreateEventModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={addNewEvent}
          position={createModalPosition}
          date={createEventDate}
          timelineColor={timelineColor}
        />
      </div>
    </>
  );
}

export default Timeline;