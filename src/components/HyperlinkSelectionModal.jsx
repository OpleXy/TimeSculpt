import { useEffect } from 'react';
import '../styles/hyperlink-selection-modal.css';

function HyperlinkSelectionModal({ 
  isOpen, 
  onClose, 
  hyperlinks, 
  eventTitle 
}) {
  // Handle ESC key to close modal
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

  // Handle hyperlink click
  const handleHyperlinkClick = (url) => {
    // Open URL in new tab/window
    window.open(url, '_blank', 'noopener,noreferrer');
    // Close modal after opening link
    onClose();
  };

  // Extract domain from URL for display
  const extractDomain = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  };

  // Truncate URL for display
  const truncateUrl = (url, maxLength = 50) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  if (!isOpen || !hyperlinks || hyperlinks.length === 0) return null;

  return (
    <div className="hyperlink-selection-overlay" onClick={handleBackdropClick}>
      <div 
        className="hyperlink-selection-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <h3>Velg hyperlenke</h3>
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

        {/* Event title */}
        <div className="event-title-display">
          <div 
            className="event-title-content" 
            dangerouslySetInnerHTML={{ __html: eventTitle }}
          />
        </div>

        {/* Hyperlinks list */}
        <div className="hyperlinks-list">
          {hyperlinks.map((url, index) => (
            <button
              key={index}
              className="hyperlink-item"
              onClick={() => handleHyperlinkClick(url)}
              title={url}
            >
              <div className="hyperlink-icon">
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              </div>
              <div className="hyperlink-info">
                <div className="hyperlink-domain">
                  {extractDomain(url)}
                </div>
                <div className="hyperlink-url">
                  {truncateUrl(url)}
                </div>
              </div>
              <div className="external-link-icon">
                <svg 
                  width="14" 
                  height="14" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15,3 21,3 21,9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HyperlinkSelectionModal;