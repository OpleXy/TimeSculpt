// src/components/contextMenu/BackgroundSubmenu.jsx - COMPACT VERSION
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
  
  // Image editing states - always available when image is selected
  const [selectedImageForEditing, setSelectedImageForEditing] = useState(null);
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

      setSelectedImageForEditing(imageUrl);
      resetImageFilters();

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

  // Handle background image selection WITH editing option
  const handleBackgroundImageSelect = (imageValue) => {
    if (imageValue) {
      if (onBackgroundImageSelect) {
        onBackgroundImageSelect(imageValue);
      }
      
      setSelectedImageForEditing(imageValue);
      
      // Load existing filters if available
      if (typeof currentBackgroundImage === 'object' && currentBackgroundImage.filters) {
        parseFiltersFromString(currentBackgroundImage.filters);
      } else {
        resetImageFilters();
      }
    }
  };

  // Parse existing filters from CSS string
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

  // Reset image filters
  const resetImageFilters = () => {
    setImageFilters({
      blur: 0,
      brightness: 100,
      saturate: 100
    });
  };

  // Handle filter changes
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
      
      if (typeof selectedImageForEditing === 'string') {
        if (selectedImageForEditing.startsWith('http')) {
          imageUrl = selectedImageForEditing;
        } else {
          imageUrl = `/backgrounds/${selectedImageForEditing}`;
        }
      } else if (selectedImageForEditing && selectedImageForEditing.url) {
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

  // Create CSS filter string
  const createFilterString = (filters) => {
    const filterParts = [];
    
    if (filters.blur > 0) filterParts.push(`blur(${filters.blur}px)`);
    if (filters.brightness !== 100) filterParts.push(`brightness(${filters.brightness}%)`);
    if (filters.saturate !== 100) filterParts.push(`saturate(${filters.saturate}%)`);
    
    return filterParts.length > 0 ? filterParts.join(' ') : 'none';
  };

  // Generate filter style for preview
  const getFilterStyle = () => {
    return createFilterString(imageFilters);
  };

  // Reset filters
  const handleResetFilters = () => {
    resetImageFilters();
    
    if (selectedImageForEditing && onBackgroundImageSelect) {
      let imageUrl;
      
      if (typeof selectedImageForEditing === 'string') {
        if (selectedImageForEditing.startsWith('http')) {
          imageUrl = selectedImageForEditing;
        } else {
          imageUrl = `/backgrounds/${selectedImageForEditing}`;
        }
      } else if (selectedImageForEditing && selectedImageForEditing.url) {
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

  // Check if we have a selected image that can be edited
  const canEditCurrentImage = () => {
    const currentUrl = getCurrentImageUrl();
    return currentUrl !== null;
  };

  // Initialize editing when component loads if image is already selected
  React.useEffect(() => {
    const currentUrl = getCurrentImageUrl();
    if (currentUrl) {
      setSelectedImageForEditing(currentBackgroundImage);
      
      if (typeof currentBackgroundImage === 'object' && currentBackgroundImage.filters) {
        parseFiltersFromString(currentBackgroundImage.filters);
      } else {
        resetImageFilters();
      }
    }
  }, [currentBackgroundImage]);

  // Render upload zone as a grid item
  const renderUploadZone = () => {
    if (!currentUser) {
      return (
        <div className="background-upload-grid-item disabled">
          <div className="background-upload-grid-content">
            <div className="background-upload-icon-small">🔒</div>
            <span className="background-upload-text-small">Logg inn</span>
          </div>
        </div>
      );
    }

    // If we have a custom uploaded image, show it instead of upload zone
    if (isCustomImage()) {
      return (
        <div 
          className={`background-image-option ${isCustomImage() ? 'selected custom-image' : ''}`}
          title="Ditt opplastede bilde"
        >
          <img
            src={getCustomImagePreviewUrl()}
            alt="Egendefinert bakgrunn"
            className="background-image-preview"
          />
          <div className="background-image-info">
            <span className="background-image-name">Mitt bilde</span>
            <button 
              className="background-remove-button-small"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveCustomBackground();
              }}
              title="Fjern bilde"
            >
              ✕
            </button>
          </div>
          {isCustomImage() && (
            <span className="background-checkmark">✓</span>
          )}
        </div>
      );
    }

    // Show upload zone
    return (
      <div 
        className={`background-upload-grid-item ${isUploading ? 'uploading' : ''}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        title="Last opp eget bilde"
      >
        {isUploading ? (
          <div className="background-upload-grid-content uploading">
            <div className="background-spinner-small" />
            <span className="background-upload-text-small">{Math.round(uploadProgress)}%</span>
          </div>
        ) : (
          <div className="background-upload-grid-content">
            <div className="background-upload-icon-small">📁</div>
            <span className="background-upload-text-small">Last opp</span>
          </div>
        )}
      </div>
    );
  };

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
            {/* Combined gallery with upload zone and predefined images */}
            <div className="background-image-gallery-container">
              <div className="library-section-title">Velg bakgrunnsbilde</div>
              <div className="background-image-gallery">
                {/* Upload zone as first grid item */}
                {renderUploadZone()}
                
                {/* Predefined images */}
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
              
              {/* Hidden file input */}
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
            </div>

            {/* Image Editor Section - Always open when image is selected */}
            {canEditCurrentImage() && (
              <div className="background-image-editor-section">
                <div className="editor-section-title">Bildeeditor</div>
                
                <div className="inline-image-editor always-open">
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BackgroundSubmenu;