// src/components/topbar/TopbarLeft.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DateInput from '../DateInput';
import tsLogoNoBg from '../../assets/ts_logo_no_bg.png';

function TopbarLeft({ onCreateTimeline, hasUnsavedChanges, buttonHeight = '36px' }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // Timeline form state
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [timelineCount, setTimelineCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const formRef = useRef(null);

  // Logo click handler
  const handleLogoClick = () => {
    navigate('/');
  };

  // Toggle timeline form
  const toggleForm = () => {
    setIsExpanded(!isExpanded);
  };

  // Handle clicks outside form to close it
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

  // Date change handlers
  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };

  // Form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Check for unsaved changes
    if (hasUnsavedChanges) {
      const confirmCreate = window.confirm(
        'Du har ulagrede endringer. Er du sikker på at du vil opprette en ny tidslinje? Ulagrede endringer vil gå tapt.'
      );
      
      if (!confirmCreate) {
        return;
      }
    }

    // Validation
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
    <div className="topbar-left">
      {/* Logo og Workspace */}
      <div className="logo-workspace-container" onClick={handleLogoClick}>
        <div className="logo-container">
          <img 
            src={tsLogoNoBg} 
            alt="TimeSculpt Logo" 
            className="logo-image"
          />
        </div>
        <span className="workspace-text">WORKSPACE</span>
      </div>

      {/* Timeline Form */}
      <div className="topbar-timeline-form" ref={formRef}>
        <button 
          className="new-timeline-button" 
          onClick={toggleForm}
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
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
      </div>
    </div>
  );
}

export default TopbarLeft;