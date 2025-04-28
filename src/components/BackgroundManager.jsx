import React, { useEffect } from 'react';
import '../styles/background-images.css'; // Import the background styles

/**
 * BackgroundManager component - a utility component for handling background images
 * This component doesn't render any visible elements
 */
function BackgroundManager({ backgroundImage, onBackgroundLoaded }) {
  // We'll use CSS for displaying background images instead of trying to dynamically import them

  useEffect(() => {
    if (!backgroundImage) {
      // No background image selected
      if (onBackgroundLoaded) {
        onBackgroundLoaded(null);
      }
      return;
    }
    
    // For the fixed version, we'll just construct a URL assuming the images are in the public folder
    // Images should be placed in: public/backgrounds/[filename].png with lowercase filenames
    const imageUrl = `/backgrounds/${backgroundImage}`;
    
    // Create an Image object to check if the image can be loaded
    const img = new Image();
    img.onload = () => {
      // Image loaded successfully
      if (onBackgroundLoaded) {
        onBackgroundLoaded(imageUrl);
      }
    };
    
    img.onerror = () => {
      console.error(`Failed to load background image: ${backgroundImage}`);
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
  }, [backgroundImage, onBackgroundLoaded]);
  
  // This component doesn't render anything visible
  return null;
}

// Helper function to get background image options - using the new filenames
export const getBackgroundImageOptions = () => {
  return [
    { name: 'Cctv', value: 'cctv.png' },
    { name: 'Cia', value: 'cia.png' },
    { name: 'Dino', value: 'dino.png' },
    { name: 'Eldre Krig', value: 'eldrekrig.png' },
    { name: 'Eventyr', value: 'eventyr.png' },
    { name: 'Hacker', value: 'hacker.png' },
    { name: 'Huleboer', value: 'huleboer.png' },
    { name: 'Industri', value: 'industri.png' },
    { name: 'Kina', value: 'kina.png' },
    { name: 'Melkeveien', value: 'melkeveien.png' },
    { name: 'Moderne Krig', value: 'modernekrig.png' },
    { name: 'Overgrodd', value: 'overgrodd.png' },
    { name: 'Patent', value: 'patent.png' },
    { name: 'Pyramide', value: 'pyramide.png' },
    { name: 'Ridder', value: 'ridder.png' },
    { name: 'Timesculpt', value: 'timesculpt.png' }
  ];
};

export default BackgroundManager;