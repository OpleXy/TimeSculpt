import React, { useState, useEffect, useRef } from 'react';
import '../styles/DateInput.css';

// DateInput component that uses native HTML date picker
const DateInput = ({ value, onChange, label = "Dato", required = false }) => {
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [isBC, setIsBC] = useState(false);
  const nativeDateInputRef = useRef(null);
  
  // Initialize with value if provided
  useEffect(() => {
    if (value) {
      const dateObj = new Date(value);
      if (!isNaN(dateObj.getTime())) {
        setDate(formatDate(dateObj));
        setSelectedDate(dateObj);
      }
    }
  }, [value]);

  // Handle date input change with auto-formatting
  const handleDateChange = (e) => {
    let input = e.target.value;
    
    // Remove non-numeric characters
    const numbersOnly = input.replace(/[^\d]/g, '');
    
    // Add slashes automatically
    let formattedInput = '';
    if (numbersOnly.length > 0) {
      // Add first part (day)
      formattedInput = numbersOnly.substring(0, Math.min(2, numbersOnly.length));
      
      // Add slash and month part
      if (numbersOnly.length > 2) {
        formattedInput += '/' + numbersOnly.substring(2, Math.min(4, numbersOnly.length));
        
        // Add slash and year part
        if (numbersOnly.length > 4) {
          formattedInput += '/' + numbersOnly.substring(4);
        }
      }
    }
    
    // Update state
    setDate(formattedInput);
    
    // Basic validation
    if (formattedInput && formattedInput.length >= 10 && !isValidDateFormat(formattedInput)) {
      setError('Vennligst bruk DD/MM/YYYY format');
    } else {
      setError('');
      
      // If valid date, update selected date and call onChange
      if (isValidDate(formattedInput)) {
        const [day, month, year] = formattedInput.split('/').map(num => parseInt(num, 10));
        const adjustedYear = isBC ? -Math.abs(year) : Math.abs(year);
        
        // Create date object and notify parent component
        const newDate = new Date(adjustedYear, month - 1, day);
        setSelectedDate(newDate);
        
        if (onChange) {
          // Format as YYYY-MM-DD for HTML inputs
          const isoDate = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`;
          onChange({ target: { value: isoDate } });
        }
      }
    }
  };
  
  // Handle native date picker change
  const handleNativeDateChange = (e) => {
    const isoDate = e.target.value; // Format: YYYY-MM-DD
    
    if (isoDate) {
      // Convert ISO date to Date object
      const dateObj = new Date(isoDate);
      
      // Format for display
      setDate(formatDate(dateObj));
      setSelectedDate(dateObj);
      
      // Call parent onChange
      if (onChange) {
        onChange({ target: { value: isoDate } });
      }
      
      setError('');
    }
  };
  
  // Open native date picker when calendar button is clicked
  const openNativeDatePicker = () => {
    if (nativeDateInputRef.current) {
      nativeDateInputRef.current.showPicker();
    }
  };
  
  // Check if date format is valid (DD/MM/YYYY)
  const isValidDateFormat = (dateStr) => {
    // Modified regex to accept any number of digits for the year (4 or more)
    const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4,}$/;
    return regex.test(dateStr);
  };
  
  // Check if date is valid
  const isValidDate = (dateStr) => {
    if (!isValidDateFormat(dateStr)) return false;
    
    const [day, month, year] = dateStr.split('/').map(num => parseInt(num, 10));
    // Create date without any maximum year limitation
    const date = new Date(year, month - 1, day);
    
    return date.getMonth() === month - 1 && 
           date.getDate() === day && 
           date.getFullYear() === year;
  };
  
  // Format date for input (DD/MM/YYYY)
  const formatDate = (date) => {
    if (!date) return '';
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = Math.abs(date.getFullYear());
    return `${day}/${month}/${year}`;
  };
  
  // Format date for native date input (YYYY-MM-DD)
  const formatDateForNative = (date) => {
    if (!date) return '';
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };
  
  return (
    <div className="date-input-container form-group">
      {label && (
        <label htmlFor="date">
          {label} {required && <span className="required-mark">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div className={`date-input-field ${error ? 'error' : ''}`}>
          <input
            id="date"
            type="text"
            placeholder="DD/MM/YYYY"
            value={date}
            onChange={handleDateChange}
            required={required}
            aria-label={label || "Date input"}
          />
          <button 
            type="button"
            onClick={openNativeDatePicker}
            className="calendar-toggle-btn"
            aria-label="Open calendar"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </button>
          
          {/* Hidden native date input that will be triggered by the calendar button */}
          <input
            ref={nativeDateInputRef}
            type="date"
            value={selectedDate ? formatDateForNative(selectedDate) : ''}
            onChange={handleNativeDateChange}
            className="native-date-input"
            aria-hidden="true"
          />
        </div>
        
        {error && <p className="error-message">{error}</p>}
      </div>
      
      
    </div>
  );
};

export default DateInput;