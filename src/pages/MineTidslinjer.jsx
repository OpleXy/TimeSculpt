import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { loadTimelineList, deleteTimeline } from '../api';
import Layout from '../components/Layout';
import { setDocumentTitle } from '../services/documentTitleService'; // Import the service

function MineTidslinjer() {
  const [timelines, setTimelines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated, currentUser } = useAuth();

  // Set document title when component mounts
  useEffect(() => {
    setDocumentTitle('Mine tidslinjer');
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTimelines();
    } else {
      setTimelines([]);
      setIsLoading(false);
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

  // Format date to display in a user-friendly format
  const formatDate = (date) => {
    if (!date) return '';
    
    return new Date(date).toLocaleDateString('no-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Layout>
      <div className="page-fullwidth-container">
        <h1 className="page-subtle-title">🗂️ Mine tidslinjer</h1>
        
        {!isAuthenticated ? (
          <div className="auth-centered-content">
            <div className="auth-required-message">
              <p>Du må være logget inn for å se dine tidslinjer.</p>
            </div>
          </div>
        ) : (
          <div className="content-container">
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
                      <h3>{timeline.title}</h3>
                    </div>
                    <div className="timeline-card-body">
                      <p className="timeline-dates">
                        {formatDate(timeline.start)} - {formatDate(timeline.end)}
                      </p>
                    </div>
                    <div className="timeline-card-footer">
                      <button 
                        className="edit-btn"
                        onClick={() => handleLoadTimeline(timeline.id)}
                      >
                        Rediger
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteTimeline(timeline.id)}
                      >
                        Slett
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default MineTidslinjer;