import OpenAI from 'openai';
import { findHistoricalEvent } from './historicalEvents';

// Initialiser OpenAI-klienten med din API-nøkkel
// For utviklingsformål, setter vi en midlertidig API-nøkkel her
// I produksjon bør dette håndteres på en sikker måte via miljøvariabler
const OPENAI_API_KEY = "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"; // Erstatt denne med din faktiske API-nøkkel

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Tillater bruk i nettleseren, men merk at dette eksponerer API-nøkkelen
});

// Enkelt in-memory cache
const commandCache = new Map();

/**
 * Prosesser en tidlinjekommando med OpenAI
 * @param {string} command - Brukerens kommando
 * @returns {Promise<Object>} - Resultatet av kommandoprosesseringen
 */
export async function processTimelineCommand(command) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Bruk denne modellen for beste pris/ytelse 
      messages: [
        {
          role: "system",
          content: `Du er en historieassistent som hjelper med å tolke kommandoer for en tidslinjeapplikasjon.
                   Returner et JSON-objekt med følgende struktur:
                   For legg til hendelse-kommandoer:
                   {
                     "commandType": "add_event",
                     "event": {
                       "title": "Hendelsens tittel",
                       "date": "YYYY-MM-DD", // ISO-datoformat
                       "description": "Kort beskrivelse",
                       "size": "small/medium/large", // valgfritt
                       "color": "default/blue/green/red/orange/purple" // valgfritt
                     }
                   }
                   
                   For tidslinjegenerering:
                   {
                     "commandType": "generate_timeline",
                     "timeline": {
                       "startDate": "YYYY-MM-DD",
                       "endDate": "YYYY-MM-DD",
                       "events": [
                         {
                           "title": "Hendelse 1",
                           "date": "YYYY-MM-DD",
                           "description": "Beskrivelse",
                           "size": "small/medium/large", // valgfritt
                           "color": "default/blue/green/red/orange/purple" // valgfritt
                         },
                         // Flere hendelser (maks 5-7 hendelser)
                       ]
                     }
                   }
                   
                   For søk-kommandoer:
                   {
                     "commandType": "find_event",
                     "searchTerm": "søkebegrepet"
                   }`
        },
        { role: "user", content: command }
      ],
      response_format: { type: "json_object" }, // Tvinger JSON-respons
      temperature: 0.3, // Lavere temperatur gir mer konsekvente svar
      max_tokens: 500 // Begrens svaret for å redusere tokenkostnad
    });

    // Parse JSON-responsen
    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw new Error('Kunne ikke prosessere kommandoen: ' + error.message);
  }
}

/**
 * Prosesser en tidlinjekommando med lokal database først, så cache, så OpenAI
 * @param {string} command - Brukerens kommando
 * @returns {Promise<Object>} - Resultatet av kommandoprosesseringen
 */
export async function smartProcessCommand(command) {
  // Normaliser kommandoen
  const normalizedCommand = command.toLowerCase().trim();
  
  // 1. Sjekk cachen
  if (commandCache.has(normalizedCommand)) {
    console.log('Cache hit for command:', normalizedCommand);
    return commandCache.get(normalizedCommand);
  }
  
  // 2. Sjekk lokal database
  const localResult = findHistoricalEvent(normalizedCommand);
  if (localResult) {
    console.log('Local database hit for command:', normalizedCommand);
    commandCache.set(normalizedCommand, localResult); // Lagre i cache for senere
    return localResult;
  }
  
  // 3. Bruk OpenAI som siste utvei
  console.log('Using OpenAI for command:', normalizedCommand);
  try {
    const aiResult = await processTimelineCommand(normalizedCommand);
    
    // Lagre i cache for senere bruk
    commandCache.set(normalizedCommand, aiResult);
    
    return aiResult;
  } catch (error) {
    console.error('Error processing with OpenAI', error);
    
    // Returner en feilmelding med riktig format
    return {
      commandType: 'error',
      message: 'Kunne ikke behandle forespørselen: ' + error.message,
      success: false
    };
  }
}

export default {
  processTimelineCommand,
  smartProcessCommand
};