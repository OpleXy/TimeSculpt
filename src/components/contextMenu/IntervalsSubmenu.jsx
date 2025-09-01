// src/components/contextMenu/IntervalsSubmenu.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CalendarIcon, InfoIcon, WarningIcon } from './MenuIcons';

function IntervalsSubmenu({
  showIntervals,
  intervalCount,
  intervalType,
  timelineData,
  onIntervalToggle,
  onIntervalCountChange,
  onIntervalTypeChange
}) {
  // Available interval types
  const intervalTypes = [
    { id: 'even', label: 'Jevnt fordelt' },
    { id: 'daily', label: 'Daglig' },
    { id: 'weekly', label: 'Ukentlig' },
    { id: 'monthly', label: 'Månedlig' },
    { id: 'yearly', label: 'Årlig' },
    { id: 'decade', label: 'Tiår' },
    { id: 'century', label: 'Århundre' }
  ];

  // Local state for interval settings
  const [localIntervalCount, setLocalIntervalCount] = useState(intervalCount);
  const [validationWarning, setValidationWarning] = useState('');
  const [maxAllowedIntervals, setMaxAllowedIntervals] = useState(20);
  const [localIntervalType, setLocalIntervalType] = useState(intervalType);
  const updateInProgressRef = useRef(false);

  // State for interval count input
  const [showIntervalInput, setShowIntervalInput] = useState(false);
  const [intervalInputValue, setIntervalInputValue] = useState(String(intervalCount));

  const [availableTypes, setAvailableTypes] = useState(intervalTypes);

  const MINIMUM_DAYS_PER_INTERVAL = 2;
  const MAXIMUM_EVEN_INTERVALS = 20;
  const MAXIMUM_TOTAL_MARKERS = 30;

  // Calculate available interval types
  const calculateAvailableTypes = useCallback(() => {
    if (!timelineData || !timelineData.start || !timelineData.end) {
      return intervalTypes;
    }
    
    const startDate = typeof timelineData.start === 'string' 
      ? new Date(timelineData.start) 
      : timelineData.start;
    
    const endDate = typeof timelineData.end === 'string' 
      ? new Date(timelineData.end) 
      : timelineData.end;
    
    const timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const diffWeeks = Math.ceil(diffDays / 7);
    const diffMonths = Math.ceil(diffDays / 30);
    const diffYears = Math.ceil(diffDays / 365);
    const diffDecades = Math.ceil(diffYears / 10);
    const diffCenturies = Math.ceil(diffYears / 100);
    
    return intervalTypes.filter(type => {
      switch (type.id) {
        case 'daily':
          return diffDays >= 2 && diffDays <= MAXIMUM_TOTAL_MARKERS;
        case 'weekly':
          return diffWeeks >= 2 && diffWeeks <= MAXIMUM_TOTAL_MARKERS;
        case 'monthly':
          return diffMonths >= 2 && diffMonths <= MAXIMUM_TOTAL_MARKERS;
        case 'yearly':
          return diffYears >= 2;
        case 'decade':
          return diffDecades >= 2;
        case 'century':
          return diffCenturies >= 2;
        default:
          return true;
      }
    });
  }, [timelineData]);

  // Effect for timeline data changes
  useEffect(() => {
    if (updateInProgressRef.current) return;
    
    const newAvailableTypes = calculateAvailableTypes();
    setAvailableTypes(newAvailableTypes);
    
    if (!newAvailableTypes.find(t => t.id === localIntervalType)) {
      const newType = ['even', 'yearly', 'decade', 'monthly', 'weekly', 'daily', 'century']
        .find(t => newAvailableTypes.some(available => available.id === t)) || 'even';
      
      setLocalIntervalType(newType);
      if (onIntervalTypeChange) {
        onIntervalTypeChange(newType);
      }
    }
    
    if (timelineData?.start && timelineData?.end) {
      const startDate = typeof timelineData.start === 'string' 
        ? new Date(timelineData.start) 
        : timelineData.start;
      const endDate = typeof timelineData.end === 'string' 
        ? new Date(timelineData.end) 
        : timelineData.end;
      
      const timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      const maxIntervals = Math.min(
        MAXIMUM_EVEN_INTERVALS,
        Math.max(2, Math.floor(diffDays / MINIMUM_DAYS_PER_INTERVAL))
      );
      
      setMaxAllowedIntervals(maxIntervals);
      
      if (localIntervalType === 'even' && localIntervalCount > maxIntervals) {
        setLocalIntervalCount(maxIntervals);
        setIntervalInputValue(String(maxIntervals));
        setValidationWarning(`Maks ${maxIntervals} intervaller for en tidslinje på ${diffDays} dager`);
      } else {
        setValidationWarning('');
      }
    }
  }, [timelineData, calculateAvailableTypes, localIntervalType, localIntervalCount]);

  // Sync with props
  useEffect(() => {
    if (intervalCount !== localIntervalCount) {
      setLocalIntervalCount(intervalCount);
      setIntervalInputValue(String(intervalCount));
    }
  }, [intervalCount]);

  useEffect(() => {
    if (intervalType !== localIntervalType) {
      setLocalIntervalType(intervalType);
    }
  }, [intervalType]);

  // Debounced change handlers
  useEffect(() => {
    if (updateInProgressRef.current) return;
    
    const timeoutId = setTimeout(() => {
      if (localIntervalCount !== intervalCount && onIntervalCountChange) {
        updateInProgressRef.current = true;
        onIntervalCountChange(localIntervalCount);
        setTimeout(() => { updateInProgressRef.current = false; }, 50);
      }
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [localIntervalCount, intervalCount, onIntervalCountChange]);

  useEffect(() => {
    if (updateInProgressRef.current) return;
    
    const timeoutId = setTimeout(() => {
      if (localIntervalType !== intervalType && onIntervalTypeChange) {
        updateInProgressRef.current = true;
        onIntervalTypeChange(localIntervalType);
        setTimeout(() => { updateInProgressRef.current = false; }, 50);
      }
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [localIntervalType, intervalType, onIntervalTypeChange]);

  // Handle interval toggle
  const handleIntervalToggle = () => {
    const newShowIntervals = !showIntervals;
    if (onIntervalToggle) {
      onIntervalToggle(newShowIntervals);
    }
  };

  // Handle interval count change
  const handleIntervalCountChange = (newCount) => {
    if (localIntervalType !== 'even') {
      setLocalIntervalCount(newCount);
      setIntervalInputValue(String(newCount));
      return;
    }
    
    if (newCount > MAXIMUM_EVEN_INTERVALS) {
      setValidationWarning(`Maks ${MAXIMUM_EVEN_INTERVALS} intervaller tillatt for jevnt fordelte intervaller`);
      setLocalIntervalCount(MAXIMUM_EVEN_INTERVALS);
      setIntervalInputValue(String(MAXIMUM_EVEN_INTERVALS));
      return;
    }
    
    if (newCount > maxAllowedIntervals) {
      setValidationWarning(`Maks ${maxAllowedIntervals} intervaller tillatt`);
      setLocalIntervalCount(maxAllowedIntervals);
      setIntervalInputValue(String(maxAllowedIntervals));
    } else {
      setValidationWarning('');
      setLocalIntervalCount(newCount);
      setIntervalInputValue(String(newCount));
    }
  };

  // Handle interval type change
  const handleIntervalTypeChange = (e) => {
    const newType = e.target.value;
    setLocalIntervalType(newType);
    setValidationWarning('');
    
    if (newType === 'even' && localIntervalCount > MAXIMUM_EVEN_INTERVALS) {
      setLocalIntervalCount(MAXIMUM_EVEN_INTERVALS);
      setIntervalInputValue(String(MAXIMUM_EVEN_INTERVALS));
    }
  };

  // Handle interval label click
  const handleIntervalLabelClick = () => {
    setShowIntervalInput(true);
    setIntervalInputValue(String(localIntervalCount));
  };

  // Handle interval input change
  const handleIntervalInputChange = (e) => {
    const value = e.target.value;
    setIntervalInputValue(value);
  };

  // Handle interval input submit
  const handleIntervalInputSubmit = () => {
    const numValue = parseInt(intervalInputValue);
    const maxValue = Math.min(MAXIMUM_EVEN_INTERVALS, maxAllowedIntervals);
    
    if (!isNaN(numValue) && numValue >= 2 && numValue <= maxValue) {
      setLocalIntervalCount(numValue);
      setShowIntervalInput(false);
    } else {
      setIntervalInputValue(String(localIntervalCount));
      setShowIntervalInput(false);
    }
  };

  // Handle interval input key press
  const handleIntervalInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleIntervalInputSubmit();
    } else if (e.key === 'Escape') {
      setIntervalInputValue(String(localIntervalCount));
      setShowIntervalInput(false);
    }
  };

  // Handle interval input blur
  const handleIntervalInputBlur = () => {
    handleIntervalInputSubmit();
  };

  // Get info text based on interval type
  const getInfoText = () => {
    switch (localIntervalType) {
      case 'even':
        return 'Jevnt fordelte intervaller. Maks 20 intervaller. Klikk på verdien for å skrive inn et tall.';
      case 'daily':
        return 'Daglige intervaller markerer hver dag på tidslinjen. Tilgjengelig for tidslinjer med opptil 30 dager.';
      case 'weekly':
        return 'Ukentlige intervaller markerer starten av hver uke på tidslinjen. Tilgjengelig for tidslinjer med opptil 30 uker.';
      case 'monthly':
        return 'Månedlige intervaller markerer starten av hver måned på tidslinjen. Tilgjengelig for tidslinjer med opptil 30 måneder.';
      case 'yearly':
        return 'Årlige intervaller markerer starten av hvert år på tidslinjen.';
      case 'decade':
        return 'Tiårsintervaller markerer starten av hvert tiår på tidslinjen.';
      case 'century':
        return 'Århundreintervaller markerer starten av hvert århundre på tidslinjen.';
      default:
        return '';
    }
  };

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
          
          {localIntervalType === 'even' && (
            <div className="interval-count-row">
              {showIntervalInput ? (
                <div className="interval-input-container">
                  <span>Antall intervaller: </span>
                  <input
                    type="number"
                    min="2"
                    max={Math.min(MAXIMUM_EVEN_INTERVALS, maxAllowedIntervals)}
                    value={intervalInputValue}
                    onChange={handleIntervalInputChange}
                    onKeyDown={handleIntervalInputKeyPress}
                    onBlur={handleIntervalInputBlur}
                    className="interval-input"
                    autoFocus
                  />
                </div>
              ) : (
                <span 
                  className="interval-label clickable"
                  onClick={handleIntervalLabelClick}
                  title="Klikk for å skrive inn verdi"
                >
                  Antall intervaller: {localIntervalCount}
                </span>
              )}
              <input
                type="range"
                min="2"
                max={Math.min(MAXIMUM_EVEN_INTERVALS, maxAllowedIntervals)}
                value={localIntervalCount}
                onChange={(e) => handleIntervalCountChange(parseInt(e.target.value))}
                className="interval-slider"
              />
            </div>
          )}
          
          {validationWarning && (
            <div className="interval-warning">
              <WarningIcon />
              <span>{validationWarning}</span>
            </div>
          )}
          
          <div className="interval-info">
            <InfoIcon />
            <span>{getInfoText()}</span>
          </div>
        </>
      )}
    </div>
  );
}

export default IntervalsSubmenu;