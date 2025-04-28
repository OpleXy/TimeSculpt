import { useState, useRef, useEffect } from 'react';
import '../styles/timeline-command-input.css';
import { smartProcessCommand } from '../services/openAiService';

function TimelineCommandInput({ timelineData, addEvent }) {
  const [commandText, setCommandText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef(null);
  const commandHistoryRef = useRef(null);

  // Focus the input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Scroll to the bottom of command history when it updates
  useEffect(() => {
    if (commandHistoryRef.current) {
      commandHistoryRef.current.scrollTop = commandHistoryRef.current.scrollHeight;
    }
  }, [commandHistory]);

  // Handle command submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!commandText.trim()) return;
    
    // Add user command to history
    setCommandHistory(prev => [...prev, { type: 'user', text: commandText }]);
    
    // Process the command
    try {
      setIsProcessing(true);

      // Bruk smartProcessCommand fra openAiService
      const result = await smartProcessCommand(commandText);
      
      if (result.commandType === 'add_event' && result.event) {
        // Konverter til format som forventes av tidslinjen
        const eventData = {
          title: result.event.title,
          plainTitle: result.event.title,
          date: new Date(result.event.date),
          description: result.event.description || '',
          size: result.event.size || 'medium',
          color: result.event.color || 'default',
          offset: 0,
          xOffset: 0,
          yOffset: 0
        };
        
        // Legg til hendelsen i tidslinjen
        addEvent(eventData);
        
        // Legg til systemrespons i historikken
        setCommandHistory(prev => [...prev, { 
          type: 'system', 
          text: `La til hendelse: "${result.event.title}" på ${new Date(result.event.date).toLocaleDateString('no-NO')}`,
          success: true,
          eventData: eventData
        }]);
      } 
      else if (result.commandType === 'generate_timeline' && result.timeline) {
        // Håndter generering av hel tidslinje
        setCommandHistory(prev => [...prev, { 
          type: 'system', 
          text: `Genererte tidslinje fra ${new Date(result.timeline.startDate).toLocaleDateString('no-NO')} til ${new Date(result.timeline.endDate).toLocaleDateString('no-NO')} med ${result.timeline.events.length} hendelser.`,
          success: true
        }]);
        
        // Legg til hver hendelse i tidslinjen
        result.timeline.events.forEach(event => {
          addEvent({
            title: event.title,
            plainTitle: event.title,
            date: new Date(event.date),
            description: event.description || '',
            size: event.size || 'medium',
            color: event.color || 'default',
            offset: 0,
            xOffset: 0,
            yOffset: 0
          });
        });
      }
      else if (result.commandType === 'find_event' && result.events) {
        // Håndter søkeresultater
        setCommandHistory(prev => [...prev, { 
          type: 'system', 
          text: result.message || `Fant ${result.events.length} hendelser:`,
          success: true,
          events: result.events
        }]);
      }
      else {
        // Håndter ukjent resultat eller feilmelding
        setCommandHistory(prev => [...prev, { 
          type: 'system', 
          text: result.message || 'Jeg forstod ikke kommandoen helt. Prøv å være mer spesifikk.',
          success: result.success !== false
        }]);
      }
    } 
    catch (error) {
      console.error('Error processing command:', error);
      
      // Add error message to history
      setCommandHistory(prev => [...prev, { 
        type: 'system', 
        text: 'Det oppstod en feil under behandling av kommandoen: ' + error.message,
        success: false 
      }]);
    } 
    finally {
      setIsProcessing(false);
      setCommandText('');
      setHistoryIndex(-1);
    }
  };

  // Handle key navigation for command history
  const handleKeyDown = (e) => {
    // Navigate through command history with up and down arrows
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const userCommands = commandHistory.filter(item => item.type === 'user');
      
      if (userCommands.length > 0) {
        const newIndex = historyIndex >= userCommands.length - 1 ? userCommands.length - 1 : historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommandText(userCommands[userCommands.length - 1 - newIndex].text);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      
      if (historyIndex > 0) {
        const userCommands = commandHistory.filter(item => item.type === 'user');
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommandText(userCommands[userCommands.length - 1 - newIndex].text);
      } else if (historyIndex === 0) {
        // Clear command when reaching the bottom of history
        setHistoryIndex(-1);
        setCommandText('');
      }
    }
  };

  // Render related events list
  const renderEventsList = (events) => {
    if (!events || events.length === 0) return null;
    
    return (
      <ul className="command-events-list">
        {events.map((event, index) => (
          <li key={index} className="command-event-item">
            <div className="command-event-title">{event.plainTitle || event.title}</div>
            <div className="command-event-date">
              {new Date(event.date).toLocaleDateString('no-NO')}
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="timeline-command-container">
      <div 
        className="timeline-command-history" 
        ref={commandHistoryRef}
      >
        {commandHistory.map((item, index) => (
          <div 
            key={index} 
            className={`command-item ${item.type} ${item.success === false ? 'error' : ''}`}
          >
            {item.type === 'user' ? (
              <div className="command-user">
                <span className="command-prefix">Du:</span> {item.text}
              </div>
            ) : (
              <div className="command-system">
                <span className="command-prefix">TimeSculpt AI:</span> {item.text}
                {item.eventData && (
                  <div className="command-event-data">
                    <div className="command-event-data-date">
                      {new Date(item.eventData.date).toLocaleDateString('no-NO')}
                    </div>
                  </div>
                )}
                {item.events && renderEventsList(item.events)}
              </div>
            )}
          </div>
        ))}
        
        {isProcessing && (
          <div className="command-processing">
            <div className="command-processing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="timeline-command-form">
        <input
          ref={inputRef}
          type="text"
          value={commandText}
          onChange={(e) => setCommandText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Spør om å legge til eller finne hendelser..."
          disabled={isProcessing}
          className="timeline-command-input"
        />
        <button 
          type="submit" 
          disabled={isProcessing || !commandText.trim()} 
          className="timeline-command-button"
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
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
      
      <div className="timeline-command-examples">
        <span className="example-label">Eksempler:</span>
        <button 
  onClick={() => setCommandText('Oppsummer hvordan andre verdenskrig startet')}
  className="example-button"
>
  Oppsummer hvordan andre verdenskrig startet
</button>
<button 
  onClick={() => setCommandText('Fortell om slaget ved Stalingrad')}
  className="example-button"
>
  Fortell om slaget ved Stalingrad
</button>
<button 
  onClick={() => setCommandText('Gi en funfact om noe innenfor denne tidslinjen')}
  className="example-button"
>
Gi en funfact
</button>

      </div>
    </div>
  );
}

export default TimelineCommandInput;