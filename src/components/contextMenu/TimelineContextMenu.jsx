// src/components/contextMenu/TimelineContextMenu.jsx
import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import BackgroundSubmenu from './BackgroundSubmenu';
import ThicknessSubmenu from './ThicknessSubmenu';
import ColorSubmenu from './ColorSubmenu';
import IntervalsSubmenu from './IntervalsSubmenu';
import AutoLayoutSubmenu from './AutoLayoutSubmenu';
import ImageEditorSubmenu from './ImageEditorSubmenu';
import { BackIcon, ChevronIcon, IntervalIcon, BackgroundIcon, ThicknessIcon, AutoLayoutIcon } from './MenuIcons';
import '../../styles/TimelineContextMenu.css';

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
  showIntervals = true,
  intervalCount = 5,
  onIntervalToggle,
  onIntervalCountChange,
  intervalType = 'even',
  onIntervalTypeChange,
  timelineData = {},
  autoLayoutEnabled = true,
  onAutoLayoutToggle,
  onResetLayout,
  onBackgroundChange
}) {
  const { currentUser } = useAuth();
  const menuRef = useRef(null);
  const [currentView, setCurrentView] = useState('main');
  const [scrollPosition, setScrollPosition] = useState(0);
  
  // Auto-layout helper functions
  const eventCount = timelineData?.events?.length || 0;
  const canUseAutoLayout = eventCount >= 3;
  
  // Store scroll position when changing views
  useEffect(() => {
    if (menuRef.current) {
      menuRef.current.scrollTop = scrollPosition;
    }
  }, [currentView, scrollPosition]);
  
  // Prevent zooming when scrolling in the menu
  useEffect(() => {
    const handleWheel = (e) => {
      e.stopPropagation();
    };
    
    const menuElement = menuRef.current;
    if (menuElement) {
      menuElement.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    return () => {
      if (menuElement) {
        menuElement.removeEventListener('wheel', handleWheel);
      }
    };
  }, [currentView]);
  
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
  
  // Go back to main menu
  const handleBackClick = () => {
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
          {currentView === 'thickness' && 'Timeline Thickness'}
          {currentView === 'color' && 'Timeline Color'}
          {currentView === 'intervals' && 'Intervallmarkører'}
          {currentView === 'background' && 'Bakgrunn'}
          {currentView === 'autolayout' && 'Auto-Layout'}
          {currentView === 'imageeditor' && 'Bildeeditor'}
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
              <div className="context-menu-icon-wrapper">
                <BackgroundIcon />
              </div>
              Bakgrunn
              <ChevronIcon />
            </li>
            
            <li 
              className="context-menu-item"
              onClick={() => setCurrentView('thickness')}
            >
              <div className="context-menu-icon-wrapper">
                <ThicknessIcon />
              </div>
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

            <li 
              className="context-menu-item"
              onClick={() => setCurrentView('autolayout')}
            >
              <div className="context-menu-icon-wrapper">
                <AutoLayoutIcon />
              </div>
              Auto-Layout
              <ChevronIcon />
            </li>
          </ul>
        )}

        {/* Submenus */}
        {currentView === 'background' && (
          <BackgroundSubmenu
            currentUser={currentUser}
            currentBackgroundColor={currentBackgroundColor}
            currentBackgroundImage={currentBackgroundImage}
            onColorSelect={onColorSelect}
            onBackgroundImageSelect={onBackgroundImageSelect}
            setCurrentView={setCurrentView}
          />
        )}

        {currentView === 'thickness' && (
          <ThicknessSubmenu
            currentThickness={currentThickness}
            onStyleSelect={onStyleSelect}
          />
        )}

        {currentView === 'color' && (
          <ColorSubmenu
            currentColor={currentColor}
            onStyleSelect={onStyleSelect}
          />
        )}

        {currentView === 'intervals' && (
          <IntervalsSubmenu
            showIntervals={showIntervals}
            intervalCount={intervalCount}
            intervalType={intervalType}
            timelineData={timelineData}
            onIntervalToggle={onIntervalToggle}
            onIntervalCountChange={onIntervalCountChange}
            onIntervalTypeChange={onIntervalTypeChange}
          />
        )}

        {currentView === 'autolayout' && (
          <AutoLayoutSubmenu
            autoLayoutEnabled={autoLayoutEnabled}
            canUseAutoLayout={canUseAutoLayout}
            eventCount={eventCount}
            onAutoLayoutToggle={onAutoLayoutToggle}
            onResetLayout={onResetLayout}
            onClose={onClose}
          />
        )}

        {currentView === 'imageeditor' && (
  <ImageEditorSubmenu
    onBackgroundImageSelect={onBackgroundImageSelect}
    setCurrentView={setCurrentView}
    currentBackgroundImage={currentBackgroundImage} // Add this line
  />
)}
      </div>
    </div>
  );
}

export default TimelineContextMenu;