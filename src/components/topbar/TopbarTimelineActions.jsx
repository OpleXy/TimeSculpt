// src/components/topbar/TopbarTimelineActions.jsx
import { useState, useEffect, useRef } from 'react';
import TimelineShareModal from '../TimelineShareModal';

function TopbarTimelineActions({
  timelineData,
  hasUnsavedChanges,
  lastSaved,
  onSaveTimeline,
  isTimelineOwner,
  isAuthenticated,
  isPublic,
  onPrivacyChange
}) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareModalTab, setShareModalTab] = useState('permissions');
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  
  const actionsDropdownRef = useRef(null);

  // Check if timeline is active and has events
  const isTimelineActive = timelineData && timelineData.title;
  const hasEvents = timelineData && timelineData.events && timelineData.events.length > 0;
  const shouldShowSaveButton = isTimelineActive && hasEvents && (isTimelineOwner || !timelineData.id);
  const shouldShowActionsButton = isTimelineActive && timelineData.id && isAuthenticated;

  // Format timestamp for display
  const formatLastSaved = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const savedTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - savedTime) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Nettopp lagret';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} min siden`;
    } else if (diffInMinutes < 1440) { // Less than 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} time${hours > 1 ? 'r' : ''} siden`;
    } else {
      return savedTime.toLocaleDateString('no-NO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  };

  // Close actions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showActionsDropdown && actionsDropdownRef.current && !actionsDropdownRef.current.contains(event.target)) {
        setShowActionsDropdown(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showActionsDropdown]);

  // Save timeline handler
  const handleSaveTimeline = () => {
    if (typeof onSaveTimeline === 'function') {
      onSaveTimeline();
    }
  };

  // Actions dropdown handlers
  const handleActionsDropdownToggle = () => {
    setShowActionsDropdown(!showActionsDropdown);
  };

  const handleShareTimeline = () => {
    setShowActionsDropdown(false);
    setShareModalTab('permissions');
    setShowShareModal(true);
  };

  const handleExportPDF = () => {
    setShowActionsDropdown(false);
    console.log('Eksporter som PDF');
    alert('PDF-eksport kommer snart!');
  };

  const handleExportPNG = () => {
    setShowActionsDropdown(false);
    console.log('Eksporter som PNG');
    alert('PNG-eksport kommer snart!');
  };

  const handlePrintTimeline = () => {
    setShowActionsDropdown(false);
    window.print();
  };

  const handleOpenShareModal = (tab = 'permissions') => {
    setShareModalTab(tab);
    setShowShareModal(true);
  };

  // Don't render anything if no timeline is active
  if (!isTimelineActive) {
    return null;
  }

  return (
    <div className="topbar-timeline-actions">
      {/* Save Button */}
      {shouldShowSaveButton && (
        <div className="timeline-save-section" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '15px' }}>
          <button
            className="save-timeline-btn topbar-save-btn"
            onClick={handleSaveTimeline}
            disabled={!hasUnsavedChanges}
            title={hasUnsavedChanges ? "Lagre endringer" : "Ingen endringer å lagre"}
            style={{
              width: 'auto',
              padding: '0 16px',
              height: '36px',
              backgroundColor: hasUnsavedChanges ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: hasUnsavedChanges ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              fontWeight: '500',
              fontSize: '14px',
              opacity: hasUnsavedChanges ? 1 : 0.7,
              transition: 'all 0.2s ease'
            }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ marginRight: '8px' }}
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            Lagre
          </button>

          {/* Last saved indicator */}
          {lastSaved && !hasUnsavedChanges && (
            <span 
              style={{
                fontSize: '12px',
                color: '#6c757d',
                fontStyle: 'italic',
                whiteSpace: 'nowrap'
              }}
              title={`Sist lagret: ${new Date(lastSaved).toLocaleString('no-NO')}`}
            >
              {formatLastSaved(lastSaved)}
            </span>
          )}
        </div>
      )}

      {/* Timeline Actions Dropdown */}
      {shouldShowActionsButton && (
        <div className="timeline-actions-dropdown" ref={actionsDropdownRef} style={{ position: 'relative' }}>
          <button 
            className="timeline-actions-btn topbar-actions-btn"
            onClick={handleActionsDropdownToggle}
            title="Handlinger for tidslinje"
            style={{
              width: 'auto',
              padding: '0 16px',
              height: '36px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              fontWeight: '500',
              fontSize: '14px',
              position: 'relative'
            }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ marginRight: '8px' }}
            >
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
            <span>Handlinger</span>
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
              style={{ 
                marginLeft: '8px',
                transform: showActionsDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}
            >
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>

          {showActionsDropdown && (
            <div className="timeline-actions-dropdown-menu">
              <button 
                className="dropdown-action-item"
                onClick={handleShareTimeline}
              >
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
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
                Del tidslinje
              </button>

              <div className="dropdown-divider"></div>

              <button 
                className="dropdown-action-item"
                onClick={handleExportPDF}
              >
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
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                Eksporter som PDF
              </button>

              <button 
                className="dropdown-action-item"
                onClick={handleExportPNG}
              >
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
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                Eksporter som PNG
              </button>

              <div className="dropdown-divider"></div>

              <button 
                className="dropdown-action-item"
                onClick={handlePrintTimeline}
              >
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
                  <polyline points="6 9 6 2 18 2 18 9"></polyline>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2 2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                  <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
                Print tidslinje
              </button>
            </div>
          )}
        </div>
      )}

      {/* Timeline Share Modal */}
      {showShareModal && (
        <TimelineShareModal
          timelineData={timelineData}
          isOwner={isTimelineOwner}
          initialTab={shareModalTab}
          onClose={() => setShowShareModal(false)}
          isPublic={isPublic}
          onPrivacyChange={onPrivacyChange}
        />
      )}
    </div>
  );
}

export default TopbarTimelineActions;