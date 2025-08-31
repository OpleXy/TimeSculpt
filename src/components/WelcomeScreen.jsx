// File: src/components/WelcomeScreen.jsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { generateTimelineFromPrompt } from '../services/openAiService';
import '../styles/welcome-screen.css';

export default function WelcomeScreen({ onLogin, onCreateTimeline }) {
  const { isAuthenticated } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateTimeline = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError('');

    try {
      const timelineConfig = await generateTimelineFromPrompt(prompt.trim());

      let validTimeline = null;
      if (timelineConfig && timelineConfig.title && timelineConfig.events) {
        validTimeline = timelineConfig;
      } else if (timelineConfig && timelineConfig.timeline) {
        validTimeline = timelineConfig.timeline;
      } else if (timelineConfig && timelineConfig.isFallback) {
        validTimeline = timelineConfig;
      } else {
        throw new Error('Ugyldig tidslinje format mottatt fra AI');
      }

      if (!validTimeline?.title) throw new Error('Tidslinje mangler tittel');
      if (!validTimeline?.events?.length) throw new Error('Tidslinje mangler hendelser');

      if (!onCreateTimeline) {
        setError('Intern feil: onCreateTimeline prop mangler');
        return;
      }

      onCreateTimeline(validTimeline);
      setPrompt('');
    } catch (err) {
      setError(`Kunne ikke generere tidslinje: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExampleClick = (examplePrompt) => {
    setPrompt(examplePrompt);
    setError('');
  };

  return (
    <div className="welcome-container">
      <form onSubmit={handleGenerateTimeline} className="ai-timeline-form">
        <div className="input-group">
          <input
            id="timelinePrompt"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={isAuthenticated ? 'Skriv hva du vil lage en tidslinje om…' : 'Generer en tidslinje – f.eks. \"Vikingtiden\"'}
            disabled={isGenerating}
            className="ai-input"
            autoComplete="off"
            aria-label="Prompt for å generere tidslinje"
          />
          <button 
            type="submit"
            title={isGenerating ? 'Genererer…' : 'Generer tidslinje'}
            aria-label={isGenerating ? 'Genererer' : 'Generer'}
            disabled={isGenerating || !prompt.trim()}
            className="ai-generate-btn"
          >
            {isGenerating ? (
              <svg className="spinner" viewBox="0 0 50 50" role="img" aria-label="Laster">
                <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path d="M12 4l-7 8h4v8h6v-8h4z" fill="currentColor" />
              </svg>
            )}
          </button>
        </div>

        {error && (
          <div className="error-message" role="alert" aria-live="assertive">{error}</div>
        )}

        <div className="example-buttons" aria-label="Eksempler">
          <button type="button" className="example-btn" onClick={() => handleExampleClick('Norges historie')} disabled={isGenerating}>Norges historie</button>
          <button type="button" className="example-btn" onClick={() => handleExampleClick('Andre verdenskrig')} disabled={isGenerating}>Andre verdenskrig</button>
          <button type="button" className="example-btn" onClick={() => handleExampleClick('Vikingtiden')} disabled={isGenerating}>Vikingtiden</button>
        </div>
      </form>
    </div>
  );
}


