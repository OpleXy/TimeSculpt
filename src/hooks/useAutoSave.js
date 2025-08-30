// hooks/useAutoSave.js
import { useEffect, useRef, useCallback } from 'react';

const useAutoSave = (saveFunction, data, delay = 2000) => {
  const timeoutRef = useRef(null);
  const isSavingRef = useRef(false);
  const lastDataRef = useRef(data);

  const debouncedSave = useCallback(async () => {
    // Forhindre overlappende saves
    if (isSavingRef.current) {
      console.log('Save already in progress, skipping auto-save');
      return;
    }

    // Sammenlign om data faktisk har endret seg
    if (JSON.stringify(lastDataRef.current) === JSON.stringify(data)) {
      console.log('No changes detected, skipping auto-save');
      return;
    }

    try {
      isSavingRef.current = true;
      lastDataRef.current = data;
      await saveFunction();
      console.log('Auto-save completed successfully');
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      isSavingRef.current = false;
    }
  }, [saveFunction, data]);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't auto-save if manual save is in progress
    if (isSavingRef.current) {
      return;
    }

    // Set new timeout
    timeoutRef.current = setTimeout(debouncedSave, delay);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [debouncedSave, delay]);

  // Cancel auto-save (useful for manual saves)
  const cancelAutoSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { cancelAutoSave, isSaving: isSavingRef.current };
};

export default useAutoSave;