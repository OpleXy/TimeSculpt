import { useState } from 'react';
import RichTextEditor from './RichTextEditor';
import { generateTimelineEvents } from '../services/aiTimelineService';
import '../styles/event-form.css';
import '../styles/text-to-timeline.css';

function TextToTimelineForm({ onGenerateEvents, timelineStart, timelineEnd }) {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedCount, setGeneratedCount] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!text.trim()) {
      setError('Vennligst skriv eller lim inn tekst for å generere hendelser');
      return;
    }

    if (!timelineStart || !timelineEnd) {
      setError('Tidslinjen må ha start- og sluttdato');
      return;
    }

    try {
      setIsLoading(true);
      
      // Use the AI service to generate events
      const generatedEvents = await generateTimelineEvents(text, timelineStart, timelineEnd);
      
      // Track how many events were generated
      setGeneratedCount(generatedEvents.length);
      
      // Send events back to parent component
      onGenerateEvents(generatedEvents);
      
      // Clear form after successful generation
      setText('');
    } catch (error) {
      console.error('Feil ved generering av hendelser:', error);
      setError('Kunne ikke generere hendelser. Prøv igjen senere.');
    } finally {
      setIsLoading(false);
    }
  };

  // Utility function to strip HTML for plaintext storage
  const stripHtml = (html) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <div className="text-to-timeline-form">
      <h3>Tekst til tidslinje</h3>
      <form onSubmit={handleSubmit} className="compact-form">
        <div className="form-group">
          <label htmlFor="timelineText">Skriv eller lim inn tekst<span className="required-mark"> *</span></label>
          <RichTextEditor 
            value={text}
            onChange={(val) => {
              setText(val);
              setError('');
            }}
            placeholder="Skriv eller lim inn en sammenhengende tekst med historiske hendelser..."
            minHeight="200px"
          />
        </div>
        
        <div className="text-to-timeline-info">
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
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span>
            AI-assistenten vil analysere teksten og foreslå en rekke hendelser innenfor tidsperioden.
            Du kan redigere eller flytte hendelsene etter generering.
          </span>
        </div>
        
        {error && <div className="error">{error}</div>}
        
        {generatedCount > 0 && !isLoading && (
          <div className="success-message">
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
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>
              {generatedCount} hendelse{generatedCount !== 1 ? 'r' : ''} ble generert! 
              Du kan nå redigere og plassere dem på tidslinjen.
            </span>
          </div>
        )}
        
        <button 
          type="submit" 
          className="generate-timeline-btn"
          disabled={isLoading || !text.trim()}
        >
          {isLoading ? (
            <>
              <span className="loading-spinner"></span>
              <span>Genererer...</span>
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
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              <span>{generatedCount > 0 ? 'Generer flere hendelser' : 'Generer hendelser'}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default TextToTimelineForm;