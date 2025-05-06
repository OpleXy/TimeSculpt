import React, { useState, useEffect, useRef } from 'react';

function CreateEventModal({ 
  isOpen, 
  onClose, 
  onSave, 
  position, 
  date,
  timelineColor 
}) {
  const [title, setTitle] = useState('');
  const modalRef = useRef(null);
  
  // Reset tittel når modal åpnes
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      // Fokuser på input når modalen åpnes
      setTimeout(() => {
        const input = modalRef.current?.querySelector('input');
        if (input) input.focus();
      }, 100);
    }
  }, [isOpen]);
  
  // Forbedret formatDate funksjon med bedre feilhåndtering
  const formatDate = (date) => {
    // Sjekk om datoen er gyldig
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      console.warn('Ugyldig dato mottatt i CreateEventModal:', date);
      return 'Ikke spesifisert';
    }
    
    try {
      return date.toLocaleDateString('no-NO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Feil ved formatering av dato:', error);
      // Manuell formatering som fallback
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Måneder er 0-indeksert
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    }
  };
  
  // Håndter lagring med datovalidering
  const handleSave = () => {
    // Sikre at vi har en gyldig dato, eller bruk nåværende dato som fallback
    let eventDate = date;
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      console.warn('Ugyldig dato ved lagring, bruker nåværende dato i stedet');
      eventDate = new Date(); // Bruk nåværende dato som fallback
    }
    
    onSave({
      title: title.trim() || 'Hendelse uten navn',
      date: eventDate,
      // Standardverdier
      description: '',
      color: 'default',
      size: 'medium',
      xOffset: 0,
      yOffset: 0
    });
    onClose();
  };
  
  // Håndter klikk utenfor modalen
  const handleClickOutside = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };
  
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  // Håndter tastaturtaster
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      handleSave();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay create-event-modal-overlay">
      <div 
        className="create-event-modal" 
        ref={modalRef}
        style={{
          position: 'absolute',
          top: position.y,
          left: position.x,
          transform: 'translate(-50%, -50%)',
          zIndex: 100
        }}
      >
        <h3>Ny hendelse</h3>
        <p className="date-display">Dato: {formatDate(date)}</p>
        
        <div className="form-group">
          <label htmlFor="eventTitle">Tittel:</label>
          <input
            id="eventTitle"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hendelse uten navn"
            className="form-control"
          />
        </div>
        
        <div className="modal-buttons">
          <button 
            className="cancel-btn" 
            onClick={onClose}
          >
            Avbryt
          </button>
          <button 
            className="save-btn" 
            onClick={handleSave}
            style={{ backgroundColor: "#007bff" }}
          >
            Legg til
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateEventModal;