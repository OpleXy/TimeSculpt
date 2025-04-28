// src/components/TimelineIntervals.jsx
import React, { useMemo } from 'react';

const TimelineIntervals = ({ 
  timelineData,
  intervalCount = 5,
  showIntervals = true,
  intervalType = 'even' // Default to 'even' for new timelines
}) => {
  // Check all possible locations for the showIntervals setting
  const effectiveShowIntervals = (
    timelineData.showIntervals !== undefined ? timelineData.showIntervals :
    timelineData.intervalSettings?.show !== undefined ? timelineData.intervalSettings.show :
    showIntervals
  );
    
  const effectiveIntervalCount = timelineData.intervalCount !== undefined
    ? timelineData.intervalCount
    : intervalCount;
    
  const effectiveIntervalType = timelineData.intervalType !== undefined
    ? timelineData.intervalType
    : intervalType;
  
  // Don't render anything if intervals are disabled or timeline doesn't have proper dates
  if (!effectiveShowIntervals || !timelineData.start || !timelineData.end) {
    return null;
  }

  // Convert dates to Date objects if they're strings
  const startDate = typeof timelineData.start === 'string' 
    ? new Date(timelineData.start) 
    : timelineData.start;
  
  const endDate = typeof timelineData.end === 'string' 
    ? new Date(timelineData.end) 
    : timelineData.end;

  // Generate intervals using memoization for better performance
  const intervals = useMemo(() => {
    switch (effectiveIntervalType) {
      case 'daily':
        return generateDailyIntervals(startDate, endDate);
      case 'weekly':
        return generateWeeklyIntervals(startDate, endDate);
      case 'monthly':
        return generateMonthlyIntervals(startDate, endDate);
      case 'yearly':
        return generateYearlyIntervals(startDate, endDate);
      case 'decade':
        return generateDecadeIntervals(startDate, endDate);
      case 'century':
        return generateCenturyIntervals(startDate, endDate);
      case 'even':
      default:
        return generateEvenIntervals(startDate, endDate, effectiveIntervalCount);
    }
  }, [startDate, endDate, effectiveIntervalCount, effectiveIntervalType]);

  // Generate evenly spaced intervals
  function generateEvenIntervals(start, end, count) {
    const intervals = [];
    const startTime = start.getTime();
    const endTime = end.getTime();
    const totalDuration = endTime - startTime;
    const step = totalDuration / (count - 1);

    for (let i = 0; i < count; i++) {
      intervals.push(new Date(startTime + i * step));
    }

    return intervals;
  }

  // Generate daily intervals
  function generateDailyIntervals(start, end) {
    const intervals = [];
    const startTime = new Date(start);
    startTime.setHours(0, 0, 0, 0); // Start at beginning of the day
    
    const endTime = new Date(end);
    endTime.setHours(23, 59, 59, 999); // End at end of the day
    
    // Loop through each day
    for (let current = new Date(startTime); current <= endTime; current.setDate(current.getDate() + 1)) {
      intervals.push(new Date(current));
    }
    
    return intervals;
  }

  // Generate weekly intervals
  function generateWeeklyIntervals(start, end) {
    const intervals = [];
    const startTime = new Date(start);
    // Set to beginning of the week (Sunday or Monday depending on locale)
    const day = startTime.getDay();
    const diff = startTime.getDate() - day + (day === 0 ? -6 : 1); // Adjust to get to Monday
    startTime.setDate(diff);
    startTime.setHours(0, 0, 0, 0);
    
    const endTime = new Date(end);
    
    // Loop through each week
    for (let current = new Date(startTime); current <= endTime; current.setDate(current.getDate() + 7)) {
      intervals.push(new Date(current));
    }
    
    return intervals;
  }

  // Generate monthly intervals
  function generateMonthlyIntervals(start, end) {
    const intervals = [];
    const startTime = new Date(start);
    startTime.setDate(1); // Start at beginning of the month
    startTime.setHours(0, 0, 0, 0);
    
    const endTime = new Date(end);
    
    // Loop through each month
    for (let current = new Date(startTime); current <= endTime;) {
      intervals.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }
    
    return intervals;
  }

  // Generate yearly intervals
  function generateYearlyIntervals(start, end) {
    const intervals = [];
    const startTime = new Date(start);
    startTime.setMonth(0, 1); // Start at beginning of the year (Jan 1)
    startTime.setHours(0, 0, 0, 0);
    
    const endTime = new Date(end);
    
    // Loop through each year
    for (let current = new Date(startTime); current <= endTime;) {
      intervals.push(new Date(current));
      current.setFullYear(current.getFullYear() + 1);
    }
    
    return intervals;
  }

  // Generate decade intervals
  function generateDecadeIntervals(start, end) {
    const intervals = [];
    const startTime = new Date(start);
    const startYear = startTime.getFullYear();
    const decadeStart = Math.floor(startYear / 10) * 10; // Get the decade beginning
    
    startTime.setFullYear(decadeStart, 0, 1); // Start at beginning of the decade (Jan 1)
    startTime.setHours(0, 0, 0, 0);
    
    const endTime = new Date(end);
    
    // Loop through each decade
    for (let current = new Date(startTime); current <= endTime;) {
      intervals.push(new Date(current));
      current.setFullYear(current.getFullYear() + 10);
    }
    
    return intervals;
  }

  // Generate century intervals
  function generateCenturyIntervals(start, end) {
    const intervals = [];
    const startTime = new Date(start);
    const startYear = startTime.getFullYear();
    const centuryStart = Math.floor(startYear / 100) * 100; // Get the century beginning
    
    startTime.setFullYear(centuryStart, 0, 1); // Start at beginning of the century (Jan 1)
    startTime.setHours(0, 0, 0, 0);
    
    const endTime = new Date(end);
    
    // Loop through each century
    for (let current = new Date(startTime); current <= endTime;) {
      intervals.push(new Date(current));
      current.setFullYear(current.getFullYear() + 100);
    }
    
    return intervals;
  }

  // Format interval date label based on interval type and time span
  const formatIntervalDate = (date) => {
    const timeSpan = endDate.getTime() - startDate.getTime();
    const oneDay = 86400000; // milliseconds in a day
    const oneWeek = oneDay * 7;
    const oneMonth = oneDay * 30;
    const oneYear = oneDay * 365;
    
    // Format based on interval type first
    switch (effectiveIntervalType) {
      case 'daily':
        return date.toLocaleDateString(undefined, { 
          day: 'numeric',
          month: 'short'
        });
      case 'weekly':
        return `Uke ${getWeekNumber(date)}, ${date.getFullYear()}`;
      case 'monthly':
        return date.toLocaleDateString(undefined, { 
          month: 'short',
          year: 'numeric'
        });
      case 'yearly':
        // For yearly, just show the year as requested
        return date.getFullYear().toString();
      case 'decade':
        // For decade, show the decade (e.g., "2020-årene")
        const decadeYear = Math.floor(date.getFullYear() / 10) * 10;
        return `${decadeYear}-årene`;
      case 'century':
        // For century, just show the century number
        const century = Math.floor(date.getFullYear() / 100) + 1;
        return `${century}. århundre`;
      case 'even':
      default:
        // For even spacing, format based on time span
        if (timeSpan < oneDay) {
          return date.toLocaleTimeString(undefined, { 
            hour: '2-digit', 
            minute: '2-digit'
          });
        } else if (timeSpan < oneWeek) {
          return date.toLocaleDateString(undefined, { 
            weekday: 'short',
            day: 'numeric'
          });
        } else if (timeSpan < oneMonth) {
          return date.toLocaleDateString(undefined, { 
            day: 'numeric',
            month: 'short' 
          });
        } else if (timeSpan < oneYear) {
          return date.toLocaleDateString(undefined, { 
            day: 'numeric',
            month: 'short'
          });
        } else {
          return date.toLocaleDateString(undefined, {
            month: 'short',
            year: 'numeric'
          });
        }
    }
  };
  
  // Helper function to get the week number
  function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  // Get timeline color with opacity for the markers
  const getMarkerColor = () => {
    const baseColor = timelineData.timelineColor || '#007bff';
    
    if (baseColor.startsWith('#')) {
      const r = parseInt(baseColor.slice(1, 3), 16);
      const g = parseInt(baseColor.slice(3, 5), 16);
      const b = parseInt(baseColor.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, 0.6)`;
    }
    
    if (baseColor.startsWith('rgba')) {
      return baseColor.replace(/[\d\.]+\)$/, '0.6)');
    }
    
    if (baseColor.startsWith('rgb(')) {
      return baseColor.replace('rgb(', 'rgba(').replace(')', ', 0.6)');
    }
    
    return 'rgba(0, 123, 255, 0.6)';
  };

  // Calculate marker positions based on timeline orientation - UPDATED for inside timeline
  const getMarkerPosition = (orientation, positionPercentage) => {
    // Horizontal timeline
    if (orientation === 'horizontal') {
      return {
        left: `${positionPercentage}%`,
        // Position exactly on the line (centered)
        top: '50%',
        transform: 'translate(-50%, -50%)'
      };
    } 
    // Vertical timeline
    else {
      return {
        top: `${positionPercentage}%`,
        // Position exactly on the line (centered)
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
    }
  };

  // Get marker line styles based on orientation - UPDATED to be perpendicular to the timeline
  const getMarkerLineStyle = (orientation) => {
    const color = getMarkerColor();
    const thickness = Math.max(1, Math.floor((timelineData.timelineThickness || 2) / 2));
    
    // Horizontal timeline (vertical marker lines)
    if (orientation === 'horizontal') {
      return {
        backgroundColor: color,
        width: `${thickness}px`,
        height: '16px',  // Shorter height to stay within timeline
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)' // Center the marker line
      };
    } 
    // Vertical timeline (horizontal marker lines)
    else {
      return {
        backgroundColor: color,
        height: `${thickness}px`,
        width: '16px',  // Shorter width to stay within timeline
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)' // Center the marker line
      };
    }
  };

  // Get label position based on orientation - UPDATED to place labels inside timeline
  // No explicit background color is set here, it will be set in CSS with var(--marker-label-bg)
  const getLabelPosition = (orientation) => {
    // Horizontal timeline (labels inside timeline)
    if (orientation === 'horizontal') {
      return {
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '0.75rem',
        padding: '2px 4px',
        borderRadius: '2px',
        whiteSpace: 'nowrap',
        textAlign: 'center',
        maxWidth: '90px',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      };
    } 
    // Vertical timeline (labels inside timeline)
    else {
      return {
        position: 'absolute',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '0.75rem',
        padding: '2px 4px',
        borderRadius: '2px',
        whiteSpace: 'nowrap',
        textAlign: 'center',
        maxWidth: '90px',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      };
    }
  };

  // Calculate position percentage for interval markers
  const calculatePositionPercentage = (date, intervalType) => {
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    const dateTime = date.getTime();
    let totalDuration = endTime - startTime;
    let position;
    
    // For day-based interval types (daily, weekly, monthly, yearly, etc.),
    // we need to standardize how we place the markers
    if (intervalType === 'daily') {
      // Get start and end time at day precision (midnight)
      const startDayMidnight = new Date(startDate);
      startDayMidnight.setHours(0, 0, 0, 0);
      
      const endDayMidnight = new Date(endDate);
      endDayMidnight.setHours(0, 0, 0, 0);
      
      // For the current date, also get midnight
      const dateMidnight = new Date(date);
      dateMidnight.setHours(0, 0, 0, 0);
      
      // Calculate total days (including partial days)
      const totalDurationDays = endTime - startTime;
      
      // Calculate day position offset
      const dayPosition = dateMidnight.getTime() - startDayMidnight.getTime();
      
      // Calculate position percentage based on days
      position = (dayPosition / totalDurationDays) * 100;
      
      // Special case: if this is the last date and it falls on the end date,
      // force it to 100% position
      if (dateMidnight.getTime() === endDayMidnight.getTime()) {
        position = 100;
      }
    } 
    // For other specific interval types
    else if (intervalType === 'weekly' || intervalType === 'monthly' || 
             intervalType === 'yearly' || intervalType === 'decade' || 
             intervalType === 'century') {
      // Standard positioning
      position = ((dateTime - startTime) / totalDuration) * 100;
      
      // If this is the last interval, check if it aligns with the end of the timeline
      if (date === intervals[intervals.length - 1]) {
        // Check if this interval is close to the end of the timeline
        // If it's the actual end date or very close, position at 100%
        const timeDiff = Math.abs(dateTime - endTime);
        if (timeDiff < 86400000) { // Within 1 day
          position = 100;
        }
      }
    } 
    // Standard calculation for 'even' and any other types
    else {
      position = ((dateTime - startTime) / totalDuration) * 100;
    }
    
    // Ensure position is within bounds
    return Math.max(0, Math.min(100, position));
  };

  return (
    <>
      {intervals.map((date, idx) => {
        const safePosition = calculatePositionPercentage(date, effectiveIntervalType);
        
        // Get positioned styles based on orientation
        const markerPositionStyle = getMarkerPosition(timelineData.orientation, safePosition);
        const markerLineStyle = getMarkerLineStyle(timelineData.orientation);
        const labelStyle = getLabelPosition(timelineData.orientation);
        
        return (
          <div
            key={`interval-${idx}`}
            className={`interval-marker ${timelineData.orientation} interval-type-${effectiveIntervalType}`}
            style={{
              position: 'absolute',
              ...markerPositionStyle,
              zIndex: 6  // Above the timeline line but below events
            }}
          >
            <div 
              className="marker-line"
              style={markerLineStyle}
            ></div>
            <div 
              className="marker-label"
              style={labelStyle}
            >
              {formatIntervalDate(date)}
            </div>
          </div>
        );
      })}
    </>
  );
};

export default TimelineIntervals;