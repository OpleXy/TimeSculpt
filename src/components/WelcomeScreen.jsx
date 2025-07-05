import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { generateTimelineFromPrompt } from '../services/openAiService';
import '../styles/layout-manager.css';
import '../styles/welcome-screen.css';

/**
 * WelcomeScreen component displays different welcome messages 
 * based on user authentication status and includes AI timeline generation
 */
function WelcomeScreen({ onLogin, onCreateTimeline }) {
  const { isAuthenticated, currentUser } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  // Remove the unused date fixing functions since the new OpenAI service handles this
  // The functions fixTimelineDates and fixSingleDate are no longer needed

  // Handle AI timeline generation
  const handleGenerateTimeline = async (e) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError('Vennligst skriv inn en beskrivelse av tidslinjen');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      console.log('🚀 Genererer tidslinje fra prompt:', prompt);
      
      // Call the new OpenAI service directly - it already returns the right format
      const timelineConfig = await generateTimelineFromPrompt(prompt);
      
      console.log('✅ Raw response from generateTimelineFromPrompt:', timelineConfig);
      
      // Check if we got a valid timeline - handle both old and new format
      let validTimeline = null;
      
      if (timelineConfig && timelineConfig.title && timelineConfig.events) {
        // New format - direct timeline config
        validTimeline = timelineConfig;
      } else if (timelineConfig && timelineConfig.timeline) {
        // Old format - wrapped in timeline property
        validTimeline = timelineConfig.timeline;
      } else if (timelineConfig && timelineConfig.isFallback) {
        // Fallback timeline
        validTimeline = timelineConfig;
      } else {
        console.error('Unexpected timeline format:', timelineConfig);
        throw new Error('Ugyldig tidslinje format mottatt fra AI');
      }
      
      if (!validTimeline || !validTimeline.title) {
        throw new Error('Tidslinje mangler tittel');
      }
      
      if (!validTimeline.events || validTimeline.events.length === 0) {
        throw new Error('Tidslinje mangler hendelser');
      }
      
      console.log('✅ Valid timeline extracted:', validTimeline);
      
      // DEBUG: Check if onCreateTimeline exists
      if (!onCreateTimeline) {
        console.error('❌ onCreateTimeline prop is missing!');
        setError('Intern feil: onCreateTimeline prop mangler');
        return;
      }
      
      console.log('📤 Calling onCreateTimeline with:', validTimeline);
      
      // Send to parent component to create the timeline
      onCreateTimeline(validTimeline);
      
      console.log('✅ onCreateTimeline called successfully');
      
      // Clear the form
      setPrompt('');
      
    } catch (error) {
      console.error('❌ Feil ved generering:', error);
      setError(`Kunne ikke generere tidslinje: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExampleClick = (examplePrompt) => {
    setPrompt(examplePrompt);
    setError('');
  };

  // Display personalized welcome for authenticated users
  if (isAuthenticated && currentUser) {
    return (
      <div className="welcome-container authenticated">
        <h2>Velkommen tilbake, {currentUser.displayName || 'bruker'}!</h2>
        
        {/* AI Timeline Generator */}
        <div className="ai-timeline-section">
          <h3>🤖 Lag tidslinje med AI</h3>
          <p>Beskriv tidslinjen du vil lage, så genererer AI en komplett tidslinje for deg:</p>
          
          <form onSubmit={handleGenerateTimeline} className="ai-timeline-form">
            <div className="input-group">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="f.eks: 'en tidslinje over den russiske revolusjon'"
                disabled={isGenerating}
                className="ai-input"
              />
              <button 
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="ai-generate-btn"
              >
                {isGenerating ? (
                  <>
                    <span className="spinner"></span>
                    Genererer...
                  </>
                ) : (
                  '🚀 Generer tidslinje'
                )}
              </button>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="example-prompts">
              <p>💡 Eksempler du kan prøve:</p>
              <div className="example-buttons">
                <button 
                  type="button" 
                  className="example-btn"
                  onClick={() => handleExampleClick('en tidslinje over den russiske revolusjon')}
                  disabled={isGenerating}
                >
                  Den russiske revolusjon
                </button>
                <button 
                  type="button" 
                  className="example-btn"
                  onClick={() => handleExampleClick('andre verdenskrig i Europa')}
                  disabled={isGenerating}
                >
                  Andre verdenskrig
                </button>
                <button 
                  type="button" 
                  className="example-btn"
                  onClick={() => handleExampleClick('den amerikanske borgerkrigen')}
                  disabled={isGenerating}
                >
                  Amerikansk borgerkrig
                </button>
                <button 
                  type="button" 
                  className="example-btn"
                  onClick={() => handleExampleClick('huleboertiden i Norge')}
                  disabled={isGenerating}
                >
                  Huleboertiden i Norge
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="divider">
          <span>eller</span>
        </div>

        <p>
          Du kan også opprette en tom tidslinje ved å klikke på <strong>+ Ny Tidslinje</strong> knappen i topmenyen,
          eller velge en eksisterende tidslinje fra 
        </p>
        
        <div className="welcome-actions">
          <button className="welcome-create-btn" onClick={() => window.location.href = '/tidslinjer'}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9 L12 2 L21 9 L21 20 C21 20.5523 20.5523 21 20 21 L4 21 C3.44772 21 3 20.5523 3 20 Z"/>
              <polyline points="9,22 9,12 15,12 15,22"/>
            </svg>
            Mitt arkiv
          </button>

          <p><strong>eller</strong></p>         
          <button className="welcome-explore-btn" onClick={() => window.location.href = '/utforsk'}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            Utforsk tidslinjer
          </button>
        </div>
      </div>
    );
  }
  
  // Display welcome message for guests
  return (
    <div className="welcome-container guest">
      <div className="welcome-content">
        <h3>🚀 <strong>Slik kommer du i gang:</strong></h3>
        
        {/* AI Timeline Generator for guests */}
        <div className="ai-timeline-section">
          <h4>🤖 Prøv AI-generering (krever ikke innlogging)</h4>
          <p>Beskriv en tidslinje, så viser vi deg hva AI kan lage:</p>
          
          <form onSubmit={handleGenerateTimeline} className="ai-timeline-form">
            <div className="input-group">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="f.eks: 'en tidslinje over den russiske revolusjon'"
                disabled={isGenerating}
                className="ai-input"
              />
              <button 
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="ai-generate-btn"
              >
                {isGenerating ? (
                  <>
                    <span className="spinner"></span>
                    Genererer...
                  </>
                ) : (
                  '🚀 Prøv AI'
                )}
              </button>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="example-prompts">
              <p>💡 Eksempler:</p>
              <div className="example-buttons">
                <button 
                  type="button" 
                  className="example-btn"
                  onClick={() => handleExampleClick('den russiske revolusjon')}
                  disabled={isGenerating}
                >
                  Russisk revolusjon
                </button>
                <button 
                  type="button" 
                  className="example-btn"
                  onClick={() => handleExampleClick('andre verdenskrig')}
                  disabled={isGenerating}
                >
                  Andre verdenskrig
                </button>
                <button 
                  type="button" 
                  className="example-btn"
                  onClick={() => handleExampleClick('huleboertiden i Norge')}
                  disabled={isGenerating}
                >
                  Huleboertiden
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="divider">
          <span>eller lag manuelt</span>
        </div>

        <ol>
          <li>Klikk på <strong>+ Ny Tidslinje</strong> i toppmenyen</li>
          <li>Gi tidslinjen en tittel, og velg start- og sluttdato</li>
          <li>Lag hendelser på menyen til venstre og plasser dem på tidslinjen</li>
          <li><strong>Logg inn</strong> for å lagre arbeidet ditt</li>
        </ol>
      
        <div className="welcome-help-section">
          <p>Trenger du hjelp? Sjekk ut <a href="https://support.timesculpt.no/tutorials" target="_blank" rel="noopener noreferrer">videoguidene våre</a> eller <a href="mailto:timesculpt.post@gmail.com">ta kontakt med oss</a> direkte!⏳💫</p>
        </div>
      </div>
      
      <div className="welcome-actions">
       
      </div>
    </div>
  );
}

export default WelcomeScreen;