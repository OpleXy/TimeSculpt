import { useState, useEffect } from 'react';
import { loadTimelineList, deleteTimeline, loadTimeline } from '../api';
import { useAuth } from '../contexts/AuthContext';

function TimelineList({ onLoadTimeline, hasUnsavedChanges, refreshTrigger = 0 }) {
  const [timelineItems, setTimelineItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();

  // Load timelines when component mounts, auth-status changes, or refreshTrigger is updated
  useEffect(() => {
    async function fetchTimelines() {
      if (!isAuthenticated) {
        setTimelineItems([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const timelines = await loadTimelineList();
        setTimelineItems(timelines);
      } catch (err) {
        console.error('Feil ved lasting av tidslinjer:', err);
        setError('Kunne ikke laste tidslinjer');
      } finally {
        setLoading(false);
      }
    }

    fetchTimelines();
  }, [isAuthenticated, refreshTrigger]);

  const handleLoadTimeline = async (timelineId) => {
    // Check for unsaved changes
    if (hasUnsavedChanges) {
      const confirmLoad = window.confirm(
        'Du har ulagrede endringer. Er du sikker på at du vil laste en annen tidslinje? Ulagrede endringer vil gå tapt.'
      );
      
      if (!confirmLoad) {
        return; // User cancelled, don't load the new timeline
      }
    }
    
    try {
      setLoading(true);
      setError('');
      const timelineData = await loadTimeline(timelineId);
      
      if (onLoadTimeline && typeof onLoadTimeline === 'function') {
        onLoadTimeline(timelineData);
      }
    } catch (err) {
      console.error('Feil ved lasting av tidslinje:', err);
      setError('Kunne ikke laste tidslinjen');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTimeline = async (e, timelineId) => {
    e.stopPropagation(); // Prevent triggering the parent click (load)
    
    if (!confirm('Er du sikker på at du vil slette denne tidslinjen?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      await deleteTimeline(timelineId);
      
      // Update timeline list after deletion
      const updatedTimelines = await loadTimelineList();
      setTimelineItems(updatedTimelines);
    } catch (err) {
      console.error('Feil ved sletting av tidslinje:', err);
      setError('Kunne ikke slette tidslinjen');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAll = () => {
    // Navigate to Mine Tidslinjer page
    window.location.href = '/mine-tidslinjer';
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading && timelineItems.length === 0) {
    return (
      <div className="timeline-list">
        <h3>Mine tidslinjer</h3>
        <div className="timeline-list-scrollable">
          <p>Laster tidslinjer...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="timeline-list">
        <h3>Mine tidslinjer</h3>
        <div className="timeline-list-scrollable">
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  // Show timeline limit information
  const renderTimelineLimit = () => {
    const count = timelineItems.length;
    const limitReached = count >= 3;
    
    return (
      <div className="timeline-limit-indicator">
        <div className="timeline-limit-count">
          <strong>{count} av 3</strong> tidslinjer brukt
        </div>
        <div className="timeline-limit-progress">
          <div className={`timeline-limit-bar ${limitReached ? 'limit-reached' : ''}`} 
            style={{ width: `${(count / 3) * 100}%` }}>
          </div>
        </div>
      </div>
    );
  };

  // If no timelines, return empty state
  if (timelineItems.length === 0) {
    return (
      <div className="timeline-list">
        <h3>Mine tidslinjer</h3>
        {renderTimelineLimit()}
        <div className="timeline-empty">
          Ingen tidslinjer funnet
        </div>
      </div>
    );
  }

  // Format date for display
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="timeline-list">
      <h3>
        Mine tidslinjer
        <button className="view-all-btn" onClick={handleViewAll}>
          Se alle
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="12" 
            height="12" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </h3>
      {renderTimelineLimit()}
      <div className="timeline-list-scrollable">
        {timelineItems.map(timeline => (
          <div 
            className="timeline-item" 
            key={timeline.id}
            onClick={() => handleLoadTimeline(timeline.id)}
            title="Last tidslinje"
          >
            <button
              className="delete-btn-subtle" 
              onClick={(e) => handleDeleteTimeline(e, timeline.id)}
              title="Slett tidslinje"
            >
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
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="timeline-item-header">
              <div className="timeline-title">{timeline.title}</div>
            </div>
            
            <div className="timeline-date">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              {formatDate(timeline.start)} - {formatDate(timeline.end)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TimelineList;