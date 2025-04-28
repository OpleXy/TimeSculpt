import React from 'react';

function ToggleSwitch({ isVertical, onChange, id, label }) {
  return (
    <div className="orientation-toggle">
      {label && <label className="toggle-label">{label}</label>}
      <div className="toggle-labels">
        <span className={!isVertical ? 'active' : ''}>Horisontal</span>
        <label className="switch">
          <input
            type="checkbox"
            checked={isVertical}
            onChange={onChange}
            id={id}
          />
          <span className="slider round"></span>
        </label>
        <span className={isVertical ? 'active' : ''}>Vertikal</span>
      </div>
    </div>
  );
}

export default ToggleSwitch;