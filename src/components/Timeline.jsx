// src/components/Timeline.jsx - KOMPLETT versjon med fikset bakgrunnsfiltrering
import { useRef, useEffect, useState, useCallback } from 'react';
import TimelineEvent from './TimelineEvent';
import TimelineContextMenu from './contextMenu';
import EventContextMenu from './EventContextMenu';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import BackgroundManager from './BackgroundManager';
import TimelineIntervals from './TimelineIntervals';
import CreateEventModal from './CreateEventModal';
import EditEventModal from './EditEventModal';
import { setDocumentTitle } from '../services/documentTitleService';
import { smartLayout, needsRelayout, resetEventLayout } from '../services/eventLayoutService';

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
  
  // States for edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);
  
  // States for hover date display
  const [showHoverDate, setShowHoverDate] = useState(false);
  const [hoverDate, setHoverDate] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  // State for context menu and styling
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [backgroundColor, setBackgroundColor] = useState('white');
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(null);
  
  // State for event context menu
  const [showEventContextMenu, setShowEventContextMenu] = useState(false);
  const [eventContextMenuPosition, setEventContextMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenuEvent, setContextMenuEvent] = useState(null);
  
  // State for delete confirmation modal
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteEventToConfirm, setDeleteEventToConfirm] = useState(null);
  
  // State for timeline color and thickness
  const [timelineColor, setTimelineColor] = useState('#007bff');
  const [timelineThickness, setTimelineThickness] = useState(2);
  
  // State for interval markers
  const [localShowIntervals, setLocalShowIntervals] = useState(showIntervals);
  const [localIntervalCount, setLocalIntervalCount] = useState(intervalCount);
  const [localIntervalType, setLocalIntervalType] = useState(intervalType);
  
  // State to track last clicked event for z-index ordering
  const [lastClickedEvent, setLastClickedEvent] = useState(null);

  // Auto-layout state
  const [autoLayoutEnabled, setAutoLayoutEnabled] = useState(true);

  useEffect(() => {
    if (timelineData && timelineData.title) {
      setDocumentTitle(timelineData.title);
    } else {
      setDocumentTitle('Hjem');
    }
  }, [timelineData?.title]);
  
  // Update local state when props change
  useEffect(() => {
    setLocalShowIntervals(showIntervals);
    setLocalIntervalCount(intervalCount);
    setLocalIntervalType(intervalType);
  }, [showIntervals, intervalCount, intervalType]);

  // Auto-layout function
  const applyAutoLayout = useCallback(() => {
    if (!timelineData.events || timelineData.events.length === 0 || !autoLayoutEnabled) {
      return;
    }
    
    if (!needsRelayout(timelineData.events)) {
      return;
    }
    
    console.log('🔄 Anvender auto-layout på', timelineData.events.length, 'hendelser...');
    
    const layoutedEvents = smartLayout(
      timelineData.events,
      timelineData.orientation,
      timelineData.start,
      timelineData.end
    );
    
    setTimelineData(prevData => ({
      ...prevData,
      events: layoutedEvents
    }));
    
    console.log('✅ Auto-layout anvendt på', layoutedEvents.length, 'hendelser');
  }, [timelineData.events, timelineData.orientation, timelineData.start, timelineData.end, autoLayoutEnabled, setTimelineData]);

  // Auto-layout effect
  useEffect(() => {
    if (timelineData.events && timelineData.events.length >= 3 && autoLayoutEnabled) {
      const layoutTimer = setTimeout(() => {
        applyAutoLayout();
      }, 500);
      
      return () => clearTimeout(layoutTimer);
    }
  }, [timelineData.events?.length, applyAutoLayout, autoLayoutEnabled]);

  // Manual layout-reset function
  const handleResetLayout = () => {
    if (!timelineData.events) return;
    
    console.log('🔄 Tilbakestiller layout for alle hendelser...');
    
    const resetEvents = resetEventLayout(timelineData.events);
    setTimelineData(prevData => ({
      ...prevData,
      events: resetEvents
    }));
    
    if (autoLayoutEnabled) {
      setTimeout(() => {
        applyAutoLayout();
      }, 100);
    }
  };

  // Toggle for auto-layout
  const handleAutoLayoutToggle = (enabled) => {
    console.log('🔧 Auto-layout', enabled ? 'aktivert' : 'deaktivert');
    setAutoLayoutEnabled(enabled);
    
    if (enabled && timelineData.events && timelineData.events.length >= 3) {
      setTimeout(() => {
        applyAutoLayout();
      }, 100);
    }
  };
  
  // Format date function
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
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    }
  };
  
  // Handle timeline hover for date display
  const handleTimelineMouseMove = (e) => {
    if (e.target.classList.contains('timeline-line')) {
      if (!timelineData.start || !timelineData.end) {
        return;
      }
      
      const startDate = timelineData.start instanceof Date ? 
        timelineData.start : 
        new Date(timelineData.start);
        
      const endDate = timelineData.end instanceof Date ?
        timelineData.end :
        new Date(timelineData.end);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return;
      }
      
      const rect = e.target.getBoundingClientRect();
      let hoverPos = { x: e.clientX, y: e.clientY };
      let hoverDt;
      
      if (timelineData.orientation === 'horizontal') {
        const hoverX = e.clientX - rect.left;
        const hoverPercentage = hoverX / rect.width;
        
        const timeRange = endDate.getTime() - startDate.getTime();
        const timestamp = startDate.getTime() + (timeRange * hoverPercentage);
        hoverDt = new Date(timestamp);
        
      } else {
        const hoverY = e.clientY - rect.top;
        const hoverPercentage = hoverY / rect.height;
        
        const timeRange = endDate.getTime() - startDate.getTime();
        const timestamp = startDate.getTime() + (timeRange * hoverPercentage);
        hoverDt = new Date(timestamp);
      }
      
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
  
  // Hide hover date when mouse leaves timeline
  const handleTimelineMouseLeave = () => {
    setShowHoverDate(false);
  };
  
  // Handle timeline line click to create new event
  const handleTimelineLineClick = (e) => {
    if (e.target.classList.contains('timeline-line')) {
      e.stopPropagation();
      
      if (!timelineData.start || !timelineData.end) {
        return;
      }
      
      const startDate = timelineData.start instanceof Date ? 
        timelineData.start : 
        new Date(timelineData.start);
        
      const endDate = timelineData.end instanceof Date ?
        timelineData.end :
        new Date(timelineData.end);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('Ugyldige tidslinje-datoer:', { start: timelineData.start, end: timelineData.end });
        return;
      }
      
      const rect = e.target.getBoundingClientRect();
      let clickPosition;
      let clickDate;
      
      if (timelineData.orientation === 'horizontal') {
        const clickX = e.clientX - rect.left;
        const clickPercentage = clickX / rect.width;
        clickPosition = { x: e.clientX, y: e.clientY };
        
        const timeRange = endDate.getTime() - startDate.getTime();
        const timestamp = startDate.getTime() + (timeRange * clickPercentage);
        clickDate = new Date(timestamp);
        
      } else {
        const clickY = e.clientY - rect.top;
        const clickPercentage = clickY / rect.height;
        clickPosition = { x: e.clientX, y: e.clientY };
        
        const timeRange = endDate.getTime() - startDate.getTime();
        const timestamp = startDate.getTime() + (timeRange * clickPercentage);
        clickDate = new Date(timestamp);
      }
      
      if (!clickDate || isNaN(clickDate.getTime())) {
        console.error('Kunne ikke beregne gyldig dato fra klikk');
        clickDate = new Date();
      }
      
      console.log('Beregnet dato fra klikk:', clickDate.toISOString());
      
      setCreateEventDate(clickDate);
      setCreateModalPosition(clickPosition);
      setShowCreateModal(true);
    }
  };
  
  // Add new event from modal
  const addNewEvent = (newEvent) => {
    const updatedEvents = [...timelineData.events, newEvent];
    
    setTimelineData({
      ...timelineData,
      events: updatedEvents
    });
  };
  
  // Handle opening edit modal
  const handleEditEvent = (event, index) => {
    setEventToEdit({...event, index});
    setShowEditModal(true);
    setShowDetailPanel(false);
  };
  
  // Handle saving edited event from modal
  const handleSaveEventFromModal = (updatedEvent) => {
    if (!eventToEdit || eventToEdit.index === undefined) return;
    
    const newEvents = [...timelineData.events];
    const eventIndex = eventToEdit.index;
    
    newEvents[eventIndex] = {
      ...updatedEvent,
      xOffset: eventToEdit.xOffset || 0,
      yOffset: eventToEdit.yOffset || eventToEdit.offset || 0,
      offset: eventToEdit.yOffset || eventToEdit.offset || 0,
      autoLayouted: eventToEdit.autoLayouted || false,
      manuallyPositioned: eventToEdit.manuallyPositioned || false
    };
    
    setTimelineData({
      ...timelineData,
      events: newEvents
    });
    
    setShowEditModal(false);
    setEventToEdit(null);
  };
  
  // Handle deleting event from modal
  const handleDeleteEventFromModal = (event, index) => {
    const eventIndex = typeof index === 'number' ? index : eventToEdit?.index;
    if (eventIndex === undefined) return;
    
    const newEvents = [...timelineData.events];
    newEvents.splice(eventIndex, 1);
    
    setTimelineData({
      ...timelineData,
      events: newEvents
    });
    
    setShowEditModal(false);
    setEventToEdit(null);
    
    if (lastClickedEvent === eventIndex) {
      setLastClickedEvent(null);
    } else if (lastClickedEvent > eventIndex) {
      setLastClickedEvent(lastClickedEvent - 1);
    }
  };
  
  // FIXED: Callback for when a background image is loaded
  const handleBackgroundLoaded = useCallback((loadedImageData) => {
    console.log('✅ Background loaded:', loadedImageData);
    
    if (loadedImageData) {
      // Handle both simple URLs and structured data
      if (typeof loadedImageData === 'object') {
        setBackgroundImageUrl(loadedImageData);
      } else {
        // Convert simple URL to structured format for consistency
        setBackgroundImageUrl({
          url: loadedImageData,
          filters: 'none'
        });
      }
    } else {
      setBackgroundImageUrl(null);
    }
  }, []);
  
  // Handle event dragging with 2D movement
  const handleEventDrag = (index, xOffset, yOffset) => {
    const newEvents = [...timelineData.events];
    
    newEvents[index] = {
      ...newEvents[index],
      xOffset: xOffset,
      yOffset: yOffset,
      offset: yOffset,
      autoLayouted: false,
      manuallyPositioned: true
    };
    
    setTimelineData({
      ...timelineData,
      events: newEvents
    });
  };
  
  // Handle showing event details in the side panel
  const handleShowEventDetail = (event, index) => {
    handleEditEvent(event, index);
  };
  
  // Handle closing the detail panel
  const handleCloseDetailPanel = () => {
    setShowDetailPanel(false);
  };
  
  // Handle event context menu (right-click on events)
  const handleEventContextMenu = (e, event, index) => {
    e.preventDefault();
    e.stopPropagation();
    
    setShowContextMenu(false);
    setShowDetailPanel(false);
    
    setContextMenuEvent({ ...event, index });
    setEventContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowEventContextMenu(true);
    setLastClickedEvent(index);
  };
  
  // Handle edit event from context menu
  const handleEditEventFromContextMenu = (event) => {
    handleEditEvent(event, event.index);
    setShowEventContextMenu(false);
  };
  
  // Handle delete event from context menu
  const handleDeleteEventFromContextMenu = (event) => {
    setDeleteEventToConfirm(event);
    setShowDeleteConfirmation(true);
    setShowEventContextMenu(false);
  };
  
  // Close event context menu
  const closeEventContextMenu = () => {
    setShowEventContextMenu(false);
    setContextMenuEvent(null);
  };
  
  // Confirm delete from new modal
  const confirmDeleteFromModal = () => {
    if (!deleteEventToConfirm) return;
    
    const index = deleteEventToConfirm.index;
    if (index === undefined) return;
    
    const newEvents = [...timelineData.events];
    newEvents.splice(index, 1);
    
    setTimelineData({
      ...timelineData,
      events: newEvents
    });
    
    setShowDeleteConfirmation(false);
    setDeleteEventToConfirm(null);
    
    if (detailEvent && detailEvent.index === index) {
      setShowDetailPanel(false);
    }
    
    if (lastClickedEvent === index) {
      setLastClickedEvent(null);
    } 
    else if (lastClickedEvent > index) {
      setLastClickedEvent(lastClickedEvent - 1);
    }
  };
  
  // Cancel delete from new modal
  const cancelDeleteFromModal = () => {
    setShowDeleteConfirmation(false);
    setDeleteEventToConfirm(null);
  };
  
  // Legacy delete event handler
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
      offset: currentEvent.yOffset || currentEvent.offset || 0,
      autoLayouted: currentEvent.autoLayouted || false,
      manuallyPositioned: currentEvent.manuallyPositioned || false
    };
    
    setTimelineData({
      ...timelineData,
      events: newEvents
    });
    
    setDetailEvent({...updatedEvent, index: eventIndex});
  };
  
  // Delete event from detail panel
  const handleDeleteFromPanel = (event, index) => {
    setShowDetailPanel(false);
    setDeleteEventToConfirm(index !== undefined ? { index } : detailEvent);
    setShowDeleteConfirmation(true);
  };
  
  // Legacy confirm delete event
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
  
  // Set up timeline interactions
  useEffect(() => {
    const timeline = timelineRef.current;
    const container = containerRef.current;
    
    if (!timeline || !container) return;
    
    timeline.style.transformOrigin = 'top left';
    
    const updateTransform = () => {
      timeline.style.transform = `translate3d(${translatePos.x}px, ${translatePos.y}px, 0) scale(${zoom})`;
    };
    
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
      
      newZoom = Math.max(0.5, Math.min(3, newZoom));
      
      const worldX = (mouseX - translatePos.x) / currentZoom;
      const worldY = (mouseY - translatePos.y) / currentZoom;
      
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
        
        const containerCenterX = rect.width / 2;
        const containerCenterY = rect.height / 2;
        
        const timelineRect = timeline.getBoundingClientRect();
        const timelineWidth = timelineRect.width / zoom;
        const timelineHeight = timelineRect.height / zoom;
        
        let newTranslateX, newTranslateY;
        
        if (timelineData.orientation === 'horizontal') {
          newTranslateX = containerCenterX - (timelineWidth / 2) * defaultZoom;
          newTranslateY = containerCenterY - (timelineHeight / 2) * defaultZoom;
        } else {
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
    
    if (style.orientation !== undefined) {
      setTimelineData({
        ...timelineData,
        orientation: style.orientation
      });
    }
  };
  
  // FIXED: Handle background image selection
  const handleBackgroundImageSelect = (imageData) => {
    console.log('🖼️ Background image select:', imageData);
    
    if (imageData) {
      // Handle structured image data from image editor
      if (typeof imageData === 'object' && imageData.url) {
        console.log('📝 Setting structured background:', {
          url: imageData.url,
          filters: imageData.filters || 'none'
        });
        
        setBackgroundImage(imageData);
        setBackgroundColor(null);
        
        // Update timeline data with structured background
        setTimelineData({
          ...timelineData,
          backgroundImage: imageData,
          backgroundColor: null
        });
        
      } else if (typeof imageData === 'string') {
        // Handle simple string (predefined image)
        console.log('📁 Setting predefined background:', imageData);
        
        setBackgroundImage(imageData);
        setBackgroundColor(null);
        
        setTimelineData({
          ...timelineData,
          backgroundImage: imageData,
          backgroundColor: null
        });
      }
      
    } else {
      // Remove background
      console.log('🗑️ Removing background');
      
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
  
  // Handle interval toggle from context menu
  const handleIntervalToggle = (shouldShow) => {
    setLocalShowIntervals(shouldShow);
    
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
    setLocalIntervalCount(count);
    
    setTimelineData({
      ...timelineData,
      intervalCount: count,
      intervalSettings: {
        ...(timelineData.intervalSettings || {}),
        count: count
      }
    });
    
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
    setLocalIntervalType(type);
    
    setTimelineData({
      ...timelineData,
      intervalType: type,
      intervalSettings: {
        ...(timelineData.intervalSettings || {}),
        type: type
      }
    });
    
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
  
  // UPDATED: Set styling from timelineData when it changes
  useEffect(() => {
    console.log('🔄 Timeline data changed, updating styles:', {
      backgroundColor: timelineData.backgroundColor,
      backgroundImage: timelineData.backgroundImage
    });
    
    if (timelineData.backgroundColor) {
      setBackgroundColor(timelineData.backgroundColor);
      setBackgroundImage(null);
      setBackgroundImageUrl(null);
    } else if (timelineData.backgroundImage) {
      setBackgroundImage(timelineData.backgroundImage);
      setBackgroundColor(null);
      
      // Trigger BackgroundManager to load the image
      // The handleBackgroundLoaded callback will set backgroundImageUrl
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
    
    // Handle interval settings
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
  
  // FIXED: Get container style including background color or image - PROPERLY HANDLES FILTERED BACKGROUNDS
  const getContainerStyle = () => {
    const baseStyle = {};
    
    // Check if we have a filtered background image
    const hasFilteredBackground = backgroundImageUrl && 
      typeof backgroundImageUrl === 'object' && 
      backgroundImageUrl.url && 
      backgroundImageUrl.filters && 
      backgroundImageUrl.filters !== 'none';
    
    if (hasFilteredBackground) {
      // FIXED: Use CSS custom properties for filtered backgrounds
      baseStyle['--bg-image'] = `url(${backgroundImageUrl.url})`;
      baseStyle['--bg-filter'] = backgroundImageUrl.filters;
      baseStyle.backgroundColor = 'transparent';
      
      // Signal that this container has a filtered background
      baseStyle['data-has-filtered-background'] = 'true';
      
    } else if (backgroundImageUrl) {
      // Handle other background image formats
      let imageUrl;
      
      if (typeof backgroundImageUrl === 'object' && backgroundImageUrl.url) {
        imageUrl = backgroundImageUrl.url;
      } else if (typeof backgroundImageUrl === 'string') {
        if (backgroundImageUrl.startsWith('http')) {
          imageUrl = backgroundImageUrl;
        } else {
          imageUrl = `/backgrounds/${backgroundImageUrl}`;
        }
      }
      
      if (imageUrl) {
        baseStyle.backgroundImage = `url(${imageUrl})`;
        baseStyle.backgroundSize = 'cover';
        baseStyle.backgroundPosition = 'center';
        baseStyle.backgroundRepeat = 'no-repeat';
        baseStyle.backgroundColor = 'transparent';
      }
      
    } else if (backgroundColor) {
      // Solid color background
      baseStyle.backgroundColor = backgroundColor;
      baseStyle.backgroundImage = 'none';
    } else {
      // Default fallback
      baseStyle.backgroundColor = 'white';
      baseStyle.backgroundImage = 'none';
    }
    
    // IMPORTANT: Never apply filter to main container
    baseStyle.filter = 'none';
    
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
            isVertical={timelineData.orientation === 'vertical'}
            // Auto-layout props
            autoLayoutEnabled={autoLayoutEnabled}
            onAutoLayoutToggle={handleAutoLayoutToggle}
            onResetLayout={handleResetLayout}
            />
          )}
        </div>
      </>
    );
  }

  // UPDATED: Main component render with proper filtered background handling
  const containerStyle = getContainerStyle();
  const hasFilteredBackground = containerStyle['data-has-filtered-background'] === 'true';
  
  // Separate data attributes from style
  const { 'data-has-filtered-background': dataAttr, ...styleProps } = containerStyle;
  
  return (
    <>
      <BackgroundManager 
        backgroundImage={backgroundImage} 
        onBackgroundLoaded={handleBackgroundLoaded}
      />
      
      <div 
        id="timelineContainer" 
        className={`timeline-container ${showDetailPanel ? 'with-detail-panel' : ''} ${hasFilteredBackground ? 'has-filtered-background' : ''}`}
        ref={containerRef}
        onContextMenu={handleContextMenu}
        onClick={handleTimelineClick}
        style={styleProps}
        data-has-filtered-background={hasFilteredBackground ? 'true' : 'false'}
      >
        <div 
          id="timeline" 
          className={`timeline ${timelineData.orientation}`} 
          ref={timelineRef}
        >
          {/* Timeline line with click and hover functionality */}
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
                onDrag={handleEventDrag}
                zoom={zoom}
                timelineColor={timelineColor}
                timelineThickness={timelineThickness}
                setLastClickedEvent={setLastClickedEvent}
                lastClickedEvent={lastClickedEvent}
                onShowDetail={handleShowEventDetail}
                onContextMenu={handleEventContextMenu}
              />
            );
          })}
        </div>
        
        {/* Show hover date when mouse is over timeline */}
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
            // Auto-layout props
            autoLayoutEnabled={autoLayoutEnabled}
            onAutoLayoutToggle={handleAutoLayoutToggle}
            onResetLayout={handleResetLayout}
          />
        )}
        
        {/* Event Context Menu */}
        {showEventContextMenu && contextMenuEvent && (
          <EventContextMenu
            position={eventContextMenuPosition}
            event={contextMenuEvent}
            onEdit={handleEditEventFromContextMenu}
            onDelete={handleDeleteEventFromContextMenu}
            onClose={closeEventContextMenu}
          />
        )}
        
        {/* Edit Event Modal */}
        <EditEventModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveEventFromModal}
          onDelete={handleDeleteEventFromModal}
          event={eventToEdit}
          timelineData={timelineData}
        />
        
        {/* New Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteConfirmation}
          eventTitle={deleteEventToConfirm?.title || deleteEventToConfirm?.plainTitle}
          onConfirm={confirmDeleteFromModal}
          onCancel={cancelDeleteFromModal}
        />
        
        {/* Legacy Delete Confirmation Modal */}
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
{/* Bottom timeline info bar */}
<div className="timeline-info-bar">
  <div className="timeline-duration">
    {timelineData.start && timelineData.end && <span>Varighet: {calculateTimelineDuration()}</span>}
  </div>
  <div className="timeline-instructions">
    <strong>Tips!</strong> scroll = <strong>Zoom</strong> | dobbelklikk = <strong>Nullstill</strong> | høyreklikk på canvas = <strong>Rediger tidslinje</strong> | høyreklikk på hendelser = <strong>Rediger hendelser</strong> | dra canvas = <strong>Naviger</strong> | dra hendelsene = <strong>Flytt hendelsene</strong>
  </div>
</div>

{/* Create event modal */}
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