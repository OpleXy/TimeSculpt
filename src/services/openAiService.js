import OpenAI from 'openai';

// Initialiser OpenAI-klienten
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Date fixing functions (copied from working HTML)
function fixTimelineDates(timelineData) {
  if (!timelineData.timeline) return timelineData;
  
  const timeline = timelineData.timeline;
  
  timeline.startDate = fixSingleDate(timeline.startDate);
  timeline.endDate = fixSingleDate(timeline.endDate);
  
  if (timeline.events) {
    timeline.events = timeline.events.map(event => ({
      ...event,
      date: fixSingleDate(event.date)
    }));
  }
  
  return timelineData;
}

function fixSingleDate(dateStr) {
  if (!dateStr) return "1000-01-01";
  
  // If already in correct format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Handle BC dates (Before Christ / f.Kr.)
  if (dateStr.includes('BC') || dateStr.includes('f.Kr') || dateStr.includes('f.kr') || dateStr.includes('BCE')) {
    const yearMatch = dateStr.match(/(\d+)/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      const yearStr = year.toString().padStart(4, '0');
      return `-${yearStr}-01-01`;
    }
  }
  
  // Handle AD dates (Anno Domini / e.Kr.)
  if (dateStr.includes('AD') || dateStr.includes('e.Kr') || dateStr.includes('e.kr') || dateStr.includes('CE')) {
    const yearMatch = dateStr.match(/(\d+)/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      const yearStr = year.toString().padStart(4, '0');
      return `${yearStr}-01-01`;
    }
  }
  
  // Handle ranges like "10000-8000", "1000-800"
  const rangeMatch = dateStr.match(/(\d+)-(\d+)/);
  if (rangeMatch) {
    let startYear = parseInt(rangeMatch[1]);
    let endYear = parseInt(rangeMatch[2]);
    
    let chosenYear;
    if (startYear > endYear) {
      // Prehistoric: 10000-8000, choose 10000 (earlier time)
      chosenYear = startYear;
    } else {
      // Historical: 1000-1100, choose 1000 (earlier time)
      chosenYear = startYear;
    }
    
    // Check if this is likely BC (very old dates)
    if (chosenYear > 3000) {
      // Prehistoric dates are BC
      const yearStr = chosenYear.toString().padStart(4, '0');
      return `-${yearStr}-01-01`;
    } else {
      // More recent dates are AD
      const yearStr = chosenYear.toString().padStart(4, '0');
      return `${yearStr}-01-01`;
    }
  }
  
  // Handle single years
  const yearMatch = dateStr.match(/(\d+)/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    
    // Determine if BC or AD based on year size
    if (year > 3000) {
      // Very old dates are likely BC
      const yearStr = year.toString().padStart(4, '0');
      return `-${yearStr}-01-01`;
    } else {
      // More recent dates are AD
      const yearStr = year.toString().padStart(4, '0');
      return `${yearStr}-01-01`;
    }
  }
  
  return "1000-01-01";
}

/**
 * Generer en komplett tidslinje fra en enkel prompt ved hjelp av OpenAI
 * @param {string} prompt - Brukerens prompt som "en tidslinje over den russiske revolusjon"
 * @returns {Promise<Object>} - Komplett tidslinje-objekt
 */
