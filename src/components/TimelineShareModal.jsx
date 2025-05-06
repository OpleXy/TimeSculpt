import { useState, useEffect, useRef } from 'react';
import { 
  addTimelineCollaborator, 
  removeTimelineCollaborator, 
  getTimelineCollaborators,
  updateCollaboratorRole
} from '../api';
import '../styles/timeline-share-modal.css';

function TimelineShareModal({ 
  timelineData, 
  isOwner, 
  onClose, 
  isPublic, 
  onPrivacyChange 
}) {
  const [collaborators, setCollaborators] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('viewer'); // Default role is viewer
  const [shareUrl, setShareUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const modalRef = useRef(null);
  
  // Generate share URL when component mounts
  useEffect(() => {
    if (timelineData && timelineData.id) {
      const url = `${window.location.origin}/?timelineId=${timelineData.id}`;
      setShareUrl(url);
    }
  }, [timelineData]);
  
  // Load collaborators on component mount
  useEffect(() => {
    if (timelineData && timelineData.id) {
      loadCollaborators();
    }
  }, [timelineData]);
  
  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // Load timeline collaborators
  const loadCollaborators = async () => {
    if (!timelineData || !timelineData.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await getTimelineCollaborators(timelineData.id);
      setCollaborators(result);
    } catch (err) {
      console.error('Failed to load collaborators:', err);
      setError('Kunne ikke laste delte brukere. Prøv igjen senere.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add new collaborator
  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    
    if (!newEmail || !newEmail.includes('@')) {
      setError('Vennligst oppgi en gyldig e-postadresse');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      await addTimelineCollaborator(timelineData.id, newEmail, newRole);
      setNewEmail('');
      setNewRole('viewer'); // Reset to default role
      
      // Reload collaborators
      await loadCollaborators();
    } catch (err) {
      console.error('Failed to add collaborator:', err);
      setError('Kunne ikke legge til samarbeidspartner. ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Remove collaborator
  const handleRemoveCollaborator = async (email) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await removeTimelineCollaborator(timelineData.id, email);
      
      // Reload collaborators
      await loadCollaborators();
    } catch (err) {
      console.error('Failed to remove collaborator:', err);
      setError('Kunne ikke fjerne samarbeidspartner. Prøv igjen senere.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update collaborator role
  const handleUpdateRole = async (email, role) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await updateCollaboratorRole(timelineData.id, email, role);
      
      // Reload collaborators
      await loadCollaborators();
    } catch (err) {
      console.error('Failed to update collaborator role:', err);
      setError('Kunne ikke oppdatere rolle. Prøv igjen senere.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle public/private status
  const handleTogglePublic = () => {
    if (onPrivacyChange) {
      onPrivacyChange(!isPublic);
    }
  };
  
  // Copy share URL to clipboard
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
        setError('Kunne ikke kopiere lenke til utklippstavlen');
      });
  };
  
  // Icons
  const GlobeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
  );
  
  const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );
  
  const LinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
    </svg>
  );
  
  const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  );
  
  const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  );
  
  const ViewIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );
  
  const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  );
  
  return (
    <div className="modal-overlay">
      <div ref={modalRef} className="timeline-share-modal">
        <div className="modal-header">
          <h3>Del tidslinjen: {timelineData ? timelineData.title : ''}</h3>
          <button className="close-modal-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="timeline-share-modal__content">
          {/* Share Link Section */}
          <div className="share-section">
            <div className="share-header">
              <LinkIcon />
              <h4>Delings-lenke</h4>
            </div>
            
            <div className="share-url-container">
              <input type="text" value={shareUrl} readOnly className="share-url-input" />
              <button className="copy-url-button" onClick={handleCopyUrl}>
                <CopyIcon />
              </button>
            </div>
            
            {copySuccess && (
              <div className="copy-success">Lenke kopiert!</div>
            )}
          </div>
          
          {/* Privacy Toggle */}
          <div className="privacy-section">
            <div className="section-header">
              <h4>Personvern</h4>
            </div>
            
            <div className="privacy-toggle">
              <div 
                className={`privacy-option ${!isPublic ? 'active' : ''}`}
                onClick={isOwner ? () => handleTogglePublic() : undefined}
                style={{ cursor: isOwner ? 'pointer' : 'default' }}
              >
                <LockIcon />
                <div className="option-text">
                  <strong>Privat</strong>
                </div>
              </div>
              
              <div 
                className={`privacy-option ${isPublic ? 'active' : ''}`}
                onClick={isOwner ? () => handleTogglePublic() : undefined}
                style={{ cursor: isOwner ? 'pointer' : 'default' }}
              >
                <GlobeIcon />
                <div className="option-text">
                  <strong>Offentlig</strong>
                </div>
              </div>
            </div>
            
            <p className="privacy-description">
              {isPublic ? 
                'Alle med lenken kan se tidslinjen, men ikke redigere.' : 
                'Kun personer du deler tidslinjen med vil få tilgang.'}
            </p>
          </div>
          
          {/* Collaborators Section */}
          <div className="collaborators-section">
            <div className="section-header">
              <UsersIcon />
              <h4>Samarbeidspartnere</h4>
            </div>
            
            {isOwner && (
              <form onSubmit={handleAddCollaborator} className="add-collaborator-form">
                <input 
                  type="email" 
                  placeholder="Legg til person med e-post"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={isLoading}
                />
                <select 
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  disabled={isLoading}
                  className="role-select"
                >
                  <option value="viewer">Kun visning</option>
                  <option value="editor">Kan redigere</option>
                </select>
                <button type="submit" disabled={isLoading || !newEmail}>+</button>
              </form>
            )}
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="collaborators-list">
              {isLoading ? (
                <div className="loading">Laster...</div>
              ) : collaborators.length === 0 ? (
                <div className="no-collaborators">
                  Ingen samarbeidspartnere
                </div>
              ) : (
                <ul>
                  {collaborators.map(collaborator => (
                    <li key={collaborator.email} className="collaborator-item">
                      <div className="collaborator-info">
                        <div className="avatar">
                          {collaborator.email && collaborator.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-details">
                          <span className="email">{collaborator.email}</span>
                          <span className={`role-badge ${collaborator.role}`}>
                            {collaborator.role === "editor" ? (
                              <><EditIcon /> Kan redigere</>
                            ) : (
                              <><ViewIcon /> Kun visning</>
                            )}
                          </span>
                        </div>
                      </div>
                      
                      {isOwner && (
                        <div className="collaborator-actions">
                          {/* Role toggle dropdown */}
                          <select 
                            value={collaborator.role}
                            onChange={(e) => handleUpdateRole(collaborator.email, e.target.value)}
                            disabled={isLoading}
                            className="role-select-small"
                          >
                            <option value="viewer">Kun visning</option>
                            <option value="editor">Kan redigere</option>
                          </select>
                          
                          <button 
                            className="remove-collaborator-btn"
                            onClick={() => handleRemoveCollaborator(collaborator.email)}
                            disabled={isLoading}
                            title="Fjern"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="modal-close-btn" onClick={onClose}>Lukk</button>
        </div>
      </div>
    </div>
  );
}

export default TimelineShareModal;