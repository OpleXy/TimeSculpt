import React, { useState } from 'react';
import { generateTimelineFromPrompt } from '../services/openAiService';

const TextToTimelineForm = ({ onTimelineGenerated, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError('Vennligst skriv inn en beskrivelse av tidslinjen');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      // Kall den nye OpenAI-servicen direkte
      const timelineConfig = await generateTimelineFromPrompt(prompt);
      
      // Send den komplette tidslinjen til parent komponenten
      onTimelineGenerated(timelineConfig);
      
      // Lukk modalen
      if (onClose) {
        onClose();
      }
      
    } catch (error) {
      console.error('Feil ved generering av tidslinje:', error);
      setError(`Kunne ikke generere tidslinje: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExampleClick = (examplePrompt) => {
    setPrompt(examplePrompt);
  };

  return (
    <div className="text-to-timeline-form">
      <h3>Lag tidslinje fra tekst</h3>
      <p>Skriv en kort beskrivelse av tidslinjen du ønsker å lage:</p>
      
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="F.eks: 'en tidslinje over den russiske revolusjon' eller 'andre verdenskrig 1939-1945'"
            rows="3"
            disabled={isGenerating}
          />
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
              onClick={() => handleExampleClick('den kalde krigen')}
              disabled={isGenerating}
            >
              Den kalde krigen
            </button>
          </div>
        </div>

        <div className="form-buttons">
          <button 
            type="button" 
            onClick={onClose}
            disabled={isGenerating}
            className="cancel-btn"
          >
            Avbryt
          </button>
          <button 
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className="generate-btn"
          >
            {isGenerating ? (
              <>
                <span className="spinner"></span>
                Genererer...
              </>
            ) : (
              'Generer tidslinje'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TextToTimelineForm;