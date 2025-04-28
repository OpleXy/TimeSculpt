// src/components/auth/UserProfile.jsx
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { logOut } from '../../firebase.js';

function UserProfile({ onLogin }) {
  const { currentUser, isAuthenticated } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  
  const handleLogout = async () => {
    try {
      await logOut();
    } catch (err) {
      console.error('Kunne ikke logge ut:', err);
    }
  };
  
  if (!isAuthenticated) {
    return (
      <div className="user-profile">
        <button onClick={onLogin} className="login-button">
          Logg inn
        </button>
      </div>
    );
  }
  
  return (
    <div className="user-profile">
      {currentUser.photoURL && (
        <div className="user-avatar">
          <img src={currentUser.photoURL} alt={currentUser.displayName || "Bruker"} />
        </div>
      )}
      <div className="user-info">
        {currentUser.displayName && (
          <div className="user-name">
            {currentUser.displayName}
          </div>
        )}
        <div className="user-email">
          {currentUser.email}
        </div>
      </div>
      <div className="user-actions">
        <button 
          onClick={toggleDarkMode} 
          className="theme-toggle-profile-btn"
          title={darkMode ? "Bytt til lys modus" : "Bytt til mørk modus"}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
        <button onClick={handleLogout} className="logout-button">
          Logg ut
        </button>
      </div>
    </div>
  );
}

export default UserProfile;