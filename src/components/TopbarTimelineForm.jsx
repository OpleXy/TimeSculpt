import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DateInput from './DateInput';
import '../styles/topbar-timeline-form.css';

function TopbarTimelineForm({ onCreateTimeline, hasUnsavedChanges, buttonHeight = '36px' }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [timelineCount, setTimelineCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const formRef = useRef(null);
  const { isAuthenticated } = useAuth();

  const toggleForm = () => {
    setIsExpanded(!isExpanded);
  };

  // Handle clicks outside of the form to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (formRef.current && !formRef.current.contains(event.target) && isExpanded) {
        setIsExpanded(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);



  // Handle date changes from DateInput components
  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check for unsaved changes
    if (hasUnsavedChanges) {
      const confirmCreate = window.confirm(
        'Du har ulagrede endringer. Er du sikker på at du vil opprette en ny tidslinje? Ulagrede endringer vil gå tapt.'
      );
      
      if (!confirmCreate) {
        return; // User cancelled, don't create a new timeline
      }
    }

    // Manual mode validation
    if (!title || !startDate || !endDate) {
      alert('Vennligst fyll ut alle feltene');
      return;
    }

    onCreateTimeline({
      title,
      start: new Date(startDate),
      end: new Date(endDate),
      orientation: 'horizontal',
      events: [],
      backgroundColor: 'white',
      timelineColor: '#007bff',
      timelineThickness: 2
    });

    // Reset form after successful creation
    setTitle('');
    setStartDate('');
    setEndDate('');
    setIsExpanded(false);
  };
  
  return (
    <div className="topbar-timeline-form" ref={formRef}>
      <button 
        className="add-description-btn new-timeline-button" 
        onClick={toggleForm}
        type="button"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'background-color 0.2s, color 0.2s',
          fontSize: '0.9rem',
          padding: '0 12px',
          borderRadius: '4px',
          border: '1px dashed var(--primary-color)',
          backgroundColor: isExpanded ? 'rgba(0, 123, 255, 0.1)' : 'transparent',
          color: 'var(--primary-color)',
          height: buttonHeight,
          width: 'auto',
          margin: 0
        }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ marginRight: '6px' }}
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Ny tidslinje
      </button>

      {isExpanded && (
        <div className="topbar-form-dropdown">

          <form onSubmit={handleSubmit}>
            
            <div className="form-group">
              <label htmlFor="timelineTitle" style={{ 
                display: 'block', 
                marginBottom: '5px', 
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                Tidslinjetittel <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input 
                type="text" 
                id="timelineTitle" 
                placeholder="Tidslinjetittel" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required 
              />
            </div>
            
            <div className="form-row">
              <div className="form-group half">
                <label style={{ 
                  display: 'block', 
                  marginBottom: '5px', 
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  Start dato <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <DateInput
                  value={startDate}
                  onChange={handleStartDateChange}
                  label=""
                  required={true}
                />
              </div>
              
              <div className="form-group half">
                <label style={{ 
                  display: 'block', 
                  marginBottom: '5px', 
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  Slutt dato <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <DateInput
                  value={endDate}
                  onChange={handleEndDateChange}
                  label=""
                  required={true}
                />
              </div>
            </div>
            <button 
                type="submit" 
                className="create-btn"
              >
                Opprett
              </button>

          </form>
        </div>
      )}
      
      <style jsx>{`
        .form-header {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid var(--border-color, #eaeaea);
        }
        
        .form-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-color, #333);
          text-align: center;
        }
      `}</style>
    </div>
  );
}

export default TopbarTimelineForm;