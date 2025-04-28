import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function TimelineForm({ onCreateTimeline, onSaveTimeline, onLogin }) {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [orientation, setOrientation] = useState('horizontal');
  const { isAuthenticated } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!title || !startDate || !endDate) {
      alert('Vennligst fyll ut alle feltene');
      return;
    }

    onCreateTimeline({
      title,
      start: new Date(startDate),
      end: new Date(endDate),
      orientation,
      events: [],
      backgroundColor: 'white',
      timelineColor: '#007bff',
      timelineThickness: 2
    });
  };

  const handleSave = () => {
    if (!isAuthenticated) {
      // If not logged in, prompt to login first
      alert('Du må være logget inn for å lagre tidslinjer');
      onLogin();
      return;
    }
    
    onSaveTimeline();
  };

  return (
    <div className="timeline-setup">
      <h2>Lag en tidslinje</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input 
            type="text" 
            id="timelineTitle" 
            placeholder="Tidslinjetittel" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required 
          />
        </div>
        
        <div className="form-group">
          <input 
            type="text" 
            id="timelineStart" 
            placeholder="Start dato" 
            onFocus={(e) => e.target.type = 'date'} 
            onBlur={(e) => !e.target.value ? e.target.type = 'text' : null}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)} 
            required 
          />
        </div>
        
        <div className="form-group">
          <input 
            type="text" 
            id="timelineEnd" 
            placeholder="Slutt dato" 
            onFocus={(e) => e.target.type = 'date'} 
            onBlur={(e) => !e.target.value ? e.target.type = 'text' : null}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)} 
            required 
          />
        </div>
        
        <div className="form-group">
          <select 
            id="orientation" 
            value={orientation}
            onChange={(e) => setOrientation(e.target.value)} 
          >
            <option value="horizontal">Horisontal</option>
            <option value="vertical">Vertikal</option>
          </select>
        </div>
        
        <button type="submit">Opprett Tidslinje</button>
      </form>
      
      <button className="save-timeline-btn" onClick={handleSave}>
        <span>Lagre Tidslinje</span>
      </button>
    </div>
  );
}

export default TimelineForm;