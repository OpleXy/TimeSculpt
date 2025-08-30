import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { updateUserTheme } from '../userAPI';
import Layout from '../components/Layout';
import { setDocumentTitle } from '../services/documentTitleService';
import '../styles/pages/Innstillinger.css';

function Innstillinger() {
  const { isAuthenticated, currentUser } = useAuth();
  const { darkMode, toggleDarkMode, synced } = useTheme();
  const [settings, setSettings] = useState({
    language: 'no'
  });
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    setDocumentTitle('Innstillinger');
  }, []);

  const handleToggleChange = async (setting) => {
    if (setting === 'darkMode') {
      toggleDarkMode();
      
      if (isAuthenticated && currentUser) {
        try {
          await updateUserTheme(!darkMode, currentUser.uid);
          showSavedMessage('Tema-innstilling lagret til din profil');
        } catch (err) {
          console.error('Kunne ikke lagre tema:', err);
          showSavedMessage('Kunne ikke lagre til profil, bruker lokal innstilling');
        }
      } else {
        showSavedMessage('Tema-innstilling oppdatert (lokal)');
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

  const showSavedMessage = (message) => {
    setSavedMessage(message);
    setTimeout(() => setSavedMessage(''), 3000);
  };

  return (
    <Layout>
      <div className="page-fullwidth-container">
        <h1 className="page-subtle-title">⚙️ Innstillinger</h1>
        
        <div className="content-container">
          {!isAuthenticated && (
            <div className="auth-notification-message">
              <p>
                <strong>Merk:</strong> Du er ikke logget inn. Endringer vil kun gjelde for denne enheten.
                <br />
                <a href="#" onClick={() => document.querySelector('[data-testid="login-button"]')?.click()}>
                  Logg inn
                </a> for å lagre preferanser på tvers av enheter.
              </p>
            </div>
          )}
          
          <div className="settings-container">
            <div className="settings-form">
              <div className="settings-section">
                <div className="setting-item">
                  <div className="setting-label">
                    <label htmlFor="darkMode">🌓 Mørk modus</label>
                    <p className="setting-description">
                      Aktiver mørkt tema for applikasjonen
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
                
                <div className="setting-item">
                  <div className="setting-label">
                    <label htmlFor="language">🌍 Velg språk</label>
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
        </div>
        
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