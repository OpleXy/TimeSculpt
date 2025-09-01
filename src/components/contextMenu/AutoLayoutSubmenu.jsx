// src/components/contextMenu/AutoLayoutSubmenu.jsx
import React from 'react';

function AutoLayoutSubmenu({
  autoLayoutEnabled,
  canUseAutoLayout,
  eventCount,
  onAutoLayoutToggle,
  onResetLayout,
  onClose
}) {
  // Handle auto-layout toggle
  const handleAutoLayoutToggleClick = (e) => {
    e.stopPropagation();
    onAutoLayoutToggle?.(!autoLayoutEnabled);
  };

  // Handle reset layout
  const handleResetLayoutClick = (e) => {
    e.stopPropagation();
    onResetLayout?.();
    onClose();
  };

  return (
    <div className="context-menu-autolayout">
      <div className="toggle-container">
        <div className="toggle-item">
          <span className="toggle-label">Aktiver auto-layout</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={autoLayoutEnabled}
              onChange={handleAutoLayoutToggleClick}
              disabled={!canUseAutoLayout}
            />
            <span className="slider round"></span>
          </label>
        </div>
        <div className="toggle-description">
          {canUseAutoLayout ? 
            'Strukturerer hendelser automatisk' :
            `Krever minst 3 hendelser (har ${eventCount})`
          }
        </div>
      </div>

      {autoLayoutEnabled && canUseAutoLayout && (
        <>
          <button 
            className="context-menu-action"
            onClick={handleResetLayoutClick}
            title="Tilbakestill alle hendelser og kjør auto-layout på nytt"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            <span>Tilbakestill layout</span>
          </button>
        </>
      )}

      {!canUseAutoLayout && (
        <div className="auto-layout-disabled">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>Legg til flere hendelser for å bruke auto-layout</span>
        </div>
      )}
    </div>
  );
}

export default AutoLayoutSubmenu;