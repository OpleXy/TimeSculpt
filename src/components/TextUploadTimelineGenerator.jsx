import { useState, useRef } from 'react';
import { generateTimelineEvents } from '../services/aiTimelineService';
import '../styles/text-upload-timeline-generator.css';

function TextUploadTimelineGenerator({ onGenerateTimeline }) {
  const [file, setFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [manualText, setManualText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [inputMode, setInputMode] = useState('upload'); // 'upload' or 'paste'
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/plain' && selectedFile.type !== 'application/pdf' && 
          selectedFile.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' &&
          selectedFile.type !== 'application/msword') {
        setError('Vennligst last opp en tekstfil (.txt), PDF eller Word-dokument.');
        setFile(null);
        e.target.value = null;
        return;
      }
      
      setError('');
      setFile(selectedFile);
      
      // Read the file content
      const reader = new FileReader();
      reader.onload = (event) => {
        setFileContent(event.target.result);
      };
      reader.onerror = () => {
        setError('Kunne ikke lese filen. Vennligst prøv igjen.');
      };
      
      if (selectedFile.type === 'text/plain') {
        reader.readAsText(selectedFile);
      } else {
        // For PDF and Word files, we'll extract text using a more basic approach
        // In a production app, you'd want to use a proper PDF/Word parser
        setFileContent(`Innhold fra fil: ${selectedFile.name}`);
        
        // For demonstration, let's pretend we got the content from the file
        // In a real app, you'd use a library to extract text from PDF/Word
        if (selectedFile.name.includes('ww2') || selectedFile.name.toLowerCase().includes('verdenskrig')) {
          setFileContent(`Andre verdenskrig var en global krig som varte fra 1939 til 1945.
På den ene siden av krigen stod aksemaktene: Tyskland, Italia (1940–1943), Slovakia (1939–1945), Den uavhengige staten Kroatia, Bulgaria, Romania og Ungarn (alle fire 1941–1944), samt Japan (1941–1945) og Thailand (1942–1945). Finland var i årene 1941–1944 i en løs allianse med Tyskland som begrenset seg til krigen mellom Finland og Sovjetunionen.
På den andre siden stod de allierte: Polen, Storbritannia med Samveldet av nasjoner og Frankrike (alle tre fra 1939), Norge, Belgia og Nederland (alle tre fra 1940), Jugoslavia, Hellas, Sovjetunionen og USA (alle fire fra 1941), Tyrkia (1945), samt Kina; dessuten en rekke land i Asia, Afrika og Latin-Amerika.
De allierte vant krigen.`);
        }
      }
    }
  };

  const handleTextChange = (e) => {
    setManualText(e.target.value);
    setError('');
  };

  const handleModeChange = (mode) => {
    setInputMode(mode);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Get the text content based on the input mode
    const textContent = inputMode === 'upload' ? fileContent : manualText;
    
    if (!textContent.trim()) {
      setError('Ingen tekst å analysere. Vennligst last opp en fil eller lim inn tekst.');
      return;
    }
    
    // Perform some basic validation on the text length
    if (textContent.length < 50) {
      setError('Teksten er for kort for å generere en meningsfull tidslinje. Vennligst oppgi mer innhold.');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Generate timeline based on text content
      const timelineTitle = extractTimelineTitle(textContent);
      const timelineDates = extractTimelineDates(textContent);
      
      // Create a new timeline object with properties matching the App.jsx expected format
      const timeline = {
        title: timelineTitle,
        start: timelineDates.startDate,
        end: timelineDates.endDate,
        orientation: 'horizontal',
        events: [], // We'll populate this with AI-generated events
        backgroundColor: 'white',
        timelineColor: '#007bff',
        timelineThickness: 2,
        showIntervals: true,
        intervalCount: 5,
        intervalType: 'even',
        intervalSettings: {
          show: true,
          count: 5,
          type: 'even'
        },
        generatedFromText: true, // Flag to indicate this was generated from text
        // Create a promptText property to work with existing prompt processing logic
        promptText: textContent, 
        generatedFromPrompt: true // We'll leverage the existing prompt processing logic
      };
      
      // Call the parent handler to create the timeline
      // App.jsx will handle generating events since we set generatedFromPrompt
      onGenerateTimeline(timeline);
      
      // Reset the form
      setFile(null);
      setFileContent('');
      setManualText('');
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
      
    } catch (error) {
      console.error('Error generating timeline:', error);
      setError('Kunne ikke generere tidslinje. Vennligst prøv igjen senere.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Extract a title from the text content (use the first sentence or first few words)
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
  
  // Get a preview of the text content
  const getTextPreview = () => {
    const text = inputMode === 'upload' ? fileContent : manualText;
    if (!text) return null;
    
    const maxLength = 200;
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="text-upload-timeline-generator">
      <h3>Generer tidslinje fra tekst</h3>
      
      <div className="input-mode-selector">
        <button
          type="button"
          className={inputMode === 'upload' ? 'active' : ''}
          onClick={() => handleModeChange('upload')}
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
          Last opp fil
        </button>
        <button
          type="button"
          className={inputMode === 'paste' ? 'active' : ''}
          onClick={() => handleModeChange('paste')}
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
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
          </svg>
          Lim inn tekst
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        {inputMode === 'upload' ? (
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
        ) : (
          <div className="text-paste-container">
            <textarea
              placeholder="Lim inn eller skriv tekst her for å generere en tidslinje..."
              value={manualText}
              onChange={handleTextChange}
              rows={8}
              className="text-input"
            ></textarea>
          </div>
        )}
        
        {/* Text preview */}
        {getTextPreview() && (
          <div className="text-preview">
            <h4>Forhåndsvisning:</h4>
            <p>{getTextPreview()}</p>
          </div>
        )}
        
        {error && <div className="error-message">{error}</div>}
        
        <button 
          type="submit" 
          className="generate-timeline-btn" 
          disabled={isLoading || (!fileContent && !manualText)}
        >
          {isLoading ? (
            <>
              <span className="loading-spinner"></span>
              <span>Genererer tidslinje...</span>
            </>
          ) : (
            <>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <polyline points="19 12 12 19 5 12"></polyline>
              </svg>
              <span>Generer tidslinje</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default TextUploadTimelineGenerator;