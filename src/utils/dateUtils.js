/**
 * Utility functions for handling dates in the timeline application
 */

/**
 * Format a date to YYYY-MM-DD for input fields
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDateForInput(date) {
    if (!date) return '';
    
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    return date.toISOString().split('T')[0];
  }
  
  /**
   * Format a date for display
   * @param {Date} date - Date to format
   * @returns {string} Formatted date string for display
   */
  export function formatDateForDisplay(date) {
    if (!date) return '';
    
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    return date.toLocaleDateString();
  }
  
  /**
   * Calculate the position percentage along the timeline
   * @param {Date} date - Event date
   * @param {Date} startDate - Timeline start date
   * @param {Date} endDate - Timeline end date
   * @returns {number} Percentage position (0-100)
   */
  export function calculatePositionPercentage(date, startDate, endDate) {
    if (!date || !startDate || !endDate) return 0;
    
    const totalDuration = endDate - startDate;
    const eventPosition = date - startDate;
    
    return (eventPosition / totalDuration) * 100;
  }
  
  /**
   * Check if a date is within a range
   * @param {Date} date - Date to check
   * @param {Date} startDate - Start of range
   * @param {Date} endDate - End of range
   * @returns {boolean} Whether date is in range
   */
  export function isDateInRange(date, startDate, endDate) {
    if (!date || !startDate || !endDate) return false;
    
    return date >= startDate && date <= endDate;
  }
  
  export default {
    formatDateForInput,
    formatDateForDisplay,
    calculatePositionPercentage,
    isDateInRange
  };