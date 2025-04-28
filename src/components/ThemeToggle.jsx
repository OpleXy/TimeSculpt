// src/components/ThemeToggle.jsx
import React from 'react';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

function ThemeToggle() {
  const { darkMode, toggleDarkMode, synced } = useTheme();
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="theme-toggle">
      <button 
        onClick={toggleDarkMode} 
        className="theme-toggle-btn"
        title={darkMode ? "Bytt til lys modus" : "Bytt til mørk modus"}
        aria-label={darkMode ? "Bytt til lys modus" : "Bytt til mørk modus"}
      >
        {darkMode ? (
          <span role="img" aria-hidden="true">☀️</span>
        ) : (
          <span role="img" aria-hidden="true">🌙</span>
        )}
      </button>
      
      {isAuthenticated && synced && (
        <span className="theme-sync-indicator" title="Temaet er synkronisert med din konto">
          <span role="img" aria-hidden="true">🔄</span>
        </span>
      )}
    </div>
  );
}

export default ThemeToggle;