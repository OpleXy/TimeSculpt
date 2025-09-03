import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '../components/auth/AuthModal';
import Topbar from './topbar/Topbar'; // Import the Topbar component
import '../styles/darkMode.css'; // Import dark mode styles

function Layout({ children }) {
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  // Create dummy props to pass to Topbar that match the ones in App.jsx
  const dummyTimelineData = {
    title: '',
    events: [],
    start: null,
    end: null
  };

  // Dummy handlers for topbar actions that navigate rather than modify state
  const handleCreateTimeline = () => {
    navigate('/');
  };

  const handleLoadTimeline = (timeline) => {
    navigate(`/?timelineId=${timeline.id}`);
  };

  return (
    <div className="app-container">
      {/* Use the same Topbar component as in App.jsx */}
      <Topbar
        timelineData={dummyTimelineData}
        onLogin={openAuthModal}
        onLoadTimeline={handleLoadTimeline}
        onCreateTimeline={handleCreateTimeline}
        onUpdateTimeline={() => {}}
        onSaveTimeline={() => {}}
        hasUnsavedChanges={false}
      />
      
      <main className="main-content main-content-with-topbar">
        {children}
      </main>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={closeAuthModal} 
      />
    </div>
  );
}

export default Layout;