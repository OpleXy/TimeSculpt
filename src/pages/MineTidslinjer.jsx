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
    setDocumentTitle('Mine tidslinjer');
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

  const handleDeleteTimeline = async (id, e) => {
    e.stopPropagation(); // Forhindre at klikket på slett-knappen trigger kortets onClick
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

  const handleViewTimeline = (id, view = 'timeline') => {
    window.location.href = `/?view=${view}&timelineId=${id}`;
  };

  // Toggle privacy for a timeline
  const toggleTimelinePrivacy = async (id, currentPrivacy, e) => {
    if (e) e.stopPropagation(); // Forhindre at klikket på personvern-knappen trigger kortets onClick
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
  const copyShareUrl = (id, e) => {
    if (e) e.stopPropagation(); // Forhindre at klikket på del-knappen trigger kortets onClick
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
  const openShareModal = (timeline, e) => {
    if (e) e.stopPropagation(); // Forhindre at klikket på del-knappen trigger kortets onClick
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
      style={{ marginRight: '4px' }}
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
      style={{ marginRight: '4px' }}
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

  return (
    <Layout>
      <div className="page-fullwidth-container">
        <div className="page-header-with-action">
          <h1 className="page-subtle-title">🗂️ Mine tidslinjer</h1>
        </div>
        
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
                    <div 
                      key={timeline.id} 
                      className="timeline-card clickable-card"
                      onClick={() => handleViewTimeline(timeline.id)}
                    >
                      <div className="timeline-card-content">
                        <div className="timeline-card-top">
                          <h3>{timeline.title}</h3>
                          <button 
                            className="icon-button delete"
                            onClick={(e) => handleDeleteTimeline(timeline.id, e)}
                            title="Slett"
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                        
                        <p className="timeline-dates">
                          {formatDate(timeline.start)} - {formatDate(timeline.end)}
                        </p>
                        
                        <div className="timeline-card-actions">
                          <button 
                            className={`privacy-toggle-btn ${timeline.isPublic ? 'public' : 'private'}`}
                            onClick={(e) => toggleTimelinePrivacy(timeline.id, timeline.isPublic, e)}
                          >
                            {timeline.isPublic ? (
                              <><PublicIcon /> Offentlig</>
                            ) : (
                              <><PrivateIcon /> Privat</>
                            )}
                          </button>
                          
                          {/* Share button is now always visible */}
                          <button 
                            className="share-btn"
                            onClick={(e) => openShareModal(timeline, e)}
                            title="Del tidslinje"
                          >
                            <ShareIcon />
                          </button>
                          
                          {showCopiedNotification === timeline.id && (
                            <div className="copy-success">Kopiert!</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Shared Timelines Section */}
            <div className="timelines-section shared-section">
              <h2 className="section-title">Delt med meg</h2>
              
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
                    <div 
                      key={timeline.id} 
                      className="timeline-card shared-timeline-card clickable-card"
                      onClick={() => handleViewTimeline(timeline.id)}
                    >
                      <div className="timeline-card-content">
                        <div className="timeline-card-top">
                          <h3>{timeline.title}</h3>
                          <div className="role-badge">
                            {timeline.collaboratorRole === "editor" ? "Kan redigere" : "Kun visning"}
                          </div>
                        </div>
                        
                        <p className="timeline-dates">
                          {formatDate(timeline.start)} - {formatDate(timeline.end)}
                        </p>
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