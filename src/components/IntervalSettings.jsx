import React, { useState, useEffect, useCallback } from 'react';

// This component handles interval settings for timeline markers
function IntervalSettings({
  showIntervals = true,
  intervalCount = 5,
  intervalType = 'even',
  onIntervalToggle,
  onIntervalCountChange,
  onIntervalTypeChange,
  timelineData = {}
}) {
  // Local state for interval count slider
  const [localIntervalCount, setLocalIntervalCount] = useState(intervalCount);
  // State for validation warning
  const [validationWarning, setValidationWarning] = useState('');
  // State for maximum allowed intervals
  const [maxAllowedIntervals, setMaxAllowedIntervals] = useState(20);
  // Local state for interval type
  const [localIntervalType, setLocalIntervalType] = useState(intervalType);
  
  // Available interval types - Added "Decade" option
  const intervalTypes = [
    { id: 'even', label: 'Jevnt fordelt' },
    { id: 'daily', label: 'Daglig' },
    { id: 'weekly', label: 'Ukentlig' },
    { id: 'monthly', label: 'Månedlig' },
    { id: 'yearly', label: 'Årlig' },
    { id: 'decade', label: 'Tiår' },
    { id: 'century', label: 'Århundre' }
  ];
  
  // State for available interval types
  const [availableTypes, setAvailableTypes] = useState(intervalTypes);
  
  // Constants for limits
  const MINIMUM_DAYS_PER_INTERVAL = 2;
  const MAXIMUM_EVEN_INTERVALS = 20;
  const MAXIMUM_TOTAL_MARKERS = 30;
  
  // Calculate max allowed intervals based on timeline duration
  const calculateMaxIntervals = useCallback(() => {
    if (!timelineData.start || !timelineData.end) {
      return MAXIMUM_EVEN_INTERVALS; // Default max if no timeline data
    }
    
    // Convert dates to Date objects if they're strings
    const startDate = typeof timelineData.start === 'string' 
      ? new Date(timelineData.start) 
      : timelineData.start;
    
    const endDate = typeof timelineData.end === 'string' 
      ? new Date(timelineData.end) 
      : timelineData.end;
    
    // Calculate time difference in days
    const timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Limit to maximum of 1 marker per day and never more than MAXIMUM_EVEN_INTERVALS
    // Use Math.min to ensure we don't have more markers than allowed
    const maxIntervals = Math.min(
      MAXIMUM_EVEN_INTERVALS,
      Math.min(
        diffDays,
        Math.floor(diffDays / MINIMUM_DAYS_PER_INTERVAL)
      )
    );
    
    // Ensure at least 2 intervals (start and end)
    return Math.max(2, maxIntervals);
  }, [timelineData]);
  
  // Calculate the number of markers for a given interval type
  const calculateMarkerCount = useCallback((type) => {
    if (!timelineData.start || !timelineData.end) {
      return 0;
    }
    
    // Convert dates to Date objects if they're strings
    const startDate = typeof timelineData.start === 'string' 
      ? new Date(timelineData.start) 
      : timelineData.start;
    
    const endDate = typeof timelineData.end === 'string' 
      ? new Date(timelineData.end) 
      : timelineData.end;
    
    // Calculate various time spans
    const timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const diffWeeks = Math.ceil(diffDays / 7);
    const diffMonths = Math.ceil(diffDays / 30); // Approximate
    const diffYears = Math.ceil(diffDays / 365); // Approximate
    const diffDecades = Math.ceil(diffYears / 10); // Added for decades
    const diffCenturies = Math.ceil(diffYears / 100);
    
    switch (type) {
      case 'daily':
        return diffDays;
      case 'weekly':
        return diffWeeks;
      case 'monthly':
        return diffMonths;
      case 'yearly':
        return diffYears;
      case 'decade':
        return diffDecades;
      case 'century':
        return diffCenturies;
      case 'even':
      default:
        return calculateMaxIntervals();
    }
  }, [timelineData, calculateMaxIntervals]);
  
  // Update available interval types and max allowed intervals when timeline data changes
  useEffect(() => {
    if (!timelineData || !timelineData.start || !timelineData.end) {
      setMaxAllowedIntervals(MAXIMUM_EVEN_INTERVALS); // Default max if no timeline data
      setAvailableTypes(intervalTypes);
      return;
    }
    
    // Convert dates to Date objects if they're strings
    const startDate = typeof timelineData.start === 'string' 
      ? new Date(timelineData.start) 
      : timelineData.start;
    
    const endDate = typeof timelineData.end === 'string' 
      ? new Date(timelineData.end) 
      : timelineData.end;
    
    // Calculate time difference in various units
    const timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const diffWeeks = Math.ceil(diffDays / 7);
    const diffMonths = Math.ceil(diffDays / 30); // Approximate
    const diffYears = Math.ceil(diffDays / 365); // Approximate
    const diffDecades = Math.ceil(diffYears / 10); // Added for decades
    const diffCenturies = Math.ceil(diffYears / 100);
    
    // Determine available interval types based on timeline span and marker count limits
    const types = intervalTypes.filter(type => {
      switch (type.id) {
        case 'daily':
          // Daily is available if there are at least 2 days and no more than MAXIMUM_TOTAL_MARKERS days
          return diffDays >= 2 && diffDays <= MAXIMUM_TOTAL_MARKERS;
        case 'weekly':
          // Weekly is available if there are at least 2 weeks and no more than MAXIMUM_TOTAL_MARKERS weeks
          return diffWeeks >= 2 && diffWeeks <= MAXIMUM_TOTAL_MARKERS;
        case 'monthly':
          // Monthly is available if there are at least 2 months and no more than MAXIMUM_TOTAL_MARKERS months
          return diffMonths >= 2 && diffMonths <= MAXIMUM_TOTAL_MARKERS;
        case 'yearly':
          // Yearly is available if there are at least 2 years
          return diffYears >= 2;
        case 'decade':
          // Decade is available if there are at least 2 decades
          return diffDecades >= 2;
        case 'century':
          // Century is available if there are at least 2 centuries
          return diffCenturies >= 2;
        default:
          return true; // Always include even spacing
      }
    });
    
    setAvailableTypes(types);
    
    // If current interval type is not available, switch to the most appropriate one
    if (!types.find(t => t.id === localIntervalType)) {
      // Find the first available type that has less than MAXIMUM_TOTAL_MARKERS
      // Updated to include 'decade' in the priority list
      const newType = ['even', 'yearly', 'decade', 'monthly', 'weekly', 'daily', 'century']
        .find(t => types.some(available => available.id === t)) || 'even';
      
      setLocalIntervalType(newType);
      // Also update parent component if needed
      if (onIntervalTypeChange) {
        onIntervalTypeChange(newType);
      }
    }
    
    // Set max allowed intervals (with hard limit of MAXIMUM_EVEN_INTERVALS for 'even' type)
    const newMaxIntervals = calculateMaxIntervals();
    setMaxAllowedIntervals(newMaxIntervals);
    
    // If using even spacing and current interval count exceeds max, adjust it
    if (localIntervalType === 'even' && localIntervalCount > newMaxIntervals) {
      setLocalIntervalCount(newMaxIntervals);
      // Also update parent component if needed
      if (onIntervalCountChange) {
        onIntervalCountChange(newMaxIntervals);
      }
      
      // Show warning
      const warningMessage = `Maks ${newMaxIntervals} intervaller tillatt (begrenset til ${MAXIMUM_EVEN_INTERVALS} for jevnt fordelte intervaller)`;
      setValidationWarning(warningMessage);
    } else {
      setValidationWarning('');
    }
    
    // If the current type would result in too many markers, show a warning
    const markerCount = calculateMarkerCount(localIntervalType);
    if (markerCount > MAXIMUM_TOTAL_MARKERS) {
      setValidationWarning(`${localIntervalType === 'even' ? 'Jevnt fordelt' : 
                              localIntervalType === 'daily' ? 'Daglig' : 
                              localIntervalType === 'weekly' ? 'Ukentlig' : 
                              localIntervalType === 'monthly' ? 'Månedlig' : 
                              localIntervalType === 'yearly' ? 'Årlig' :
                              localIntervalType === 'decade' ? 'Tiår' : 'Århundre'} 
                            markører ville vist ${markerCount} punkter, som er over grensen på ${MAXIMUM_TOTAL_MARKERS} markører.`);
    }
  }, [timelineData, calculateMaxIntervals, localIntervalCount, localIntervalType, 
      onIntervalCountChange, onIntervalTypeChange, intervalTypes, calculateMarkerCount]);
  
  // Update local interval count when prop changes
  useEffect(() => {
    setLocalIntervalCount(intervalCount);
  }, [intervalCount]);
  
  // Update local interval type when prop changes
  useEffect(() => {
    setLocalIntervalType(intervalType);
  }, [intervalType]);
  
  // Apply interval count changes automatically when localIntervalCount changes
  useEffect(() => {
    // Only call the change handler if the value has actually changed
    if (localIntervalCount !== intervalCount && onIntervalCountChange) {
      onIntervalCountChange(localIntervalCount);
    }
  }, [localIntervalCount, intervalCount, onIntervalCountChange]);
  
  // Apply interval type changes automatically when localIntervalType changes
  useEffect(() => {
    // Only call the change handler if the value has actually changed
    if (localIntervalType !== intervalType && onIntervalTypeChange) {
      onIntervalTypeChange(localIntervalType);
    }
  }, [localIntervalType, intervalType, onIntervalTypeChange]);
  
  // Handle interval toggle - UPDATED FOR CONSISTENT STATE PROPAGATION
  const handleIntervalToggle = () => {
    const newShowIntervals = !showIntervals;
    if (onIntervalToggle) {
      onIntervalToggle(newShowIntervals);
    }
  };

  // Handle interval count change - with validation and hard limit
  const handleIntervalCountChange = (newCount) => {
    // Only apply validation for 'even' type
    if (localIntervalType !== 'even') {
      setLocalIntervalCount(newCount);
      return;
    }
    
    // Enforce the hard limit for even intervals
    if (newCount > MAXIMUM_EVEN_INTERVALS) {
      setValidationWarning(`Maks ${MAXIMUM_EVEN_INTERVALS} intervaller tillatt for jevnt fordelte intervaller`);
      setLocalIntervalCount(MAXIMUM_EVEN_INTERVALS);
      return;
    }
    
    // Then validate against calculated max (which respects days)
    if (newCount > maxAllowedIntervals) {
      // Show warning
      const startDate = typeof timelineData.start === 'string' 
        ? new Date(timelineData.start) 
        : timelineData.start;
      const endDate = typeof timelineData.end === 'string' 
        ? new Date(timelineData.end) 
        : timelineData.end;
      const timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      // Updated warning message to clarify the limit is based on days
      setValidationWarning(`Maks ${maxAllowedIntervals} intervaller for en tidslinje på ${diffDays} dager (maks 1 per dag)`);
      
      // Set to max allowed
      setLocalIntervalCount(maxAllowedIntervals);
    } else {
      // Clear warning and set new count
      setValidationWarning('');
      setLocalIntervalCount(newCount);
    }
    // Effect will handle calling onIntervalCountChange
  };
  
  // Handle interval type change
  const handleIntervalTypeChange = (e) => {
    const newType = e.target.value;
    setLocalIntervalType(newType);
    
    // Clear warning when changing type
    setValidationWarning('');
    
    // If switching to 'even' type, enforce the hard limit
    if (newType === 'even' && localIntervalCount > MAXIMUM_EVEN_INTERVALS) {
      setLocalIntervalCount(MAXIMUM_EVEN_INTERVALS);
      setValidationWarning(`Maks ${MAXIMUM_EVEN_INTERVALS} intervaller tillatt for jevnt fordelte intervaller`);
    }
    
    // Check if the new type would produce too many markers
    const markerCount = calculateMarkerCount(newType);
    if (markerCount > MAXIMUM_TOTAL_MARKERS) {
      const typeName = newType === 'daily' ? 'Daglig' : 
                      newType === 'weekly' ? 'Ukentlig' : 
                      newType === 'monthly' ? 'Månedlig' : 
                      newType === 'yearly' ? 'Årlig' : 
                      newType === 'decade' ? 'Tiår' :
                      newType === 'century' ? 'Århundre' : 'Jevnt fordelt';
      
      setValidationWarning(`${typeName} markører ville vist ${markerCount} punkter, som er over grensen på ${MAXIMUM_TOTAL_MARKERS} markører.`);
    }
    
    // Effect will handle calling onIntervalTypeChange
  };
  
  // Calendar icon for interval type
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
          {/* Interval Type Selection */}
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
          
          {/* Only show count slider for 'even' interval type */}
          {localIntervalType === 'even' && (
            <div className="interval-count-row">
              <span>Antall intervaller: {localIntervalCount}</span>
              <input
                type="range"
                min="2"
                max={Math.min(MAXIMUM_EVEN_INTERVALS, maxAllowedIntervals)} // Never exceed MAXIMUM_EVEN_INTERVALS
                value={localIntervalCount}
                onChange={(e) => handleIntervalCountChange(parseInt(e.target.value))}
                className="interval-slider"
              />
            </div>
          )}

{/* Display validation warning if present */}
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
                ? 'Jevnt fordelte intervaller viser punkter med lik avstand over hele tidslinjen. Maks 20 intervaller tillatt.'
                : localIntervalType === 'daily'
                  ? 'Daglige intervaller markerer hver dag på tidslinjen. Tilgjengelig for tidslinjer med opptil 30 dager.'
                  : localIntervalType === 'weekly'
                    ? 'Ukentlige intervaller markerer starten av hver uke på tidslinjen. Tilgjengelig for tidslinjer med opptil 30 uker.'
                    : localIntervalType === 'monthly'
                      ? 'Månedlige intervaller markerer starten av hver måned på tidslinjen. Tilgjengelig for tidslinjer med opptil 30 måneder.'
                      : localIntervalType === 'yearly'
                        ? 'Årlige intervaller markerer starten av hvert år på tidslinjen.'
                        : localIntervalType === 'decade'
                          ? 'Tiårsintervaller markerer starten av hvert tiår på tidslinjen.'
                          : 'Århundreintervaller markerer starten av hvert århundre på tidslinjen.'
              }
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default IntervalSettings;