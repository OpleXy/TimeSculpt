// src/components/contextMenu/ImageEditorSubmenu.jsx - SIMPLIFIED VERSION
import React, { useState, useEffect } from 'react';

function ImageEditorSubmenu({ 
  onBackgroundImageSelect, 
  setCurrentView, 
  currentBackgroundImage 
}) {
  // Image filter states
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [imageFilters, setImageFilters] = useState({
    blur: 0,
    brightness: 100,
    saturate: 100
  });

  // Update currentImageUrl when currentBackgroundImage changes
  useEffect(() => {
    if (currentBackgroundImage) {
      // Handle different image formats
      if (typeof currentBackgroundImage === 'object' && currentBackgroundImage.url) {
        // New format with filters
        setCurrentImageUrl(currentBackgroundImage.url);
        
        // If filters exist, parse and apply them
        if (currentBackgroundImage.filters && currentBackgroundImage.filters !== 'none') {
          parseFiltersFromString(currentBackgroundImage.filters);
        } else {
          // Reset filters if none are applied
          resetFilters();
        }
      } else if (typeof currentBackgroundImage === 'string') {
        // Handle different string formats
        if (currentBackgroundImage.startsWith('http')) {
          // Direct URL (uploaded image)
          setCurrentImageUrl(currentBackgroundImage);
        } else {
          // Predefined image filename
          setCurrentImageUrl(`/backgrounds/${currentBackgroundImage}`);
        }
        // Reset filters for string-based images (legacy format)
        resetFilters();
      }
    } else {
      setCurrentImageUrl(null);
      resetFilters();
    }
  }, [currentBackgroundImage]);

  // Parse existing filters from CSS string
  const parseFiltersFromString = (filterString) => {
    const filters = {
      blur: 0,
      brightness: 100,
      saturate: 100
    };

    // Parse each filter from the string
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

    setImageFilters(filters);
  };

  // Handle filter changes with real-time preview
  const handleFilterChange = (filterType, value) => {
    const newFilters = {
      ...imageFilters,
      [filterType]: value
    };
    
    setImageFilters(newFilters);
    
    // Apply filters in real-time for better UX
    applyFiltersRealTime(newFilters);
  };

  // Apply filters in real-time (optional - for immediate feedback)
  const applyFiltersRealTime = (filters) => {
    if (!currentImageUrl || !onBackgroundImageSelect) return;
    
    // Create filter string
    const filterString = createFilterString(filters);
    
    // Apply the filtered image immediately
    onBackgroundImageSelect({
      url: currentImageUrl,
      filters: filterString !== 'none' ? filterString : 'none'
    });
  };

  // Create CSS filter string from filter values
  const createFilterString = (filters) => {
    const filterParts = [];
    
    if (filters.blur > 0) filterParts.push(`blur(${filters.blur}px)`);
    if (filters.brightness !== 100) filterParts.push(`brightness(${filters.brightness}%)`);
    if (filters.saturate !== 100) filterParts.push(`saturate(${filters.saturate}%)`);
    
    return filterParts.length > 0 ? filterParts.join(' ') : 'none';
  };

  // Apply filters to background (final save)
  const applyImageFilters = () => {
    if (!currentImageUrl || !onBackgroundImageSelect) return;
    
    // Create filter string
    const filterString = createFilterString(imageFilters);
    
    // Apply the filtered image
    onBackgroundImageSelect({
      url: currentImageUrl,
      filters: filterString
    });
    
    // Go back to background menu
    setCurrentView('background');
  };

  // Reset all filters to default values
  const resetFilters = () => {
    const defaultFilters = {
      blur: 0,
      brightness: 100,
      saturate: 100
    };
    
    setImageFilters(defaultFilters);
  };

  // Reset and apply default filters
  const handleResetFilters = () => {
    resetFilters();
    
    // Apply reset filters immediately
    if (currentImageUrl && onBackgroundImageSelect) {
      onBackgroundImageSelect({
        url: currentImageUrl,
        filters: 'none'
      });
    }
  };

  // Generate filter CSS string for preview
  const getFilterStyle = () => {
    return createFilterString(imageFilters);
  };

  // If no image is loaded, show a message
  if (!currentImageUrl) {
    return (
      <div className="image-editor-container">
        <div className="no-image-message">
          <p>Ingen bilde valgt for redigering</p>
          <button onClick={() => setCurrentView('background')}>
            Gå tilbake til bakgrunn
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="image-editor-container">
      {/* Image Preview */}
      <div className="image-preview">
        <img 
          src={currentImageUrl} 
          alt="Background preview"
          style={{ 
            filter: getFilterStyle(),
            width: '100%',
            height: '120px',
            objectFit: 'cover',
            borderRadius: '6px',
            transition: 'filter 0.2s ease' // Smooth filter transitions
          }}
        />
      </div>

      {/* Filter Controls */}
      <div className="filter-controls">
        {/* Blur */}
        <div className="filter-group">
          <label>Blur: {imageFilters.blur}px</label>
          <input
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={imageFilters.blur}
            onChange={(e) => handleFilterChange('blur', parseFloat(e.target.value))}
            className="filter-slider"
          />
        </div>

        {/* Brightness */}
        <div className="filter-group">
          <label>Lysstyrke: {imageFilters.brightness}%</label>
          <input
            type="range"
            min="0"
            max="200"
            value={imageFilters.brightness}
            onChange={(e) => handleFilterChange('brightness', parseInt(e.target.value))}
            className="filter-slider"
          />
        </div>

        {/* Saturation */}
        <div className="filter-group">
          <label>Metning: {imageFilters.saturate}%</label>
          <input
            type="range"
            min="0"
            max="200"
            value={imageFilters.saturate}
            onChange={(e) => handleFilterChange('saturate', parseInt(e.target.value))}
            className="filter-slider"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="editor-actions">
        <button 
          className="reset-filters-btn"
          onClick={handleResetFilters}
          title="Fjern alle filtere og gå tilbake til original"
        >
          Tilbakestill
        </button>
        <button 
          className="apply-filters-btn"
          onClick={applyImageFilters}
          title="Lagre endringer og gå tilbake"
        >
          Ferdig
        </button>
      </div>
    </div>
  );
}

export default ImageEditorSubmenu;