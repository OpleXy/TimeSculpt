// src/components/topbar/TopbarCenter.jsx
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ActiveLink from '../ActiveLink';
import DateInput from '../DateInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faPen, faFolder } from '@fortawesome/free-solid-svg-icons';

function TopbarCenter({ 
  timelineData, 
  onUpdateTimeline, 
  isPublic, 
  onPrivacyChange, 
  currentUser,
  isTimelineOwner 
}) {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Title editor state
  const [showTitleEditor, setShowTitleEditor] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [eventsOutsideRange, setEventsOutsideRange] = useState([]);
  
  const titleEditorRef = useRef(null);
  
  // Check if we're on the main timeline page
  const isTimelinePage = location.pathname === '/';
  
  // Check if a timeline is actively being displayed
  const isTimelineActive = isTimelinePage && timelineData && timelineData.title;

  // Format date for input fields (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  // Format date to display in a user-friendly format
  const formatDate = (date) => {
    if (!date) return '';
    
    return date.toLocaleDateString('no-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Update form values when timeline data changes
  useEffect(() => {
    if (timelineData && timelineData.title) {
      setEditTitle(timelineData.title);
      setEditStartDate(timelineData.start ? formatDateForInput(timelineData.start) : '');
      setEditEndDate(timelineData.end ? formatDateForInput(timelineData.end) : '');
    }
  }, [timelineData]);

  // Close title editor when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTitleEditor && titleEditorRef.current && !titleEditorRef.current.contains(event.target) && !event.target.closest('.timeline-title-display')) {
        setShowTitleEditor(false);
        setShowWarning(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showTitleEditor]);

  // Title click handler
  const handleTitleClick = () => {
    if (timelineData.title) {
      setShowTitleEditor(true);
    }
  };

  // Form handlers
  const handleTitleChange = (e) => {
    setEditTitle(e.target.value);
  };

  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    setEditStartDate(newStartDate);
    checkEventsOutsideRange(new Date(newStartDate), editEndDate ? new Date(editEndDate) : timelineData.end);
  };

  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    setEditEndDate(newEndDate);
    checkEventsOutsideRange(editStartDate ? new Date(editStartDate) : timelineData.start, new Date(newEndDate));
  };

  // Check if events fall outside the new date range
  const checkEventsOutsideRange = (startDate, endDate) => {
    if (!timelineData.events || timelineData.events.length === 0) {
      setShowWarning(false);
      return;
    }
    
    const outsideEvents = timelineData.events.filter(event => {
      return event.date < startDate || event.date > endDate;
    });
    
    if (outsideEvents.length > 0) {
      setEventsOutsideRange(outsideEvents);
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  };

  // Form submission
  const handleTitleSubmit = (e) => {
    e.preventDefault();
    
    if (!editTitle || !editStartDate || !editEndDate) {
      alert('Vennligst fyll ut alle feltene');
      return;
    }
    
    const start = new Date(editStartDate);
    const end = new Date(editEndDate);
    
    if (start > end) {
      alert('Startdato må være før sluttdato');
      return;
    }
    
    let updatedEvents = [...timelineData.events];
    if (showWarning) {
      updatedEvents = timelineData.events.filter(event => {
        return event.date >= start && event.date <= end;
      });
    }
    
    const updatedTimeline = {
      ...timelineData,
      title: editTitle,
      start,
      end,  
      events: updatedEvents
    };
    
    if (typeof onUpdateTimeline === 'function') {
      onUpdateTimeline(updatedTimeline);
    }
    
    setShowTitleEditor(false);
    setShowWarning(false);
  };

  // Privacy toggle
  const toggleTimelinePrivacy = () => {
    if (onPrivacyChange) {
      onPrivacyChange(!isPublic);
    }
  };

  return (
    <div className="topbar-center">
      {!isTimelineActive && (
        <nav className="main-nav">
          <ul className="nav-links">
            <li>
              <ActiveLink to="/utforsk">
                <FontAwesomeIcon icon={faGlobe} style={{ marginRight: '8px' }} />
                Utforsk
              </ActiveLink>
            </li>
            <li>
              <ActiveLink to="/">
                <FontAwesomeIcon icon={faPen} style={{ marginRight: '8px' }} />
                Ny tidslinje
              </ActiveLink>
            </li>
            {isAuthenticated && (
              <li>
                <ActiveLink to="/mine-tidslinjer">
                  <FontAwesomeIcon icon={faFolder} style={{ marginRight: '8px' }} />
                  Mine tidslinjer
                </ActiveLink>
              </li>
            )}
          </ul>
        </nav>
      )}
      
      {isTimelineActive && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span 
            className="timeline-title-display" 
            onClick={handleTitleClick}
            style={{ cursor: 'pointer' }}
            title="Klikk for å redigere tidslinje"
          >
            {timelineData.title}
            {timelineData.start && timelineData.end && (
              <span className="timeline-period">
                ({formatDate(timelineData.start)} - {formatDate(timelineData.end)})
              </span>
            )}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ marginLeft: '8px', verticalAlign: 'middle' }}
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="m18.5 2.5 3 3L12 15l-4 1 1-4L18.5 2.5z"/>
            </svg>
          </span>

          {/* Public/Private Status Badge */}
          {isTimelineActive && timelineData.id && (
            <div 
              className={`privacy-status-badge ${isPublic ? 'public' : 'private'}`}
              onClick={isTimelineOwner ? toggleTimelinePrivacy : undefined}
              style={{ 
                cursor: isTimelineOwner ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '13px',
                fontWeight: '500',
                padding: '2px 10px',
                borderRadius: '16px',
                backgroundColor: isPublic 
                  ? 'rgba(40, 167, 69, 0.1)' 
                  : 'rgba(108, 117, 125, 0.1)',
                color: isPublic 
                  ? '#28a745' 
                  : '#6c757d',
                border: isPublic
                  ? '1px solid rgba(40, 167, 69, 0.2)'
                  : '1px solid rgba(108, 117, 125, 0.2)'
              }}
            >
              {isPublic ? (
                <>
                  <svg 
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
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                  Offentlig
                </>
              ) : (
                <>
                  <svg 
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
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  Privat
                </>
              )}
            </div>
          )}
          
          {/* Title Editor Modal */}
          {showTitleEditor && (
            <div className="title-editor-container" ref={titleEditorRef}>
              <form onSubmit={handleTitleSubmit} className="title-editor-form">
                <h3>Rediger tidslinje</h3>
                <div className="form-group">
                  <label htmlFor="edit-title">Tittel<span className="required-mark"> *</span></label>
                  <input 
                    type="text" 
                    id="edit-title" 
                    value={editTitle} 
                    onChange={handleTitleChange} 
                    required 
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group half">
                    <DateInput
                      value={editStartDate}
                      onChange={handleStartDateChange}
                      label="Start dato"
                      required={true}
                    />
                  </div>
                  
                  <div className="form-group half">
                    <DateInput
                      value={editEndDate}
                      onChange={handleEndDateChange}
                      label="Slutt dato"
                      required={true}
                    />
                  </div>
                </div>
                
                {showWarning && (
                  <div className="warning-message">
                    <strong>Advarsel:</strong> Endring av datointervallet vil slette {eventsOutsideRange.length} hendelse(r) 
                    som ikke lenger er innenfor det nye intervallet. Denne handlingen kan ikke angres.
                  </div>
                )}
                
                <div className="form-buttons">
                  <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={() => {
                      setShowTitleEditor(false);
                      setShowWarning(false);
                    }}
                  >
                    Avbryt
                  </button>
                  <button type="submit" className="save-btn">Oppdater</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TopbarCenter;