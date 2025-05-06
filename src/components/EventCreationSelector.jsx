import { useState } from 'react';
import EventForm from './EventForm';
import TimelineCommandInput from './TimelineCommandInput';
import '../styles/event-creation-selector.css';

function EventCreationSelector({ onAddEvent, timelineStart, timelineEnd, timelineData }) {
  const [creationMethod, setCreationMethod] = useState('manual'); // 'manual' or 'ai'

  // Handle method selection
  const handleMethodChange = (method) => {
    setCreationMethod(method);
  };

  return (
    <div className="event-form">
      <h3>Legg til hendelse</h3>
      
      {/* Method selection buttons */}
      <div className="creation-method-selector">
        <button 
          className={`method-button ${creationMethod === 'manual' ? 'active' : ''}`}
          onClick={() => handleMethodChange('manual')}
        >
          Manuell Oppsett
        </button>
        <button 
          className={`method-button ${creationMethod === 'ai' ? 'active' : ''}`}
          onClick={() => handleMethodChange('ai')}
        >
          AI Generering
        </button>
      </div>

      {/* Render UI based on selected method */}
      {creationMethod === 'ai' ? (
        <div className="ai-generation-form">
          {/* Add TimelineCommandInput for AI generation */}
          <TimelineCommandInput 
            timelineData={timelineData}
            addEvent={onAddEvent}
          />
        </div>
      ) : (
        <div className="manual-event-form">
          <EventForm 
            onAddEvent={onAddEvent} 
            timelineStart={timelineStart} 
            timelineEnd={timelineEnd} 
            showTitle={false}
          />
        </div>
      )}
    </div>
  );
}

export default EventCreationSelector;