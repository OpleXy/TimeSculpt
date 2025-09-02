// src/components/contextMenu/BackgroundSubmenu.jsx - MED INNEBYGD IMAGE EDITING
import React, { useState, useRef, useCallback } from 'react';
import { uploadBackgroundImage, deleteBackgroundImage } from '../../services/backgroundImageService';

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

const predefinedImages = [
  { name: 'Strand', filename: 'beach.png', category: 'Natur' },
  { name: 'By', filename: 'city.png', category: 'Urban' },
  { name: 'Skog', filename: 'forest.png', category: 'Natur' },
];

function BackgroundSubmenu({
  currentUser,
  currentBackgroundColor,
  currentBackgroundImage,
  onColorSelect,
  onBackgroundImageSelect,
  setCurrentView
}) {
  const fileInputRef = useRef(null);
  const [activeBackgroundTab, setActiveBackgroundTab] = useState('colors');
  const [customColor, setCustomColor] = useState(currentBackgroundColor || '#ffffff');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  
  // NEW: Image editing states - directly in background menu
  const [selectedImageForEditing, setSelectedImageForEditing] = useState(null);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [imageFilters, setImageFilters] = useState({
    blur: 0,
    brightness: 100,
    saturate: 100
  });

  // Helper function to get the actual image URL from different formats
  const getCurrentImageUrl = () => {
    if (!currentBackgroundImage) return null;
    
    if (typeof currentBackgroundImage === 'object' && currentBackgroundImage.url) {
      return currentBackgroundImage.url;
    } else if (typeof currentBackgroundImage === 'string') {
      return currentBackgroundImage;
    }
    
    return null;
  };

  // Helper function to check if current image matches a filename
  const isImageSelected = (filename) => {
    if (!currentBackgroundImage) return false;
    
    if (typeof currentBackgroundImage === 'object' && currentBackgroundImage.url) {
      return currentBackgroundImage.url === `/backgrounds/${filename}`;
    } else if (typeof currentBackgroundImage === 'string') {
      return currentBackgroundImage === filename || 
             currentBackgroundImage === `/backgrounds/${filename}`;
    }
    
    return false;
  };

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

      // FIXED: Set uploaded image for editing
      setSelectedImageForEditing(imageUrl);
      resetImageFilters(); // Reset filters for new upload

      setIsUploading(false);
      setUploadProgress(0);
      
      // Switch to images tab but DON'T open editor automatically
      setActiveBackgroundTab('images');
      
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

  const handleColorSelect = (color) => {
    if (onColorSelect) {
      onColorSelect(color);
    }
  };

  // Handle color picker change with live preview
  const handleColorPickerChange = (e) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    if (onColorSelect) {
      onColorSelect(newColor);
    }
  };

  // NEW: Handle background image selection WITH editing option
  const handleBackgroundImageSelect = (imageValue) => {
    if (imageValue) {
      if (onBackgroundImageSelect) {
        onBackgroundImageSelect(imageValue);
      }
      
      // FIXED: Set up for potential editing - handle both uploaded and predefined images
      setSelectedImageForEditing(imageValue);
      
      // Load existing filters if available
      if (typeof currentBackgroundImage === 'object' && currentBackgroundImage.filters) {
        parseFiltersFromString(currentBackgroundImage.filters);
      } else {
        resetImageFilters();
      }
    }
  };

  // NEW: Parse existing filters from CSS string
  const parseFiltersFromString = (filterString) => {
    const filters = {
      blur: 0,
      brightness: 100,
      saturate: 100
    };

    if (filterString && filterString !== 'none') {
      const filterMatches = filterString.match(/(\w+)\(([^)]+)\)/g);
      if (filterMatches) {
        filterMatches.forEach(match => {
          const [, filterName, value] = match.match(/(\w+)\(([^)]+)\)/);
          
          switch (filterName) {
            case 'blur':
              filters.blur = parseFloat(value.replace('px', ''));
              break;
            case 'brightness':
              filters.brightness = parseInt(value.replace('%', ''));
              break;
            case 'saturate':
              filters.saturate = parseInt(value.replace('%', ''));
              break;
          }
        });
      }
    }

    setImageFilters(filters);
  };

  // NEW: Reset image filters
  const resetImageFilters = () => {
    setImageFilters({
      blur: 0,
      brightness: 100,
      saturate: 100
    });
  };

  // NEW: Handle filter changes - IMPROVED for both uploaded and predefined images
  const handleFilterChange = (filterType, value) => {
    const newFilters = {
      ...imageFilters,
      [filterType]: value
    };
    
    setImageFilters(newFilters);
    
    // Apply filters in real-time
    if (selectedImageForEditing && onBackgroundImageSelect) {
      const filterString = createFilterString(newFilters);
      
      let imageUrl;
      
      // FIXED: Handle both uploaded images (URLs) and predefined images (filenames)
      if (typeof selectedImageForEditing === 'string') {
        if (selectedImageForEditing.startsWith('http')) {
          // Uploaded image - use URL directly
          imageUrl = selectedImageForEditing;
        } else {
          // Predefined image - add path prefix
          imageUrl = `/backgrounds/${selectedImageForEditing}`;
        }
      } else if (selectedImageForEditing && selectedImageForEditing.url) {
        // Structured image object
        imageUrl = selectedImageForEditing.url;
      }
      
      if (imageUrl) {
        onBackgroundImageSelect({
          url: imageUrl,
          filters: filterString !== 'none' ? filterString : 'none',
          _applyToBackground: true,
          _timestamp: Date.now()
        });
      }
    }
  };

  // NEW: Create CSS filter string
  const createFilterString = (filters) => {
    const filterParts = [];
    
    if (filters.blur > 0) filterParts.push(`blur(${filters.blur}px)`);
    if (filters.brightness !== 100) filterParts.push(`brightness(${filters.brightness}%)`);
    if (filters.saturate !== 100) filterParts.push(`saturate(${filters.saturate}%)`);
    
    return filterParts.length > 0 ? filterParts.join(' ') : 'none';
  };

  // NEW: Generate filter style for preview
  const getFilterStyle = () => {
    return createFilterString(imageFilters);
  };

  // NEW: Reset filters - IMPROVED to handle all image types
  const handleResetFilters = () => {
    resetImageFilters();
    
    if (selectedImageForEditing && onBackgroundImageSelect) {
      let imageUrl;
      
      // FIXED: Handle both uploaded and predefined images
      if (typeof selectedImageForEditing === 'string') {
        if (selectedImageForEditing.startsWith('http')) {
          // Uploaded image
          imageUrl = selectedImageForEditing;
        } else {
          // Predefined image
          imageUrl = `/backgrounds/${selectedImageForEditing}`;
        }
      } else if (selectedImageForEditing && selectedImageForEditing.url) {
        // Structured image object
        imageUrl = selectedImageForEditing.url;
      }
      
      if (imageUrl) {
        onBackgroundImageSelect({
          url: imageUrl,
          filters: 'none',
          _applyToBackground: true,
          _timestamp: Date.now()
        });
      }
    }
  };

  // NEW: Toggle image editor visibility
  const toggleImageEditor = () => {
    if (!showImageEditor && selectedImageForEditing) {
      // Load current filters when opening editor
      if (typeof currentBackgroundImage === 'object' && currentBackgroundImage.filters) {
        parseFiltersFromString(currentBackgroundImage.filters);
      }
    }
    setShowImageEditor(!showImageEditor);
  };

  // Remove custom background
  const handleRemoveCustomBackground = async () => {
    const currentImageUrl = getCurrentImageUrl();
    
    if (currentImageUrl && currentImageUrl.startsWith('https://')) {
      try {
        await deleteBackgroundImage(currentImageUrl);
      } catch (error) {
        console.error('Feil ved sletting av bilde:', error);
      }
    }
    
    setSelectedImageForEditing(null);
    setShowImageEditor(false);
    
    if (onColorSelect) {
      onColorSelect('#ffffff');
    }
  };

  // Check if current background image is custom (uploaded)
  const isCustomImage = () => {
    const imageUrl = getCurrentImageUrl();
    return imageUrl && imageUrl.startsWith('https://');
  };

  // Get display URL for custom image preview
  const getCustomImagePreviewUrl = () => {
    return getCurrentImageUrl();
  };

  // UPDATED: Check if we have a selected image that can be edited
  const canEditCurrentImage = () => {
    // Check if there's a currently active background image
    const currentUrl = getCurrentImageUrl();
    return currentUrl !== null;
  };

  // NEW: Initialize editing when component loads if image is already selected
  React.useEffect(() => {
    const currentUrl = getCurrentImageUrl();
    if (currentUrl) {
      setSelectedImageForEditing(currentBackgroundImage);
      
      // Load existing filters if available
      if (typeof currentBackgroundImage === 'object' && currentBackgroundImage.filters) {
        parseFiltersFromString(currentBackgroundImage.filters);
      } else {
        resetImageFilters();
      }
    }
  }, [currentBackgroundImage]);

  return (
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
        {activeBackgroundTab === 'colors' && (
          <div className="background-color-palette">
            {/* Custom color input */}
            <label className="custom-color-input-wrapper">
              <input
                type="color"
                value={customColor}
                onChange={handleColorPickerChange}
                className="custom-color-input"
                title="Egendefinert farge"
              />
            </label>

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

        {/* Images tab */}
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

                  {isCustomImage() && (
                    <div className="background-custom-image-actions">
                      <h4>Ditt opplastede bilde</h4>
                      <img 
                        src={getCustomImagePreviewUrl()} 
                        alt="Egendefinert bakgrunn"
                        className="background-custom-image-preview"
                        style={showImageEditor ? { filter: getFilterStyle() } : {}}
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
              <div className="library-section-title">Forslag: (generert av openAI)</div>
              <div className="background-image-gallery">
                {predefinedImages.map((image) => (
                  <button
                    key={image.filename}
                    className={`background-image-option ${
                      isImageSelected(image.filename) ? 'selected' : ''
                    }`}
                    onClick={() => handleBackgroundImageSelect(image.filename)}
                    title={image.name}
                  >
                    <img
                      src={`/backgrounds/${image.filename}`}
                      alt={image.name}
                      className="background-image-preview"
                      loading="lazy"
                      style={showImageEditor && isImageSelected(image.filename) ? { filter: getFilterStyle() } : {}}
                    />
                    <div className="background-image-info">
                      <span className="background-image-name">{image.name}</span>
                    </div>
                    {isImageSelected(image.filename) && (
                      <span className="background-checkmark">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* NEW: Image Editor Section - Only show when there's an image selected */}
            {canEditCurrentImage() && (
              <div className="background-image-editor-section">
                <div className="editor-section-header">
                  <div className="editor-section-title">Bildeeditor</div>
                  <button 
                    className={`editor-toggle-btn ${showImageEditor ? 'active' : ''}`}
                    onClick={toggleImageEditor}
                    title={showImageEditor ? 'Skjul editor' : 'Vis editor'}
                  >
                    {showImageEditor ? '▼' : '▶'}
                  </button>
                </div>
                
                {showImageEditor && (
                  <div className="inline-image-editor">
                    {/* Filter Controls */}
                    <div className="filter-controls-compact">
                      {/* Blur */}
                      <div className={`filter-group-compact ${imageFilters.blur > 0 ? 'has-filter' : ''}`}>
                        <label>Blur: {imageFilters.blur}px</label>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="0.1"
                          value={imageFilters.blur}
                          onChange={(e) => handleFilterChange('blur', parseFloat(e.target.value))}
                          className="filter-slider-compact"
                        />
                      </div>

                      {/* Brightness */}
                      <div className={`filter-group-compact ${imageFilters.brightness !== 100 ? 'has-filter' : ''}`}>
                        <label>Lysstyrke: {imageFilters.brightness}%</label>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={imageFilters.brightness}
                          onChange={(e) => handleFilterChange('brightness', parseInt(e.target.value))}
                          className="filter-slider-compact"
                        />
                      </div>

                      {/* Saturation */}
                      <div className={`filter-group-compact ${imageFilters.saturate !== 100 ? 'has-filter' : ''}`}>
                        <label>Metning: {imageFilters.saturate}%</label>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={imageFilters.saturate}
                          onChange={(e) => handleFilterChange('saturate', parseInt(e.target.value))}
                          className="filter-slider-compact"
                        />
                      </div>
                    </div>

                    {/* Reset Button */}
                    <div className="editor-actions-compact">
                      <button 
                        className="reset-filters-btn-compact"
                        onClick={handleResetFilters}
                        title="Tilbakestill alle filtere"
                      >
                        Tilbakestill
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BackgroundSubmenu;