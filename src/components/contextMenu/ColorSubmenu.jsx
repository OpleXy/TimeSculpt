// src/components/contextMenu/ColorSubmenu.jsx
import React from 'react';
import { CheckIcon } from './MenuIcons';

const timelineColors = [
  { name: 'Default Blue', value: '#007bff' },
  { name: 'Red', value: '#dc3545' },
  { name: 'Green', value: '#28a745' },
  { name: 'Orange', value: '#fd7e14' },
  { name: 'Purple', value: '#6f42c1' },
  { name: 'Teal', value: '#20c997' },
  { name: 'Gray', value: '#6c757d' }
];

function ColorSubmenu({ currentColor, onStyleSelect }) {
  // Handle timeline color selection
  const handleTimelineColorClick = (color) => {
    onStyleSelect({ color });
  };

  // For highlighting the active menu item
  const isActive = (itemValue, currentValue) => itemValue === currentValue;

  return (
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
  );
}

export default ColorSubmenu;