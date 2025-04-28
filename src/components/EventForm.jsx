import { useState, useEffect } from 'react';
import RichTextEditor from './RichTextEditor';
import DateInput from './DateInput';
import ExpandableMenu from './ExpandableMenu';
import '../styles/EventFormTransition.css';
import '../styles/event-form.css';
import '../styles/expandable-menu.css';

function EventForm({ onAddEvent, timelineStart, timelineEnd }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [size, setSize] = useState('medium');
  const [color, setColor] = useState('default'); // Default color matches timeline color
  const [error, setError] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);

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
      color, // Add color to event data
      offset: 0,
      xOffset: 0,
      yOffset: 0
    };

    // Call parent handler to add event
    onAddEvent(eventData);

    // Reset form
    setTitle('');
    setDate('');
    setDescription('');
    setSize('medium');
    setColor('default');
    setError('');
  };

  // Handle date change from DateInput component
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

  return (
    <div className="event-form">
      <h3>Legg til hendelse</h3>
      <form onSubmit={handleSubmit} className="compact-form">
        <div className="form-group">
          <label htmlFor="eventTitle">Tittel<span className="required-mark"> *</span></label>
          <RichTextEditor 
            value={title}
            onChange={(val) => {
              setTitle(val);
              setError('');
            }}
            placeholder="Tittel"
            minHeight="40px"
          />
        </div>

        <DateInput 
          value={date}
          onChange={handleDateChange}
          label="Dato"
          required={true}
          key={date}
        />
        
        <div className="expandable-group">
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

export default EventForm;