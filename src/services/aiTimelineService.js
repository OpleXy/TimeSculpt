// This service handles the AI-powered generation of timeline events from text

// Define common date patterns for parsing
const DATE_PATTERNS = [
  // Year only, e.g. "1969"
  {
    regex: /\b(1[0-9]{3}|20[0-2][0-9])\b/g,
    format: (match) => {
      return new Date(`${match}-01-01`);
    },
    confidence: 0.7
  },
  // Day, month and year in format "DD.MM.YYYY" (Norwegian format)
  {
    regex: /\b([0-3]?[0-9])\.(0?[1-9]|1[0-2])\.(\d{4})\b/g,
    format: (match, day, month, year) => {
      return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    },
    confidence: 0.9
  },
  // Month and year, e.g. "January 1969"
  {
    regex: /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/g,
    format: (match, month, year) => {
      const monthIndex = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ].indexOf(month);
      return new Date(year, monthIndex, 1);
    },
    confidence: 0.8
  },
  // Norwegian month and year, e.g. "januar 1969"
  {
    regex: /\b(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember)\s+(\d{4})\b/gi,
    format: (match, month, year) => {
      const monthIndex = [
        'januar', 'februar', 'mars', 'april', 'mai', 'juni',
        'juli', 'august', 'september', 'oktober', 'november', 'desember'
      ].map(m => m.toLowerCase()).indexOf(month.toLowerCase());
      return new Date(year, monthIndex, 1);
    },
    confidence: 0.8
  }
];

/**
 * Extract dates from text
 * @param {string} text - Text containing potential dates
 * @returns {Array} Array of found dates with their positions and confidence
 */
const extractDates = (text) => {
  const dates = [];
  
  DATE_PATTERNS.forEach(pattern => {
    const regex = new RegExp(pattern.regex);
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      try {
        const dateObj = {
          text: match[0],
          position: match.index,
          date: pattern.format(...match),
          confidence: pattern.confidence
        };
        
        // Verify the date is valid
        if (!isNaN(dateObj.date.getTime())) {
          dates.push(dateObj);
        }
      } catch (error) {
        console.warn('Error parsing date:', match[0], error);
      }
    }
  });
  
  return dates;
};

/**
 * Extract events from text by analyzing sentences and dates
 * @param {string} text - Input text to extract events from
 * @param {Date} startDate - Timeline start date
 * @param {Date} endDate - Timeline end date
 * @returns {Array} Array of event objects
 */
const extractEvents = (text, startDate, endDate) => {
  // Split text into sentences
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  // Find dates in the entire text
  const extractedDates = extractDates(text);
  
  // If no dates found, generate events with evenly distributed dates
  if (extractedDates.length === 0) {
    return generateEvenlyDistributedEvents(sentences, startDate, endDate);
  }
  
  // Array to store the extracted events
  const events = [];
  
  // Process each sentence to see if it contains a date or is connected to a date
  sentences.forEach((sentence, index) => {
    // Check if sentence contains a date
    const sentenceDates = extractedDates.filter(dateObj => 
      sentence.indexOf(dateObj.text) !== -1
    );
    
    if (sentenceDates.length > 0) {
      // Use the date with highest confidence if multiple dates in one sentence
      const bestDateMatch = sentenceDates.sort((a, b) => b.confidence - a.confidence)[0];
      
      // Check if date is within timeline bounds
      if (bestDateMatch.date >= startDate && bestDateMatch.date <= endDate) {
        // Create event
        events.push(createEvent(
          sentence,
          bestDateMatch.date,
          assignRandomProperties()
        ));
      }
    } else if (index > 0 && events.length > 0) {
      // If no date in this sentence, it might be a continuation of previous event
      // We'll only do this if we have at least one event already and
      // the sentence is short enough to likely be part of a continuation
      if (sentence.length < 100 && Math.random() > 0.5) {
        // 50% chance to add as description to the previous event
        const prevEvent = events[events.length - 1];
        prevEvent.description = (prevEvent.description || '') + ' ' + sentence.trim();
      }
    }
  });
  
  // If we couldn't extract enough events, add some evenly distributed ones
  if (events.length < 3 && sentences.length > 3) {
    const additionalEvents = generateEvenlyDistributedEvents(
      sentences.filter(sentence => 
        !events.some(event => event.title.includes(sentence))
      ),
      startDate, 
      endDate,
      Math.min(5 - events.length, sentences.length - events.length)
    );
    
    events.push(...additionalEvents);
  }
  
  // Sort events by date
  events.sort((a, b) => a.date - b.date);
  
  return events;
};

