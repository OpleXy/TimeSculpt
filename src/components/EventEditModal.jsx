import { useState, useEffect, useRef } from 'react';
import RichTextEditor from './RichTextEditor';
import DateInput from './DateInput';

function EventEditModal({ event, onSave, onClose, onDelete }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [size, setSize] = useState('medium');
  const [color, setColor] = useState('default'); // Default color matches timeline color
  const [error, setError] = useState('');
  const modalRef = useRef(null);

  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    if (!date) return '';
    
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    return date.toISOString().split('T')[0];
  };

  // Utility function to strip HTML for plaintext storage
  const stripHtml = (html) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Initialize form with event data
  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDate(formatDateForInput(event.date) || '');
      setDescription(event.description || '');
      setSize(event.size || 'medium');
      setColor(event.color || 'default');
    }
  }, [event]);

  // Prevent wheel events from propagating to the timeline
  useEffect(() => {
    const modalElement = modalRef.current;
    
    if (!modalElement) return;
    
    const handleWheel = (e) => {
      // Stop the event from propagating to the timeline underneath
      e.stopPropagation();
    };
    
    modalElement.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      if (modalElement) {
        modalElement.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!title || !date) {
      setError('Vennligst fyll ut alle påkrevde feltene');
      return;
    }

    // Create updated event object
    const updatedEvent = {
      ...event,
      title, // Rich HTML content
      plainTitle: stripHtml(title), // Plain text version
      date: new Date(date),
      description, // Rich HTML content
      size, // Add the size property
      color // Add the color property
    };

    onSave(updatedEvent);
  };

  // Prevent clicks in the modal from closing it
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  // Handle size selection
  const handleSizeSelect = (selectedSize) => {
    setSize(selectedSize);
  };

  // Handle color selection
  const handleColorSelect = (selectedColor) => {
    setColor(selectedColor);
  };

  // Handle date change from DateInput component
  const handleDateChange = (e) => {
    setDate(e.target.value);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        ref={modalRef}
        className="event-edit-modal" 
        onClick={handleModalClick}
      >
        <div className="modal-header">
          <h3>Rediger hendelse</h3>
          
          <div className="modal-header-buttons">
            <button 
              type="button" 
              className="delete-btn" 
              onClick={() => onDelete && onDelete(event, event.index)}
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
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              Slett
            </button>
            
            <button 
              form="event-edit-form"
              type="submit" 
              className="save-btn"
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
                <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34" />
                <polygon points="18 2 22 6 12 16 8 16 8 12 18 2" />
              </svg>
              Oppdater
            </button>
          </div>
        </div>

        <form id="event-edit-form" onSubmit={handleSubmit}>
          <div className="form-row" style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group" style={{ flex: '2' }}>
              <label htmlFor="eventTitle">Tittel<span className="required-mark"> *</span></label>
              
              <RichTextEditor 
                value={title}
                onChange={setTitle}
                placeholder="Gi hendelsen en beskrivende tittel"
                minHeight="40px"
              />
            </div>
            
            <div className="form-group" style={{ flex: '1' }}>
              <DateInput 
                value={date}
                onChange={handleDateChange}
                label="Dato"
                required={true}
              />
            </div>
          </div>
          
          <div className="form-row" style={{ marginBottom: '20px' }}>
            <div className="form-group">
              <label>Størrelse</label>
              <div className="size-buttons-group">
                <button 
                  type="button"
                  className={`size-button small ${size === 'small' ? 'active' : ''}`}
                  onClick={() => handleSizeSelect('small')}
                  title="Liten størrelse"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="size-icon"
                  >
                    <rect x="8" y="8" width="8" height="8" rx="1" />
                  </svg>
                </button>
                <button 
                  type="button"
                  className={`size-button medium ${size === 'medium' ? 'active' : ''}`}
                  onClick={() => handleSizeSelect('medium')}
                  title="Middels størrelse"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="size-icon"
                  >
                    <rect x="5" y="6" width="14" height="12" rx="1" />
                  </svg>
                </button>
                <button 
                  type="button"
                  className={`size-button large ${size === 'large' ? 'active' : ''}`}
                  onClick={() => handleSizeSelect('large')}
                  title="Stor størrelse"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="size-icon"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

<div className="form-row" style={{ marginBottom: '20px' }}>
  <div className="form-group">
    <label>Farge</label>
    <div className="color-buttons-group">
      <button
        type="button"
        className={`color-button default ${color === 'default' ? 'active' : ''}`}
        onClick={() => handleColorSelect('default')}
        title="Standard (Tidslinjefarge)"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M7 21L12 17L17 21V3H7V21Z" />
        </svg>
      </button>
      <button
        type="button"
        className={`color-button blue ${color === 'blue' ? 'active' : ''}`}
        onClick={() => handleColorSelect('blue')}
        title="Blå"
        style={{ backgroundColor: '#007bff' }}
      ></button>
      <button
        type="button"
        className={`color-button green ${color === 'green' ? 'active' : ''}`}
        onClick={() => handleColorSelect('green')}
        title="Grønn"
        style={{ backgroundColor: '#28a745' }}
      ></button>
      <button
        type="button"
        className={`color-button red ${color === 'red' ? 'active' : ''}`}
        onClick={() => handleColorSelect('red')}
        title="Rød"
        style={{ backgroundColor: '#dc3545' }}
      ></button>
      <button
        type="button"
        className={`color-button orange ${color === 'orange' ? 'active' : ''}`}
        onClick={() => handleColorSelect('orange')}
        title="Oransje"
        style={{ backgroundColor: '#fd7e14' }}
      ></button>
      <button
        type="button"
        className={`color-button purple ${color === 'purple' ? 'active' : ''}`}
        onClick={() => handleColorSelect('purple')}
        title="Lilla"
        style={{ backgroundColor: '#6f42c1' }}
      ></button>
    </div>
  </div>
</div>
          
          <div className="form-group" style={{ marginBottom: '25px' }}>
            <label htmlFor="eventDescription">Beskrivelse</label>
            <RichTextEditor 
              value={description}
              onChange={setDescription}
              placeholder="Beskrivelse"
              minHeight="120px"
            />
          </div>
          
          {error && <div className="error">{error}</div>}
        </form>
      </div>
    </div>
  );
}

export default EventEditModal;