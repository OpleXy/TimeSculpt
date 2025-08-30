import { useState, useEffect, useRef } from 'react';
import RichTextEditor from './RichTextEditor';
import DateInput from './DateInput';
import '../styles/EventEditModal.css';
import '../styles/event-form.css';

function EventEditModal({ event, onSave, onClose, onDelete }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [size, setSize] = useState('medium');
  const [color, setColor] = useState('default');
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
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
      
      // Handle existing image
      if (event.hasImage && event.imageUrl) {
        setImagePreview(event.imageUrl);
        setImageFile(event.imageUrl); // For existing images, keep the URL
      } else {
        setImageFile(null);
        setImagePreview(null);
      }
    }
  }, [event]);

  // Cleanup preview URL on unmount (only for new files, not existing URLs)
  useEffect(() => {
    return () => {
      if (imagePreview && typeof imagePreview === 'string' && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Prevent wheel events from propagating to the timeline
  useEffect(() => {
    const modalElement = modalRef.current;
    
    if (!modalElement) return;
    
    const handleWheel = (e) => {
      e.stopPropagation();
    };
    
    modalElement.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      if (modalElement) {
        modalElement.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  // Validate image file
  const validateImageFile = (file) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Ugyldig filtype. Kun JPEG, PNG, GIF og WebP bilder er tillatt.');
      return false;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Filen er for stor. Maksimal størrelse er 5MB.');
      return false;
    }

    return true;
  };

  // Process image file (common function for both file input and drag-drop)
  const processImageFile = (file) => {
    if (!validateImageFile(file)) {
      return;
    }

    setImageFile(file);
    setError(''); // Clear any existing errors

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

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
      title,
      plainTitle: stripHtml(title),
      date: new Date(date),
      description,
      size,
      color,
      hasImage: !!imageFile,
      imageFile: imageFile
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

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Drag over - EventEditModal');
    setIsDragOver(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Drag enter - EventEditModal');
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Drag leave - EventEditModal');
    
    // Only set dragOver to false if we're leaving the drag area completely
    const dragArea = e.currentTarget;
    const relatedTarget = e.relatedTarget;
    
    if (!dragArea.contains(relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Drop - EventEditModal', e.dataTransfer.files);
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      console.log('Processing image file:', imageFile.name);
      processImageFile(imageFile);
    } else if (files.length > 0) {
      console.log('No image files found');
      setError('Kun bildefiler er tillatt.');
    }
  };

  // Handle image removal
  const handleImageRemove = () => {
    // Only revoke URL if it's a blob URL (new upload)
    if (imagePreview && typeof imagePreview === 'string' && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    
    // Reset the file input
    const fileInput = document.getElementById('image-edit');
    if (fileInput) {
      fileInput.value = '';
    }
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
              form="event-edit-form"
              type="submit" 
              className="save-btn"
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
                <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34" />
                <polygon points="18 2 22 6 12 16 8 16 8 12 18 2" />
              </svg>
              Oppdater
            </button>
          </div>
        </div>

        <form id="event-edit-form" onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label htmlFor="eventTitle">Tittel<span className="required-mark"> *</span></label>
            
            <RichTextEditor 
              value={title}
              onChange={setTitle}
              placeholder="Gi hendelsen en beskrivende tittel"
              minHeight="36px"
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <DateInput 
              value={date}
              onChange={handleDateChange}
              label="Dato"
              required={true}
            />
          </div>

          {/* Image Upload Section */}
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label>Bilde</label>
            <div className="image-upload-container">
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
                        {typeof imageFile === 'string' ? 'Eksisterende bilde' : imageFile?.name}
                      </span>
                      <span className="file-size">
                        {typeof imageFile === 'object' && imageFile?.size ? `${(imageFile.size / 1024 / 1024).toFixed(1)} MB` : ''}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Upload area with drag-and-drop */}
                {!imagePreview && (
                  <label 
                    htmlFor="image-edit" 
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
                  id="image-edit" 
                  name="image-edit" 
                  type="file" 
                  accept="image/*" 
                  className="image-input" 
                  onChange={handleImageChange}
                />
              </div>
            </div>
          </div>
          
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label htmlFor="eventDescription">Beskrivelse</label>
            <RichTextEditor 
              value={description}
              onChange={setDescription}
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
                  className={`color-button default ${color === 'default' ? 'active' : ''}`}
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
            <div className="form-group size-group">
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
                  className={`size-button medium ${size === 'medium' ? 'active' : ''}`}
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
                  className={`size-button large ${size === 'large' ? 'active' : ''}`}
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
              onClick={() => onDelete && onDelete(event, event.index)}
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
          
          {error && <div className="error">{error}</div>}
        </form>
      </div>
    </div>
  );
}

export default EventEditModal;