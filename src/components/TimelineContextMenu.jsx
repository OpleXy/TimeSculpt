import { useRef, useEffect, useState } from 'react';
import '../styles/TimelineContextMenu.css';
import IntervalSettings from './IntervalSettings';

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
  // Interval marker props with 'even' as default
  showIntervals = true,
  intervalCount = 5,
  onIntervalToggle,
  onIntervalCountChange,
  // Set 'even' as the default interval type
  intervalType = 'even',
  onIntervalTypeChange,
  // Add timeline data prop for validation
  timelineData = {}
}) {
  const menuRef = useRef(null);
  const bgImageListRef = useRef(null);
  const [currentView, setCurrentView] = useState('main'); // 'main', 'background', 'thickness', 'color', 'backgroundImage', 'intervals'
  const [scrollPosition, setScrollPosition] = useState(0);
  
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
        
        {/* Interval Markers Submenu - Using the IntervalSettings component */}
        {currentView === 'intervals' && (
          <IntervalSettings
            showIntervals={showIntervals}
            intervalCount={intervalCount}
            intervalType={intervalType}
            onIntervalToggle={onIntervalToggle}
            onIntervalCountChange={onIntervalCountChange}
            onIntervalTypeChange={onIntervalTypeChange}
            timelineData={timelineData}
          />
        )}
      </div>
    </div>
  );
}

export default TimelineContextMenu;