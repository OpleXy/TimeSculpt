import { useRef, useEffect, useState, useCallback } from 'react';
import '../styles/TimelineContextMenu.css';

function TimelineContextMenu({ 
  position, 
  onColorSelect, 
  onStyleSelect, 
  onClose, 
  currentColor, 
  currentThickness, 
  currentBackgroundColor, 
  onBackgroundImageSelect, 
  currentBackgroundImage,
  // Add props for interval markers
  showIntervals = true,
  intervalCount = 5,
  onIntervalToggle,
  onIntervalCountChange,
  // Add interval type prop and handler
  intervalType = 'even',
  onIntervalTypeChange,
  // Add timeline data prop for validation
  timelineData = {}
}) {
  const menuRef = useRef(null);
  const bgImageListRef = useRef(null);
  const [currentView, setCurrentView] = useState('main'); // 'main', 'background', 'thickness', 'color', 'backgroundImage', 'intervals'
  const [scrollPosition, setScrollPosition] = useState(0);
  // Local state for interval count slider
  const [localIntervalCount, setLocalIntervalCount] = useState(intervalCount);
  // State for validation warning
  const [validationWarning, setValidationWarning] = useState('');
  // State for maximum allowed intervals
  const [maxAllowedIntervals, setMaxAllowedIntervals] = useState(20);
  // Local state for interval type
  const [localIntervalType, setLocalIntervalType] = useState(intervalType);
  
  // Available interval types
  const intervalTypes = [
    { id: 'even', label: 'Jevnt fordelt' },
    { id: 'daily', label: 'Daglig' },
    { id: 'weekly', label: 'Ukentlig' },
    { id: 'monthly', label: 'Månedlig' },
    { id: 'yearly', label: 'Årlig' },
    { id: 'century', label: 'Århundre' }
  ];
  
  // State for available interval types
  const [availableTypes, setAvailableTypes] = useState(intervalTypes);
  
  // Constant for minimum days per interval
  const MINIMUM_DAYS_PER_INTERVAL = 2;
  
  // Update local interval count when prop changes
  useEffect(() => {
    setLocalIntervalCount(intervalCount);
  }, [intervalCount]);
  
  // Update local interval type when prop changes
  useEffect(() => {
    setLocalIntervalType(intervalType);
  }, [intervalType]);
  
  // Calculate available interval types and max allowed intervals based on timeline duration
  useEffect(() => {
    if (!timelineData || !timelineData.start || !timelineData.end) {
      setMaxAllowedIntervals(20); // Default max if no timeline data
      setAvailableTypes(intervalTypes);
      return;
    }
    
    // Convert dates to Date objects if they're strings
    const startDate = typeof timelineData.start === 'string' 
      ? new Date(timelineData.start) 
      : timelineData.start;
    
    const endDate = typeof timelineData.end === 'string' 
      ? new Date(timelineData.end) 
      : timelineData.end;
    
    // Calculate time difference in various units
    const timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30); // Approximate
    const diffYears = Math.floor(diffDays / 365); // Approximate
    const diffCenturies = Math.floor(diffYears / 100);
    
    // Determine available interval types based on timeline span
    const types = intervalTypes.filter(type => {
      switch (type.id) {
        case 'daily':
          return diffDays >= 2; // At least 2 days
        case 'weekly':
          return diffWeeks >= 2; // At least 2 weeks
        case 'monthly':
          return diffMonths >= 2; // At least 2 months
        case 'yearly':
          return diffYears >= 2; // At least 2 years
        case 'century':
          return diffCenturies >= 2; // At least 2 centuries
        default:
          return true; // Always include even spacing
      }
    });
    
    setAvailableTypes(types);
    
    // If current interval type is not available, switch to 'even'
    if (!types.find(t => t.id === localIntervalType)) {
      setLocalIntervalType('even');
      // Also update parent component if needed
      if (onIntervalTypeChange) {
        onIntervalTypeChange('even');
      }
    }
    
    // Limit to maximum of 1 marker per day for 'even' type
    if (localIntervalType === 'even') {
      const maxIntervals = Math.min(
        diffDays,
        Math.floor(diffDays / MINIMUM_DAYS_PER_INTERVAL)
      );
      
      // Ensure at least 2 intervals (start and end)
      const calculatedMax = Math.max(2, maxIntervals);
      
      setMaxAllowedIntervals(calculatedMax);
      
      // If current interval count exceeds max, adjust it
      if (localIntervalCount > calculatedMax) {
        setLocalIntervalCount(calculatedMax);
        // Also update parent component if needed
        if (onIntervalCountChange) {
          onIntervalCountChange(calculatedMax);
        }
        
        // Show warning
        const warningMessage = `Maks ${calculatedMax} intervaller for en tidslinje på ${diffDays} dager (maks 1 per dag)`;
        setValidationWarning(warningMessage);
      } else {
        setValidationWarning('');
      }
    }
  }, [timelineData, localIntervalCount, localIntervalType, onIntervalCountChange, onIntervalTypeChange]);
  
  // Apply interval count changes automatically when localIntervalCount changes
  useEffect(() => {
    // Only call the change handler if the value has actually changed
    if (localIntervalCount !== intervalCount && onIntervalCountChange) {
      onIntervalCountChange(localIntervalCount);
    }
  }, [localIntervalCount, intervalCount, onIntervalCountChange]);
  
  // Apply interval type changes automatically when localIntervalType changes
  useEffect(() => {
    // Only call the change handler if the value has actually changed
    if (localIntervalType !== intervalType && onIntervalTypeChange) {
      onIntervalTypeChange(localIntervalType);
    }
  }, [localIntervalType, intervalType, onIntervalTypeChange]);
  
  // Background color options
  const backgroundColors = [
    { name: 'Default', value: 'white' },
    { name: 'Light Gray', value: '#f5f5f5' },
    { name: 'Light Blue', value: '#e3f2fd' },
    { name: 'Light Green', value: '#e8f5e9' },
    { name: 'Light Yellow', value: '#fffde7' },
    { name: 'Light Pink', value: '#fce4ec' },
    { name: 'Light Purple', value: '#f3e5f5' }
  ];
  
  // Background image options with the correct filenames
  const backgroundImages = [
    { name: 'Cctv', value: 'cctv.png' },
    { name: 'Cia', value: 'cia.png' },
    { name: 'Dino', value: 'dino.png' },
    { name: 'Eldre Krig', value: 'eldrekrig.png' },
    { name: 'Eventyr', value: 'eventyr.png' },
    { name: 'Hacker', value: 'hacker.png' },
    { name: 'Huleboer', value: 'huleboer.png' },
    { name: 'Industri', value: 'industri.png' },
    { name: 'Kina', value: 'kina.png' },
    { name: 'Melkeveien', value: 'melkeveien.png' },
    { name: 'Moderne Krig', value: 'modernekrig.png' },
    { name: 'Overgrodd', value: 'overgrodd.png' },
    { name: 'Patent', value: 'patent.png' },
    { name: 'Pyramide', value: 'pyramide.png' },
    { name: 'Ridder', value: 'ridder.png' },
    { name: 'Timesculpt', value: 'timesculpt.png' }
  ];
  
  // Timeline color options
  const timelineColors = [
    { name: 'Default Blue', value: '#007bff' },
    { name: 'Red', value: '#dc3545' },
    { name: 'Green', value: '#28a745' },
    { name: 'Orange', value: '#fd7e14' },
    { name: 'Purple', value: '#6f42c1' },
    { name: 'Teal', value: '#20c997' },
    { name: 'Gray', value: '#6c757d' }
  ];
  
  // Timeline thickness options
  const thicknesses = [
    { name: 'Thin', value: 1 },
    { name: 'Medium', value: 2 },
    { name: 'Thick', value: 3 },
    { name: 'Extra Thick', value: 4 }
  ];
  
  // Store scroll position when changing views
  useEffect(() => {
    if (menuRef.current) {
      menuRef.current.scrollTop = scrollPosition;
    }
  }, [currentView, scrollPosition]);
  
  // Prevent zooming when scrolling in the menu
  useEffect(() => {
    const handleWheel = (e) => {
      // Prevent the wheel event from propagating to the timeline container
      e.stopPropagation();
    };
    
    // Add wheel event listener to the menu
    const menuElement = menuRef.current;
    if (menuElement) {
      menuElement.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    // Add specific wheel event listener to the background image list for smoother scrolling
    const bgImageList = bgImageListRef.current;
    if (bgImageList) {
      bgImageList.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    return () => {
      // Clean up event listeners
      if (menuElement) {
        menuElement.removeEventListener('wheel', handleWheel);
      }
      
      if (bgImageList) {
        bgImageList.removeEventListener('wheel', handleWheel);
      }
    };
  }, [currentView]); // Re-add listeners when view changes
  
  // Close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);
  
  // Handle right-click to go back
  useEffect(() => {
    const handleRightClick = (e) => {
      // Prevent the default context menu from showing
      e.preventDefault();
      
      // Only handle right-clicks inside the menu
      if (menuRef.current && menuRef.current.contains(e.target)) {
        // If we're in a submenu, go back to main menu
        if (currentView !== 'main') {
          handleBackClick();
        }
      }
    };
    
    // Add context menu (right-click) event listener to the menu
    const menuElement = menuRef.current;
    if (menuElement) {
      menuElement.addEventListener('contextmenu', handleRightClick);
    }
    
    return () => {
      // Clean up event listener
      if (menuElement) {
        menuElement.removeEventListener('contextmenu', handleRightClick);
      }
    };
  }, [currentView]); // Re-add listener when view changes
  
  // Handle background color selection
  const handleBackgroundColorClick = (color) => {
    onColorSelect(color);
  };
  
  // Handle background image selection
  const handleBackgroundImageClick = (imageName) => {
    if (onBackgroundImageSelect) {
      onBackgroundImageSelect(imageName);
    }
  };
  
  // Handle timeline color selection
  const handleTimelineColorClick = (color) => {
    onStyleSelect({ color });
  };
  
  // Handle thickness selection
  const handleThicknessClick = (thickness) => {
    onStyleSelect({ thickness });
  };
  
  // Handle interval toggle
  const handleIntervalToggle = () => {
    const newShowIntervals = !showIntervals;
    if (onIntervalToggle) {
      onIntervalToggle(newShowIntervals);
    }
  };

  // Handle interval count change - with validation
  const handleIntervalCountChange = (newCount) => {
    if (localIntervalType !== 'even') {
      setLocalIntervalCount(newCount);
      return;
    }
    
    // Validate against max allowed intervals for 'even' type
    if (newCount > maxAllowedIntervals) {
      // Show warning
      const startDate = typeof timelineData.start === 'string' 
        ? new Date(timelineData.start) 
        : timelineData.start;
      const endDate = typeof timelineData.end === 'string' 
        ? new Date(timelineData.end) 
        : timelineData.end;
      const timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      // Updated warning message to clarify the limit is based on days
      setValidationWarning(`Maks ${maxAllowedIntervals} intervaller for en tidslinje på ${diffDays} dager (maks 1 per dag)`);
      
      // Set to max allowed
      setLocalIntervalCount(maxAllowedIntervals);
    } else {
      // Clear warning and set new count
      setValidationWarning('');
      setLocalIntervalCount(newCount);
    }
    // Effect will handle calling onIntervalCountChange
  };
  
  // Handle interval type change
  const handleIntervalTypeChange = (e) => {
    const newType = e.target.value;
    setLocalIntervalType(newType);
    
    // Clear warning when changing type
    setValidationWarning('');
    
    // Effect will handle calling onIntervalTypeChange
  };
  
  // Go back to main menu
  const handleBackClick = () => {
    // Save the current scroll position before going back
    if (menuRef.current) {
      setScrollPosition(menuRef.current.scrollTop);
    }
    setCurrentView('main');
  };
  
  // Set the menu position style
  const menuPositionStyle = {
    top: `${position.y}px`,
    left: `${position.x}px`,
  };
  
  // Set data attributes to help with styling and theming
  const dataProps = {
    'data-color': currentColor || '#007bff',
    'data-thickness': currentThickness || 2,
    'data-view': currentView
  };
  
  // For highlighting the active menu item
  const isActive = (itemValue, currentValue) => itemValue === currentValue;

  // Render BackIcon component
  const BackIcon = () => (
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
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  );

  // Render ChevronIcon component
  const ChevronIcon = () => (
    <svg 
      className="context-menu-chevron"
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
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  );

  // Render CheckIcon component
  const CheckIcon = () => (
    <svg 
      className="context-menu-check"
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
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );

  // Render the interval marker icon - now using a more appropriate ruler/measurement icon
  const IntervalIcon = () => (
    <svg 
      className="context-menu-icon"
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
      <path d="M2 4h20v16H2z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M6 4v4" />
      <path d="M10 4v6" />
      <path d="M14 4v4" />
      <path d="M18 4v6" />
    </svg>
  );

  // Calendar icon for interval type
  const CalendarIcon = () => (
    <svg 
      className="context-menu-icon"
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
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );

  return (
    <div 
      ref={menuRef} 
      style={menuPositionStyle} 
      className="timeline-context-menu"
      {...dataProps}
    >
      {/* Menu Header */}
      <div className="context-menu-header">
        {currentView !== 'main' && (
          <button 
            onClick={handleBackClick}
            className="context-menu-back-btn"
            aria-label="Go back"
          >
            <BackIcon />
          </button>
        )}
        <span>
          {currentView === 'main' && 'Timeline Settings'}
          {currentView === 'background' && 'Background Color'}
          {currentView === 'thickness' && 'Timeline Thickness'}
          {currentView === 'color' && 'Timeline Color'}
          {currentView === 'backgroundImage' && 'Background Image'}
          {currentView === 'intervals' && 'Intervallmarkører'}
        </span>
      </div>
      
      <div className="context-menu-body">
        {/* Main Menu */}
        {currentView === 'main' && (
          <ul className="context-menu-list">
            <li 
              className="context-menu-item"
              onClick={() => setCurrentView('background')}
            >
              <div
                className="context-menu-color-swatch"
                style={{
                  backgroundColor: currentBackgroundColor || 'white'
                }}
              />
              Background Color
              <ChevronIcon />
            </li>
            
            <li 
              className="context-menu-item"
              onClick={() => setCurrentView('backgroundImage')}
            >
              <div
                className="bg-image-preview"
                data-image={currentBackgroundImage || ""}
              />
              Background Image
              <ChevronIcon />
            </li>
            
            <li 
              className="context-menu-item"
              onClick={() => setCurrentView('thickness')}
            >
              <div
                className="context-menu-thickness-swatch"
                style={{
                  height: `${currentThickness || 2}px`
                }}
              />
              Timeline Thickness
              <ChevronIcon />
            </li>
            
            <li 
              className="context-menu-item"
              onClick={() => setCurrentView('color')}
            >
              <div
                className="context-menu-color-swatch"
                style={{
                  backgroundColor: currentColor || '#007bff'
                }}
              />
              Timeline Color
              <ChevronIcon />
            </li>
            
            {/* New interval markers item */}
            <li 
              className="context-menu-item"
              onClick={() => setCurrentView('intervals')}
            >
              <div className="context-menu-icon-wrapper">
                <IntervalIcon />
              </div>
              Intervallmarkører
              <ChevronIcon />
            </li>
          </ul>
        )}
        
        {/* Background Color Submenu */}
        {currentView === 'background' && (
          <ul className="context-menu-list">
            {backgroundColors.map((color) => (
              <li
                key={color.value}
                onClick={() => handleBackgroundColorClick(color.value)}
                className={`context-menu-item ${isActive(color.value, currentBackgroundColor) ? 'active' : ''}`}
              >
                <div
                  className="context-menu-color-swatch"
                  style={{
                    backgroundColor: color.value
                  }}
                />
                {color.name}
                {isActive(color.value, currentBackgroundColor) && <CheckIcon />}
              </li>
            ))}
          </ul>
        )}
        
        {/* Background Image Submenu */}
        {currentView === 'backgroundImage' && (
          <ul 
            ref={bgImageListRef}
            className="context-menu-list bg-image-list"
          >
            {backgroundImages.map((image) => (
              <li
                key={image.value}
                onClick={() => handleBackgroundImageClick(image.value)}
                className={`context-menu-item ${isActive(image.value, currentBackgroundImage) ? 'active' : ''}`}
              >
                <div
                  className="bg-image-preview"
                  data-image={image.value}
                />
                {image.name}
                {isActive(image.value, currentBackgroundImage) && <CheckIcon />}
              </li>
            ))}
          </ul>
        )}
        
        {/* Timeline Color Submenu */}
        {currentView === 'color' && (
          <ul className="context-menu-list">
            {timelineColors.map((color) => (
              <li
                key={color.value}
                onClick={() => handleTimelineColorClick(color.value)}
                className={`context-menu-item ${isActive(color.value, currentColor) ? 'active' : ''}`}
              >
                <div
                  className="context-menu-color-swatch"
                  style={{
                    backgroundColor: color.value
                  }}
                />
                {color.name}
                {isActive(color.value, currentColor) && <CheckIcon />}
              </li>
            ))}
          </ul>
        )}
        
        {/* Timeline Thickness Submenu */}
        {currentView === 'thickness' && (
          <ul className="context-menu-list">
            {thicknesses.map((thickness) => (
              <li
                key={thickness.value}
                onClick={() => handleThicknessClick(thickness.value)}
                className={`context-menu-item ${isActive(thickness.value, currentThickness) ? 'active' : ''}`}
              >
                <div
                  className="context-menu-thickness-swatch"
                  style={{
                    height: `${thickness.value}px`
                  }}
                />
                {thickness.name}
                {isActive(thickness.value, currentThickness) && <CheckIcon />}
              </li>
            ))}
          </ul>
        )}
        
        {/* Interval Markers Submenu */}
        {currentView === 'intervals' && (
          <div className="context-menu-intervals">
            <div className="interval-toggle-row">
              <span>Vis intervallmarkører</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={showIntervals}
                  onChange={handleIntervalToggle}
                />
                <span className="slider round"></span>
              </label>
            </div>
            
            {showIntervals && (
              <>
                {/* Interval Type Selection */}
                <div className="interval-type-container">
                  <div className="interval-type-header">
                    <CalendarIcon />
                    <span>Intervalltype:</span>
                  </div>
                  
                  <div className="interval-type-select-wrapper">
                    <select
                      value={localIntervalType}
                      onChange={handleIntervalTypeChange}
                      className="interval-type-select"
                    >
                      {availableTypes.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Only show count slider for 'even' interval type */}
                {localIntervalType === 'even' && (
                  <div className="interval-count-row">
                    <span>Antall intervaller: {localIntervalCount}</span>
                    <input
                      type="range"
                      min="2"
                      max={maxAllowedIntervals}
                      value={localIntervalCount}
                      onChange={(e) => handleIntervalCountChange(parseInt(e.target.value))}
                      className="interval-slider"
                    />
                  </div>
                )}
                
                {/* Display validation warning if present */}
                {validationWarning && (
                  <div className="interval-warning">
                    <svg 
                      className="warning-icon"
                      xmlns="http://www.w3.org/2000/svg" 
                      width="14" 
                      height="14" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <span>{validationWarning}</span>
                  </div>
                )}
                
                <div className="interval-info">
                  <svg 
                    className="info-icon"
                    xmlns="http://www.w3.org/2000/svg" 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span>
                    {localIntervalType === 'even' 
                      ? 'Jevnt fordelte intervaller viser punkter med lik avstand over hele tidslinjen.'
                      : localIntervalType === 'daily'
                        ? 'Daglige intervaller markerer hver dag på tidslinjen.'
                        : localIntervalType === 'weekly'
                          ? 'Ukentlige intervaller markerer starten av hver uke på tidslinjen.'
                          : localIntervalType === 'monthly'
                            ? 'Månedlige intervaller markerer starten av hver måned på tidslinjen.'
                            : localIntervalType === 'yearly'
                              ? 'Årlige intervaller markerer starten av hvert år på tidslinjen.'
                              : 'Århundreintervaller markerer starten av hvert århundre på tidslinjen.'
                    }
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TimelineContextMenu;