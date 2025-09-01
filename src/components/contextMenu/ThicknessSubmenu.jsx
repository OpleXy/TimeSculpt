// src/components/contextMenu/ThicknessSubmenu.jsx
import React, { useState, useEffect } from 'react';
import { InfoIcon } from './MenuIcons';

function ThicknessSubmenu({ currentThickness, onStyleSelect }) {
  const [localThickness, setLocalThickness] = useState(currentThickness || 2);
  const [showThicknessInput, setShowThicknessInput] = useState(false);
  const [thicknessInputValue, setThicknessInputValue] = useState(String(currentThickness || 2));

  // Apply thickness changes with debouncing
  useEffect(() => {
    if (localThickness !== currentThickness && onStyleSelect) {
      const timeoutId = setTimeout(() => {
        onStyleSelect({ thickness: localThickness });
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [localThickness, currentThickness, onStyleSelect]);

  // Handle thickness change
  const handleThicknessChange = (newThickness) => {
    setLocalThickness(newThickness);
    setThicknessInputValue(String(newThickness));
  };
  
  // Handle thickness label click
  const handleThicknessLabelClick = () => {
    setShowThicknessInput(true);
    setThicknessInputValue(String(localThickness));
  };
  
  // Handle thickness input change
  const handleThicknessInputChange = (e) => {
    const value = e.target.value;
    setThicknessInputValue(value);
  };
  
  // Handle thickness input submit
  const handleThicknessInputSubmit = () => {
    const numValue = parseInt(thicknessInputValue);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 10) {
      setLocalThickness(numValue);
      setShowThicknessInput(false);
    } else {
      setThicknessInputValue(String(localThickness));
      setShowThicknessInput(false);
    }
  };
  
  // Handle thickness input key press
  const handleThicknessInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleThicknessInputSubmit();
    } else if (e.key === 'Escape') {
      setThicknessInputValue(String(localThickness));
      setShowThicknessInput(false);
    }
  };
  
  // Handle thickness input blur
  const handleThicknessInputBlur = () => {
    handleThicknessInputSubmit();
  };

  return (
    <div className="context-menu-thickness-slider">
      <div className="thickness-slider-container">
        {showThicknessInput ? (
          <div className="thickness-input-container">
            <span>Tykkelse: </span>
            <input
              type="number"
              min="1"
              max="10"
              value={thicknessInputValue}
              onChange={handleThicknessInputChange}
              onKeyDown={handleThicknessInputKeyPress}
              onBlur={handleThicknessInputBlur}
              className="thickness-input"
              autoFocus
            />
            <span>px</span>
          </div>
        ) : (
          <span 
            className="thickness-label clickable"
            onClick={handleThicknessLabelClick}
            title="Klikk for å skrive inn verdi"
          >
            Tykkelse: {localThickness}px
          </span>
        )}
        <input
          type="range"
          min="1"
          max="10"
          value={localThickness}
          onChange={(e) => handleThicknessChange(parseInt(e.target.value))}
          className="thickness-slider"
        />
        <div className="thickness-slider-labels">
          <span>1px</span>
          <span>10px</span>
        </div>
      </div>
      
      <div className="thickness-info">
        <InfoIcon />
        <span>Klikk på verdien for å skrive inn et tall.</span>
      </div>
    </div>
  );
}

export default ThicknessSubmenu;