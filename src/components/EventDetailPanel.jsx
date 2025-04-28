import { useRef, useEffect, useState } from 'react';

function EventDetailPanel({ event, isOpen, onClose, onEdit }) {
  const panelRef = useRef(null);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [prevEvent, setPrevEvent] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle event changes for smooth transitions
  useEffect(() => {
    // If a new event is loaded while panel is already open
    if (isOpen && event && prevEvent && event.index !== prevEvent.index) {
      setIsContentLoading(true);
      // Very short timeout to trigger CSS transition
      setTimeout(() => {
        setIsContentLoading(false);
      }, 150);
    }
    
    setPrevEvent(event);
  }, [event, isOpen, prevEvent]);

  // Only handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        // First exit expanded mode if active, otherwise close panel
        if (isExpanded) {
          setIsExpanded(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose, isExpanded]);

  // Format the event date
  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('no-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      weekday: 'long'
    });
  };
  
  // Only convert class attributes to className for React compatibility, with no URL processing
  const processHtmlContent = (html) => {
    if (!html) return '';
    
    // Use DOM-based approach to handle HTML properly
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Convert class attributes to className for React compatibility
    const elementsWithClass = tempDiv.querySelectorAll('[class]');
    elementsWithClass.forEach(element => {
      const classValue = element.getAttribute('class');
      element.removeAttribute('class');
      element.setAttribute('className', classValue);
    });
    
    // Find and fix broken anchor tags by replacing them with plain text
    const allAnchors = tempDiv.querySelectorAll('a');
    allAnchors.forEach(anchor => {
      // Replace any anchor with its text content
      const textNode = document.createTextNode(anchor.textContent);
      anchor.parentNode.replaceChild(textNode, anchor);
    });
    
    return tempDiv.innerHTML;
  };

  // Toggle expanded mode
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  if (!event) return null;

  return (
    <div className={`event-detail-panel ${!isOpen ? 'hidden' : ''} ${isExpanded ? 'expanded' : ''}`} ref={panelRef}>
      <div className="detail-panel-header">
        <h3>Hendelsesdetaljer</h3>
        <div className="panel-header-actions">
          <button 
            className="edit-btn" 
            onClick={() => onEdit(event, event.index)}
            aria-label="Rediger hendelse"
            title="Rediger hendelse"
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
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button 
            className="expand-btn" 
            onClick={toggleExpanded}
            aria-label={isExpanded ? "Mindre visning" : "Større visning"}
            title={isExpanded ? "Mindre visning" : "Større visning"}
          >
            {isExpanded ? (
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
              >
                <polyline points="4 14 10 14 10 20"></polyline>
                <polyline points="20 10 14 10 14 4"></polyline>
                <line x1="14" y1="10" x2="21" y2="3"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
            ) : (
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
              >
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
            )}
          </button>
          <button 
            className="close-panel-btn" 
            onClick={onClose}
            aria-label="Lukk panel"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className={`detail-panel-content ${isContentLoading ? 'loading' : ''}`}>
        <div className="event-title">
          {/* Using dangerouslySetInnerHTML to properly render the formatted title */}
          <h4 dangerouslySetInnerHTML={{ __html: processHtmlContent(event.title) }}></h4>
          <span className="event-date">{formatDate(event.date)}</span>
        </div>
        
        {event.description ? (
          <div className="event-description">
            {/* Removed "Beskrivelse" heading */}
            <div 
              className="description-content"
              dangerouslySetInnerHTML={{ __html: processHtmlContent(event.description) }}
            />
          </div>
        ) : (
          <div className="no-description">
            <p>Ingen beskrivelse er lagt til for denne hendelsen.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventDetailPanel;