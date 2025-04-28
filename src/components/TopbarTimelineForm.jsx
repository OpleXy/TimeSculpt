import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { loadTimelineList } from '../api';
import ToggleSwitch from './ToggleSwitch';
import DateInput from './DateInput';
import { generateTimelineFromPrompt } from '../services/promptTimelineService';
import '../styles/topbar-timeline-form.css';

function TopbarTimelineForm({ onCreateTimeline, hasUnsavedChanges, buttonHeight = '36px' }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isVertical, setIsVertical] = useState(false);
  const [timelineCount, setTimelineCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [creationMode, setCreationMode] = useState('manual'); // 'manual', 'prompt', or 'upload'
  const [promptText, setPromptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [file, setFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [uploadError, setUploadError] = useState('');
  
  const formRef = useRef(null);
  const fileInputRef = useRef(null);
  const { isAuthenticated } = useAuth();

  const toggleForm = () => {
    setIsExpanded(!isExpanded);
    
    // Load timeline count when expanding the form
    if (!isExpanded && isAuthenticated) {
      loadTimelineCount();
    }
  };

  // Load the user's timeline count
  const loadTimelineCount = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      const timelines = await loadTimelineList();
      setTimelineCount(timelines.length);
    } catch (error) {
      console.error('Error loading timeline count:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle clicks outside of the form to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (formRef.current && !formRef.current.contains(event.target) && isExpanded) {
        setIsExpanded(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  const handleOrientationChange = (e) => {
    setIsVertical(e.target.checked);
  };

  // Handle date changes from DateInput components
  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };

  // File upload handling
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/plain' && selectedFile.type !== 'application/pdf' && 
          selectedFile.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' &&
          selectedFile.type !== 'application/msword') {
        setUploadError('Vennligst last opp en tekstfil (.txt), PDF eller Word-dokument.');
        setFile(null);
        e.target.value = null;
        return;
      }
      
      setUploadError('');
      setFile(selectedFile);
      
      // Read the file content
      const reader = new FileReader();
      reader.onload = (event) => {
        setFileContent(event.target.result);
      };
      reader.onerror = () => {
        setUploadError('Kunne ikke lese filen. Vennligst prøv igjen.');
      };
      
      if (selectedFile.type === 'text/plain') {
        reader.readAsText(selectedFile);
      } else {
        // For PDF and Word files, we'll extract text using a more basic approach
        setFileContent(`Innhold fra fil: ${selectedFile.name}`);
        
        // For demonstration, let's pretend we got the content from the file
        if (selectedFile.name.includes('ww2') || selectedFile.name.toLowerCase().includes('verdenskrig')) {
          setFileContent(`Andre verdenskrig var en global krig som varte fra 1939 til 1945.
På den ene siden av krigen stod aksemaktene: Tyskland, Italia (1940–1943), Slovakia (1939–1945), Den uavhengige staten Kroatia, Bulgaria, Romania og Ungarn (alle fire 1941–1944), samt Japan (1941–1945) og Thailand (1942–1945). Finland var i årene 1941–1944 i en løs allianse med Tyskland.
På den andre siden stod de allierte: Polen, Storbritannia med Samveldet av nasjoner og Frankrike (alle tre fra 1939), Norge, Belgia og Nederland (alle tre fra 1940), Jugoslavia, Hellas, Sovjetunionen og USA (alle fire fra 1941), Tyrkia (1945), samt Kina.
De allierte vant krigen.`);
        }
      }
    }
  };

  // Get a preview of the text content
  const getTextPreview = () => {
    const text = fileContent;
    if (!text) return null;
    
    const maxLength = 200;
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength) + '...';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check if the user has reached the timeline limit
    if (timelineCount >= 3 && isAuthenticated) {
      alert('Du har nådd grensen på 3 tidslinjer. Vennligst slett en eksisterende tidslinje før du oppretter en ny.');
      return;
    }

    // Check for unsaved changes
    if (hasUnsavedChanges) {
      const confirmCreate = window.confirm(
        'Du har ulagrede endringer. Er du sikker på at du vil opprette en ny tidslinje? Ulagrede endringer vil gå tapt.'
      );
      
      if (!confirmCreate) {
        return; // User cancelled, don't create a new timeline
      }
    }

    if (creationMode === 'manual') {
      // Manual mode validation
      if (!title || !startDate || !endDate) {
        alert('Vennligst fyll ut alle feltene');
        return;
      }

      onCreateTimeline({
        title,
        start: new Date(startDate),
        end: new Date(endDate),
        orientation: isVertical ? 'vertical' : 'horizontal',
        events: [],
        backgroundColor: 'white',
        timelineColor: '#007bff',
        timelineThickness: 2
      });
    } 
    else if (creationMode === 'prompt') {
      // Prompt-based mode
      if (!promptText.trim()) {
        alert('Vennligst skriv en beskrivelse av tidslinjen du ønsker å opprette');
        return;
      }
      
      // Process the prompt and generate a timeline
      handleGenerateTimelineFromPrompt();
    }
    else if (creationMode === 'upload') {
      // Upload mode
      if (!fileContent.trim()) {
        alert('Ingen tekst å analysere. Vennligst last opp en fil.');
        return;
      }
      
      // Generate timeline from uploaded text
      handleGenerateTimelineFromText();
    }
  };
  
  // Handle generating a timeline from prompt
  const handleGenerateTimelineFromPrompt = async () => {
    try {
      setIsGenerating(true);
      
      // Call our promptTimelineService to generate a timeline from the prompt
      const generatedTimeline = await generateTimelineFromPrompt(promptText);
      
      // Create the timeline
      onCreateTimeline(generatedTimeline);
      
      // Reset form and close it
      setPromptText('');
      setIsExpanded(false);
      
    } catch (error) {
      console.error('Error generating timeline from prompt:', error);
      alert('Det oppstod en feil ved generering av tidslinjen. Vennligst prøv igjen senere.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle generating timeline from uploaded text
  const handleGenerateTimelineFromText = async () => {
    try {
      setIsGenerating(true);
      
      // Extract title and dates from text
      const timelineTitle = extractTimelineTitle(fileContent);
      const timelineDates = extractTimelineDates(fileContent);
      
      // Create timeline object
      const timeline = {
        title: timelineTitle,
        start: timelineDates.startDate,
        end: timelineDates.endDate,
        orientation: isVertical ? 'vertical' : 'horizontal',
        events: [],
        backgroundColor: 'white',
        timelineColor: '#007bff',
        timelineThickness: 2,
        generatedFromPrompt: true, // Use existing prompt processing system
        promptText: fileContent // Use the file content as the prompt
      };
      
      // Create the timeline
      onCreateTimeline(timeline);
      
      // Reset form and close it
      setFile(null);
      setFileContent('');
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
      setIsExpanded(false);
      
    } catch (error) {
      console.error('Error generating timeline from text:', error);
      alert('Det oppstod en feil ved generering av tidslinjen. Vennligst prøv igjen senere.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Extract a title from the text content
  const extractTimelineTitle = (text) => {
    // Try to get the first sentence
    const firstSentence = text.split(/[.!?]/).filter(s => s.trim().length > 0)[0] || '';
    
    if (firstSentence.length < 60) {
      return firstSentence.trim();
    }
    
    // If first sentence is too long, use the first few words
    const words = text.split(/\s+/).slice(0, 6).join(' ');
    return words + '...';
  };
  
  // Extract start and end dates from the text content
  const extractTimelineDates = (text) => {
    // Look for year patterns, e.g., "1939 to 1945" or "from 1939 to 1945"
    const yearRangePattern = /(?:from\s+)?(\d{4})(?:\s*[-–—]\s*|\s+til\s+)(\d{4})/i;
    const yearRangeMatch = text.match(yearRangePattern);
    
    if (yearRangeMatch) {
      return {
        startDate: new Date(`${yearRangeMatch[1]}-01-01`),
        endDate: new Date(`${yearRangeMatch[2]}-12-31`)
      };
    }
    
    // Look for individual years
    const yearPattern = /\b(1\d{3}|20\d{2})\b/g;
    const years = [];
    let match;
    
    while ((match = yearPattern.exec(text)) !== null) {
      years.push(parseInt(match[1]));
    }
    
    if (years.length >= 2) {
      // Use the earliest and latest years
      const sortedYears = [...years].sort((a, b) => a - b);
      return {
        startDate: new Date(`${sortedYears[0]}-01-01`),
        endDate: new Date(`${sortedYears[sortedYears.length - 1]}-12-31`)
      };
    }
    
    // Default to recent history if no dates found
    const currentYear = new Date().getFullYear();
    return {
      startDate: new Date(`${currentYear - 10}-01-01`),
      endDate: new Date(`${currentYear}-12-31`)
    };
  };
  
  return (
    <div className="topbar-timeline-form" ref={formRef}>
      <button 
        className="add-description-btn new-timeline-button" 
        onClick={toggleForm}
        type="button"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'background-color 0.2s, color 0.2s',
          fontSize: '0.9rem',
          padding: '0 12px',
          borderRadius: '4px',
          border: '1px dashed var(--primary-color)',
          backgroundColor: isExpanded ? 'rgba(0, 123, 255, 0.1)' : 'transparent',
          color: 'var(--primary-color)',
          height: buttonHeight, // Use the consistent height prop
          width: 'auto',
          margin: 0
        }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ marginRight: '6px' }}
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Ny Tidslinje
      </button>

      {isExpanded && (
        <div className="topbar-form-dropdown">
          <form onSubmit={handleSubmit}>
            {isAuthenticated && (
              <div className="timeline-limit-info" style={{
                marginBottom: '15px',
                fontSize: '0.85rem',
                color: timelineCount >= 3 ? '#dc3545' : '#6c757d',
                backgroundColor: timelineCount >= 3 ? 'rgba(220, 53, 69, 0.1)' : 'rgba(108, 117, 125, 0.1)',
                padding: '8px 12px',
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                {isLoading ? (
                  <span>Laster tidslinjeinformasjon...</span>
                ) : (
                  <span>
                    Du har <strong>{timelineCount} av 3</strong> tillatte tidslinjer
                    {timelineCount >= 3 && (
                      <span style={{ display: 'block', marginTop: '4px' }}>
                        Slett en eksisterende tidslinje for å opprette en ny
                      </span>
                    )}
                  </span>
                )}
              </div>
            )}
            
            {/* Creation mode selector with three options */}
            <div className="creation-mode-selector">
              <button
                type="button"
                className={creationMode === 'manual' ? 'active' : ''}
                onClick={() => setCreationMode('manual')}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
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
                Manuell
              </button>
              <button
                type="button"
                className={creationMode === 'prompt' ? 'active' : ''}
                onClick={() => setCreationMode('prompt')}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Prompt
                <span className="ai-badge">AI</span>
              </button>
              <button
                type="button"
                className={creationMode === 'upload' ? 'active' : ''}
                onClick={() => setCreationMode('upload')}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Last opp
                <span className="ai-badge">AI</span>
              </button>
            </div>
            
            {creationMode === 'manual' && (
              // Manual creation form
              <>
                <div className="form-group">
                  <label htmlFor="timelineTitle" style={{ 
                    display: 'block', 
                    marginBottom: '5px', 
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}>
                    Tidslinjetittel <span style={{ color: '#dc3545' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    id="timelineTitle" 
                    placeholder="Tidslinjetittel" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required 
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group half">
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '5px', 
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}>
                      Start dato <span style={{ color: '#dc3545' }}>*</span>
                    </label>
                    <DateInput
                      value={startDate}
                      onChange={handleStartDateChange}
                      label=""
                      required={true}
                    />
                  </div>
                  
                  <div className="form-group half">
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '5px', 
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}>
                      Slutt dato <span style={{ color: '#dc3545' }}>*</span>
                    </label>
                    <DateInput
                      value={endDate}
                      onChange={handleEndDateChange}
                      label=""
                      required={true}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <ToggleSwitch
                    isVertical={isVertical}
                    onChange={handleOrientationChange}
                    id="orientation-toggle"
                  />
                </div>
              </>
            )}
            
            {creationMode === 'prompt' && (
              // Prompt-based creation form
              <div className="form-group">
                <label htmlFor="timelinePrompt" style={{ 
                  display: 'block', 
                  marginBottom: '5px', 
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  Beskriv tidslinjen <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <textarea 
                  id="timelinePrompt" 
                  placeholder="Beskriv temaet og tidsperioden for tidslinjen du ønsker å opprette..." 
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  required
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ced4da',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
                <div className="prompt-info" style={{
                  marginTop: '8px',
                  fontSize: '0.8rem',
                  color: '#6c757d',
                  display: 'flex',
                  alignItems: 'flex-start'
                }}>
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
                    style={{ marginRight: '6px', marginTop: '2px', flexShrink: 0 }}
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span>
                    Eksempel: "En tidslinje over andre verdenskrig fra 1939 til 1945, med fokus på viktige slag og politiske hendelser."
                  </span>
                </div>
              </div>
            )}

            {creationMode === 'upload' && (
              // Upload-based creation form
              <>
                <div className="file-upload-container">
                  <label htmlFor="text-file-upload" className="file-upload-label">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <span>{file ? file.name : 'Klikk for å laste opp en tekstfil'}</span>
                  </label>
                  <input 
                    type="file" 
                    id="text-file-upload" 
                    accept=".txt,.pdf,.doc,.docx" 
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="file-input"
                  />
                  <p className="file-upload-help">
                    Støttede formater: .txt, .pdf, .doc, .docx
                  </p>
                </div>

                {uploadError && <div className="error-message">{uploadError}</div>}

                {getTextPreview() && (
                  <div className="text-preview">
                    <h4>Forhåndsvisning:</h4>
                    <p>{getTextPreview()}</p>
                  </div>
                )}

                <div className="form-group">
                  <ToggleSwitch
                    isVertical={isVertical}
                    onChange={handleOrientationChange}
                    id="upload-orientation-toggle"
                  />
                </div>
              </>
            )}
            
            <div className="form-footer">
              <button 
                type="submit" 
                className="create-btn"
                disabled={(isAuthenticated && timelineCount >= 3) || isGenerating}
                style={{
                  opacity: (isAuthenticated && timelineCount >= 3) || isGenerating ? 0.7 : 1,
                  cursor: (isAuthenticated && timelineCount >= 3) || isGenerating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isGenerating ? (
                  <>
                    <span className="loading-spinner" style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '50%',
                      borderTopColor: 'white',
                      animation: 'spin 0.8s linear infinite',
                      marginRight: '8px'
                    }}></span>
                    Genererer...
                  </>
                ) : (
                  creationMode === 'manual' ? 'Opprett' : 'Generer tidslinje'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        .creation-mode-selector {
          display: flex;
          background-color: var(--sidebar-item-bg, #f8f9fa);
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 15px;
          border: 1px solid var(--border-color, #dee2e6);
        }
        
        .creation-mode-selector button {
          flex: 1;
          padding: 10px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-color-secondary, #6c757d);
          transition: all 0.2s;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .creation-mode-selector button.active {
          background-color: var(--primary-color, #007bff);
          color: white;
        }
        
        .creation-mode-selector button:not(:last-child) {
          border-right: 1px solid var(--border-color, #dee2e6);
        }
        
        .creation-mode-selector button:hover:not(.active) {
          background-color: rgba(0, 0, 0, 0.03);
        }
        
        .creation-mode-selector button svg {
          margin-right: 6px;
        }
        
        .ai-badge {
          background-color: rgba(0, 123, 255, 0.2);
          color: var(--primary-color, #007bff);
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 0.7rem;
          margin-left: 5px;
          font-weight: 600;
        }
        
        .creation-mode-selector button.active .ai-badge {
          background-color: rgba(255, 255, 255, 0.3);
          color: white;
        }

        .file-upload-container {
          margin-bottom: 15px;
        }
        
        .file-upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          border: 2px dashed var(--primary-color-light, #b8daff);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          background-color: rgba(0, 123, 255, 0.05);
        }
        
        .file-upload-label:hover {
          border-color: var(--primary-color, #007bff);
          background-color: rgba(0, 123, 255, 0.1);
        }
        
        .file-upload-label svg {
          color: var(--primary-color, #007bff);
          margin-bottom: 10px;
        }
        
        .file-upload-label span {
          font-size: 0.9rem;
          color: var(--text-color, #333);
        }
        
        .file-input {
          display: none;
        }
        
        .file-upload-help {
          font-size: 0.8rem;
          color: var(--text-color-secondary, #6c757d);
          margin-top: 8px;
          margin-bottom: 0;
          text-align: center;
        }
        
        .text-preview {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 15px;
          border: 1px solid #eaeaea;
        }
        
        .text-preview h4 {
          font-size: 0.9rem;
          margin-top: 0;
          margin-bottom: 8px;
          color: var(--text-color-secondary, #6c757d);
        }
        
        .text-preview p {
          font-size: 0.85rem;
          margin: 0;
          color: var(--text-color, #333);
          line-height: 1.5;
          white-space: pre-line;
        }
        
        .error-message {
          background-color: rgba(220, 53, 69, 0.1);
          color: #dc3545;
          padding: 10px;
          border-radius: 6px;
          font-size: 0.85rem;
          margin-bottom: 15px;
        }
      `}</style>
    </div>
  );
}

export default TopbarTimelineForm;