/**
 * Generate events with evenly distributed dates when no dates are found in text
 * @param {Array} sentences - Array of sentences to use for event titles
 * @param {Date} startDate - Timeline start date
 * @param {Date} endDate - Timeline end date
 * @param {number} count - Number of events to generate (default: 5)
 * @returns {Array} Array of event objects
 */
const generateEvenlyDistributedEvents = (sentences, startDate, endDate, count = 5) => {
  const events = [];
  const timeRange = endDate.getTime() - startDate.getTime();
  
  // Use at most the number of sentences we have or the requested count
  const eventsToCreate = Math.min(sentences.length, count);
  
  for (let i = 0; i < eventsToCreate; i++) {
    // Get sentence for this event, prioritizing longer, more substantive sentences
    const sentenceIndex = findBestSentenceIndex(sentences, events);
    if (sentenceIndex === -1) break;
    
    const sentence = sentences[sentenceIndex];
    
    // Calculate evenly distributed dates
    const timeStep = timeRange / (eventsToCreate + 1);
    const date = new Date(startDate.getTime() + timeStep * (i + 1));
    
    // Create the event
    events.push(createEvent(
      sentence,
      date,
      assignRandomProperties()
    ));
  }
  
  return events;
};

/**
 * Find the best sentence to use for an event title
 * @param {Array} sentences - Array of sentences
 * @param {Array} existingEvents - Array of already created events
 * @returns {number} Index of the best sentence to use, or -1 if none found
 */
const findBestSentenceIndex = (sentences, existingEvents) => {
  // Filter out sentences that are already used
  const unusedSentences = sentences.filter(sentence => 
    !existingEvents.some(event => event.title.includes(sentence))
  );
  
  if (unusedSentences.length === 0) return -1;
  
  // Score sentences by length and keyword presence
  const scoredSentences = unusedSentences.map((sentence, index) => {
    let score = 0;
    
    // Prefer sentences of moderate length
    const words = sentence.split(/\s+/).length;
    if (words >= 5 && words <= 15) score += 3;
    else if (words < 5) score += 1;
    else score += 2;
    
    // Prefer sentences with keywords indicating events
    const keywords = ['happened', 'occurred', 'started', 'ended', 'founded', 'created', 'established', 'launched', 'built', 'developed', 'discovered', 'invented', 'introduced'];
    keywords.forEach(keyword => {
      if (sentence.toLowerCase().includes(keyword)) score += 2;
    });
    
    return { index: sentences.indexOf(unusedSentences[index]), score };
  });
  
  // Return the index of the highest scoring sentence
  return scoredSentences.sort((a, b) => b.score - a.score)[0]?.index || 0;
};

/**
 * Create an event object from title and date
 * @param {string} title - Event title
 * @param {Date} date - Event date
 * @param {Object} properties - Additional event properties
 * @returns {Object} Event object
 */
const createEvent = (title, date, properties) => {
  // Clean up the title (remove trailing punctuation, etc.)
  let cleanTitle = title.trim();
  if (cleanTitle.endsWith('.') || cleanTitle.endsWith('!') || cleanTitle.endsWith('?')) {
    cleanTitle = cleanTitle.slice(0, -1);
  }
  
  // Assign default properties
  return {
    title: cleanTitle,
    plainTitle: stripHtml(cleanTitle),
    date: date,
    description: '',
    offset: 0,
    xOffset: 0,
    yOffset: 0,
    ...properties
  };
};

