import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { updateUserTheme } from '../userAPI'; // Import directly for debugging
import Layout from '../components/Layout';
import { setDocumentTitle } from '../services/documentTitleService'; // Import the service

function Innstillinger() {
  const { isAuthenticated, currentUser } = useAuth();
  const { darkMode, toggleDarkMode, synced } = useTheme();
  const [settings, setSettings] = useState({
    language: 'no'
  });
  const [savedMessage, setSavedMessage] = useState('');
  const [saveAttempt, setSaveAttempt] = useState(0);

  // Set document title when component mounts
  useEffect(() => {
    setDocumentTitle('Innstillinger');
    
    // This ensures settings reflect any stored preferences
  }, [darkMode]);

  // Debug: Let's verify the toggle is actually working
  useEffect(() => {
    console.log('Innstillinger render state:', { 
      isAuthenticated, 
      hasCurrentUser: !!currentUser,
      currentUserId: currentUser?.uid,
      darkMode, 
      synced,
      saveAttempt
    });
  }, [isAuthenticated, currentUser, darkMode, synced, saveAttempt]);

  const handleToggleChange = async (setting) => {
    if (setting === 'darkMode') {
      console.log('Toggle clicked, current state:', darkMode);
      
      // Use the context's toggle function
      toggleDarkMode();
      
      // Also force a direct update to Firebase for debugging
      if (isAuthenticated && currentUser) {
        try {
          console.log('Directly saving theme to Firebase:', !darkMode);
          await updateUserTheme(!darkMode, currentUser.uid);
          console.log('Direct save successful');
        } catch (err) {
          console.error('Direct save failed:', err);
        }
      }
      
      setSaveAttempt(prev => prev + 1);
      
      if (isAuthenticated) {
        showSavedMessage('Tema-innstilling oppdatert og lagret til din profil');
      } else {
        showSavedMessage('Tema-innstilling oppdatert');
      }
    }
  };

  const handleLanguageChange = (e) => {
    setSettings(prev => ({
      ...prev,
      language: e.target.value
    }));
    showSavedMessage('Språk oppdatert');
  };

  const showSavedMessage = (message = 'Innstillinger oppdatert') => {
    setSavedMessage(message);
    
    // Clear message after 3 seconds
    setTimeout(() => {
      setSavedMessage('');
    }, 3000);
  };

  return (
    <Layout>
      <div className="page-fullwidth-container">
        <h1 className="page-subtle-title">⚙️ Innstillinger</h1>
        
        {!isAuthenticated ? (
          <div className="content-container">
            <div className="auth-notification-message">
              <p>
                <strong>Merk:</strong> Du er ikke logget inn. Endringer i innstillinger vil kun gjelde for denne enheten og denne nettleseren.
                <br />
                <a href="#" onClick={() => document.querySelector('[data-testid="login-button"]')?.click()}>
                  Logg inn
                </a> for å lagre dine preferanser på tvers av enheter.
              </p>
            </div>
            
            <div className="settings-form">
              <div className="settings-section">
                <h2>🌓 Utseende</h2>
                
                <div className="setting-item">
                  <div className="setting-label">
                    <label htmlFor="darkMode">Mørk modus</label>
                    <p className="setting-description">
                      Bytt til mørkt tema for applikasjonen
                    </p>
                  </div>
                  <div className="setting-control">
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        id="darkMode"
                        checked={darkMode}
                        onChange={() => handleToggleChange('darkMode')}
                      />
                      <label htmlFor="darkMode"></label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="settings-section">
                <h2>🌍 Språk</h2>
                
                <div className="setting-item">
                  <div className="setting-label">
                    <label htmlFor="language">Velg språk</label>
                    <p className="setting-description">
                      Endre språket for brukergrensesnittet
                    </p>
                  </div>
                  <div className="setting-control">
                    <select
                      id="language"
                      value={settings.language}
                      onChange={handleLanguageChange}
                      className="language-select"
                    >
                      <option value="no">Norsk</option>
                      <option value="en">English</option>
                      <option value="sv">Svenska</option>
                      <option value="da">Dansk</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="content-container">
            <div className="settings-form">
              <div className="settings-section">
                <h2>🌓 Utseende</h2>
                
                <div className="setting-item">
                  <div className="setting-label">
                    <label htmlFor="darkMode">Mørk modus</label>
                    <p className="setting-description">
                      Bytt til mørkt tema for applikasjonen
                    </p>
                  </div>
                  <div className="setting-control">
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        id="darkMode"
                        checked={darkMode}
                        onChange={() => handleToggleChange('darkMode')}
                      />
                      <label htmlFor="darkMode"></label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="settings-section">
                <h2>🌍 Språk</h2>
                
                <div className="setting-item">
                  <div className="setting-label">
                    <label htmlFor="language">Velg språk</label>
                    <p className="setting-description">
                      Endre språket for brukergrensesnittet
                    </p>
                  </div>
                  <div className="setting-control">
                    <select
                      id="language"
                      value={settings.language}
                      onChange={handleLanguageChange}
                      className="language-select"
                    >
                      <option value="no">Norsk</option>
                      <option value="en">English</option>
                      <option value="sv">Svenska</option>
                      <option value="da">Dansk</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {savedMessage && (
          <div className="floating-message">
            <div className="save-message success">
              {savedMessage}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Innstillinger;