import { useState, useEffect } from 'react';
import RichTextEditor from './RichTextEditor';
import DateInput from './DateInput';
import ExpandableMenu from './ExpandableMenu';
import { useAuth } from '../contexts/AuthContext';
import '../styles/add-event-modal.css';

function CreateEventModal({ 
  isOpen, 
  onClose, 
  onSave, 
  date,
  timelineColor 
}) {
  const { isAuthenticated } = useAuth();
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState(date);
  const [description, setDescription] = useState('');
  const [size, setSize] = useState('medium');
  const [color, setColor] = useState('default');
  const [error, setError] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  // Reset form når modal åpnes
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setEventDate(date);
      setDescription('');
      setSize('medium');
      setColor('default');
      setImageFile(null);
      setError('');
    }
  }, [isOpen, date]);

  // Sjekk om skjemaet er gyldig
  useEffect(() => {
    const titleText = stripHtml(title);
    const hasTitle = titleText && titleText.trim().length > 0;
    const hasDate = eventDate && !isNaN(eventDate.getTime());
    
    setIsFormValid(hasTitle && hasDate);
  }, [title, eventDate]);

  // Utility function to strip HTML for plaintext storage
  const stripHtml = (html) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Handle event creation
  const handleEventCreate = (eventData) => {
    // Create event object
    const newEvent = {
      title: eventData.title,
      plainTitle: stripHtml(eventData.title),
      date: eventData.date,
      description: eventData.description || '',
      size: eventData.size,
      color: eventData.color,
      // Default positioning
      xOffset: 0,
      yOffset: 0,
      offset: 0,
      autoLayouted: false,
      manuallyPositioned: false,
      // Image properties
      hasImage: !!eventData.imageFile,
      imageFile: eventData.imageFile
    };

    onSave(newEvent);
    onClose();
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
          <h2>Ny hendelse</h2>
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
          <div className="create-event-form">
            <CreateEventForm 
              date={eventDate}
              onDateChange={setEventDate}
              onSaveEvent={handleEventCreate}
              timelineColor={timelineColor}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Create Event Form component
function CreateEventForm({ date, onDateChange, onSaveEvent, timelineColor }) {
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState(date);
  const [description, setDescription] = useState('');
  const [size, setSize] = useState('medium');
  const [color, setColor] = useState('default');
  const [error, setError] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  // Update local state when prop changes
  useEffect(() => {
    setEventDate(date);
  }, [date]);

  // Check form validity
  useEffect(() => {
    const titleText = stripHtml(title);
    const hasTitle = titleText && titleText.trim().length > 0;
    const hasDate = eventDate && !isNaN(eventDate.getTime());
    
    setIsFormValid(hasTitle && hasDate);
  }, [title, eventDate]);

  // Utility function to strip HTML for plaintext storage
  const stripHtml = (html) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!isFormValid) {
      setError('Vennligst fyll ut alle påkrevde feltene');
      return;
    }

    // Create event object
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

    // Call parent handler to create event
    onSaveEvent(eventData);
  };

  // Handle date change
  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      setEventDate(newDate);
      onDateChange(newDate);
    }
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
        <label htmlFor="bilde-create" className="image-upload-area">
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
            id="bilde-create" 
            name="bilde-create" 
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
    <div className="event-form no-title">
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
              value={eventDate ? eventDate.toISOString().split('T')[0] : ''}
              onChange={handleDateChange}
              label="Dato"
              required={true}
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
          title={isFormValid ? "Legg til hendelse" : "Fyll ut alle påkrevde felt korrekt før du kan legge til hendelsen"}
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
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Legg til hendelse</span>
        </button>
      </form>
    </div>
  );
}

export default CreateEventModal;