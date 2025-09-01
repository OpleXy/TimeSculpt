// src/components/contextMenu/ImageEditorSubmenu.jsx
import React, { useState, useEffect } from 'react';

function ImageEditorSubmenu({ 
  onBackgroundImageSelect, 
  setCurrentView, 
  currentBackgroundImage // Add this prop
}) {
  // Image filter states
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [imageFilters, setImageFilters] = useState({
    blur: 0,
    brightness: 100,
    contrast: 100,
    saturate: 100,
    sepia: 0,
    grayscale: 0,
    hue: 0,
    opacity: 100
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
      }
    } else {
      setCurrentImageUrl(null);
    }
  }, [currentBackgroundImage]);

  // Parse existing filters from CSS string
  const parseFiltersFromString = (filterString) => {
    const filters = {
      blur: 0,
      brightness: 100,
      contrast: 100,
      saturate: 100,
      sepia: 0,
      grayscale: 0,
      hue: 0,
      opacity: 100
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
          case 'contrast':
            filters.contrast = parseInt(value.replace('%', ''));
            break;
          case 'saturate':
            filters.saturate = parseInt(value.replace('%', ''));
            break;
          case 'sepia':
            filters.sepia = parseInt(value.replace('%', ''));
            break;
          case 'grayscale':
            filters.grayscale = parseInt(value.replace('%', ''));
            break;
          case 'hue-rotate':
            filters.hue = parseInt(value.replace('deg', ''));
            break;
          case 'opacity':
            filters.opacity = parseInt(value.replace('%', ''));
            break;
        }
      });
    }

    setImageFilters(filters);
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setImageFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Apply filters to background
  const applyImageFilters = () => {
    if (!currentImageUrl || !onBackgroundImageSelect) return;
    
    // Create filter string
    const filterString = `blur(${imageFilters.blur}px) brightness(${imageFilters.brightness}%) contrast(${imageFilters.contrast}%) saturate(${imageFilters.saturate}%) sepia(${imageFilters.sepia}%) grayscale(${imageFilters.grayscale}%) hue-rotate(${imageFilters.hue}deg) opacity(${imageFilters.opacity}%)`;
    
    // Apply the filtered image
    if (onBackgroundImageSelect) {
      onBackgroundImageSelect({
        url: currentImageUrl,
        filters: filterString !== 'blur(0px) brightness(100%) contrast(100%) saturate(100%) sepia(0%) grayscale(0%) hue-rotate(0deg) opacity(100%)' ? filterString : 'none'
      });
    }
    
    // Go back to background menu
    setCurrentView('background');
  };

  // Reset all filters
  const resetFilters = () => {
    setImageFilters({
      blur: 0,
      brightness: 100,
      contrast: 100,
      saturate: 100,
      sepia: 0,
      grayscale: 0,
      hue: 0,
      opacity: 100
    });
  };

  // Generate filter CSS string for preview
  const getFilterStyle = () => {
    return `blur(${imageFilters.blur}px) brightness(${imageFilters.brightness}%) contrast(${imageFilters.contrast}%) saturate(${imageFilters.saturate}%) sepia(${imageFilters.sepia}%) grayscale(${imageFilters.grayscale}%) hue-rotate(${imageFilters.hue}deg) opacity(${imageFilters.opacity}%)`;
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
            borderRadius: '6px'
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

        {/* Contrast */}
        <div className="filter-group">
          <label>Kontrast: {imageFilters.contrast}%</label>
          <input
            type="range"
            min="0"
            max="200"
            value={imageFilters.contrast}
            onChange={(e) => handleFilterChange('contrast', parseInt(e.target.value))}
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

        {/* Sepia */}
        <div className="filter-group">
          <label>Sepia: {imageFilters.sepia}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={imageFilters.sepia}
            onChange={(e) => handleFilterChange('sepia', parseInt(e.target.value))}
            className="filter-slider"
          />
        </div>

        {/* Grayscale */}
        <div className="filter-group">
          <label>Gråskala: {imageFilters.grayscale}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={imageFilters.grayscale}
            onChange={(e) => handleFilterChange('grayscale', parseInt(e.target.value))}
            className="filter-slider"
          />
        </div>

        {/* Hue Rotate */}
        <div className="filter-group">
          <label>Fargetone: {imageFilters.hue}°</label>
          <input
            type="range"
            min="0"
            max="360"
            value={imageFilters.hue}
            onChange={(e) => handleFilterChange('hue', parseInt(e.target.value))}
            className="filter-slider"
          />
        </div>

        {/* Opacity */}
        <div className="filter-group">
          <label>Gjennomsiktighet: {imageFilters.opacity}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={imageFilters.opacity}
            onChange={(e) => handleFilterChange('opacity', parseInt(e.target.value))}
            className="filter-slider"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="editor-actions">
        <button 
          className="reset-filters-btn"
          onClick={resetFilters}
        >
          Tilbakestill
        </button>
        <button 
          className="apply-filters-btn"
          onClick={applyImageFilters}
        >
          Bruk
        </button>
      </div>
    </div>
  );
}

export default ImageEditorSubmenu;