// src/hooks/useBackgroundManager.js
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  uploadBackgroundImage, 
  deleteBackgroundImage, 
  getUserBackgroundImages 
} from '../services/backgroundImageService';

/**
 * Custom hook for managing timeline backgrounds
 * Handles both color and image backgrounds with upload functionality
 */
export const useBackgroundManager = (initialBackground = null) => {
  const { currentUser } = useAuth();
  const [currentBackground, setCurrentBackground] = useState(initialBackground);
  const [userImages, setUserImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Load user's uploaded images on mount
  useEffect(() => {
    if (currentUser) {
      loadUserImages();
    }
  }, [currentUser]);

  // Function to load user's uploaded background images
  const loadUserImages = useCallback(async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      const images = await getUserBackgroundImages(currentUser.uid);
      setUserImages(images);
    } catch (err) {
      console.error('Error loading user images:', err);
      // Don't set error for this as it's not critical
      setUserImages([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Function to handle background changes
  const changeBackground = useCallback((backgroundData) => {
    const newBackground = {
      type: backgroundData.type, // 'color' or 'image'
      value: backgroundData.value,
      isCustom: backgroundData.isCustom || false,
      timestamp: Date.now()
    };

    setCurrentBackground(newBackground);
    setError(null);

    return newBackground;
  }, []);

  // Function to upload a new background image
  const uploadImage = useCallback(async (file) => {
    if (!currentUser) {
      throw new Error('Du må være logget inn for å laste opp bilder');
    }

    try {
      setIsLoading(true);
      setError(null);
      setUploadProgress(0);

      const imageUrl = await uploadBackgroundImage(
        file,
        currentUser.uid,
        (progress) => setUploadProgress(progress)
      );

      // Add the new image to user's image list
      setUserImages(prev => [imageUrl, ...prev]);

      // Automatically set the uploaded image as current background
      const newBackground = changeBackground({
        type: 'image',
        value: imageUrl,
        isCustom: true
      });

      setUploadProgress(0);
      return newBackground;

    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, changeBackground]);

  // Function to delete a background image
  const deleteImage = useCallback(async (imageUrl) => {
    if (!currentUser) {
      throw new Error('Du må være logget inn for å slette bilder');
    }

    try {
      setIsLoading(true);
      setError(null);

      await deleteBackgroundImage(imageUrl);

      // Remove the image from user's image list
      setUserImages(prev => prev.filter(url => url !== imageUrl));

      // If the deleted image was the current background, reset to default
      if (currentBackground?.value === imageUrl) {
        setCurrentBackground({
          type: 'color',
          value: '#ffffff',
          isCustom: false,
          timestamp: Date.now()
        });
      }

      return true;

    } catch (err) {
      console.error('Error deleting image:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, currentBackground]);

  // Function to reset background to default
  const resetBackground = useCallback(() => {
    const defaultBackground = {
      type: 'color',
      value: '#ffffff',
      isCustom: false,
      timestamp: Date.now()
    };

    setCurrentBackground(defaultBackground);
    setError(null);

    return defaultBackground;
  }, []);

  // Function to get background CSS properties
  const getBackgroundStyles = useCallback(() => {
    if (!currentBackground) {
      return { backgroundColor: '#ffffff' };
    }

    if (currentBackground.type === 'color') {
      return { 
        backgroundColor: currentBackground.value,
        backgroundImage: 'none'
      };
    } else if (currentBackground.type === 'image') {
      const imageUrl = currentBackground.isCustom 
        ? currentBackground.value 
        : `/backgrounds/${currentBackground.value}`;

      return {
        backgroundColor: 'transparent',
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }

    return { backgroundColor: '#ffffff' };
  }, [currentBackground]);

  // Function to get background data for saving
  const getBackgroundData = useCallback(() => {
    if (!currentBackground) {
      return {
        backgroundColor: '#ffffff',
        backgroundImage: null
      };
    }

    if (currentBackground.type === 'color') {
      return {
        backgroundColor: currentBackground.value,
        backgroundImage: null
      };
    } else if (currentBackground.type === 'image') {
      return {
        backgroundColor: null,
        backgroundImage: currentBackground.value
      };
    }

    return {
      backgroundColor: '#ffffff',
      backgroundImage: null
    };
  }, [currentBackground]);

  // Function to validate if an image is a custom upload
  const isCustomImage = useCallback((imageValue) => {
    return imageValue && (
      imageValue.startsWith('https://') || 
      userImages.includes(imageValue)
    );
  }, [userImages]);

  // Function to get image preview URL
  const getImagePreviewUrl = useCallback((imageValue, isCustom = false) => {
    if (!imageValue) return null;

    if (isCustom || imageValue.startsWith('https://')) {
      return imageValue;
    }

    return `/backgrounds/${imageValue}`;
  }, []);

  return {
    // State
    currentBackground,
    userImages,
    isLoading,
    error,
    uploadProgress,

    // Functions
    changeBackground,
    uploadImage,
    deleteImage,
    resetBackground,
    loadUserImages,

    // Utility functions
    getBackgroundStyles,
    getBackgroundData,
    isCustomImage,
    getImagePreviewUrl,

    // Computed values
    hasCustomImages: userImages.length > 0,
    isCustomBackground: currentBackground?.isCustom || false,
    backgroundType: currentBackground?.type || 'color'
  };
};

export default useBackgroundManager;