export async function generateTimelineFromPrompt(prompt) {
  try {
    console.log('🚀 Sender forespørsel til OpenAI...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Du er en ekspert historiker. Lag en JSON-tidslinje med nøyaktig dette formatet:

{"timeline":{"title":"Beskrivende tittel","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD","events":[{"title":"Hendelsestitel","date":"YYYY-MM-DD","description":"Kort beskrivelse","size":"medium","color":"blue"}]}}

KRITISKE REGLER FOR DATOER:
- Alle datoer MÅ være i eksakt YYYY-MM-DD format
- For år ETTER Kristus (1-2024): Bruk positive år som "0800-01-01", "1066-10-14", "1917-02-23"
- For år FØR Kristus: Bruk negative år som "-0500-01-01", "-1000-01-01", "-8000-01-01"
- ALDRI bruk områder som "1000-800" eller "10000-8000"
- ALDRI bruk "f.Kr", "e.Kr", "BC", "AD" i datoene
- Hvis du er usikker på nøyaktig dato, VELG ALLTID det tidligste året og sett dag/måned til 01-01

KRITISK: Inkluder MINST 15-20 viktige hendelser fordelt jevnt over hele tidsperioden!
Dette er ekstremt viktig - tidslinjen skal være rik på detaljer og hendelser.

EKSEMPLER på riktige datoer:
- Steinalderen (8000 f.Kr): "-8000-01-01"
- Bronsealderen (1500 f.Kr): "-1500-01-01"
- Romerriket (500 f.Kr): "-0500-01-01"
- Vikingtiden (800 e.Kr): "0800-01-01"
- Hastings-slaget (1066): "1066-10-14"
- Oktoberrevolusjonen (1917): "1917-10-25"

ANDRE REGLER:
- Titler maks 60 tegn
- Beskrivelser maks 150 tegn
- Størrelser: "small", "medium", "large"
- Farger: "red" (konflikter), "blue" (politisk), "green" (positive), "orange" (vendepunkter), "purple" (kulturelt), "default"

Returner KUN JSON, ingen annen tekst.`
        },
        {
          role: "user",
          content: `Lag en komplett tidslinje for: "${prompt}"`
        }
      ],
      temperature: 0.3,
      max_tokens: 3000
    });

    console.log('📨 Mottok respons fra OpenAI');

    if (!response.choices || !response.choices[0] || !response.choices[0].message) {
      throw new Error('Ugyldig respons fra OpenAI');
    }

    const rawResponse = response.choices[0].message.content;
    console.log('📝 Raw response:', rawResponse);

    // Parse JSON with date fixing (exactly like HTML version)
    let timelineData;
    try {
      const cleanedResponse = rawResponse
        .replace(/```json\n?|\n?```/g, '')
        .replace(/```\n?|\n?```/g, '')
        .trim();
      
      timelineData = JSON.parse(cleanedResponse);
      timelineData = fixTimelineDates(timelineData);
      
    } catch (parseError) {
      throw new Error(`JSON Parsing Error: ${parseError.message}\n\nRaw response: ${rawResponse}`);
    }

    // Validate structure (exactly like HTML version)
    if (!timelineData.timeline || !timelineData.timeline.startDate || !timelineData.timeline.endDate || !timelineData.timeline.events) {
      throw new Error('Invalid timeline structure from OpenAI');
    }

    const timeline = timelineData.timeline;

    // Validate and convert dates
    const startDate = new Date(timeline.startDate);
    const endDate = new Date(timeline.endDate);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Ugyldige datoer i OpenAI-respons');
    }

    if (startDate >= endDate) {
      throw new Error('Startdato må være før sluttdato');
    }

    // Filter valid events (exactly like HTML version)
    const validEvents = timeline.events.filter(event => {
      const eventDate = new Date(event.date);
      return !isNaN(eventDate.getTime()) && eventDate >= startDate && eventDate <= endDate;
    });

    if (validEvents.length < 5) {
      console.warn('⚠️ For få gyldige hendelser, bruker fallback');
      return createFallbackTimeline(prompt);
    }

    // Sort events chronologically
    validEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Convert to the format expected by the main app (exactly like HTML conversion)
    const timelineConfig = {
      title: timeline.title,
      start: startDate,
      end: endDate,
      events: validEvents.map(event => ({
        title: event.title,
        plainTitle: event.title,
        date: new Date(event.date),
        description: event.description || '',
        size: event.size || 'medium',
        color: event.color || 'default',
        offset: 0,
        xOffset: 0,
        yOffset: 0
      })),
      orientation: 'horizontal',
      backgroundColor: 'white',
      timelineColor: '#007bff',
      timelineThickness: 2,
      generatedFromPrompt: true,
      promptText: prompt
    };

    console.log(`✅ Tidslinje generert: ${timelineConfig.title} med ${timelineConfig.events.length} hendelser`);
    
    return timelineConfig;

  } catch (error) {
    console.error('❌ Feil ved generering av tidslinje:', error);
    
    // Return fallback timeline on any error
    return createFallbackTimeline(prompt);
  }
}

/**
 * Opprett en fallback-tidslinje når API feiler
 */
export function createFallbackTimeline(prompt) {
  console.log('🔄 Oppretter fallback-tidslinje...');
  
  const currentYear = new Date().getFullYear();
  
  // Generate more fallback events
  const fallbackEvents = [];
  for (let i = 1; i <= 15; i++) {
    const eventYear = currentYear - 5 + Math.floor((i-1) * 10/15);
    const eventMonth = (i % 12) + 1;
    const eventDay = (i % 28) + 1;
    
    fallbackEvents.push({
      title: `Viktig hendelse ${i} i ${prompt}`,
      plainTitle: `Viktig hendelse ${i} i ${prompt}`,
      date: new Date(`${eventYear}-${eventMonth.toString().padStart(2, '0')}-${eventDay.toString().padStart(2, '0')}`),
      description: `En betydningsfull hendelse som fant sted i forbindelse med ${prompt}.`,
      size: i <= 3 ? 'large' : i <= 8 ? 'medium' : 'small',
      color: ['blue', 'green', 'red', 'orange', 'purple', 'default'][i % 6],
      offset: 0,
      xOffset: 0,
      yOffset: 0
    });
  }
  
  return {
    title: `Tidslinje: ${prompt}`,
    start: new Date(`${currentYear - 5}-01-01`),
    end: new Date(`${currentYear}-12-31`),
    events: fallbackEvents,
    orientation: 'horizontal',
    backgroundColor: 'white',
    timelineColor: '#007bff',
    timelineThickness: 2,
    generatedFromPrompt: true,
    promptText: prompt,
    isFallback: true
  };
}

/**
 * Forenklet kommandoprosessering for bakoverkompatibilitet
 */
export async function processTimelineCommand(command) {
  try {
    console.log(`🔄 Prosesserer kommando: "${command}"`);
    
    // For kommandoer, bruk samme logikk som timeline-generering
    return {
      commandType: 'add_event',
      event: {
        title: 'Test hendelse',
        date: new Date().toISOString().split('T')[0],
        description: 'En test hendelse opprettet fra kommando',
        size: 'medium',
        color: 'default'
      }
    };
    
  } catch (error) {
    console.error('❌ Feil ved kommandoprosessering:', error);
    return {
      commandType: 'error',
      message: 'Kunne ikke behandle kommandoen: ' + error.message,
      success: false
    };
  }
}

/**
 * Alias for bakoverkompatibilitet
 */
export const smartProcessCommand = processTimelineCommand;

/**
 * Test-funksjon
 */
export async function testTimelineGeneration(prompt) {
  console.log(`🧪 Tester tidslinjegenerering for: "${prompt}"`);
  
  try {
    const timeline = await generateTimelineFromPrompt(prompt);
    
    console.log('✅ Test fullført!');
    console.log(`📝 Tittel: ${timeline.title}`);
    console.log(`📅 Periode: ${timeline.start.toLocaleDateString('no-NO')} - ${timeline.end.toLocaleDateString('no-NO')}`);
    console.log(`🎯 Antall hendelser: ${timeline.events.length}`);
    console.log(`🔄 Fallback brukt: ${timeline.isFallback ? 'JA' : 'NEI'}`);
    
    return timeline;
    
  } catch (error) {
    console.error('❌ Test feilet:', error);
    throw error;
  }
}

export default {
  generateTimelineFromPrompt,
  processTimelineCommand,
  smartProcessCommand,
  testTimelineGeneration,
  createFallbackTimeline
};