import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logOut } from '../firebase';
import ActiveLink from './ActiveLink';
import TopbarTimelineForm from './TopbarTimelineForm';
import ToggleSwitch from './ToggleSwitch';
import DateInput from './DateInput';
import TimelineShareModal from './TimelineShareModal';
import logoWithText from '../assets/logo-timesculpt.png';

function Topbar({ 
  timelineData, 
  onLogin, 
  onLoadTimeline, 
  onCreateTimeline, 
  onUpdateTimeline, 
  hasUnsavedChanges, 
  onSaveTimeline,
  isPublic, 
  onPrivacyChange,
  lastSaved // Prop for timestamp
}) {
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
  
  // New state for sharing
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareModalTab, setShareModalTab] = useState('permissions');
  
  // Check if we're on the main timeline page
  const isTimelinePage = location.pathname === '/';
  
  // Check if a timeline is actively being displayed
  const isTimelineActive = isTimelinePage && timelineData && timelineData.title;
  
  // Check if user is the owner of the timeline
  const isTimelineOwner = timelineData && currentUser && timelineData.userId === currentUser.uid;

  // Format timestamp for display
  const formatLastSaved = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const savedTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - savedTime) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Nettopp lagret';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} min siden`;
    } else if (diffInMinutes < 1440) { // Less than 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} time${hours > 1 ? 'r' : ''} siden`;
    } else {
      return savedTime.toLocaleDateString('no-NO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  };
  
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
    } else {
      console.warn('onUpdateTimeline function is not provided');
    }
    
    setShowTitleEditor(false);
    setShowWarning(false);
  };

  const handleLogoClick = () => {
    navigate('/');
  };
  
  const handleBackToMainSite = () => {
    window.location.href = 'https://timesculpt.no/';
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

  const handleMyTimelines = () => {
    setShowDropdown(false);
    navigate('/mine-tidslinjer');
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
  
  const handleOpenShareModal = (tab = 'permissions') => {
    setShareModalTab(tab);
    setShowShareModal(true);
  };
  
  const toggleTimelinePrivacy = () => {
    if (onPrivacyChange) {
      onPrivacyChange(!isPublic);
    }
  };

  const consistentHeight = '36px';

  return (
    <div className="topbar">
      <div className="topbar-left">
        {/* Back to main site button */}
        
        
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
            height: consistentHeight,
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
              height: '32px',
              width: 'auto',
              display: 'block',
              filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
              transition: 'transform 0.2s ease',
              borderRadius: '4px',
            }} 
          />
        </div>
        
        {isTimelinePage && (
          <TopbarTimelineForm 
            onCreateTimeline={onCreateTimeline} 
            buttonHeight={consistentHeight}
          />
        )}
      </div>
      
      <div className="topbar-center">
        {!isTimelineActive && (
          <nav className="main-nav">
            <ul className="nav-links">
              <li>
                <ActiveLink to="/utforsk">Utforsk</ActiveLink>
              </li>
              <li>
                <ActiveLink to="/">Lag tidsline</ActiveLink>
              </li>
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
            
            {/* Timeline Actions Container */}
            <div className="timeline-actions-container" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '15px' }}>
              
              {/* Lagre knapp - vises bare for timeline owner med hendelser */}
              {isTimelineActive && timelineData.events && timelineData.events.length > 0 && isTimelineOwner && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className="save-timeline-btn topbar-save-btn"
                    onClick={handleSaveTimeline}
                    disabled={!hasUnsavedChanges}
                    title={hasUnsavedChanges ? "Lagre endringer" : "Ingen endringer å lagre"}
                    style={{
                      width: 'auto',
                      padding: '0 16px',
                      height: '36px',
                      backgroundColor: hasUnsavedChanges ? '#007bff' : '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: hasUnsavedChanges ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      fontWeight: '500',
                      fontSize: '14px',
                      opacity: hasUnsavedChanges ? 1 : 0.7,
                      transition: 'all 0.2s ease'
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

                  {/* Subtil "sist lagret" merking */}
                  {lastSaved && !hasUnsavedChanges && (
                    <span 
                      style={{
                        fontSize: '12px',
                        color: '#6c757d',
                        fontStyle: 'italic',
                        whiteSpace: 'nowrap'
                      }}
                      title={`Sist lagret: ${new Date(lastSaved).toLocaleString('no-NO')}`}
                    >
                      {formatLastSaved(lastSaved)}
                    </span>
                  )}
                </div>
              )}
              
              {/* Share Button */}
              {isTimelineActive && timelineData.id && isAuthenticated && (
                <div className="timeline-share-dropdown">
                  <button 
                    className="share-timeline-btn topbar-share-btn"
                    onClick={() => handleOpenShareModal('permissions')}
                    title="Del tidslinje"
                    style={{
                      width: 'auto',
                      padding: '0 16px',
                      height: '36px',
                      backgroundColor: isTimelineOwner ? '#28a745' : 'transparent',
                      color: isTimelineOwner ? 'white' : '#333',
                      border: isTimelineOwner ? 'none' : '1px solid #dee2e6',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      fontWeight: '500',
                      fontSize: '14px'
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
                      <circle cx="18" cy="5" r="3"></circle>
                      <circle cx="6" cy="12" r="3"></circle>
                      <circle cx="18" cy="19" r="3"></circle>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
                    Del
                  </button>
                </div>
              )}
              
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
            </div>
            
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
      
      <div className="topbar-right">
        {/* Support button */}
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
                  <span>Mitt arkiv</span>
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
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1-2-2h4"/>
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
      
      {/* Timeline Share Modal */}
      {showShareModal && (
        <TimelineShareModal
          timelineData={timelineData}
          isOwner={isTimelineOwner}
          initialTab={shareModalTab}
          onClose={() => setShowShareModal(false)}
          isPublic={isPublic}
          onPrivacyChange={onPrivacyChange}
        />
      )}
    </div>
  );
}

export default Topbar;