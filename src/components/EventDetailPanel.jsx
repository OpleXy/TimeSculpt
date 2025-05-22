import { useRef, useEffect, useState } from 'react';
import RichTextEditor from './RichTextEditor';
import DateInput from './DateInput';

function EventDetailPanel({ event, isOpen, onClose, onSave, onDelete }) {
  const panelRef = useRef(null);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [prevEvent, setPrevEvent] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Editing states - always in editing mode
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSize, setEditSize] = useState('medium');
  const [editColor, setEditColor] = useState('default');
  const [editError, setEditError] = useState('');

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

  // Initialize edit form when event changes or panel opens
  useEffect(() => {
    if (event && isOpen) {
      setEditTitle(event.title || '');
      setEditDate(formatDateForInput(event.date) || '');
      setEditDescription(event.description || '');
      setEditSize(event.size || 'medium');
      setEditColor(event.color || 'default');
      setEditError('');
    }
  }, [event, isOpen]);

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

  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    if (!date) return '';
    
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    return date.toISOString().split('T')[0];
  };

  // Format the event date for display
  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('no-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      weekday: 'long'
    });
  };

  // Utility function to strip HTML for plaintext storage
  const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
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

  // Handle size selection
  const handleSizeSelect = (selectedSize) => {
    setEditSize(selectedSize);
  };

  // Handle color selection
  const handleColorSelect = (selectedColor) => {
    setEditColor(selectedColor);
  };

  // Handle date change
  const handleDateChange = (e) => {
    setEditDate(e.target.value);
  };

  // Auto-save changes when any field changes
  useEffect(() => {
    // Don't auto-save if we're still loading initial data or if there's no event
    if (!event || isContentLoading || !isOpen) return;
    
    // Don't auto-save on first load - check if we have actually made changes
    const hasChanges = (
      editTitle !== (event.title || '') ||
      editDate !== formatDateForInput(event.date) ||
      editDescription !== (event.description || '') ||
      editSize !== (event.size || 'medium') ||
      editColor !== (event.color || 'default')
    );
    
    if (!hasChanges) return;
    
    // Validate required fields before auto-saving
    if (!editTitle || !editDate) {
      setEditError('Vennligst fyll ut alle påkrevde feltene');
      return;
    }
    
    setEditError(''); // Clear any existing errors
    
    // Create updated event object
    const updatedEvent = {
      ...event,
      title: editTitle,
      plainTitle: stripHtml(editTitle),
      date: new Date(editDate),
      description: editDescription,
      size: editSize,
      color: editColor
    };

    // Call the onSave callback with a small delay to avoid too frequent updates
    const timeoutId = setTimeout(() => {
      if (onSave) {
        onSave(updatedEvent);
      }
    }, 500); // 500ms delay for debouncing
    
    return () => clearTimeout(timeoutId);
  }, [editTitle, editDate, editDescription, editSize, editColor, event, isContentLoading, isOpen, onSave]);

  // Handle delete
  const handleDelete = () => {
    if (window.confirm('Er du sikker på at du vil slette denne hendelsen? Denne handlingen kan ikke angres.')) {
      if (onDelete) {
        onDelete(event, event.index);
      }
      onClose();
    }
  };

  if (!event) return null;

  return (
    <div className={`event-detail-panel ${!isOpen ? 'hidden' : ''} ${isExpanded ? 'expanded' : ''} editing`} ref={panelRef}>
      <div className="detail-panel-header">
        <h3>Rediger hendelse</h3>
        <div className="panel-header-actions">
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
        <div className="edit-form">
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label htmlFor="eventTitle">Tittel<span className="required-mark"> *</span></label>
            <RichTextEditor 
              value={editTitle}
              onChange={setEditTitle}
              placeholder="Gi hendelsen en beskrivende tittel"
              minHeight="36px"
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <DateInput 
              value={editDate}
              onChange={handleDateChange}
              label="Dato"
              required={true}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label htmlFor="eventDescription">Beskrivelse</label>
            <RichTextEditor 
              value={editDescription}
              onChange={setEditDescription}
              placeholder="Beskrivelse"
              minHeight="100px"
            />
          </div>

          <div className="form-row property-row">
            <div className="form-group color-group">
              <label>Farge</label>
              <div className="color-buttons-group">
                <button
                  type="button"
                  className={`color-button default ${editColor === 'default' ? 'active' : ''}`}
                  onClick={() => handleColorSelect('default')}
                  title="Standard (Tidslinjefarge)"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="12" 
                    height="12" 
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
                  className={`color-button blue ${editColor === 'blue' ? 'active' : ''}`}
                  onClick={() => handleColorSelect('blue')}
                  title="Blå"
                  style={{ backgroundColor: '#007bff' }}
                ></button>
                <button
                  type="button"
                  className={`color-button green ${editColor === 'green' ? 'active' : ''}`}
                  onClick={() => handleColorSelect('green')}
                  title="Grønn"
                  style={{ backgroundColor: '#28a745' }}
                ></button>
                <button
                  type="button"
                  className={`color-button red ${editColor === 'red' ? 'active' : ''}`}
                  onClick={() => handleColorSelect('red')}
                  title="Rød"
                  style={{ backgroundColor: '#dc3545' }}
                ></button>
                <button
                  type="button"
                  className={`color-button orange ${editColor === 'orange' ? 'active' : ''}`}
                  onClick={() => handleColorSelect('orange')}
                  title="Oransje"
                  style={{ backgroundColor: '#fd7e14' }}
                ></button>
                <button
                  type="button"
                  className={`color-button purple ${editColor === 'purple' ? 'active' : ''}`}
                  onClick={() => handleColorSelect('purple')}
                  title="Lilla"
                  style={{ backgroundColor: '#6f42c1' }}
                ></button>
              </div>
            </div>
          </div>

          <div className="form-row property-row">
            <div className="form-group size-group">
              <label>Størrelse</label>
              <div className="size-buttons-group">
                <button 
                  type="button"
                  className={`size-button small ${editSize === 'small' ? 'active' : ''}`}
                  onClick={() => handleSizeSelect('small')}
                  title="Liten størrelse"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="12" 
                    height="12" 
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
                  className={`size-button medium ${editSize === 'medium' ? 'active' : ''}`}
                  onClick={() => handleSizeSelect('medium')}
                  title="Middels størrelse"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="14" 
                    height="14" 
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
                  className={`size-button large ${editSize === 'large' ? 'active' : ''}`}
                  onClick={() => handleSizeSelect('large')}
                  title="Stor størrelse"
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
                    <rect x="2" y="4" width="20" height="16" rx="1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="delete-button-container">
            <button 
              type="button" 
              className="delete-btn" 
              onClick={handleDelete}
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
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              Slett
            </button>
          </div>
          
          {editError && <div className="error">{editError}</div>}
        </div>
      </div>
    </div>
  );
}

export default EventDetailPanel;