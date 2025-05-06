import { useRef, useEffect, useState } from 'react';
import '../styles/TimelineContextMenu.css';
import IntervalSettings from './IntervalSettings';
import ToggleSwitch from './ToggleSwitch'; // Import the existing ToggleSwitch component

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
  // Interval marker props
  showIntervals = true,
  intervalCount = 5,
  onIntervalToggle,
  onIntervalCountChange,
  intervalType = 'even',
  onIntervalTypeChange,
  timelineData = {},
  // Direction props
  isVertical = false,
  onDirectionChange
}) {
  const menuRef = useRef(null);
  const bgImageListRef = useRef(null);
  const [currentView, setCurrentView] = useState('main');
  const [scrollPosition, setScrollPosition] = useState(0);
  const [localIsVertical, setLocalIsVertical] = useState(isVertical);
  
  // Update local direction when prop changes
  useEffect(() => {
    setLocalIsVertical(isVertical);
  }, [isVertical]);

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
  
  // Background image options
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
  
  // Standard event handlers and effects
  useEffect(() => {
    if (menuRef.current) {
      menuRef.current.scrollTop = scrollPosition;
    }
  }, [currentView, scrollPosition]);
  
  useEffect(() => {
    const handleWheel = (e) => {
      e.stopPropagation();
    };
    
    const menuElement = menuRef.current;
    if (menuElement) {
      menuElement.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    const bgImageList = bgImageListRef.current;
    if (bgImageList) {
      bgImageList.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    return () => {
      if (menuElement) {
        menuElement.removeEventListener('wheel', handleWheel);
      }
      
      if (bgImageList) {
        bgImageList.removeEventListener('wheel', handleWheel);
      }
    };
  }, [currentView]);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);
  
  useEffect(() => {
    const handleRightClick = (e) => {
      e.preventDefault();
      
      if (menuRef.current && menuRef.current.contains(e.target)) {
        if (currentView !== 'main') {
          handleBackClick();
        }
      }
    };
    
    const menuElement = menuRef.current;
    if (menuElement) {
      menuElement.addEventListener('contextmenu', handleRightClick);
    }
    
    return () => {
      if (menuElement) {
        menuElement.removeEventListener('contextmenu', handleRightClick);
      }
    };
  }, [currentView]);
  
  const handleBackgroundColorClick = (color) => {
    onColorSelect(color);
  };
  
  const handleBackgroundImageClick = (imageName) => {
    if (onBackgroundImageSelect) {
      onBackgroundImageSelect(imageName);
    }
  };
  
  const handleTimelineColorClick = (color) => {
    onStyleSelect({ color });
  };
  
  const handleThicknessClick = (thickness) => {
    onStyleSelect({ thickness });
  };
  
  // Handle direction toggle - UPDATED for direct style modification
  const handleDirectionToggle = (e) => {
    const newIsVertical = e.target.checked;
    setLocalIsVertical(newIsVertical);
    
    if (onDirectionChange) {
      onDirectionChange(newIsVertical);
    } else if (onStyleSelect) {
      // If no specific orientation handler, use the style handler
      onStyleSelect({ orientation: newIsVertical ? 'vertical' : 'horizontal' });
    }
  };
  
  const handleBackClick = () => {
    if (menuRef.current) {
      setScrollPosition(menuRef.current.scrollTop);
    }
    setCurrentView('main');
  };
  
  const menuPositionStyle = {
    top: `${position.y}px`,
    left: `${position.x}px`,
  };
  
  const dataProps = {
    'data-color': currentColor || '#007bff',
    'data-thickness': currentThickness || 2,
    'data-view': currentView
  };
  
  const isActive = (itemValue, currentValue) => itemValue === currentValue;

  // Icon components
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

  const DirectionIcon = () => (
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
      <line x1="17" y1="7" x2="7" y2="17"></line>
      <polyline points="17 17 7 17 7 7"></polyline>
    </svg>
  );

  return (
    <div 
      ref={menuRef} 
      style={menuPositionStyle} 
      className="timeline-context-menu"
      {...dataProps}
    >
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
          {currentView === 'direction' && 'Retning'}
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
            
            {/* Direction menu item */}
            <li 
              className="context-menu-item"
              onClick={() => setCurrentView('direction')}
            >
              <div className="context-menu-icon-wrapper">
                <DirectionIcon />
              </div>
              Retning
              <ChevronIcon />
            </li>
            
            {/* Interval markers item */}
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
        
        {/* Direction Submenu - IMPROVED */}
        {currentView === 'direction' && (
          <div className="context-menu-direction">
            <div className="direction-toggle-container">
              {/* Using the imported ToggleSwitch component */}
              <ToggleSwitch
                isVertical={localIsVertical}
                onChange={handleDirectionToggle}
                id="direction-toggle"
                label="Velg retning for tidslinjen"
              />
            </div>
            
            <div className="direction-info">
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
                {localIsVertical 
                  ? 'Vertikal visning viser tidslinjen fra topp til bunn.'
                  : 'Horisontal visning viser tidslinjen fra venstre til høyre.'}
              </span>
            </div>
          </div>
        )}
        
        {/* Interval Markers Submenu */}
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