/**
 * Assign random properties to an event (size, color)
 * @returns {Object} Random properties
 */
const assignRandomProperties = () => {
  const sizes = ['small', 'medium', 'large'];
  const colors = ['default', 'blue', 'green', 'red', 'orange', 'purple'];
  
  // Weight distribution to favor middle sizes and standard colors
  const sizeWeights = [0.3, 0.5, 0.2]; // 30% small, 50% medium, 20% large
  const colorWeights = [0.4, 0.15, 0.15, 0.1, 0.1, 0.1]; // 40% default, rest distributed
  
  return {
    size: getRandomWeighted(sizes, sizeWeights),
    color: getRandomWeighted(colors, colorWeights)
  };
};

/**
 * Get a random item from an array based on weights
 * @param {Array} items - Array of items
 * @param {Array} weights - Array of weights (must sum to 1)
 * @returns {*} Random item
 */
const getRandomWeighted = (items, weights) => {
  const cumulativeWeights = [];
  let sum = 0;
  
  // Calculate cumulative weights
  for (const weight of weights) {
    sum += weight;
    cumulativeWeights.push(sum);
  }
  
  // Get random value between 0 and 1
  const random = Math.random();
  
  // Find the index of the first weight greater than random
  for (let i = 0; i < cumulativeWeights.length; i++) {
    if (random <= cumulativeWeights[i]) {
      return items[i];
    }
  }
  
  // Fallback to last item
  return items[items.length - 1];
};

/**
 * Strip HTML tags from text
 * @param {string} html - HTML text
 * @returns {string} Plain text
 */
const stripHtml = (html) => {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

/**
 * Main function to generate timeline events from text
 * @param {string} text - Input text
 * @param {Date} startDate - Timeline start date
 * @param {Date} endDate - Timeline end date
 * @returns {Promise<Array>} Promise resolving to array of events
 */
export const generateTimelineEvents = async (text, startDate, endDate) => {
  // Validate input
  if (!text || !startDate || !endDate) {
    throw new Error('Missing required parameters');
  }
  
  if (startDate >= endDate) {
    throw new Error('Start date must be before end date');
  }
  
  try {
    // Add artificial delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Extract events from text
    const events = extractEvents(text, startDate, endDate);
    
    // Ensure we have at least some events
    if (events.length === 0) {
      // Generate random events if none were extracted
      return generateRandomEvents(startDate, endDate, 3);
    }
    
    return events;
  } catch (error) {
    console.error('Error generating timeline events:', error);
    throw new Error('Failed to generate timeline events');
  }
};

/**
 * Generate completely random events (fallback)
 * @param {Date} startDate - Timeline start date
 * @param {Date} endDate - Timeline end date
 * @param {number} count - Number of events to generate
 * @returns {Array} Array of event objects
 */
const generateRandomEvents = (startDate, endDate, count = 3) => {
  const events = [];
  const timeRange = endDate.getTime() - startDate.getTime();
  
  const genericTitles = [
    'En viktig hendelse',
    'Historisk øyeblikk',
    'Betydningsfullt tidspunkt',
    'Avgjørende hendelse',
    'Viktig milepæl'
  ];
  
  for (let i = 0; i < count; i++) {
    // Generate random date within timeline range
    const randomTime = Math.random() * timeRange;
    const eventDate = new Date(startDate.getTime() + randomTime);
    
    // Create event with generic title
    events.push(createEvent(
      genericTitles[i % genericTitles.length] + ` ${i + 1}`,
      eventDate,
      assignRandomProperties()
    ));
  }
  
  return events.sort((a, b) => a.date - b.date);
};

export default {
  generateTimelineEvents
};