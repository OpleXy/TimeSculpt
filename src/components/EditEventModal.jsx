import { useState, useEffect } from 'react';
import RichTextEditor from './RichTextEditor';
import DateInput from './DateInput';
import ExpandableMenu from './ExpandableMenu';
import { useAuth } from '../contexts/AuthContext';
import '../styles/add-event-modal.css';

function EditEventModal({ 
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  timelineData
}) {
  const { isAuthenticated } = useAuth();
  
  // Check if the timeline has the required fields
  const hasBasicTimelineData = timelineData && 
                              timelineData.title && 
                              timelineData.start && 
                              timelineData.end;

  // Handle event update
  const handleEventUpdate = (eventData) => {
    // Create updated event object with existing properties preserved
    const updatedEvent = {
      ...event, // Preserve existing properties like index, id, etc.
      title: eventData.title,
      plainTitle: stripHtml(eventData.title),
      date: eventData.date,
      description: eventData.description || '',
      size: eventData.size,
      color: eventData.color,
      // Preserve positioning
      xOffset: event.xOffset || 0,
      yOffset: event.yOffset || event.offset || 0,
      offset: event.yOffset || event.offset || 0,
      autoLayouted: event.autoLayouted || false,
      manuallyPositioned: event.manuallyPositioned || false,
      // Preserve image properties if they exist
      hasImage: eventData.hasImage || event.hasImage,
      imageFile: eventData.imageFile || event.imageFile
    };

    onSave(updatedEvent);
    onClose();
  };

  // Utility function to strip HTML for plaintext storage
  const stripHtml = (html) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Handle delete
  const handleDelete = () => {
    if (window.confirm('Er du sikker på at du vil slette denne hendelsen? Denne handlingen kan ikke angres.')) {
      onDelete(event, event.index);
      onClose();
    }
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

  if (!isOpen || !event) return null;

  return (
    <div className="add-event-modal-overlay" onClick={handleBackdropClick}>
      <div 
        className="add-event-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <h2>Rediger hendelse</h2>
          <div className="modal-header-actions">
            <button 
              className="delete-btn-modal"
              onClick={handleDelete}
              title="Slett hendelse"
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
        </div>

        {/* Modal Content */}
        <div className="modal-content">
          {hasBasicTimelineData && (
            <div className="edit-event-form">
              <EditEventForm 
                event={event}
                onUpdateEvent={handleEventUpdate}
                timelineStart={timelineData.start} 
                timelineEnd={timelineData.end}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Special EventForm component for editing that pre-fills values
function EditEventForm({ event, onUpdateEvent, timelineStart, timelineEnd }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [size, setSize] = useState('medium');
  const [color, setColor] = useState('default');
  const [error, setError] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    if (!date) return '';
    
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    return date.toISOString().split('T')[0];
  };

  // Initialize form with event data
  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDate(formatDateForInput(event.date) || '');
      setDescription(event.description || '');
      setSize(event.size || 'medium');
      setColor(event.color || 'default');
      setImageFile(event.imageFile || null);
    }
  }, [event]);

  // Utility function to strip HTML for plaintext storage
  const stripHtml = (html) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Check form validity whenever dependencies change
  useEffect(() => {
    const titleText = stripHtml(title);
    const hasTitle = titleText && titleText.trim().length > 0;
    
    if (!hasTitle || !date) {
      setIsFormValid(false);
      return;
    }

    // Check if date is within timeline bounds
    if (date) {
      const eventDate = new Date(date);
      if (eventDate < timelineStart || eventDate > timelineEnd) {
        setIsFormValid(false);
        return;
      }
    }

    setIsFormValid(true);
  }, [title, date, timelineStart, timelineEnd]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!isFormValid) {
      if (!stripHtml(title) || !date) {
        setError('Vennligst fyll ut alle påkrevde feltene');
      } else {
        setError('Hendelsesdato må være innenfor tidslinjeperioden');
      }
      return;
    }

    // Create event object
    const eventDate = new Date(date);
    
    const eventData = {
      title,
      plainTitle: stripHtml(title),
      date: eventDate,
      description: description || '',
      size,
      color,
      hasImage: !!imageFile,
      imageFile
    };

    // Call parent handler to update event
    onUpdateEvent(eventData);
  };

  // Handle date change
  const handleDateChange = (e) => {
    setDate(e.target.value);
    setError('');
  };

  // Handle size selection
  const handleSizeSelect = (selectedSize) => {
    setSize(selectedSize);
  };
  
  // Handle color selection
  const handleColorSelect = (selectedColor) => {
    setColor(selectedColor);
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  // Render size options content
  const renderSizeOptions = () => (
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
        >
          <rect x="2" y="4" width="20" height="16" rx="1" />
        </svg>
      </button>
    </div>
  );
  
  const renderColorOptions = () => (
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
  );

  // Render description editor content
  const renderDescriptionEditor = () => (
    <RichTextEditor 
      value={description}
      onChange={setDescription}
      placeholder="Beskrivelse"
      minHeight="80px"
      customStyles={{ padding: '4px' }}
    />
  );

  // Render image upload content
  const renderImageUpload = () => (
    <div className="image-upload-container">
      <div className="image-upload-wrapper visible">
        <label htmlFor="bilde-edit" className="image-upload-area">
          <div className="image-upload-content">
            <svg className="image-upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6h.1a5 5 0 010 10H7z" />
            </svg>
            <p className="image-upload-text">Last opp eller dra og slipp bildet her</p>
            {imageFile && (
              <p className="selected-file-text">
                Valgt fil: {typeof imageFile === 'string' ? 'Eksisterende bilde' : imageFile.name}
              </p>
            )}
          </div>
          <input 
            id="bilde-edit" 
            name="bilde-edit" 
            type="file" 
            accept="image/*" 
            className="image-input" 
            onChange={handleImageChange}
          />
        </label>
      </div>
    </div>
  );

  return (
    
      <form onSubmit={handleSubmit} className="compact-form">
        <div className="form-row">
          <div className="form-group title-group">
            <label htmlFor="eventTitle">Tittel<span className="required-mark"> *</span></label>
            <RichTextEditor 
              value={title}
              onChange={(val) => {
                setTitle(val);
                setError('');
              }}
              placeholder="Tittel"
              minHeight="42px"
            />
          </div>

          <div className="form-group date-group">
            <DateInput 
              value={date}
              onChange={handleDateChange}
              label="Dato"
              required={true}
              key={`date-${date}`}
            />
          </div>
        </div>
        
        <div className="expandable-group">
          <ExpandableMenu title="Bilde">
            {renderImageUpload()}
          </ExpandableMenu>
          
          <ExpandableMenu title="Beskrivelse">
            {renderDescriptionEditor()}
          </ExpandableMenu>
          
          <ExpandableMenu title="Farge">
            {renderColorOptions()}
          </ExpandableMenu>
          
          <ExpandableMenu title="Størrelse">
            {renderSizeOptions()}
          </ExpandableMenu>
        </div>
        
        {error && <div className="error">{error}</div>}
        
        <button 
          type="submit" 
          className="add-event-btn"
          disabled={!isFormValid}
          title={isFormValid ? "Oppdater hendelse" : "Fyll ut alle påkrevde felt korrekt før du kan oppdatere hendelsen"}
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
            <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34" />
            <polygon points="18 2 22 6 12 16 8 16 8 12 18 2" />
          </svg>
          <span>Oppdater hendelse</span>
        </button>
      </form>

  );
}

export default EditEventModal;