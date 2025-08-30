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

  // Display welcome message for guests - simplified version
  return (
    <div className="welcome-container guest">
      <div className="welcome-content">
        <h3> <strong>Velkommen til TimeSculpt!</strong> 🚀</h3>
        
        {/* AI Timeline Generator section - main focus */}
        <div className="ai-timeline-section">
          <h4>AI-generer din tidlinje:</h4>
          <p>Beskriv en tidslinje, så viser vi deg hva AI kan lage:</p>
          
          <form onSubmit={handleGenerateTimeline} className="ai-timeline-form">
            <div className="input-group">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Skriv inn hva du vil lage en tidslinje om..."
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
                  'Generer'
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
                  onClick={() => handleExampleClick('Norges historie')}
                  disabled={isGenerating}
                >
                  Norges historie
                </button>
                <button 
                  type="button" 
                  className="example-btn"
                  onClick={() => handleExampleClick('Andre verdenskrig')}
                  disabled={isGenerating}
                >
                  Andre verdenskrig
                </button>
                <button 
                  type="button" 
                  className="example-btn"
                  onClick={() => handleExampleClick('Vikingtiden')}
                  disabled={isGenerating}
                >
                  Vikingtiden
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Manual creation section - simplified */}
        <div className="manual-section">
          <p>Trykk på <strong>(+ Opprett)</strong> for å opprette en tidslinje manuelt</p>
          
          <div className="support-link">
            <a 
              href="https://support.timesculpt.no/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="support-icon"
              title="Hjelp og støtte"
            >
              ?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WelcomeScreen;