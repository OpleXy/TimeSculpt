import { useState, useEffect } from 'react';
import { getPublicTimelines } from '../api';
import Layout from '../components/Layout';
import { setDocumentTitle } from '../services/documentTitleService';
import '../styles/pages/PublicTimelines.css'; // New CSS import
import '../styles/pages/layout.css'; // Common layout styles

function PublicTimelines() {
  const [timelines, setTimelines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Set document title when component mounts
  useEffect(() => {
    setDocumentTitle('Utforsk tidslinjer');
  }, []);

  // Load public timelines when component mounts
  useEffect(() => {
    fetchTimelines();
  }, []);

  const fetchTimelines = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await getPublicTimelines(20); // Get up to 20 public timelines
      setTimelines(data);
    } catch (err) {
      console.error('Error loading public timelines:', err);
      setError('Kunne ikke laste tidslinjer. Vennligst prøv igjen senere.');
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleOpenTimeline = (id) => {
    // Navigate to the timeline with this ID
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

  // Globe icon for public timelines
  const GlobeIcon = () => (
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

  return (
    <Layout>
      <div className="page-fullwidth-container">
        <h1 className="page-subtle-title">🌍 Utforsk historie</h1>
        
        <div className="content-container">
          {isLoading ? (
            <div className="loading-indicator">Laster tidslinjer...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : timelines.length === 0 ? (
            <div className="empty-state-container">
              <div className="empty-state">
                <p>Ingen offentlige tidslinjer er tilgjengelige for øyeblikket.</p>
                <p>Lag din egen tidslinje og del den med andre!</p>
                <button 
                  className="create-timeline-btn"
                  onClick={() => window.location.href = '/'}
                >
                  Opprett tidslinje
                </button>
              </div>
            </div>
          ) : (
            <>

              
              <div className="timelines-full-grid">
                {timelines.map(timeline => (
                  <div key={timeline.id} className="timeline-card public-timeline-card">
                    <div className="timeline-card-header">
                      <h3>{timeline.title}</h3>
                      <div className="privacy-badge public">
                        <GlobeIcon />Offentlig
                      </div>
                    </div>
                    <div className="timeline-card-body">
                      <p className="timeline-dates">
                        {formatDate(timeline.start)} - {formatDate(timeline.end)}
                      </p>{/*
                      <p className="timeline-creator">
                        Laget av: {timeline.userDisplayName}
                      </p>*/}
                    </div>
                    <div className="timeline-card-footer">
                      <button 
                        className="view-timeline-btn"
                        onClick={() => handleOpenTimeline(timeline.id)}
                      >
                        Vis tidslinje
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default PublicTimelines;