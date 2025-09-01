import React, { useEffect } from 'react';
import '../styles/background-images.css';

/**
 * BackgroundManager component - handles background images with filter support
 * This component doesn't render any visible elements but manages background styling
 */
function BackgroundManager({ 
  backgroundImage, 
  backgroundFilters, 
  onBackgroundLoaded 
}) {
  
  useEffect(() => {
    if (!backgroundImage) {
      // No background image selected
      if (onBackgroundLoaded) {
        onBackgroundLoaded(null);
      }
      return;
    }
    
    let imageUrl;
    
    // Handle different types of background image data
    if (typeof backgroundImage === 'object' && backgroundImage.url) {
      // New format with filters
      imageUrl = backgroundImage.url;
    } else if (typeof backgroundImage === 'string') {
      // Legacy format or simple string
      if (backgroundImage.startsWith('https://') || backgroundImage.startsWith('http://')) {
        // Custom uploaded image
        imageUrl = backgroundImage;
      } else {
        // Predefined image from public folder
        imageUrl = `/backgrounds/${backgroundImage}`;
      }
    } else {
      console.error('Invalid background image format:', backgroundImage);
      if (onBackgroundLoaded) {
        onBackgroundLoaded(null);
      }
      return;
    }
    
    // Create an Image object to check if the image can be loaded
    const img = new Image();
    
    img.onload = () => {
      // Image loaded successfully
      const backgroundData = {
        url: imageUrl,
        filters: backgroundImage?.filters || backgroundFilters || 'none'
      };
      
      if (onBackgroundLoaded) {
        onBackgroundLoaded(backgroundData);
      }
    };
    
    img.onerror = () => {
      console.error(`Failed to load background image: ${imageUrl}`);
      if (onBackgroundLoaded) {
        onBackgroundLoaded(null);
      }
    };
    
    // Set the source to start loading
    img.src = imageUrl;
    
    // Clean up
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [backgroundImage, backgroundFilters, onBackgroundLoaded]);
  
  // This component doesn't render anything visible
  return null;
}

// Helper function to get background image options - using the new filenames
export const getBackgroundImageOptions = () => {
  return [
    { name: 'beach', value: 'beach.png' },
    { name: 'city', value: 'city.png' },
    { name: 'forest', value: 'forest.png' }
  ];
};

export default BackgroundManager;