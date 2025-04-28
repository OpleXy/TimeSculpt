import { useRef, useEffect, useState, useCallback } from 'react';
import TimelineEvent from './TimelineEvent';
import EventEditModal from './EventEditModal';
import TimelineContextMenu from './TimelineContextMenu';
import EventDetailPanel from './EventDetailPanel';
import BackgroundManager from './BackgroundManager';
import TimelineIntervals from './TimelineIntervals';
import { setDocumentTitle } from '../services/documentTitleService';

function Timeline({ 
  timelineData, 
  setTimelineData,
  // Added props for interval markers
  showIntervals = true,
  intervalCount = 5,
  intervalType = 'even', // Add default interval type
  onUpdateIntervalSettings
}) {
  const timelineRef = useRef(null);
  const containerRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [translatePos, setTranslatePos] = useState({ x: 280, y: 125 }); // Set default values directly here
  const [zoom, setZoom] = useState(0.7);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingEventIndex, setEditingEventIndex] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

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
  
  // Handle event editing and bring to front
  const handleEditEvent = (event, index) => {
    setEditingEvent({...event, index});
    setEditingEventIndex(index);
    setLastClickedEvent(index);
    setShowDetailPanel(false);
  };
  
  // Handle showing event details in the side panel
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
  
  // Save edited event
  const handleSaveEvent = (updatedEvent) => {
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
  
  // Delete event from modal with confirmation
  const handleDeleteFromModal = (event, index) => {
    setEditingEvent(null);
    setEditingEventIndex(null);
    setShowDetailPanel(false);
    setEventToDelete(index !== undefined ? index : editingEventIndex);
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
          <div className="timeline-line" style={getTimelineLineStyle()}></div>

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
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
                zoom={zoom}
                timelineColor={timelineColor}
                timelineThickness={timelineThickness}
                setLastClickedEvent={setLastClickedEvent}
                lastClickedEvent={lastClickedEvent}
                onShowDetail={handleShowEventDetail}
              />
            );
          })}
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
          />
        )}
        
        <EventDetailPanel 
          event={detailEvent}
          isOpen={showDetailPanel}
          onClose={handleCloseDetailPanel}
          onEdit={handleEditEvent}
          onDelete={handleDeleteFromModal}
        />
        
        {editingEvent && (
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
      </div>
    </>
  );
}

export default Timeline;