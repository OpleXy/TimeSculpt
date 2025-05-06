import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Layout from '../components/Layout';
import { updateProfile } from 'firebase/auth';
import { setDocumentTitle } from '../services/documentTitleService';
import '../styles/pages/MinProfil.css'; // New CSS import
import '../styles/pages/layout.css'; // Common layout styles

function MinProfil() {
  const { isAuthenticated, currentUser } = useAuth();
  const { darkMode, toggleDarkMode, synced } = useTheme();
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameUpdateStatus, setUsernameUpdateStatus] = useState(null); // 'success', 'error', or null

  // Set document title when component mounts
  useEffect(() => {
    setDocumentTitle('Min profil');
  }, []);

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  // Start editing mode
  const handleUsernameClick = () => {
    setNewUsername(currentUser?.displayName || '');
    setIsEditingUsername(true);
    setUsernameUpdateStatus(null);
  };

  // Save username on blur or Enter key
  const handleUsernameChange = async (e) => {
    // If Enter key is pressed
    if (e.key === 'Enter') {
      saveUsername();
    }
  };

  // Save username on blur
  const handleUsernameBlur = () => {
    saveUsername();
  };

  // Function to save username
  const saveUsername = async () => {
    if (!currentUser || !newUsername.trim()) {
      setIsEditingUsername(false);
      return;
    }
    
    try {
      await updateProfile(currentUser, {
        displayName: newUsername.trim()
      });
      setIsEditingUsername(false);
      setUsernameUpdateStatus('success');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setUsernameUpdateStatus(null);
      }, 3000);
    } catch (error) {
      console.error('Error updating username:', error);
      setUsernameUpdateStatus('error');
      setIsEditingUsername(false);
    }
  };

  // Determine auth providers used
  const getAuthProviders = () => {
    if (!currentUser || !currentUser.providerData) return [];
    
    return currentUser.providerData.map(provider => provider.providerId);
  };

  // Get appropriate icon for the provider
  const getProviderIcon = (providerId) => {
    switch(providerId) {
      case 'google.com':
        return (
          <div className="auth-provider-icon google" title="Google">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
            </svg>
          </div>
        );
      case 'facebook.com':
        return (
          <div className="auth-provider-icon facebook" title="Facebook">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M20.007,3H3.993C3.445,3,3,3.445,3,3.993v16.013C3,20.555,3.445,21,3.993,21h8.621v-6.971h-2.346v-2.717h2.346V9.31c0-2.325,1.42-3.591,3.494-3.591c0.993,0,1.847,0.074,2.096,0.107v2.43l-1.438,0.001c-1.128,0-1.346,0.536-1.346,1.323v1.734h2.69l-0.35,2.717h-2.34V21h4.587C20.555,21,21,20.555,21,20.007V3.993C21,3.445,20.555,3,20.007,3z" />
            </svg>
          </div>
        );
      case 'password':
      case 'email':
        return (
          <div className="auth-provider-icon email" title="Email/Password">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M20,4H4C2.9,4,2,4.9,2,6v12c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V6C22,4.9,21.1,4,20,4z M20,8l-8,5L4,8V6l8,5l8-5V8z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="auth-provider-icon generic" title="Other Sign-in Method">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M12,12H19C18.47,16.11 15.72,19.78 12,20.92V12H5V6.3L12,3.19M12,1L3,5V11C3,16.55 6.84,21.73 12,23C17.16,21.73 21,16.55 21,11V5L12,1Z" />
            </svg>
          </div>
        );
    }
  };

  const authProviders = isAuthenticated ? getAuthProviders() : [];

  return (
    <Layout>
      <div className="profile-page-container">
        <h1 className="profile-page-title">👤 Min profil</h1>
        
        {!isAuthenticated ? (
          <div className="auth-required-message">
            <p>Du må være logget inn for å se din profil.</p>
          </div>
        ) : (
          <div className="profile-full-container">
            <div className="profile-main-section">
              <div className="profile-header">
                <div className="profile-avatar-large">
                  {currentUser?.photoURL ? (
                    <img src={currentUser.photoURL} alt={currentUser.displayName || 'Bruker'} />
                  ) : (
                    <div className="avatar-initials-large">
                      {getInitials(currentUser?.displayName || currentUser?.email)}
                    </div>
                  )}
                </div>
                
                <div className="profile-info-large">
                  <h2>{currentUser?.displayName || 'Bruker'}</h2>
                  <p className="profile-email">{currentUser?.email}</p>
                </div>
                
                {/* Auth provider icons */}
                <div className="profile-auth-providers">
                  {authProviders.map((provider, index) => (
                    <div key={index} className="auth-provider">
                      {getProviderIcon(provider)}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="profile-details-section">
                <h3 className="profile-section-title">Brukerinformasjon</h3>
                <div className="profile-details-list">
                  <div className="detail-item">
                    <div className="detail-label">Brukernavn</div>
                    <div className="detail-value">
                      {isEditingUsername ? (
                        <input
                          type="text"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          onKeyDown={handleUsernameChange}
                          onBlur={handleUsernameBlur}
                          className="username-edit-input"
                          autoFocus
                          placeholder="Angi brukernavn"
                        />
                      ) : (
                        <div className="editable-username" onClick={handleUsernameClick}>
                          {currentUser?.displayName || 'Ikke angitt'}
                          <span className="edit-icon" title="Klikk for å redigere">
                            <svg viewBox="0 0 24 24" width="14" height="14">
                              <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                            </svg>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {usernameUpdateStatus && (
                    <div className={`username-update-message ${usernameUpdateStatus}`}>
                      {usernameUpdateStatus === 'success' 
                        ? 'Brukernavnet ble oppdatert!' 
                        : 'Kunne ikke oppdatere brukernavn. Prøv igjen senere.'}
                    </div>
                  )}
                  
                  <div className="detail-item">
                    <div className="detail-label">E-post</div>
                    <div className="detail-value">{currentUser?.email}</div>
                  </div>
                  
                  <div className="detail-item">
                    <div className="detail-label">Konto opprettet</div>
                    <div className="detail-value">{currentUser?.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleString() : 'Ikke tilgjengelig'}</div>
                  </div>
                  
                  {/* Show login methods */}
                  <div className="detail-item">
                    <div className="detail-label">Innloggingsmetoder</div>
                    <div className="detail-value">
                      <div className="auth-methods-list">
                        {authProviders.length > 0 ? 
                          authProviders.map((provider, index) => (
                            <span key={index} className="auth-method-name">
                              {provider === 'google.com' ? 'Google' : 
                               provider === 'facebook.com' ? 'Facebook' : 
                               provider === 'twitter.com' ? 'Twitter/X' : 
                               provider === 'github.com' ? 'GitHub' : 
                               provider === 'apple.com' ? 'Apple' : 
                               provider === 'phone' ? 'Telefon' : 
                               provider === 'password' || provider === 'email' ? 'E-post/passord' : 
                               'Annen metode'}
                              {index < authProviders.length - 1 ? ', ' : ''}
                            </span>
                          ))
                          : 'Ingen informasjon tilgjengelig'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="profile-sidebar">
              <div className="profile-membership-card">
                <h3>✨ Opp til 10 tidslinjer</h3>
                <p className="membership-info">
                  Du har tilgang til å lage opptil <strong>10 tidslinjer</strong> i din konto. Trenger du flere eller har du spørsmål? Vi er her for å hjelpe:
                </p>
                <div className="membership-actions">
                  <a
                    href="mailto:timesculpt.post@gmail.com"
                    className="upgrade-btn full-width"
                  >
                    📩 Kontakt oss
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default MinProfil;