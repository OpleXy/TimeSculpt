// src/components/topbar/Topbar.jsx (Refaktorert hovedkomponent)
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TopbarLeft from './TopbarLeft';
import TopbarCenter from './TopbarCenter';
import TopbarRight from './TopbarRight';
import TopbarTimelineActions from './TopbarTimelineActions';

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
  lastSaved 
}) {
  const location = useLocation();
  const { isAuthenticated, currentUser } = useAuth();
  
  // Check if we're on the main timeline page
  const isTimelinePage = location.pathname === '/';
  
  // Check if a timeline is actively being displayed
  const isTimelineActive = isTimelinePage && timelineData && timelineData.title;
  
  // Check if user is the owner of the timeline
  const isTimelineOwner = timelineData && currentUser && timelineData.userId === currentUser.uid;

  return (
    <div className="topbar">
      <div className="topbar-left">
        <TopbarLeft 
          onCreateTimeline={onCreateTimeline}
          hasUnsavedChanges={hasUnsavedChanges}
          buttonHeight="36px"
        />
      </div>
      
      <div className="topbar-center">
        <TopbarCenter 
          timelineData={timelineData}
          onUpdateTimeline={onUpdateTimeline}
          isPublic={isPublic}
          onPrivacyChange={onPrivacyChange}
          currentUser={currentUser}
          isTimelineOwner={isTimelineOwner}
        />
      </div>
      
      <div className="topbar-right">
        <TopbarTimelineActions 
          timelineData={timelineData}
          hasUnsavedChanges={hasUnsavedChanges}
          lastSaved={lastSaved}
          onSaveTimeline={onSaveTimeline}
          isTimelineOwner={isTimelineOwner}
          isAuthenticated={isAuthenticated}
          isPublic={isPublic}
          onPrivacyChange={onPrivacyChange}
        />
        
        <TopbarRight 
          isAuthenticated={isAuthenticated}
          currentUser={currentUser}
          onLogin={onLogin}
        />
      </div>
    </div>
  );
}

export default Topbar;