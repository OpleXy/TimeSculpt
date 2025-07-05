import OpenAI from 'openai';

// Initialiser OpenAI-klienten med bedre feilhåndtering
const OPENAI_API_KEY = "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";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

/**
 * Test API-tilkobling først
 */
export async function testApiConnection() {
  try {
    console.log('🔍 Tester API-tilkobling...');
    
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API-feil: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ API fungerer! Tilgjengelige modeller:', data.data?.slice(0, 3).map(m => m.id));
    return true;
    
  } catch (error) {
    console.error('❌ API-test feilet:', error.message);
    return false;
  }
}

/**
 * Forenklet timeline-generering med timeout og bedre feilhåndtering
 */
export async function generateTimelineFromPrompt(prompt) {
  try {
    console.log(`🚀 Starter generering for: "${prompt}"`);
    
    // Test API først
    const apiWorking = await testApiConnection();
    if (!apiWorking) {
      throw new Error('API-tilkobling fungerer ikke');
    }

    console.log('📡 Sender forespørsel til OpenAI...');
    
    // Bruk en enklere prompt for å redusere sannsynligheten for feil
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Du er historiker. Lag en JSON-tidslinje med dette formatet:
{"timeline":{"title":"Tittel","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD","events":[{"title":"Hendelse","date":"YYYY-MM-DD","description":"Beskrivelse","size":"medium","color":"blue"}]}}

Regler:
- Kun datoer i YYYY-MM-DD format
- 5-10 hendelser
- Kun JSON, ingen annen tekst`
        },
        { 
          role: "user", 
          content: `Lag tidslinje for: ${prompt}` 
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    console.log('📨 Mottok svar fra OpenAI');
    
    if (!response.choices || !response.choices[0] || !response.choices[0].message) {
      throw new Error('Ugyldig respons fra OpenAI');
    }

    // Parse JSON med robust feilhåndtering
    let result;
    try {
      const responseText = response.choices[0].message.content.trim();
      console.log('📝 Raw response:', responseText);
      
      // Fjern markdown og andre formateringer
      const cleanedResponse = responseText
        .replace(/```json\n?|\n?```/g, '')
        .replace(/```\n?|\n?```/g, '')
        .trim();
      
      console.log('🧹 Cleaned response:', cleanedResponse);
      
      result = JSON.parse(cleanedResponse);
      console.log('✅ JSON parsed successfully:', result);
      
    } catch (parseError) {
      console.error('❌ JSON parsing feilet:', parseError);
      console.error('Raw response var:', response.choices[0].message.content);
      
      // Fallback: opprett en enkel tidslinje
      return createFallbackTimeline(prompt);
    }

    // Valider responsen
    if (!result.timeline || !result.timeline.startDate || !result.timeline.endDate || !result.timeline.events) {
      console.warn('⚠️ Ugyldig respons struktur, bruker fallback');
      return createFallbackTimeline(prompt);
    }

    // Valider og konverter datoer
    const startDate = new Date(result.timeline.startDate);
    const endDate = new Date(result.timeline.endDate);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.warn('⚠️ Ugyldige datoer, bruker fallback');
      return createFallbackTimeline(prompt);
    }

    if (startDate >= endDate) {
      console.warn('⚠️ Startdato er ikke før sluttdato, bruker fallback');
      return createFallbackTimeline(prompt);
    }

    // Valider hendelser
    const validEvents = result.timeline.events.filter(event => {
      const eventDate = new Date(event.date);
      const isValidDate = !isNaN(eventDate.getTime());
      const isWithinRange = eventDate >= startDate && eventDate <= endDate;
      
      if (!isValidDate) {
        console.warn(`⚠️ Ugyldig dato: ${event.date} for ${event.title}`);
        return false;
      }
      
      if (!isWithinRange) {
        console.warn(`⚠️ Dato utenfor range: ${event.title} (${event.date})`);
        return false;
      }
      
      return true;
    });

    if (validEvents.length < 5) {
      console.warn('⚠️ For få gyldige hendelser, bruker fallback');
      return createFallbackTimeline(prompt);
    }

    // Sorter hendelser
    validEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Opprett timeline-objekt
    const timelineConfig = {
      title: result.timeline.title,
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
    console.error('❌ Feil ved generering:', error);
    
    // Returner fallback ved alle feil
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
 * Forenklet kommandoprosessering
 */
export async function processTimelineCommand(command) {
  try {
    console.log(`🔄 Prosesserer kommando: "${command}"`);
    
    // Forenklet respons uten API-kall for testing
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
 * Test-funksjon med bedre debugging
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
  testApiConnection
};