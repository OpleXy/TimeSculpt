import { useState, useEffect } from 'react';
import EventForm from './EventForm';
import { useAuth } from '../contexts/AuthContext';
import '../styles/add-event-modal.css';

function AddEventModal({ 
  isOpen,
  onClose,
  addEvent, 
  timelineData
}) {
  const { isAuthenticated } = useAuth();
  
  // Check if the timeline has the required fields to show event creation tools
  const hasBasicTimelineData = timelineData && 
                              timelineData.title && 
                              timelineData.start && 
                              timelineData.end;

  // Handle event addition
  const handleEventAdd = (eventData) => {
    addEvent(eventData);
  };

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc, false);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc, false);
    };
  }, [isOpen, onClose]);

  // Handle modal backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="add-event-modal-overlay" onClick={handleBackdropClick}>
      <div 
        className="add-event-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <h2>Legg til hendelse</h2>
          <button 
            className="close-modal-btn"
            onClick={onClose}
            aria-label="Lukk modal"
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="modal-content">
          {/* SECTION 1: New Timeline Guide (Empty State) */}
          {!hasBasicTimelineData && (
            <div className="new-button-guide">
              <div className="guide-arrow">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <polyline points="19 12 12 19 5 12"></polyline>
                </svg>
              </div>
              <h4>✨ Kom i gang med din første tidslinje</h4>
              <p>Klikk på <strong>+ Ny</strong>-knappen i toppmenyen for å starte!</p>
            </div>
          )}
          
          {/* SECTION 2: Manual Event Form */}
          {hasBasicTimelineData && (
            <div className="manual-event-form">
              <EventForm 
                onAddEvent={handleEventAdd} 
                timelineStart={timelineData.start} 
                timelineEnd={timelineData.end}
                showTitle={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddEventModal;