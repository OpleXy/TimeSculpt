import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Layout from '../components/Layout';
import { updateProfile } from 'firebase/auth';
import { setDocumentTitle } from '../services/documentTitleService';

function MinProfil() {
  const { isAuthenticated, currentUser } = useAuth();
  const { darkMode } = useTheme();
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameUpdateStatus, setUsernameUpdateStatus] = useState(null);

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

  const handleUsernameClick = () => {
    setNewUsername(currentUser?.displayName || '');
    setIsEditingUsername(true);
    setUsernameUpdateStatus(null);
  };

  const handleUsernameChange = async (e) => {
    if (e.key === 'Enter') {
      saveUsername();
    }
  };

  const handleUsernameBlur = () => {
    saveUsername();
  };

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
      
      setTimeout(() => {
        setUsernameUpdateStatus(null);
      }, 3000);
    } catch (error) {
      console.error('Error updating username:', error);
      setUsernameUpdateStatus('error');
      setIsEditingUsername(false);
    }
  };

  const getAuthProviders = () => {
    if (!currentUser || !currentUser.providerData) return [];
    return currentUser.providerData.map(provider => provider.providerId);
  };

  const getProviderIcon = (providerId) => {
    switch(providerId) {
      case 'google.com':
        return (
          <div style={authProviderIconStyle} className={darkMode ? 'auth-provider-icon dark google' : 'auth-provider-icon google'} title="Google">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
            </svg>
          </div>
        );
      case 'facebook.com':
        return (
          <div style={authProviderIconStyle} className={darkMode ? 'auth-provider-icon dark facebook' : 'auth-provider-icon facebook'} title="Facebook">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M20.007,3H3.993C3.445,3,3,3.445,3,3.993v16.013C3,20.555,3.445,21,3.993,21h8.621v-6.971h-2.346v-2.717h2.346V9.31c0-2.325,1.42-3.591,3.494-3.591c0.993,0,1.847,0.074,2.096,0.107v2.43l-1.438,0.001c-1.128,0-1.346,0.536-1.346,1.323v1.734h2.69l-0.35,2.717h-2.34V21h4.587C20.555,21,21,20.555,21,20.007V3.993C21,3.445,20.555,3,20.007,3z" />
            </svg>
          </div>
        );
      case 'password':
      case 'email':
        return (
          <div style={authProviderIconStyle} className={darkMode ? 'auth-provider-icon dark email' : 'auth-provider-icon email'} title="Email/Password">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M20,4H4C2.9,4,2,4.9,2,6v12c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V6C22,4.9,21.1,4,20,4z M20,8l-8,5L4,8V6l8,5l8-5V8z" />
            </svg>
          </div>
        );
      default:
        return (
          <div style={authProviderIconStyle} className={darkMode ? 'auth-provider-icon dark generic' : 'auth-provider-icon generic'} title="Other Sign-in Method">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M12,12H19C18.47,16.11 15.72,19.78 12,20.92V12H5V6.3L12,3.19M12,1L3,5V11C3,16.55 6.84,21.73 12,23C17.16,21.73 21,16.55 21,11V5L12,1Z" />
            </svg>
          </div>
        );
    }
  };

  const authProviders = isAuthenticated ? getAuthProviders() : [];

  // Inline styles
  const containerStyle = {
    width: '100%',
    maxWidth: '100%',
    padding: '0',
    margin: '0',
    marginTop: '60px',
    minHeight: 'calc(100vh - 60px)',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: darkMode ? '#121212' : '#f8f9fa',
    overflowY: 'auto'
  };

  const titleStyle = {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: darkMode ? '#e0e0e0' : '#333',
    padding: '1.5rem 5%',
    margin: '0',
    backgroundColor: 'transparent',
    borderBottom: darkMode ? '1px solid #333' : '1px solid #eaeaea'
  };

  const widgetStyle = {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '0 5%',
    width: '100%'
  };

  const contentStyle = {
    backgroundColor: darkMode ? '#1e1e1e' : 'white',
    borderRadius: '12px',
    padding: '2rem',
    boxShadow: darkMode ? '0 4px 20px rgba(0, 0, 0, 0.15)' : '0 4px 20px rgba(0, 0, 0, 0.08)',
    display: 'flex',
    position: 'relative',
    gap: '1.5rem'
  };

  const avatarStyle = {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    overflow: 'hidden',
    backgroundColor: darkMode ? '#2a2a2a' : '#e9ecef',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: '0'
  };

  const initialsStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.8rem',
    fontWeight: '600',
    color: darkMode ? '#aaa' : '#6c757d',
    backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa'
  };

  const infoStyle = {
    flex: '1'
  };

  const nameRowStyle = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.5rem'
  };

  const nameStyle = {
    margin: '0',
    fontSize: '1.5rem',
    color: darkMode ? '#f1f1f1' : '#333',
    fontWeight: '700',
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'color 0.2s ease'
  };

  const emailStyle = {
    fontSize: '0.95rem',
    color: darkMode ? '#adb5bd' : '#777',
    margin: '0 0 1rem 0'
  };

  const detailStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.5rem'
  };

  const editIconStyle = {
    opacity: '0.5',
    marginLeft: '8px',
    transition: 'opacity 0.2s ease'
  };

  const inputStyle = {
    padding: '8px 12px',
    border: darkMode ? '1px solid #444' : '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '1.1rem',
    backgroundColor: darkMode ? '#2a2a2a' : 'white',
    color: darkMode ? '#f1f1f1' : '#333',
    width: '100%',
    maxWidth: '300px'
  };

  const messageStyle = {
    padding: '8px 12px',
    marginTop: '10px',
    borderRadius: '6px',
    fontSize: '0.9rem',
    animation: 'fadeIn 0.3s ease'
  };

  const successMessageStyle = {
    ...messageStyle,
    backgroundColor: darkMode ? 'rgba(25, 135, 84, 0.15)' : '#d4edda',
    color: darkMode ? '#75b798' : '#155724'
  };

  const errorMessageStyle = {
    ...messageStyle,
    backgroundColor: darkMode ? 'rgba(220, 53, 69, 0.15)' : '#f8d7da',
    color: darkMode ? '#ea868f' : '#721c24'
  };

  const authEmblemStyle = {
    position: 'absolute',
    top: '1.2rem',
    right: '1.2rem',
    display: 'flex',
    gap: '6px'
  };

  const authProviderEmblemStyle = {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
    boxShadow: darkMode ? '0 2px 4px rgba(0, 0, 0, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
    color: darkMode ? '#e0e0e0' : '#555'
  };

  const authProviderIconStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const labelStyle = {
    fontWeight: '600',
    color: darkMode ? '#aaa' : '#777',
    fontSize: '0.9rem'
  };

  const valueStyle = {
    fontSize: '0.9rem',
    color: darkMode ? '#e0e0e0' : '#333'
  };

  const authRequiredStyle = {
    backgroundColor: darkMode ? '#1e1e1e' : 'white',
    borderRadius: '12px',
    padding: '3rem',
    textAlign: 'center',
    color: darkMode ? '#adb5bd' : '#6c757d',
    margin: '3rem auto',
    maxWidth: '500px',
    boxShadow: darkMode ? '0 2px 10px rgba(0, 0, 0, 0.2)' : '0 2px 10px rgba(0, 0, 0, 0.05)'
  };

  return (
    <Layout>
      <div style={containerStyle}>
        <h1 style={titleStyle}>Min profil</h1>
        
        {!isAuthenticated ? (
          <div style={authRequiredStyle}>
            <p>Du må være logget inn for å se din profil.</p>
          </div>
        ) : (
          <div style={widgetStyle}>
            <div style={contentStyle}>
              <div style={avatarStyle}>
                {currentUser?.photoURL ? (
                  <img src={currentUser.photoURL} alt={currentUser.displayName || 'Bruker'} />
                ) : (
                  <div style={initialsStyle}>
                    {getInitials(currentUser?.displayName || currentUser?.email)}
                  </div>
                )}
              </div>
              
              <div style={infoStyle}>
                <div style={nameRowStyle}>
                  {isEditingUsername ? (
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      onKeyDown={handleUsernameChange}
                      onBlur={handleUsernameBlur}
                      style={inputStyle}
                      autoFocus
                      placeholder="Angi brukernavn"
                    />
                  ) : (
                    <h2 onClick={handleUsernameClick} style={nameStyle}>
                      {currentUser?.displayName || 'Bruker'}
                      <span style={editIconStyle}>
                        <svg viewBox="0 0 24 24" width="14" height="14">
                          <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </svg>
                      </span>
                    </h2>
                  )}
                </div>
                
                <p style={emailStyle}>{currentUser?.email}</p>
                
                <div style={detailStyle}>
                  <span style={labelStyle}>Konto opprettet:</span>
                  <span style={valueStyle}>{currentUser?.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString('no-NO') : 'Ikke tilgjengelig'}</span>
                </div>
                
                {usernameUpdateStatus && (
                  <div style={usernameUpdateStatus === 'success' ? successMessageStyle : errorMessageStyle}>
                    {usernameUpdateStatus === 'success' 
                      ? 'Brukernavnet ble oppdatert!' 
                      : 'Kunne ikke oppdatere brukernavn'}
                  </div>
                )}
              </div>
              
              <div style={authEmblemStyle}>
                {authProviders.map((provider, index) => (
                  <div key={index} style={authProviderEmblemStyle}>
                    {getProviderIcon(provider)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <style jsx global>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-5px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .auth-provider-icon.google {
            background-color: #fff;
            color: #4285F4;
            border: 1px solid #eee;
          }
          
          .auth-provider-icon.dark.google {
            background-color: #1e1e1e;
            border-color: #333;
          }
          
          .auth-provider-icon.facebook {
            background-color: #3b5998;
            color: white;
          }
          
          .auth-provider-icon.email {
            background-color: #D44638;
            color: white;
          }
          
          @media (max-width: 768px) {
            .profile-widget-content {
              flex-direction: column;
              text-align: center;
              padding: 1.5rem;
            }
            
            .profile-info-compact {
              text-align: center;
            }
            
            .profile-name-row {
              justify-content: center;
            }
            
            .profile-detail-compact {
              justify-content: center;
            }
            
            .auth-providers-emblem {
              position: static;
              justify-content: center;
              margin-top: 1rem;
            }
          }
          
          @media (max-width: 480px) {
            .profile-compact-title {
              font-size: 1.3rem;
              padding: 1rem 5%;
            }
            
            .profile-avatar-compact {
              width: 70px;
              height: 70px;
            }
            
            .avatar-initials-compact {
              font-size: 1.5rem;
            }
            
            .profile-info-compact h2 {
              font-size: 1.3rem;
            }
            
            .auth-provider-emblem {
              width: 24px;
              height: 24px;
            }
            
            .auth-provider-icon svg {
              width: 14px;
              height: 14px;
            }
          }
        `}</style>
      </div>
    </Layout>
  );
}

export default MinProfil;