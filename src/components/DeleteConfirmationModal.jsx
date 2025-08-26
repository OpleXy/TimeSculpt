import { useRef, useEffect } from 'react';

function DeleteConfirmationModal({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  eventTitle 
}) {
  const modalRef = useRef(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const cancelButton = modalRef.current.querySelector('.cancel-btn');
      if (cancelButton) {
        cancelButton.focus();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div 
        ref={modalRef}
        className="delete-confirmation-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Bekreft sletting</h3>
        </div>
        
        <div className="modal-content">
          <p>
            Er du sikker på at du vil slette hendelsen{' '}
            <strong>"{eventTitle || 'denne hendelsen'}"</strong>?
          </p>
          <p>
            Denne handlingen kan ikke angres.
          </p>
        </div>
        
        <div className="modal-buttons">
          <button 
            className="cancel-btn" 
            onClick={onCancel}
            autoFocus
          >
            Avbryt
          </button>
          <button 
            className="delete-btn confirm-delete" 
            onClick={onConfirm}
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
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
            Slett
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmationModal;