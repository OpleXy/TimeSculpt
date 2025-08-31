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
  event,
  timelineData
}) {
  const { isAuthenticated } = useAuth();
  
  // Check if the timeline has the required fields
  const hasBasicTimelineData = timelineData && 
                              timelineData.title && 
                              timelineData.start && 
                              timelineData.end;

  // Handle event update - FIXED to preserve all image properties
  const handleEventUpdate = (eventData) => {
    // Create updated event object with existing properties preserved
    const updatedEvent = {
      ...event, // Preserve ALL existing properties first
      // Then update with new data
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
      
      // CRITICAL FIX: Preserve existing image properties when no new image is uploaded
      hasImage: eventData.hasImage || event.hasImage || false,
      
      // If new image file is provided, use it, otherwise keep existing image data
      imageFile: eventData.imageFile !== undefined ? eventData.imageFile : event.imageFile,
      imageUrl: eventData.imageUrl !== undefined ? eventData.imageUrl : event.imageUrl,
      imageStoragePath: eventData.imageStoragePath !== undefined ? eventData.imageStoragePath : event.imageStoragePath,
      imageFileName: eventData.imageFileName !== undefined ? eventData.imageFileName : event.imageFileName
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

  // Close modal on ESC key and prevent drag events on modal
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    
    // Prevent drag events on the entire document to avoid opening images in new tabs
    const handleDocumentDragOver = (e) => {
      e.preventDefault();
    };
    
    const handleDocumentDrop = (e) => {
      e.preventDefault();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc, false);
      document.addEventListener('dragover', handleDocumentDragOver, false);
      document.addEventListener('drop', handleDocumentDrop, false);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc, false);
      document.removeEventListener('dragover', handleDocumentDragOver, false);
      document.removeEventListener('drop', handleDocumentDrop, false);
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
    <div 
      className="add-event-modal-overlay" 
      onClick={handleBackdropClick}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
    >
      <div 
        className="add-event-modal"
        onClick={(e) => e.stopPropagation()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <h2>Rediger hendelse</h2>
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

// Special EventForm component for editing that pre-fills values with FIXED image support
function EditEventForm({ event, onUpdateEvent, timelineStart, timelineEnd }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [size, setSize] = useState('medium');
  const [color, setColor] = useState('default');
  const [error, setError] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  // State for drag and drop
  const [imageChanged, setImageChanged] = useState(false); // Track if image was changed
  const [isDragOver, setIsDragOver] = useState(false);

  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    if (!date) return '';
    
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    return date.toISOString().split('T')[0];
  };

  // FIXED: Initialize form with event data including proper image handling
  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDate(formatDateForInput(event.date) || '');
      setDescription(event.description || '');
      setSize(event.size || 'medium');
      setColor(event.color || 'default');
      setImageChanged(false); // Reset image changed flag
      
      // FIXED: Handle existing image with better logic
      if (event.hasImage && (event.imageFile || event.imageUrl)) {
        const imageUrl = event.imageUrl || (typeof event.imageFile === 'string' ? event.imageFile : null);
        if (imageUrl) {
          setExistingImageUrl(imageUrl);
          setImagePreview(imageUrl);
          setImageFile(null); // Clear new image file since we're using existing
        }
      } else {
        setImageFile(null);
        setImagePreview(null);
        setExistingImageUrl(null);
      }
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
  }, [title, date, timelineStart, timelineEnd]); // FIXED: Added missing dependencies

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview !== existingImageUrl) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview, existingImageUrl]);

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
    
    // FIXED: Proper image handling logic
    const eventData = {
      title,
      plainTitle: stripHtml(title),
      date: eventDate,
      description: description || '',
      size,
      color,
      
      // CRITICAL FIX: Only update image properties if image was actually changed
      ...(imageChanged ? {
        hasImage: !!(imageFile || existingImageUrl),
        imageFile: imageFile, // New file if uploaded
        imageUrl: existingImageUrl, // Keep existing URL if no new file
        // Don't specify imageStoragePath and imageFileName if not changed
        // Let them be preserved from the original event
      } : {
        // If image wasn't changed, don't specify any image properties
        // This will let the handleEventUpdate function preserve existing values
      })
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

  // FIXED: Handle image file selection with preview and change tracking
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Ugyldig filtype. Kun JPEG, PNG, GIF og WebP bilder er tillatt.');
        return;
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('Filen er for stor. Maksimal størrelse er 5MB.');
        return;
      }

      setImageFile(file);
      setError(''); // Clear any existing errors
      setImageChanged(true); // Mark that image was changed
      
      // Clear existing image
      setExistingImageUrl(null);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // FIXED: Handle image removal with change tracking
  const handleImageRemove = () => {
    // Clean up preview URLs
    if (imagePreview && imagePreview !== existingImageUrl) {
      URL.revokeObjectURL(imagePreview);
    }
    
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    setImageChanged(true); // Mark that image was changed (removed)
    
    // Reset the file input
    const fileInput = document.getElementById('bilde-edit');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Ugyldig filtype. Kun JPEG, PNG, GIF og WebP bilder er tillatt.');
        return;
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('Filen er for stor. Maksimal størrelse er 5MB.');
        return;
      }

      setImageFile(file);
      setError('');
      setImageChanged(true);
      
      // Clear existing image
      setExistingImageUrl(null);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
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

  // Render image upload content with preview and existing image support + drag-and-drop
  const renderImageUpload = () => (
    <div className="image-upload-container">
      <style>{`
        .image-upload-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 6rem;
          border: 2px dashed #ccc;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          background-color: #f8f9fa;
        }
        .image-upload-area:hover {
          background-color: #e9ecef;
          border-color: #007bff;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .image-upload-area.drag-over {
          background-color: #007bff !important;
          border-color: #007bff !important;
          border-style: solid !important;
          border-width: 3px !important;
          transform: translateY(-3px) !important;
          box-shadow: 0 8px 16px rgba(0, 123, 255, 0.3) !important;
        }
        .image-upload-area.drag-over .image-upload-icon {
          color: white !important;
          transform: scale(1.1);
        }
        .image-upload-area.drag-over .image-upload-text,
        .image-upload-area.drag-over .image-upload-subtitle {
          color: white !important;
          font-weight: 600 !important;
        }
        .image-upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 8px;
          pointer-events: none;
        }
        .image-upload-icon {
          width: 2rem;
          height: 2rem;
          color: #6c757d;
          transition: all 0.3s ease;
        }
        .image-upload-area:hover:not(.drag-over) .image-upload-icon {
          color: #007bff;
        }
        .image-upload-text {
          font-size: 0.8rem;
          color: #6c757d;
          font-weight: 500;
          margin: 0;
          transition: all 0.3s ease;
        }
        .image-upload-subtitle {
          font-size: 0.7rem;
          color: #6c757d;
          opacity: 0.8;
          margin: 0;
          transition: all 0.3s ease;
        }
        .image-upload-area:hover:not(.drag-over) .image-upload-text,
        .image-upload-area:hover:not(.drag-over) .image-upload-subtitle {
          color: #007bff;
        }
        .image-preview {
          position: relative;
          border: 2px solid #ccc;
          border-radius: 8px;
          overflow: hidden;
          background-color: #f8f9fa;
          margin-bottom: 0.5rem;
          animation: fadeInScale 0.3s ease-out;
        }
        .preview-image {
          width: 100%;
          height: auto;
          max-height: 150px;
          object-fit: cover;
          display: block;
        }
        .remove-image-btn {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 24px;
          height: 24px;
          background-color: rgba(220, 53, 69, 0.9);
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          z-index: 2;
        }
        .remove-image-btn:hover {
          background-color: rgba(220, 53, 69, 1);
          transform: scale(1.1);
        }
        .image-info {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
          color: white;
          padding: 6px 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
        }
        .file-name {
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 60%;
        }
        .file-size {
          font-weight: 400;
          opacity: 0.9;
        }
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
      <div className="image-upload-wrapper visible">
        {/* Image preview */}
        {imagePreview && (
          <div className="image-preview">
            <img src={imagePreview} alt="Forhåndsvisning" className="preview-image" />
            <button 
              type="button"
              className="remove-image-btn"
              onClick={handleImageRemove}
              title="Fjern bilde"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="image-info">
              <span className="file-name">
                {imageFile?.name || 'Eksisterende bilde'}
              </span>
              <span className="file-size">
                {imageFile ? `${(imageFile.size / 1024 / 1024).toFixed(1)} MB` : ''}
              </span>
            </div>
          </div>
        )}
        
        {/* Upload area with drag-and-drop */}
        {!imagePreview && (
          <label 
            htmlFor="bilde-edit" 
            className={`image-upload-area ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="image-upload-content">
              <svg className="image-upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6h.1a5 5 0 010 10H7z" />
              </svg>
              <p className="image-upload-text">
                {isDragOver ? 'Slipp bildet her' : 'Last opp eller dra og slipp bildet her'}
              </p>
              <p className="image-upload-subtitle">JPEG, PNG, GIF, WebP (maks 5MB)</p>
            </div>
          </label>
        )}
        
        <input 
          id="bilde-edit" 
          name="bilde-edit" 
          type="file" 
          accept="image/*" 
          className="image-input" 
          onChange={handleImageChange}
        />
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
    </div>
  );
}

export default EditEventModal;