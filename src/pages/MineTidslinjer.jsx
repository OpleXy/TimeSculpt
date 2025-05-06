import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  loadTimelineList, 
  deleteTimeline, 
  updateTimelinePrivacy, 
  getSharedTimelines 
} from '../api';
import Layout from '../components/Layout';
import { setDocumentTitle } from '../services/documentTitleService';
import TimelineShareModal from '../components/TimelineShareModal';
import '../styles/pages/MineTidslinjer.css';
import '../styles/pages/layout.css';

function MineTidslinjer() {
  const [timelines, setTimelines] = useState([]);
  const [sharedTimelines, setSharedTimelines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingShared, setIsLoadingShared] = useState(true);
  const [error, setError] = useState('');
  const [sharedError, setSharedError] = useState('');
  const { isAuthenticated, currentUser } = useAuth();
  const [showCopiedNotification, setShowCopiedNotification] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedTimeline, setSelectedTimeline] = useState(null);

  // Set document title when component mounts
  useEffect(() => {
    setDocumentTitle('Mitt arkiv');
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTimelines();
      fetchSharedTimelines();
    } else {
      setTimelines([]);
      setSharedTimelines([]);
      setIsLoading(false);
      setIsLoadingShared(false);
    }
  }, [isAuthenticated]);

  const fetchTimelines = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await loadTimelineList();
      setTimelines(data);
    } catch (err) {
      console.error('Error loading timelines:', err);
      setError('Kunne ikke laste tidslinjer. Vennligst prøv igjen senere.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchSharedTimelines = async () => {
    try {
      setIsLoadingShared(true);
      setSharedError('');
      const data = await getSharedTimelines();
      setSharedTimelines(data);
    } catch (err) {
      console.error('Error loading shared timelines:', err);
      setSharedError('Kunne ikke laste delte tidslinjer. Vennligst prøv igjen senere.');
    } finally {
      setIsLoadingShared(false);
    }
  };

  const handleDeleteTimeline = async (id) => {
    if (window.confirm('Er du sikker på at du vil slette denne tidslinjen? Dette kan ikke angres.')) {
      try {
        await deleteTimeline(id);
        // Refresh the timeline list after deletion
        fetchTimelines();
      } catch (err) {
        console.error('Error deleting timeline:', err);
        setError('Kunne ikke slette tidslinjen. Vennligst prøv igjen senere.');
      }
    }
  };

  const handleLoadTimeline = (id) => {
    // Navigate to the timeline editor with this ID
    window.location.href = `/?timelineId=${id}`;
  };

  // Toggle privacy for a timeline
  const toggleTimelinePrivacy = async (id, currentPrivacy) => {
    try {
      await updateTimelinePrivacy(id, !currentPrivacy);
      // Refresh the timeline list after toggling privacy
      fetchTimelines();
    } catch (err) {
      console.error('Error updating timeline privacy:', err);
      setError('Kunne ikke endre personverninnstillingene. Vennligst prøv igjen senere.');
    }
  };

  // Copy share URL to clipboard
  const copyShareUrl = (id) => {
    const shareUrl = `${window.location.origin}/?timelineId=${id}`;
    
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setShowCopiedNotification(id);
        setTimeout(() => setShowCopiedNotification(null), 2000);
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
      });
  };
  
  // Open share modal for a timeline
  const openShareModal = (timeline) => {
    setSelectedTimeline(timeline);
    setShareModalOpen(true);
  };
  
  // Handle privacy change from share modal
  const handlePrivacyChange = async (isPublic) => {
    if (!selectedTimeline) return;
    
    try {
      await updateTimelinePrivacy(selectedTimeline.id, isPublic);
      // Update the timeline in our local state
      setTimelines(timelines.map(timeline => 
        timeline.id === selectedTimeline.id 
          ? {...timeline, isPublic} 
          : timeline
      ));
      // Update selected timeline
      setSelectedTimeline({...selectedTimeline, isPublic});
    } catch (err) {
      console.error('Error updating timeline privacy:', err);
      setError('Kunne ikke endre personverninnstillingene. Vennligst prøv igjen senere.');
    }
  };

  // Format date to display in a user-friendly format
  const formatDate = (date) => {
    if (!date) return '';
    
    return new Date(date).toLocaleDateString('no-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Icons for privacy badges and actions
  const PrivateIcon = () => (
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
      style={{ marginRight: '6px' }}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );
  
  const PublicIcon = () => (
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
      style={{ marginRight: '6px' }}
    >
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
  );
  
  const ShareIcon = () => (
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
      <circle cx="18" cy="5" r="3"></circle>
      <circle cx="6" cy="12" r="3"></circle>
      <circle cx="18" cy="19" r="3"></circle>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
    </svg>
  );

  const EditIcon = () => (
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
      className="icon-edit"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  );

  const DeleteIcon = () => (
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
      className="icon-delete"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
  
  const ViewIcon = () => (
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
      style={{ marginRight: '6px' }}
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );

  return (
    <Layout>
      <div className="page-fullwidth-container">
        <h1 className="page-subtle-title">🗂️ Mitt arkiv</h1>
        
        {!isAuthenticated ? (
          <div className="auth-centered-content">
            <div className="auth-required-message">
              <p>Du må være logget inn for å se dine tidslinjer.</p>
            </div>
          </div>
        ) : (
          <div className="content-container">
            {/* My Timelines Section */}
            <div className="timelines-section">
             
              
              {isLoading ? (
                <div className="loading-indicator">Laster tidslinjer...</div>
              ) : error ? (
                <div className="error-message">{error}</div>
              ) : timelines.length === 0 ? (
                <div className="empty-state-container">
                  <div className="empty-state">
                    <p>Du har ingen tidslinjer ennå.</p>
                    <button 
                      className="create-timeline-btn"
                      onClick={() => window.location.href = '/'}
                    >
                      Opprett tidslinje
                    </button>
                  </div>
                </div>
              ) : (
                <div className="timelines-full-grid">
                  {timelines.map(timeline => (
                    <div key={timeline.id} className="timeline-card">
                      <div className="timeline-card-header">
                        <div className="timeline-title-container">
                          <h3>{timeline.title}</h3>
                          <div className={`privacy-badge ${timeline.isPublic ? 'public' : 'private'}`}>
                            {timeline.isPublic ? <><PublicIcon />Offentlig</> : <><PrivateIcon />Privat</>}
                          </div>
                        </div>
                        <div className="timeline-header-actions">
                          <button 
                            className="icon-button edit"
                            onClick={() => handleLoadTimeline(timeline.id)}
                            title="Rediger"
                          >
                            <EditIcon />
                          </button>
                          <button 
                            className="icon-button delete"
                            onClick={() => handleDeleteTimeline(timeline.id)}
                            title="Slett"
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                      </div>
                      <div className="timeline-card-body">
                        <p className="timeline-dates">
                          {formatDate(timeline.start)} - {formatDate(timeline.end)}
                        </p>
                        <button 
                          className="view-timeline-btn"
                          onClick={() => window.location.href = `/?view=timeline&timelineId=${timeline.id}`}
                          title="Vis denne tidslinjen"
                        >
                          Gå til tidslinje
                        </button>
                      </div>
                      <div className="timeline-card-footer">
                        <div className="timeline-card-actions privacy-actions">
                          <button 
                            className={`privacy-toggle-btn ${timeline.isPublic ? 'public' : 'private'}`}
                            onClick={() => toggleTimelinePrivacy(timeline.id, timeline.isPublic)}
                          >
                            {timeline.isPublic ? 'Gjør privat' : 'Gjør offentlig'}
                          </button>
                          
                          {timeline.isPublic && (
                            <button 
                              className="share-btn"
                              onClick={() => openShareModal(timeline)}
                              title="Del tidslinje"
                            >
                              <ShareIcon /> Del
                            </button>
                          )}
                          
                          {showCopiedNotification === timeline.id && (
                            <div className="copy-success">Lenke kopiert!</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Shared Timelines Section */}
            {/* Shared Timelines Section */}
{/* Shared Timelines Section */}
<div className="timelines-section shared-section">
  <h2 className="section-title">Tidslinjer delt med meg</h2>
  
  {isLoadingShared ? (
    <div className="loading-indicator">Laster delte tidslinjer...</div>
  ) : sharedError ? (
    <div className="error-message">{sharedError}</div>
  ) : sharedTimelines.length === 0 ? (
    <div className="empty-state-container">
      <div className="empty-state">
        <p>Ingen tidslinjer er delt med deg ennå.</p>
      </div>
    </div>
  ) : (
    <div className="timelines-full-grid">
      {sharedTimelines.map(timeline => (
        <div key={timeline.id} className="timeline-card shared-timeline-card">
          <div className="timeline-card-header">
            <div className="timeline-title-container">
              <h3>{timeline.title} </h3>
              <div className="role-badge">
                {timeline.collaboratorRole === "editor" ? (
                  <><EditIcon /> Kan redigere</>
                ) : (
                  <><ViewIcon /> Kun visning</>
                )}
              </div>
              {/* Owner info - show email field directly 
              <div className="owner-info">
                Eier: {timeline.userEmail || timeline.userDisplayName || 'Anonym bruker'}
              </div>*/}
            </div>
            <div className="timeline-header-actions">
              {timeline.collaboratorRole === "editor" ? (
                <button 
                  className="icon-button edit"
                  onClick={() => handleLoadTimeline(timeline.id)}
                  title="Rediger"
                >
                  <EditIcon />
                </button>
              ) : null}
            </div>
          </div>
          <div className="timeline-card-body">
            <p className="timeline-dates">
              {formatDate(timeline.start)} - {formatDate(timeline.end)}
            </p>
            <button 
              className="view-timeline-btn"
              onClick={() => window.location.href = `/?view=timeline&timelineId=${timeline.id}`}
              title="Vis denne tidslinjen"
            >
              Gå til tidslinje
            </button>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
          </div>
        )}
        
        {/* Share Modal */}
        {shareModalOpen && selectedTimeline && (
          <TimelineShareModal
            timelineData={selectedTimeline}
            isOwner={true}
            onClose={() => setShareModalOpen(false)}
            isPublic={selectedTimeline.isPublic}
            onPrivacyChange={handlePrivacyChange}
          />
        )}
      </div>
    </Layout>
  );
}

export default MineTidslinjer;