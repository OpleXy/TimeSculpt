import { useEffect, useRef, useCallback } from 'react';

const useAutoSave = (data, saveFunction, delay = 2000, dependencies = []) => {
  const timeoutRef = useRef(null);
  const lastSavedRef = useRef(null);
  const isInitializedRef = useRef(false);

  const debouncedSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      if (data && saveFunction && isInitializedRef.current) {
        // Sjekk om data faktisk har endret seg
        const currentDataString = JSON.stringify(data);
        if (lastSavedRef.current !== currentDataString) {
          try {
            await saveFunction(data);
            lastSavedRef.current = currentDataString;
            console.log('Auto-saved at:', new Date().toLocaleTimeString());
          } catch (error) {
            console.error('Auto-save failed:', error);
          }
        }
      }
    }, delay);
  }, [data, saveFunction, delay]);

  useEffect(() => {
    // Marker som initialisert etter første render
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      lastSavedRef.current = JSON.stringify(data);
      return;
    }

    debouncedSave();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, dependencies);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedSave;
};

export default useAutoSave;