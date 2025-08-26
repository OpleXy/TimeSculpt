import React, { useState, useRef, useEffect, useMemo } from 'react';

function TimelineEvent({ 
  event, 
  index, 
  orientation, 
  positionPercentage, 
  onDrag, 
  zoom, 
  timelineColor, 
  timelineThickness, 
  setLastClickedEvent, 
  lastClickedEvent, 
  onShowDetail,
  onContextMenu
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isSnapped, setIsSnapped] = useState(false);
  const eventRef = useRef(null);
  const lineRef = useRef(null);
  
  // Snapping threshold in pixels (adjusted for zoom)
  const SNAP_THRESHOLD = 10; // pixels
  
  // Color mapping for event colors
  const colorMap = {
    default: timelineColor, // Use timeline color for default
    blue: '#007bff',
    green: '#28a745',
    red: '#dc3545',
    orange: '#fd7e14',
    purple: '#6f42c1'
  };
  
  // Set position based on timeline orientation and 2D offset
  const getPosition = () => {
    const isTopEvent = lastClickedEvent === index;
    
    // Allow for both x and y offsets
    const xOffset = event.xOffset || 0;
    const yOffset = event.yOffset || (event.offset || 0); // For backward compatibility
    
    if (orientation === 'horizontal') {
      return {
        left: `calc(${positionPercentage}% + ${xOffset}px)`,
        top: `calc(50% + ${yOffset}px)`,
        zIndex: isTopEvent ? 30 : 10
      };
    } else {
      return {
        top: `calc(${positionPercentage}% + ${yOffset}px)`,
        left: `calc(50% + ${xOffset}px)`,
        zIndex: isTopEvent ? 30 : 10
      };
    }
  };
  
  // Calculate the path for the connecting line
  const getLineStyle = () => {
    // Use both x and y offsets for calculating line position
    const xOffset = event.xOffset || 0;
    const yOffset = event.yOffset || (event.offset || 0);
    
    // Get event coordinates and timeline coordinates
    let eventX, eventY, timelineX, timelineY;
  
    if (orientation === 'horizontal') {
      // Calculate coordinates for horizontal timeline
      timelineX = `${positionPercentage}%`;
      timelineY = '50%';
      eventX = `calc(${positionPercentage}% + ${xOffset}px)`;
      eventY = `calc(50% + ${yOffset}px)`;
    } else {
      // Calculate coordinates for vertical timeline
      timelineX = '50%';
      timelineY = `${positionPercentage}%`;
      eventX = `calc(50% + ${xOffset}px)`;
      eventY = `calc(${positionPercentage}% + ${yOffset}px)`;
    }
    
    // Get the event's color (match the border color to the line color)
    const eventColorName = event.color || 'default';
    const lineColor = colorMap[eventColorName] || timelineColor;
    
    return {
      display: 'none', // Hidden initially, we'll use a SVG line instead
      startX: timelineX,
      startY: timelineY,
      endX: eventX,
      endY: eventY,
      color: lineColor
    };
  };
  
  // We no longer need to apply border color directly as we're using CSS classes
  // This function is kept for backward compatibility but doesn't need to set any styles
  const getEventStyle = () => {
    return {}; // Empty style object as we're using CSS classes for styling
  };
  
  // Handle mouse down to start dragging and set as last clicked
  const handleMouseDown = (e) => {
    // Set this event as the last clicked event
    if (setLastClickedEvent) {
      setLastClickedEvent(index);
    }
    
    // Don't drag if right mouse button (contextmenu)
    if (e.button === 2) {
      return;
    }
    
    // Set cursor to 'move' when starting to drag
    if (eventRef.current) {
      eventRef.current.style.cursor = 'move';
    }

    setIsDragging(true);
    
    // Get both x and y starting positions, accounting for existing offsets
    const xOffset = event.xOffset || 0;
    const yOffset = event.yOffset || (event.offset || 0);
    
    setStartPos({
      x: e.clientX - (xOffset * zoom),
      y: e.clientY - (yOffset * zoom)
    });
    
    e.preventDefault();
  };
  
  // Check if the position should be snapped to 90 degrees
  const checkAndApplySnap = (newXOffset, newYOffset) => {
    // For horizontal timeline, we snap when x is close to 0 (vertical alignment)
    if (orientation === 'horizontal') {
      // Check if we're within the snap threshold of x=0
      if (Math.abs(newXOffset) < SNAP_THRESHOLD / zoom) {
        setIsSnapped(true);
        return { x: 0, y: newYOffset }; // Snap the x-coordinate to 0
      }
    } 
    // For vertical timeline, we snap when y is close to 0 (horizontal alignment)
    else {
      // Check if we're within the snap threshold of y=0
      if (Math.abs(newYOffset) < SNAP_THRESHOLD / zoom) {
        setIsSnapped(true);
        return { x: newXOffset, y: 0 }; // Snap the y-coordinate to 0
      }
    }
    
    // If we're not snapping, return the original offsets
    setIsSnapped(false);
    return { x: newXOffset, y: newYOffset };
  };
  
  // Handle mouse move during drag for 2D movement with snapping
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    // Calculate new X and Y offsets, adjusting for zoom
    const newXOffset = (e.clientX - startPos.x) / zoom;
    const newYOffset = (e.clientY - startPos.y) / zoom;
    
    // Check if we should snap to 90 degrees
    const { x: snappedX, y: snappedY } = checkAndApplySnap(newXOffset, newYOffset);
    
    // Update both x and y offsets
    onDrag(index, snappedX, snappedY);
  };
  
  // Handle key press during drag for precise control and snapping toggle
  const handleKeyDown = (e) => {
    if (!isDragging) return;
    
    // Shift key: Force snapping regardless of position
    if (e.key === 'Shift') {
      const currentXOffset = event.xOffset || 0;
      const currentYOffset = event.yOffset || (event.offset || 0);
      
      if (orientation === 'horizontal') {
        onDrag(index, 0, currentYOffset);
        setIsSnapped(true);
      } else {
        onDrag(index, currentXOffset, 0);
        setIsSnapped(true);
      }
    }
  };
  
  // Handle key up to restore normal dragging behavior
  const handleKeyUp = (e) => {
    if (!isDragging) return;
    
    // Shift key released: Resume normal dragging
    if (e.key === 'Shift') {
      // No need to do anything here as the next mouse move will handle normal positioning
    }
  };
  
  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    setIsDragging(false);
    
    // Reset cursor back to default when stopping drag
    if (eventRef.current) {
      eventRef.current.style.cursor = 'default';
    }
  };
  
  // Add and remove event listeners
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [isDragging, startPos, zoom]);
  
  // Format the event date
  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('no-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Only convert class attributes to className for React compatibility, without URL processing
  const processHtmlContent = (html) => {
    if (!html) return '';
    
    // This DOM-based approach prevents incorrect HTML string manipulation
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Convert class attributes to className for React compatibility
    const elementsWithClass = tempDiv.querySelectorAll('[class]');
    elementsWithClass.forEach(element => {
      // Get the class value
      const classValue = element.getAttribute('class');
      // Set it as className (React compatible)
      element.removeAttribute('class');
      element.setAttribute('className', classValue);
    });
    
    return tempDiv.innerHTML;
  };
  
  // Memoize the processed HTML content to avoid recalculating on every render
  const processedContent = useMemo(() => {
    return processHtmlContent(event.title);
  }, [event.title]);
  
  // Handle context menu (right click) - triggers the new context menu
  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Set this event as the last clicked event
    if (setLastClickedEvent) {
      setLastClickedEvent(index);
    }
    
    // Call the context menu handler passed from Timeline
    if (onContextMenu) {
      onContextMenu(e, event, index);
    }
  };

  // Handle double-click - opens detail panel for editing
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    
    // Set this event as the last clicked event
    if (setLastClickedEvent) {
      setLastClickedEvent(index);
    }
    
    // Open the detail panel for editing
    if (onShowDetail) {
      onShowDetail(event, index);
    }
  };
  
  // Handle regular click - only sets as last clicked, doesn't open detail panel
  const handleClick = (e) => {
    // If we're dragging, don't do anything
    if (isDragging) return;
    
    // Set this event as the last clicked event (for z-index ordering)
    if (setLastClickedEvent) {
      setLastClickedEvent(index);
    }
    
    // Stop propagation to prevent timeline interactions
    e.stopPropagation();
  };
  
  // Generate the appropriate size class
  const getSizeClass = () => {
    return event.size || 'medium';
  };

  // Get the color class - use 'default' for timeline default color
  const getColorClass = () => {
    return event.color || 'default';
  };

  // Calculate the line coordinates for the SVG line
  const lineStyle = getLineStyle();
  
  return (
    <>
      {/* SVG line connecting the timeline to the event */}
      <svg 
        className="event-connection-line"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'visible',
          pointerEvents: 'none',
          zIndex: 5
        }}
      >
        <line
          x1={lineStyle.startX}
          y1={lineStyle.startY}
          x2={lineStyle.endX}
          y2={lineStyle.endY}
          stroke={lineStyle.color}
          strokeWidth={timelineThickness || 2}
          vectorEffect="non-scaling-stroke"
          className={isSnapped ? 'snapped' : ''}
        />
      </svg>
      
      {/* Legacy event line - keep the ref for backward compatibility */}
      <div 
        ref={lineRef}
        className={`event-line ${orientation}`}
        style={{ display: 'none' }}
      />
      
      {/* Event box with CSS variable for timeline color */}
      <div
        ref={eventRef}
        className={`event ${isDragging ? 'dragging' : ''} ${event.description ? 'has-description' : ''} ${lastClickedEvent === index ? 'last-clicked' : ''} ${getSizeClass()} ${getColorClass()} ${isSnapped ? 'snapped' : ''}`}
        style={{
          ...getPosition(),
          ...getEventStyle(),
          // Set CSS variable for dynamic timeline color
          '--timeline-color': timelineColor,
          '--timeline-color-dark': timelineColor ? getDarkerColor(timelineColor) : '#0062cc'
        }}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
        onDoubleClick={handleDoubleClick}
        onClick={handleClick}
        data-index={index}
        title={event.description ? "Høyreklikk for kontekstmeny eller dobbelklikk for å redigere" : "Høyreklikk for kontekstmeny eller dobbelklikk for å redigere"}
      >
        <div dangerouslySetInnerHTML={{ __html: processedContent }}></div>
        <br/>
        {formatDate(event.date)}
        
        {/* Small indicator if event has description */}
        {event.description && (
          <div className="event-description-indicator">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="12" 
              height="12" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
          </div>
        )}
      </div>
    </>
  );
}

// Utility function to calculate a darker shade of a color
function getDarkerColor(hexColor) {
  // Return default dark color if no hex color provided
  if (!hexColor) return '#0062cc';
  
  // Remove # if present
  hexColor = hexColor.replace('#', '');
  
  // Parse the color components
  let r = parseInt(hexColor.substring(0, 2), 16);
  let g = parseInt(hexColor.substring(2, 4), 16);
  let b = parseInt(hexColor.substring(4, 6), 16);
  
  // Make color darker by multiplying by 0.8
  r = Math.floor(r * 0.8);
  g = Math.floor(g * 0.8);
  b = Math.floor(b * 0.8);
  
  // Convert back to hex and ensure 2 digits
  const toHex = (c) => {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  // Return the darker color
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default TimelineEvent;