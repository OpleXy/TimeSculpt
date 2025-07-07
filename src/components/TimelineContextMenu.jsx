import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { uploadBackgroundImage, deleteBackgroundImage } from '../services/backgroundImageService';
import '../styles/TimelineContextMenu.css';

function TimelineContextMenu({ 
  position, 
  onColorSelect, 
  onStyleSelect, 
  onClose, 
  currentColor, 
  currentThickness, 
  currentBackgroundColor, 
  onBackgroundImageSelect, 
  currentBackgroundImage,
  showIntervals = true,
  intervalCount = 5,
  onIntervalToggle,
  onIntervalCountChange,
  intervalType = 'even',
  onIntervalTypeChange,
  timelineData = {},
  onBackgroundChange
}) {
  const { currentUser } = useAuth();
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);
  const [currentView, setCurrentView] = useState('main');
  const [scrollPosition, setScrollPosition] = useState(0);
  
  // Background-related state
  const [activeBackgroundTab, setActiveBackgroundTab] = useState('colors');
  const [customColor, setCustomColor] = useState(currentBackgroundColor || '#ffffff');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  
  // Color picker state
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPosition, setColorPickerPosition] = useState({ x: 0, y: 0 });
  
  // Local state for interval count slider
  const [localIntervalCount, setLocalIntervalCount] = useState(intervalCount);
  const [validationWarning, setValidationWarning] = useState('');
  const [maxAllowedIntervals, setMaxAllowedIntervals] = useState(20);
  const [localIntervalType, setLocalIntervalType] = useState(intervalType);
  
  // Available interval types
  const intervalTypes = [
    { id: 'even', label: 'Jevnt fordelt' },
    { id: 'daily', label: 'Daglig' },
    { id: 'weekly', label: 'Ukentlig' },
    { id: 'monthly', label: 'Månedlig' },
    { id: 'yearly', label: 'Årlig' },
    { id: 'century', label: 'Århundre' }
  ];
  
  const [availableTypes, setAvailableTypes] = useState(intervalTypes);
  
  // Forhåndsdefinerte farger for bakgrunn
  const predefinedColors = [
    { name: 'Hvit', value: '#ffffff' },
    { name: 'Lys grå', value: '#f5f5f5' },
    { name: 'Lys blå', value: '#e3f2fd' },
    { name: 'Lys grønn', value: '#e8f5e9' },
    { name: 'Lys gul', value: '#fffde7' },
    { name: 'Lys rosa', value: '#fce4ec' },
    { name: 'Lys lilla', value: '#f3e5f5' },
    { name: 'Krem', value: '#faf8f3' },
    { name: 'Lys cyan', value: '#e0f2f1' },
    { name: 'Beige', value: '#f5f5dc' }
  ];

  // Forhåndsdefinerte bilder
  const predefinedImages = [
    { name: 'CCTV', filename: 'cctv.png', category: 'Teknologi' },
    { name: 'CIA', filename: 'cia.png', category: 'Historie' },
    { name: 'Dinosaur', filename: 'dino.png', category: 'Forhistorie' },
    { name: 'Eldre Krig', filename: 'eldrekrig.png', category: 'Historie' },
    { name: 'Eventyr', filename: 'eventyr.png', category: 'Eventyr' },
    { name: 'Hacker', filename: 'hacker.png', category: 'Teknologi' },
    { name: 'Huleboer', filename: 'huleboer.png', category: 'Forhistorie' },
    { name: 'Industri', filename: 'industri.png', category: 'Industri' },
    { name: 'Kina', filename: 'kina.png', category: 'Kultur' },
    { name: 'Melkeveien', filename: 'melkeveien.png', category: 'Romfart' },
    { name: 'Moderne Krig', filename: 'modernekrig.png', category: 'Historie' },
    { name: 'Overgrodd', filename: 'overgrodd.png', category: 'Natur' },
    { name: 'Patent', filename: 'patent.png', category: 'Teknologi' },
    { name: 'Pyramide', filename: 'pyramide.png', category: 'Historie' },
    { name: 'Ridder', filename: 'ridder.png', category: 'Middelalder' },
    { name: 'TimeSculpt', filename: 'timesculpt.png', category: 'Standard' }
  ];
  
  const MINIMUM_DAYS_PER_INTERVAL = 2;
  
  // Timeline color options
  const timelineColors = [
    { name: 'Default Blue', value: '#007bff' },
    { name: 'Red', value: '#dc3545' },
    { name: 'Green', value: '#28a745' },
    { name: 'Orange', value: '#fd7e14' },
    { name: 'Purple', value: '#6f42c1' },
    { name: 'Teal', value: '#20c997' },
    { name: 'Gray', value: '#6c757d' }
  ];
  
  // Timeline thickness options
  const thicknesses = [
    { name: 'Thin', value: 1 },
    { name: 'Medium', value: 2 },
    { name: 'Thick', value: 3 },
    { name: 'Extra Thick', value: 4 }
  ];
  
  // Update local interval count when prop changes
  useEffect(() => {
    setLocalIntervalCount(intervalCount);
  }, [intervalCount]);
  
  // Update local interval type when prop changes
  useEffect(() => {
    setLocalIntervalType(intervalType);
  }, [intervalType]);
  
  // Update custom color when background color changes
  useEffect(() => {
    setCustomColor(currentBackgroundColor || '#ffffff');
  }, [currentBackgroundColor]);
  
  // Calculate available interval types and max allowed intervals
  useEffect(() => {
    if (!timelineData || !timelineData.start || !timelineData.end) {
      setMaxAllowedIntervals(20);
      setAvailableTypes(intervalTypes);
      return;
    }
    
    const startDate = typeof timelineData.start === 'string' 
      ? new Date(timelineData.start) 
      : timelineData.start;
    
    const endDate = typeof timelineData.end === 'string' 
      ? new Date(timelineData.end) 
      : timelineData.end;
    
    const timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    const diffCenturies = Math.floor(diffYears / 100);
    
    const types = intervalTypes.filter(type => {
      switch (type.id) {
        case 'daily':
          return diffDays >= 2;
        case 'weekly':
          return diffWeeks >= 2;
        case 'monthly':
          return diffMonths >= 2;
        case 'yearly':
          return diffYears >= 2;
        case 'century':
          return diffCenturies >= 2;
        default:
          return true;
      }
    });
    
    setAvailableTypes(types);
    
    if (!types.find(t => t.id === localIntervalType)) {
      setLocalIntervalType('even');
      if (onIntervalTypeChange) {
        onIntervalTypeChange('even');
      }
    }
    
    if (localIntervalType === 'even') {
      const maxIntervals = Math.min(
        diffDays,
        Math.floor(diffDays / MINIMUM_DAYS_PER_INTERVAL)
      );
      
      const calculatedMax = Math.max(2, maxIntervals);
      setMaxAllowedIntervals(calculatedMax);
      
      if (localIntervalCount > calculatedMax) {
        setLocalIntervalCount(calculatedMax);
        if (onIntervalCountChange) {
          onIntervalCountChange(calculatedMax);
        }
        
        const warningMessage = `Maks ${calculatedMax} intervaller for en tidslinje på ${diffDays} dager (maks 1 per dag)`;
        setValidationWarning(warningMessage);
      } else {
        setValidationWarning('');
      }
    }
  }, [timelineData, localIntervalCount, localIntervalType, onIntervalCountChange, onIntervalTypeChange]);
  
  // Apply interval count changes automatically
  useEffect(() => {
    if (localIntervalCount !== intervalCount && onIntervalCountChange) {
      onIntervalCountChange(localIntervalCount);
    }
  }, [localIntervalCount, intervalCount, onIntervalCountChange]);
  
  // Apply interval type changes automatically
  useEffect(() => {
    if (localIntervalType !== intervalType && onIntervalTypeChange) {
      onIntervalTypeChange(localIntervalType);
    }
  }, [localIntervalType, intervalType, onIntervalTypeChange]);
  
  // Validation of image files
  const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Kun JPEG, PNG og WebP-filer er tillatt');
    }

    if (file.size > maxSize) {
      throw new Error('Filen er for stor. Maksimum størrelse er 5MB');
    }

    return true;
  };

  // Handle file upload
  const handleFileUpload = useCallback(async (file) => {
    if (!currentUser) {
      setUploadError('Du må være logget inn for å laste opp bilder');
      return;
    }

    try {
      validateFile(file);
      setIsUploading(true);
      setUploadError('');
      setUploadProgress(0);

      const imageUrl = await uploadBackgroundImage(
        file, 
        currentUser.uid,
        (progress) => setUploadProgress(progress)
      );

      if (onBackgroundImageSelect) {
        onBackgroundImageSelect(imageUrl);
      }

      setIsUploading(false);
      setUploadProgress(0);
    } catch (error) {
      console.error('Feil ved opplasting:', error);
      setUploadError(error.message);
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [currentUser, onBackgroundImageSelect]);

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
    event.target.value = '';
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Handle color selection
  const handleColorSelect = (color) => {
    if (onColorSelect) {
      onColorSelect(color);
    }
    setShowColorPicker(false);
  };

  // Handle custom color picker
  const handleCustomColorClick = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setColorPickerPosition({
      x: rect.right + 10,
      y: rect.top
    });
    setShowColorPicker(true);
  };

  // Handle color picker change with live preview
  const handleColorPickerChange = (e) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    // Apply color immediately for live preview
    if (onColorSelect) {
      onColorSelect(newColor);
    }
  };

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showColorPicker && !e.target.closest('.custom-color-picker-overlay')) {
        setShowColorPicker(false);
      }
    };

    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColorPicker]);

  // Handle background image selection (updated to handle both local and uploaded images)
  const handleBackgroundImageSelect = (imageValue) => {
    if (imageValue) {
      // Check if it's an uploaded image (URL) or local image (filename)
      if (imageValue.startsWith('https://')) {
        // It's an uploaded image URL
        if (onBackgroundImageSelect) {
          onBackgroundImageSelect(imageValue);
        }
      } else {
        // It's a local predefined image
        if (onBackgroundImageSelect) {
          onBackgroundImageSelect(imageValue);
        }
      }
    }
  };

  // Remove custom background
  const handleRemoveCustomBackground = async () => {
    if (currentBackgroundImage && currentBackgroundImage.startsWith('https://')) {
      try {
        await deleteBackgroundImage(currentBackgroundImage);
      } catch (error) {
        console.error('Feil ved sletting av bilde:', error);
      }
    }
    
    if (onColorSelect) {
      onColorSelect('#ffffff');
    }
  };
  
  // Store scroll position when changing views
  useEffect(() => {
    if (menuRef.current) {
      menuRef.current.scrollTop = scrollPosition;
    }
  }, [currentView, scrollPosition]);
  
  // Prevent zooming when scrolling in the menu
  useEffect(() => {
    const handleWheel = (e) => {
      e.stopPropagation();
    };
    
    const menuElement = menuRef.current;
    if (menuElement) {
      menuElement.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    return () => {
      if (menuElement) {
        menuElement.removeEventListener('wheel', handleWheel);
      }
    };
  }, [currentView]);
  
  // Close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);
  
  // Handle right-click to go back
  useEffect(() => {
    const handleRightClick = (e) => {
      e.preventDefault();
      
      if (menuRef.current && menuRef.current.contains(e.target)) {
        if (currentView !== 'main') {
          handleBackClick();
        }
      }
    };
    
    const menuElement = menuRef.current;
    if (menuElement) {
      menuElement.addEventListener('contextmenu', handleRightClick);
    }
    
    return () => {
      if (menuElement) {
        menuElement.removeEventListener('contextmenu', handleRightClick);
      }
    };
  }, [currentView]);
  
  // Handle timeline color selection
  const handleTimelineColorClick = (color) => {
    onStyleSelect({ color });
  };
  
  // Handle thickness selection
  const handleThicknessClick = (thickness) => {
    onStyleSelect({ thickness });
  };
  
  // Handle interval toggle
  const handleIntervalToggle = () => {
    const newShowIntervals = !showIntervals;
    if (onIntervalToggle) {
      onIntervalToggle(newShowIntervals);
    }
  };

  // Handle interval count change with validation
  const handleIntervalCountChange = (newCount) => {
    if (localIntervalType !== 'even') {
      setLocalIntervalCount(newCount);
      return;
    }
    
    if (newCount > maxAllowedIntervals) {
      const startDate = typeof timelineData.start === 'string' 
        ? new Date(timelineData.start) 
        : timelineData.start;
      const endDate = typeof timelineData.end === 'string' 
        ? new Date(timelineData.end) 
        : timelineData.end;
      const timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      setValidationWarning(`Maks ${maxAllowedIntervals} intervaller for en tidslinje på ${diffDays} dager (maks 1 per dag)`);
      setLocalIntervalCount(maxAllowedIntervals);
    } else {
      setValidationWarning('');
      setLocalIntervalCount(newCount);
    }
  };
  
  // Handle interval type change
  const handleIntervalTypeChange = (e) => {
    const newType = e.target.value;
    setLocalIntervalType(newType);
    setValidationWarning('');
  };
  
  // Go back to main menu
  const handleBackClick = () => {
    if (menuRef.current) {
      setScrollPosition(menuRef.current.scrollTop);
    }
    setCurrentView('main');
  };
  
  // Set the menu position style
  const menuPositionStyle = {
    top: `${position.y}px`,
    left: `${position.x}px`,
  };
  
  // Set data attributes to help with styling and theming
  const dataProps = {
    'data-color': currentColor || '#007bff',
    'data-thickness': currentThickness || 2,
    'data-view': currentView
  };
  
  // For highlighting the active menu item
  const isActive = (itemValue, currentValue) => itemValue === currentValue;

  // Check if current background image is custom (uploaded)
  const isCustomImage = currentBackgroundImage && currentBackgroundImage.startsWith('https://');

  // Icon components
  const BackIcon = () => (
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
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  );

  const ChevronIcon = () => (
    <svg 
      className="context-menu-chevron"
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
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  );

  const CheckIcon = () => (
    <svg 
      className="context-menu-check"
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
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );

  const IntervalIcon = () => (
    <svg 
      className="context-menu-icon"
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
      <path d="M2 4h20v16H2z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M6 4v4" />
      <path d="M10 4v6" />
      <path d="M14 4v4" />
      <path d="M18 4v6" />
    </svg>
  );

  const BackgroundIcon = () => (
    <svg 
      className="context-menu-icon"
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
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21,15 16,10 5,21"/>
    </svg>
  );

  const CalendarIcon = () => (
    <svg 
      className="context-menu-icon"
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
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );

  return (
    <div 
      ref={menuRef} 
      style={menuPositionStyle} 
      className="timeline-context-menu"
      {...dataProps}
    >
      {/* Menu Header */}
      <div className="context-menu-header">
        {currentView !== 'main' && (
          <button 
            onClick={handleBackClick}
            className="context-menu-back-btn"
            aria-label="Go back"
          >
            <BackIcon />
          </button>
        )}
        <span>
          {currentView === 'main' && 'Timeline Settings'}
          {currentView === 'thickness' && 'Timeline Thickness'}
          {currentView === 'color' && 'Timeline Color'}
          {currentView === 'intervals' && 'Intervallmarkører'}
          {currentView === 'background' && 'Bakgrunn'}
        </span>
      </div>
      
      <div className="context-menu-body">
        {/* Main Menu */}
        {currentView === 'main' && (
          <ul className="context-menu-list">
            <li 
              className="context-menu-item"
              onClick={() => setCurrentView('background')}
            >
              <div className="context-menu-icon-wrapper">
                <BackgroundIcon />
              </div>
              Bakgrunn
              <ChevronIcon />
            </li>
            
            <li 
              className="context-menu-item"
              onClick={() => setCurrentView('thickness')}
            >
              <div
                className="context-menu-thickness-swatch"
                style={{
                  height: `${currentThickness || 2}px`
                }}
              />
              Timeline Thickness
              <ChevronIcon />
            </li>
            
            <li 
              className="context-menu-item"
              onClick={() => setCurrentView('color')}
            >
              <div
                className="context-menu-color-swatch"
                style={{
                  backgroundColor: currentColor || '#007bff'
                }}
              />
              Timeline Color
              <ChevronIcon />
            </li>
            
            <li 
              className="context-menu-item"
              onClick={() => setCurrentView('intervals')}
            >
              <div className="context-menu-icon-wrapper">
                <IntervalIcon />
              </div>
              Intervallmarkører
              <ChevronIcon />
            </li>
          </ul>
        )}

        {/* Background Submenu */}
        {currentView === 'background' && (
          <div className="context-menu-background">
            <div className="background-tabs">
              <button
                className={`background-tab ${activeBackgroundTab === 'colors' ? 'active' : ''}`}
                onClick={() => setActiveBackgroundTab('colors')}
              >
                Helfarge
              </button>
              <button
                className={`background-tab ${activeBackgroundTab === 'images' ? 'active' : ''}`}
                onClick={() => setActiveBackgroundTab('images')}
              >
                Bilde
              </button>
            </div>

            <div className="background-content">
              {/* Combined colors (with custom color picker as first option) */}
              {activeBackgroundTab === 'colors' && (
                <div className="background-color-palette">
                  {/* Custom color picker as first "color" with pencil icon */}
                  <button
                    className={`background-color-option custom-color-option ${
                      !predefinedColors.find(c => c.value === currentBackgroundColor) ? 'selected' : ''
                    }`}
                    style={{ backgroundColor: customColor }}
                    onClick={handleCustomColorClick}
                    title="Egendefinert farge"
                  >
                    <div className="custom-color-pencil">✏️</div>
                    {!predefinedColors.find(c => c.value === currentBackgroundColor) && (
                      <span className="background-checkmark">✓</span>
                    )}
                  </button>

                  {/* Predefined colors */}
                  {predefinedColors.map((color) => (
                    <button
                      key={color.value}
                      className={`background-color-option ${
                        currentBackgroundColor === color.value ? 'selected' : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => handleColorSelect(color.value)}
                      title={color.name}
                    >
                      {currentBackgroundColor === color.value && (
                        <span className="background-checkmark">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Combined images and upload */}
              {activeBackgroundTab === 'images' && (
                <div className="background-images-section">
                  {/* Upload section first */}
                  <div className="background-upload-section">
                    {!currentUser ? (
                      <div className="background-login-required">
                        <p>Du må være logget inn for å laste opp egne bilder</p>
                      </div>
                    ) : (
                      <>
                        <div className="upload-section-title">Last opp bilde</div>
                        <div 
                          className={`background-drop-zone ${isUploading ? 'uploading' : ''}`}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          onClick={() => !isUploading && fileInputRef.current?.click()}
                        >
                          {isUploading ? (
                            <div className="background-upload-progress">
                              <div className="background-spinner" />
                              <p>Laster opp... {Math.round(uploadProgress)}%</p>
                              <div className="background-progress-bar">
                                <div 
                                  className="background-progress-fill"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="background-upload-icon">📁</div>
                              <p>Dra og slipp bilde her</p>
                              <p className="background-upload-hint">
                                JPEG, PNG, WebP • Maks 5MB
                              </p>
                            </>
                          )}
                        </div>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleFileSelect}
                          className="background-hidden-file-input"
                          disabled={isUploading}
                        />

                        {uploadError && (
                          <div className="background-error">
                            <span className="background-error-icon">⚠️</span>
                            {uploadError}
                          </div>
                        )}

                        {isCustomImage && (
                          <div className="background-custom-image-actions">
                            <h4>Ditt opplastede bilde</h4>
                            <img 
                              src={currentBackgroundImage} 
                              alt="Egendefinert bakgrunn"
                              className="background-custom-image-preview"
                            />
                            <button 
                              className="background-remove-button"
                              onClick={handleRemoveCustomBackground}
                            >
                              Fjern bilde
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Library section second */}
                  <div className="background-library-section">
                    <div className="library-section-title">Bibliotek</div>
                    <div className="background-image-gallery">
                      {predefinedImages.map((image) => (
                        <button
                          key={image.filename}
                          className={`background-image-option ${
                            currentBackgroundImage === image.filename ? 'selected' : ''
                          }`}
                          onClick={() => handleBackgroundImageSelect(image.filename)}
                          title={image.name}
                        >
                          <img
                            src={`/backgrounds/${image.filename}`}
                            alt={image.name}
                            className="background-image-preview"
                            loading="lazy"
                          />
                          <div className="background-image-info">
                            <span className="background-image-name">{image.name}</span>
                          </div>
                          {currentBackgroundImage === image.filename && (
                            <span className="background-checkmark">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Timeline Color Submenu */}
        {currentView === 'color' && (
          <ul className="context-menu-list">
            {timelineColors.map((color) => (
              <li
                key={color.value}
                onClick={() => handleTimelineColorClick(color.value)}
                className={`context-menu-item ${isActive(color.value, currentColor) ? 'active' : ''}`}
              >
                <div
                  className="context-menu-color-swatch"
                  style={{
                    backgroundColor: color.value
                  }}
                />
                {color.name}
                {isActive(color.value, currentColor) && <CheckIcon />}
              </li>
            ))}
          </ul>
        )}
        
        {/* Timeline Thickness Submenu */}
        {currentView === 'thickness' && (
          <ul className="context-menu-list">
            {thicknesses.map((thickness) => (
              <li
                key={thickness.value}
                onClick={() => handleThicknessClick(thickness.value)}
                className={`context-menu-item ${isActive(thickness.value, currentThickness) ? 'active' : ''}`}
              >
                <div
                  className="context-menu-thickness-swatch"
                  style={{
                    height: `${thickness.value}px`
                  }}
                />
                {thickness.name}
                {isActive(thickness.value, currentThickness) && <CheckIcon />}
              </li>
            ))}
          </ul>
        )}
        
        {/* Interval Markers Submenu */}
        {currentView === 'intervals' && (
          <div className="context-menu-intervals">
            <div className="interval-toggle-row">
              <span>Vis intervallmarkører</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={showIntervals}
                  onChange={handleIntervalToggle}
                />
                <span className="slider round"></span>
              </label>
            </div>
            
            {showIntervals && (
              <>
                <div className="interval-type-container">
                  <div className="interval-type-header">
                    <CalendarIcon />
                    <span>Intervalltype:</span>
                  </div>
                  
                  <div className="interval-type-select-wrapper">
                    <select
                      value={localIntervalType}
                      onChange={handleIntervalTypeChange}
                      className="interval-type-select"
                    >
                      {availableTypes.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {localIntervalType === 'even' && (
                  <div className="interval-count-row">
                    <span>Antall intervaller: {localIntervalCount}</span>
                    <input
                      type="range"
                      min="2"
                      max={maxAllowedIntervals}
                      value={localIntervalCount}
                      onChange={(e) => handleIntervalCountChange(parseInt(e.target.value))}
                      className="interval-slider"
                    />
                  </div>
                )}
                
                {validationWarning && (
                  <div className="interval-warning">
                    <svg 
                      className="warning-icon"
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
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <span>{validationWarning}</span>
                  </div>
                )}
                
                <div className="interval-info">
                  <svg 
                    className="info-icon"
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
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span>
                    {localIntervalType === 'even' 
                      ? 'Jevnt fordelte intervaller viser punkter med lik avstand over hele tidslinjen.'
                      : localIntervalType === 'daily'
                        ? 'Daglige intervaller markerer hver dag på tidslinjen.'
                        : localIntervalType === 'weekly'
                          ? 'Ukentlige intervaller markerer starten av hver uke på tidslinjen.'
                          : localIntervalType === 'monthly'
                            ? 'Månedlige intervaller markerer starten av hver måned på tidslinjen.'
                            : localIntervalType === 'yearly'
                              ? 'Årlige intervaller markerer starten av hvert år på tidslinjen.'
                              : 'Århundreintervaller markerer starten av hvert århundre på tidslinjen.'
                    }
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Custom Color Picker Overlay */}
      {showColorPicker && (
        <div 
          className="custom-color-picker-overlay"
          style={{
            position: 'fixed',
            top: `${colorPickerPosition.y}px`,
            left: `${colorPickerPosition.x}px`,
            zIndex: 10000
          }}
        >
          <div className="custom-color-picker-container">
            <div className="custom-color-picker-header">
              <span>Velg bakgrunnsfarge</span>
              <button 
                className="custom-color-picker-close"
                onClick={() => setShowColorPicker(false)}
              >
                ×
              </button>
            </div>
            <div className="custom-color-picker-content">
              <div className="color-preview-row">
                <div 
                  className="color-preview-current"
                  style={{ backgroundColor: customColor }}
                />
                <span className="color-preview-text">{customColor}</span>
              </div>
              <input
                type="color"
                value={customColor}
                onChange={handleColorPickerChange}
                className="custom-color-input"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TimelineContextMenu;