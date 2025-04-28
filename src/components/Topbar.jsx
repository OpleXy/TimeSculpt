import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logOut } from '../firebase';
import ActiveLink from './ActiveLink';
import TopbarTimelineForm from './TopbarTimelineForm';
import ToggleSwitch from './ToggleSwitch';
import DateInput from './DateInput';
import logoWithText from '../assets/logo-timesculpt.png';

function Topbar({ timelineData, onLogin, onLoadTimeline, onCreateTimeline, onUpdateTimeline, hasUnsavedChanges, onSaveTimeline }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTitleEditor, setShowTitleEditor] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [isVertical, setIsVertical] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [eventsOutsideRange, setEventsOutsideRange] = useState([]);
  const { isAuthenticated, currentUser } = useAuth();
  const titleEditorRef = useRef(null);
  
  // Check if we're on the main timeline page
  const isTimelinePage = location.pathname === '/';
  
  // Check if a timeline is actively being displayed
  const isTimelineActive = isTimelinePage && timelineData && timelineData.title;
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.topbar-user')) {
        setShowDropdown(false);
      }
      
      if (showTitleEditor && titleEditorRef.current && !titleEditorRef.current.contains(event.target) && !event.target.closest('.timeline-title-display')) {
        setShowTitleEditor(false);
        setShowWarning(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdown, showTitleEditor]);

  // Update form values when timeline data changes
  useEffect(() => {
    if (timelineData && timelineData.title) {
      setEditTitle(timelineData.title);
      setEditStartDate(timelineData.start ? formatDateForInput(timelineData.start) : '');
      setEditEndDate(timelineData.end ? formatDateForInput(timelineData.end) : '');
      setIsVertical(timelineData.orientation === 'vertical');
    }
  }, [timelineData]);

  // Format date for input fields (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  // Format date to display in a user-friendly format
  const formatDate = (date) => {
    if (!date) return '';
    
    // Create a formatted date string (DD/MM/YYYY format)
    return date.toLocaleDateString('no-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleTitleClick = () => {
    if (timelineData.title) {
      setShowTitleEditor(true);
    }
  };

  const handleTitleChange = (e) => {
    setEditTitle(e.target.value);
  };

  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    setEditStartDate(newStartDate);
    
    // Check if any events fall outside the new range
    checkEventsOutsideRange(new Date(newStartDate), editEndDate ? new Date(editEndDate) : timelineData.end);
  };

  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    setEditEndDate(newEndDate);
    
    // Check if any events fall outside the new range
    checkEventsOutsideRange(editStartDate ? new Date(editStartDate) : timelineData.start, new Date(newEndDate));
  };

  const handleOrientationChange = (e) => {
    setIsVertical(e.target.checked);
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
    
    // Filter out events that are now outside the date range
    let updatedEvents = [...timelineData.events];
    if (showWarning) {
      updatedEvents = timelineData.events.filter(event => {
        return event.date >= start && event.date <= end;
      });
    }
    
    // Update the timeline data
    const updatedTimeline = {
      ...timelineData,
      title: editTitle,
      start,
      end,
      orientation: isVertical ? 'vertical' : 'horizontal',
      events: updatedEvents
    };
    
    // Call the update function passed from App.jsx
    if (typeof onUpdateTimeline === 'function') {
      onUpdateTimeline(updatedTimeline);
    } else {
      console.warn('onUpdateTimeline function is not provided');
    }
    
    // Close the editor
    setShowTitleEditor(false);
    setShowWarning(false);
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleLogout = async () => {
    try {
      await logOut();
      setShowDropdown(false);
      navigate('/');
    } catch (err) {
      console.error('Kunne ikke logge ut:', err);
    }
  };

  // Navigation handlers
  const handleMyTimelines = () => {
    setShowDropdown(false);
    navigate('/tidslinjer');
  };

  const handleMyProfile = () => {
    setShowDropdown(false);
    navigate('/profil');
  };

  const handleSettings = () => {
    setShowDropdown(false);
    navigate('/innstillinger');
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const openSupport = () => {
    window.open('https://support.timesculpt.no', '_blank');
  };

  const handleSaveTimeline = () => {
    if (typeof onSaveTimeline === 'function') {
      onSaveTimeline();
    } else {
      console.warn('onSaveTimeline function is not provided');
    }
  };

  // Define a consistent height for both the logo and the new timeline button
  const consistentHeight = '36px';

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div 
          className="app-brand" 
          onClick={handleLogoClick}
          style={{ 
            display: 'flex',
            alignItems: 'center',
            padding: '0 8px',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginRight: '15px',
            height: consistentHeight, // Set consistent height
            overflow: 'hidden',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 123, 255, 0.05)';
            e.currentTarget.querySelector('img').style.transform = 'scale(1.03)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.querySelector('img').style.transform = 'scale(1)';
          }}
        >
          <img 
            src={logoWithText} 
            alt="TimeSculpt" 
            style={{ 
              height: '32px', // Slightly smaller than container to add padding
              width: 'auto',
              display: 'block',
              filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
              transition: 'transform 0.2s ease',
              borderRadius: '4px',
            }} 
          />
        </div>
        
        {/* Show the New Timeline form on the main timeline page, regardless of whether a timeline is active */}
        {isTimelinePage && (
          <TopbarTimelineForm 
            onCreateTimeline={onCreateTimeline} 
            buttonHeight={consistentHeight} // Pass consistent height to the form component
          />
        )}
      </div>
      
      <div className="topbar-center">
        {/* Only show navigation if we're NOT displaying an active timeline */}
        {!isTimelineActive && (
          <nav className="main-nav">
            <ul className="nav-links">
              <li>
                <ActiveLink to="/">Tidslinje</ActiveLink>
              </li>
              <li>
                <ActiveLink to="/tidslinjer">Mine tidslinjer</ActiveLink>
              </li>
            </ul>
          </nav>
        )}
        
        {/* Show timeline title when a timeline is active */}
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
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </span>
            
            {/* Save Button - Now placed right after the timeline title */}
            {isTimelineActive && timelineData.events && timelineData.events.length > 0 && (
              <button
                className="save-timeline-btn topbar-save-btn"
                onClick={handleSaveTimeline}
                disabled={!hasUnsavedChanges}
                title={hasUnsavedChanges ? "Lagre endringer" : "Ingen endringer å lagre"}
                style={{
                  width: 'auto',
                  margin: '0 0 0 15px',  // Added margin to the left to separate from the title
                  padding: '0 16px',
                  height: '36px'
                }}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{ marginRight: '8px' }}
                >
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                Lagre
              </button>
            )}
            
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
                  
                  <div className="form-group">
                    <ToggleSwitch
                      isVertical={isVertical}
                      onChange={handleOrientationChange}
                      id="edit-orientation-toggle"
                    />
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
      
      <div className="topbar-right">
        {/* Save Button - Removed from here and moved next to the timeline title */}
        
        {/* Support button - icon only */}
        <button
          onClick={openSupport}
          title="Support"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            padding: '0',
            marginRight: '10px',
            color: '#777',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            e.currentTarget.style.color = '#333';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#777';
          }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </button>

        {isAuthenticated ? (
          <div className="topbar-user" onClick={toggleDropdown}>
            {currentUser?.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt={currentUser.displayName || "Bruker"} 
                className="topbar-avatar" 
              />
            ) : (
              <div className="avatar-initials">
                {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 
                 currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : '?'}
              </div>
            )}
            <span className="topbar-username">
              {currentUser?.displayName || currentUser?.email}
            </span>
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
              className={`dropdown-arrow ${showDropdown ? 'open' : ''}`}
            >
              <path d="M6 9l6 6 6-6"/>
            </svg>
            
            {showDropdown && (
              <div className="user-dropdown">
                {/* Use ActiveLink for dropdown items */}
                <div onClick={handleMyTimelines} className="dropdown-item">
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
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  <span>Mine tidslinjer</span>
                </div>
                
                <div onClick={handleMyProfile} className="dropdown-item">
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
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span>Min profil</span>
                </div>
                
                <div onClick={handleSettings} className="dropdown-item">
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
                  >
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                  <span>Innstillinger</span>
                </div>
                
                <div className="dropdown-divider"></div>
                
                <button onClick={handleLogout} className="dropdown-item logout-btn">
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
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  <span>Logg ut</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="topbar-login-btn" onClick={onLogin}>
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
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            <span>Logg inn</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default Topbar;