/**
 * Handle adding multiple related events for a person (like birth and death)
 * @param {string} person - The person's name
 * @param {Array} eventTypes - Array of event types to add (e.g., ['fødsel', 'død'])
 * @param {Object} timelineData - Current timeline data
 * @param {Function} addEvent - Function to add events
 * @returns {Promise<Object>} - Result of processing
 */
const handleMultipleEventsForPerson = async (person, eventTypes, timelineData, addEvent) => {
    // Validate that we have a timeline with start and end dates
    if (!timelineData.start || !timelineData.end) {
      return {
        success: false,
        message: 'Kan ikke legge til hendelser - ingen tidslinje er opprettet.'
      };
    }
    
    console.log(`Processing multiple events for person: ${person}, events: ${eventTypes.join(', ')}`);
    
    const results = [];
    const addedEvents = [];
    
    // Try to find biographical data
    const bioData = await researchBiographicalData(person);
    
    if (!bioData || (!bioData.birth && !bioData.death)) {
      return {
        success: false,
        message: `Kunne ikke finne nok biografisk informasjon om ${person}.`
      };
    }
    
    // Add birth event if requested and found
    if (eventTypes.includes('fødsel') && bioData.birth) {
      const birthDate = new Date(bioData.birth.date);
      
      // Check if the date is within timeline range
      if (birthDate >= timelineData.start && birthDate <= timelineData.end) {
        const birthEvent = {
          title: `${person} blir født`,
          plainTitle: `${person} blir født`,
          date: birthDate,
          description: bioData.birth.description || `${person} ble født ${birthDate.toLocaleDateString('no-NO')}.`,
          size: 'medium',
          color: 'blue',
          offset: 0,
          xOffset: 0,
          yOffset: 0
        };
        
        addEvent(birthEvent);
        addedEvents.push(birthEvent);
        results.push(`fødsel: ${birthDate.toLocaleDateString('no-NO')}`);
      }
    }
    
    // Add death event if requested and found
    if (eventTypes.includes('død') && bioData.death) {
      const deathDate = new Date(bioData.death.date);
      
      // Check if the date is within timeline range
      if (deathDate >= timelineData.start && deathDate <= timelineData.end) {
        const deathEvent = {
          title: `${person} dør`,
          plainTitle: `${person} dør`,
          date: deathDate,
          description: bioData.death.description || `${person} døde ${deathDate.toLocaleDateString('no-NO')}.`,
          size: 'medium',
          color: 'red',
          offset: 0,
          xOffset: 0,
          yOffset: 0
        };
        
        addEvent(deathEvent);
        addedEvents.push(deathEvent);
        results.push(`død: ${deathDate.toLocaleDateString('no-NO')}`);
      }
    }
    
    if (addedEvents.length > 0) {
      return {
        success: true,
        message: `La til ${addedEvents.length} hendelser for ${person}: ${results.join(', ')}`,
        events: addedEvents
      };
    } else {
      return {
        success: false,
        message: `Fant informasjon om ${person}, men datoene er utenfor tidslinjeperioden.`,
        commandType: 'error'
      };
    }
  };
  
  /**
   * Research biographical data about a person
   * @param {string} person - The person's name
   * @returns {Promise<Object>} - Biographical data including birth and death info
   */
  const researchBiographicalData = async (person) => {
    // Normalized person name for matching
    const normalizedName = person.toLowerCase();
    
    // Simple database of well-known Norwegian people
    const norwegianPeople = {
      'gunnar sønsteby': {
        birth: {
          date: '1918-01-11',
          description: 'Gunnar Sønsteby ble født i Rjukan, Norge.'
        },
        death: {
          date: '2012-05-10',
          description: 'Gunnar Sønsteby døde i Oslo, 94 år gammel.'
        },
        info: 'Gunnar "Kjakan" Sønsteby var Norges høyest dekorerte borger og en motstandsmann under andre verdenskrig.'
      },
      'roald amundsen': {
        birth: {
          date: '1872-07-16',
          description: 'Roald Amundsen ble født i Borge, Norge.'
        },
        death: {
          date: '1928-06-18',
          description: 'Roald Amundsen forsvant under en redningsaksjon i Barentshavet.'
        },
        info: 'Roald Amundsen var en norsk polfarer som ledet den første ekspedisjonen til Sydpolen i 1911.'
      },
      'sonja henie': {
        birth: {
          date: '1912-04-08',
          description: 'Sonja Henie ble født i Kristiania (Oslo), Norge.'
        },
        death: {
          date: '1969-10-12',
          description: 'Sonja Henie døde av leukemi i et fly på vei til Oslo.'
        },
        info: 'Sonja Henie var en norsk kunstløper og filmstjerne som vant tre olympiske gullmedaljer.'
      },
      'edvard grieg': {
        birth: {
          date: '1843-06-15',
          description: 'Edvard Grieg ble født i Bergen, Norge.'
        },
        death: {
          date: '1907-09-04',
          description: 'Edvard Grieg døde i Bergen etter lang tids sykdom.'
        },
        info: 'Edvard Grieg var en norsk komponist og pianist, kjent for sine romantiske komposisjoner.'
      },
      'henrik ibsen': {
        birth: {
          date: '1828-03-20',
          description: 'Henrik Ibsen ble født i Skien, Norge.'
        },
        death: {
          date: '1906-05-23',
          description: 'Henrik Ibsen døde i Kristiania (Oslo) etter flere slag.'
        },
        info: 'Henrik Ibsen var en norsk dramatiker og regnes som "den moderne dramaets far".'
      },
      'fridtjof nansen': {
        birth: {
          date: '1861-10-10',
          description: 'Fridtjof Nansen ble født i Store Frøen gård i Christiania (Oslo), Norge.'
        },
        death: {
          date: '1930-05-13',
          description: 'Fridtjof Nansen døde på Polhøgda i Lysaker, Norge.'
        },
        info: 'Fridtjof Nansen var en norsk polfarer, vitenskapsmann, diplomat og humanist.'
      }
    };
    
    // Try to find the person in our database
    for (const [key, data] of Object.entries(norwegianPeople)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return data;
      }
    }
    
    // For Gunnar Sønsteby specifically, ensure we match even with different spellings
    if (normalizedName.includes('gunnar') && 
        (normalizedName.includes('sønteby') || normalizedName.includes('sonteby') || 
         normalizedName.includes('sønsteby') || normalizedName.includes('sonsteby'))) {
      return norwegianPeople['gunnar sønsteby'];
    }
    
    // If no exact match, try to make a best guess based on available data
    // This would typically call an external API or knowledge base
    // For this example, we'll return null to indicate no match
    return null;
  };/**
   * Enhanced Timeline Command Processor
   * Supports multi-event commands like "gi meg de 10 viktigste hendelsene i andre verdenskrig"
   */
  
  // Import the required services and data
  import { historicalEvents } from './historicalEvents';
  import { ww2Events } from './ww2Events';
  
  // Combine all historical event data sets
  const allHistoricalEvents = {
    ...historicalEvents,
    ...ww2Events
  };
  
  /**
   * Process a natural language command and perform the appropriate action on the timeline
   * @param {string} command - The natural language command from the user
   * @param {Object} timelineData - The current timeline data
   * @param {Function} addEvent - Function to add an event to the timeline
   * @returns {Promise<Object>} - Result of the command processing
   */
  export const processTimelineCommand = async (command, timelineData, addEvent) => {
    try {
      // Normalize the command (lowercase, remove extra spaces)
      const normalizedCommand = command.toLowerCase().trim();
      
      // Check if this is a multi-event request
      if (isMultiEventRequest(normalizedCommand)) {
        return await handleMultiEventRequest(normalizedCommand, timelineData, addEvent);
      }
      
      // Extract the command type and subject
      const parsedCommand = parseCommand(normalizedCommand);
      
      // Process based on the command type
      switch (parsedCommand.commandType) {
        case 'add_event':
          return await handleAddEventCommand(parsedCommand.subject, timelineData, addEvent);
        case 'add_multiple_events':
          return await handleMultipleEventsForPerson(parsedCommand.subject, parsedCommand.events, timelineData, addEvent);
        case 'find_event': 
          return await handleFindEventCommand(parsedCommand.subject, timelineData);
        case 'unknown':
        default:
          return {
            success: false,
            message: 'Beklager, jeg forstod ikke kommandoen. Prøv å spørre om å legge til eller finne hendelser i tidslinjen.'
          };
      }
    } catch (error) {
      console.error('Error processing timeline command:', error);
      return {
        success: false,
        message: 'Det oppstod en feil ved behandling av kommandoen: ' + error.message
      };
    }
  };
  
  /**
   * Determine if a command is requesting multiple events
   * @param {string} command - Normalized command
   * @returns {boolean} - True if this is a multi-event request
   */
  const isMultiEventRequest = (command) => {
    // Check for phrases indicating multiple events
    const multiEventPatterns = [
      /gi meg de \d+ viktigste/i,
      /vis meg \d+ hendelse/i,
      /legg til \d+ hendelse/i,
      /\d+ viktigste/i,
      /flere hendelser/i,
      /mange hendelser/i,
      /alle hendelser/i,
      /viktigste hendelser/i,
      /gi meg hendelser/i
    ];
    
    return multiEventPatterns.some(pattern => pattern.test(command));
  };
  
  /**
   * Parse the command to determine what the user wants to do
   * @param {string} command - The normalized command
   * @returns {Object} - The command type and subject
   */
  const parseCommand = (command) => {
    // Check for multi-event in one command (like birth and death)
    const multiEventInOneCommandPatterns = [
      /(.+) ble født og døde/i,
      /når (.+) ble født og døde/i,
      /fødsel og død (av|til) (.+)/i,
      /når (.+) ble født og når .+ døde/i
    ];
    
    // Check for multi-event in one command
    for (const pattern of multiEventInOneCommandPatterns) {
      const match = command.match(pattern);
      if (match) {
        // Extract the person's name - it could be in capture group 1 or 2
        const personName = match[1] || match[2];
        if (personName) {
          return {
            commandType: 'add_multiple_events',
            subject: personName,
            events: ['fødsel', 'død']
          };
        }
      }
    }
    
    // Check for add event patterns
    const addEventPatterns = [
      /legg til (en |et )?(ny |nytt )?(event|hendelse) (om|av|for|når) (.+)/i,
      /add (a |an )?(new )?(event) (about|for|when) (.+)/i,
      /opprett (en |et )?(ny |nytt )?(event|hendelse) (om|av|for|når) (.+)/i,
      /lag (en |et )?(ny |nytt )?(event|hendelse) (om|av|for|når) (.+)/i,
      /legg til når (.+)/i, // Simpler form: "legg til når noe skjedde"
      /legg til (.+)/i      // Even simpler: "legg til noe"
    ];
    
    // Check for find event patterns
    const findEventPatterns = [
      /finn (en |et )?(event|hendelse) (om|av|for|når) (.+)/i,
      /find (a |an )?(event) (about|for|when) (.+)/i,
      /søk etter (en |et )?(event|hendelse) (om|av|for|når) (.+)/i,
      /har tidslinjen (en |et )?(event|hendelse) (om|av|for|når) (.+)/i
    ];
    
    // Check for add event commands
    for (const pattern of addEventPatterns) {
      const match = command.match(pattern);
      if (match) {
        const lastCaptureGroup = match[match.length - 1];
        return {
          commandType: 'add_event',
          subject: lastCaptureGroup // Get the last capture group which should be the subject
        };
      }
    }
    
    // Check for find event commands
    for (const pattern of findEventPatterns) {
      const match = command.match(pattern);
      if (match) {
        const lastCaptureGroup = match[match.length - 1];
        return {
          commandType: 'find_event',
          subject: lastCaptureGroup // Get the last capture group which should be the subject
        };
      }
    }
    
    // If no specific pattern matched, return unknown
    return {
      commandType: 'unknown',
      subject: command
    };
  };
  
  /**
   * Handle a command to add an event
   * @param {string} subject - The subject of the event to add
   * @param {Object} timelineData - The current timeline data
   * @param {Function} addEvent - Function to add an event
   * @returns {Promise<Object>} - Result of the add event operation
   */
  const handleAddEventCommand = async (subject, timelineData, addEvent) => {
    // Validate that we have a timeline with start and end dates
    if (!timelineData.start || !timelineData.end) {
      return {
        success: false,
        message: 'Kan ikke legge til hendelser - ingen tidslinje er opprettet.'
      };
    }
    
    try {
      // First, check if we have this event in our expanded historical events database
      const localEvent = findEventInLocalDatabase(subject);
      
      if (localEvent) {
        // We found a matching event in our database, use it
        const eventDate = new Date(localEvent.date);
        
        // Check if the event date is within timeline range
        if (eventDate >= timelineData.start && eventDate <= timelineData.end) {
          const eventData = {
            title: localEvent.title,
            plainTitle: localEvent.title, // Stripped HTML version
            date: eventDate,
            description: localEvent.description || '',
            size: localEvent.size || 'medium',
            color: localEvent.color || 'default',
            offset: 0,
            xOffset: 0,
            yOffset: 0
          };
          
          // Add the event to the timeline
          addEvent(eventData);
          
          return {
            success: true,
            message: `La til hendelse: "${localEvent.title}" på ${eventDate.toLocaleDateString('no-NO')}`,
            eventData: eventData
          };
        }
      }
      
      // If we couldn't find a matching event in the database, or it's outside the timeline range,
      // fall back to the original research method
      const eventDetails = await researchEventDetails(subject, timelineData.start, timelineData.end);
      
      // If we couldn't find a date for the event
      if (!eventDetails.date) {
        return {
          success: false,
          message: `Kunne ikke finne en dato for "${subject}" innenfor tidslinjeperioden.`
        };
      }
      
      // Create the event object
      const eventData = {
        title: eventDetails.title,
        plainTitle: eventDetails.title, // Stripped HTML version
        date: eventDetails.date,
        description: eventDetails.description || '',
        size: eventDetails.size || 'medium',
        color: eventDetails.color || 'default',
        offset: 0,
        xOffset: 0,
        yOffset: 0
      };
      
      // Add the event to the timeline
      addEvent(eventData);
      
      return {
        success: true,
        message: `La til hendelse: "${eventDetails.title}" på ${eventDetails.date.toLocaleDateString('no-NO')}`,
        eventData: eventData
      };
    } catch (error) {
      console.error('Error handling add event command:', error);
      return {
        success: false,
        message: 'Kunne ikke legge til hendelsen: ' + error.message
      };
    }
  };
  
  /**
   * Find an event in our local database based on a subject
   * @param {string} subject - The subject to search for
   * @returns {Object|null} - The found event or null
   */
  const findEventInLocalDatabase = (subject) => {
    const normalizedSubject = subject.toLowerCase();
    
    // Search for direct keyword matches in our database
    for (const [key, event] of Object.entries(allHistoricalEvents)) {
      if (normalizedSubject.includes(key)) {
        return event;
      }
    }
    
    // Search for partial matches in title or description
    for (const event of Object.values(allHistoricalEvents)) {
      const titleLower = event.title.toLowerCase();
      const descLower = (event.description || '').toLowerCase();
      
      if (titleLower.includes(normalizedSubject) || normalizedSubject.includes(titleLower) ||
          descLower.includes(normalizedSubject)) {
        return event;
      }
    }
    
    return null;
  };
  
  /**
   * Handle a command to find an event
   * @param {string} subject - The subject to search for
   * @param {Object} timelineData - The current timeline data
   * @returns {Promise<Object>} - Result of the find operation
   */
  const handleFindEventCommand = async (subject, timelineData) => {
    // Validate that we have a timeline with events
    if (!timelineData.events || timelineData.events.length === 0) {
      return {
        success: false,
        message: 'Ingen hendelser å søke i - tidslinjen er tom.'
      };
    }
    
    // Normalize the subject for searching
    const normalizedSubject = subject.toLowerCase();
    
    // Look for matches in the event titles and descriptions
    const matches = timelineData.events.filter(event => {
      const title = (event.plainTitle || event.title || '').toLowerCase();
      const description = (event.description || '').toLowerCase();
      
      return title.includes(normalizedSubject) || description.includes(normalizedSubject);
    });
    
    if (matches.length === 0) {
      // If no exact matches, try to find related events
      const relatedEvents = await findRelatedEvents(subject, timelineData.events);
      
      if (relatedEvents.length === 0) {
        return {
          success: false,
          message: `Fant ingen hendelser relatert til "${subject}" i tidslinjen.`
        };
      }
      
      return {
        success: true,
        message: `Fant ${relatedEvents.length} hendelser som kan være relatert til "${subject}":`,
        events: relatedEvents
      };
    }
    
    return {
      success: true,
      message: `Fant ${matches.length} hendelser om "${subject}":`,
      events: matches
    };
  };
  
  /**
   * Extract a topic from a multi-event request
   * @param {string} command - Normalized command
   * @returns {Object} - Topic information with type and details
   */
  const extractTopic = (command) => {
    // Check for specific historical periods
    const topics = [
      { 
        type: 'period',
        name: 'ww2',
        patterns: ['andre verdenskrig', 'world war 2', 'world war ii', 'ww2'],
        dateRange: { start: new Date('1939-01-01'), end: new Date('1945-12-31') }
      },
      { 
        type: 'period',
        name: 'ww1',
        patterns: ['første verdenskrig', 'world war 1', 'world war i', 'ww1'],
        dateRange: { start: new Date('1914-07-01'), end: new Date('1918-11-30') }
      },
      { 
        type: 'period',
        name: 'cold_war',
        patterns: ['kald krig', 'den kalde krigen', 'cold war'],
        dateRange: { start: new Date('1947-01-01'), end: new Date('1991-12-31') }
      },
      { 
        type: 'theme',
        name: 'space',
        patterns: ['romfart', 'space race', 'romkappløpet', 'månelanding', 'moon landing'],
        keywords: ['rom', 'space', 'månen', 'moon', 'apollo', 'sputnik', 'nasa']
      },
      { 
        type: 'theme',
        name: 'norwegian_history',
        patterns: ['norsk historie', 'norges historie', 'norwegian history'],
        keywords: ['norge', 'norwegian', 'norsk', 'eidsvoll', 'grunnlov', 'union', 'olje']
      }
    ];
    
    // Try to find matching topic
    for (const topic of topics) {
      if (topic.patterns.some(pattern => command.includes(pattern))) {
        return topic;
      }
    }
    
    // Default to a general topic if no specific match
    return {
      type: 'general',
      name: 'general_history',
      keywords: ['viktig', 'important', 'historie', 'history']
    };
  };
  
  /**
   * Extract number of requested events from command
   * @param {string} command - Normalized command
   * @returns {number} - Number of events requested (default to 5 if not specified)
   */
  const extractNumberOfEvents = (command) => {
    const match = command.match(/\b(\d+)\b/);
    if (match) {
      return Math.min(parseInt(match[1]), 20); // Cap at 20 events max
    }
    return 10; // Default number of events
  };
  
  /**
   * Handle a request for multiple events
   * @param {string} command - Normalized command
   * @param {Object} timelineData - Current timeline data
   * @param {Function} addEvent - Function to add events
   * @returns {Promise<Object>} - Result of processing
   */
  const handleMultiEventRequest = async (command, timelineData, addEvent) => {
    // Validate that we have a timeline with start and end dates
    if (!timelineData.start || !timelineData.end) {
      return {
        success: false,
        message: 'Kan ikke legge til hendelser - ingen tidslinje er opprettet.'
      };
    }
    
    // Extract topic and number of events
    const topic = extractTopic(command);
    const numberOfEvents = extractNumberOfEvents(command);
    
    console.log(`Processing multi-event request for topic: ${topic.name}, requesting ${numberOfEvents} events`);
    
    // Find relevant events based on topic
    let relevantEvents = [];
    
    if (topic.type === 'period') {
      // For periods, filter events by date range
      relevantEvents = findEventsByDateRange(topic.dateRange.start, topic.dateRange.end);
      console.log(`Found ${relevantEvents.length} events in date range for ${topic.name}`);
    } else {
      // For themes, filter by keywords
      relevantEvents = findEventsByKeywords(topic.keywords || [topic.name]);
      console.log(`Found ${relevantEvents.length} events matching keywords for ${topic.name}`);
    }
    
    // If we couldn't find enough events, try to use all events
    if (relevantEvents.length < numberOfEvents) {
      console.log(`Not enough events found, using all available events`);
      // Use all events but filter to timeline range
      relevantEvents = Object.values(allHistoricalEvents).filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= timelineData.start && eventDate <= timelineData.end;
      });
    }
    
    // Sort events by importance (using size as a proxy for importance)
    const sortedEvents = sortEventsByImportance(relevantEvents);
    
    // Limit to requested number
    const selectedEvents = sortedEvents.slice(0, numberOfEvents);
    
    // Add events to timeline
    let addedCount = 0;
    const addedEvents = [];
    
    if (selectedEvents.length > 0) {
      for (const event of selectedEvents) {
        try {
          // Convert string date to Date object if needed
          const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
          
          // Check if the event is within timeline range
          if (eventDate >= timelineData.start && eventDate <= timelineData.end) {
            // Create proper event object
            const eventData = {
              title: event.title,
              plainTitle: event.title, // Stripped HTML version
              date: eventDate,
              description: event.description || '',
              size: event.size || 'medium',
              color: event.color || 'default',
              offset: 0,
              xOffset: 0,
              yOffset: 0
            };
            
            // Add event to timeline
            addEvent(eventData);
            addedCount++;
            addedEvents.push(eventData);
          }
        } catch (error) {
          console.warn('Error adding event:', error);
        }
      }
    }
    
    if (addedCount > 0) {
      return {
        success: true,
        message: `La til ${addedCount} hendelser om ${translateTopicToNorwegian(topic.name)}.`,
        events: addedEvents
      };
    } else {
      return {
        success: false,
        message: `Fant ingen hendelser om ${translateTopicToNorwegian(topic.name)} innenfor tidslinjeperioden.`,
        commandType: 'error'
      };
    }
  };
  
  /**
   * Find events by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} - Events within the date range
   */
  const findEventsByDateRange = (startDate, endDate) => {
    return Object.values(allHistoricalEvents).filter(event => {
      try {
        const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
        return eventDate >= startDate && eventDate <= endDate;
      } catch (error) {
        console.warn('Error processing date for event:', event, error);
        return false;
      }
    });
  };
  
  /**
   * Find events by keywords
   * @param {Array} keywords - Keywords to search for
   * @returns {Array} - Events matching the keywords
   */
  const findEventsByKeywords = (keywords) => {
    return Object.values(allHistoricalEvents).filter(event => {
      const textToSearch = `${event.title.toLowerCase()} ${(event.description || '').toLowerCase()}`;
      return keywords.some(keyword => textToSearch.includes(keyword.toLowerCase()));
    });
  };
  
  /**
   * Sort events by importance (using size and hardcoded importance)
   * @param {Array} events - Events to sort
   * @returns {Array} - Sorted events
   */
  const sortEventsByImportance = (events) => {
    // Define importance values for event sizes
    const sizeImportance = {
      'large': 3,
      'medium': 2,
      'small': 1
    };
    
    // Define importance values for event colors
    const colorImportance = {
      'red': 3,    // Critical events often use red
      'orange': 2, // Important but not critical
      'blue': 2,   // Significant positive events
      'green': 2,  // Positive milestones
      'purple': 1,
      'default': 1
    };
    
    // Major historical events that should be prioritized
    const criticalEvents = [
      'Tyskland invaderer Polen',
      'Pearl Harbor',
      'D-dagen',
      'Atombombing av Hiroshima',
      'Nazi-Tyskland overgir seg',
      'Japan overgir seg',
      'Berlinmurens fall',
      'Månelanding',
      'Norges grunnlov',
      'Global finanskrise',
      'COVID-19'
    ];
    
    return [...events].sort((a, b) => {
      // Calculate importance score for each event
      const scoreA = 
        (criticalEvents.some(event => a.title.includes(event)) ? 10 : 0) + 
        (sizeImportance[a.size] || 1) + 
        (colorImportance[a.color] || 1);
      
      const scoreB = 
        (criticalEvents.some(event => b.title.includes(event)) ? 10 : 0) + 
        (sizeImportance[b.size] || 1) + 
        (colorImportance[b.color] || 1);
      
      // Sort by importance score (descending)
      return scoreB - scoreA;
    });
  };
  
  /**
   * Translate topic name to Norwegian
   * @param {string} topicName - Topic name
   * @returns {string} - Norwegian translation
   */
  const translateTopicToNorwegian = (topicName) => {
    const translations = {
      'ww2': 'andre verdenskrig',
      'ww1': 'første verdenskrig', 
      'cold_war': 'den kalde krigen',
      'space': 'romkappløpet',
      'norwegian_history': 'norsk historie',
      'general_history': 'historie'
    };
    
    return translations[topicName] || topicName;
  };
  
  /**
   * Research details about a historical event using NLP techniques
   * @param {string} subject - The subject to research
   * @param {Date} startDate - The start date of the timeline
   * @param {Date} endDate - The end date of the timeline
   * @returns {Promise<Object>} - Details about the event
   */
  const researchEventDetails = async (subject, startDate, endDate) => {
    // Check for specific historical events related to Poland's invasions
    if (subject.includes('polen') && (subject.includes('invadert') || subject.includes('innvadert') || subject.includes('invasjon'))) {
      // World War II German invasion of Poland
      if (new Date('1939-01-01') >= startDate && new Date('1939-12-31') <= endDate) {
        return {
          title: 'Tyskland invaderer Polen',
          date: new Date('1939-09-01'),
          description: 'Tyskland invaderte Polen 1. september 1939, noe som markerte starten på andre verdenskrig i Europa.',
          size: 'large',
          color: 'red'
        };
      }
      // Soviet invasion of Poland
      else if (new Date('1939-01-01') >= startDate && new Date('1939-12-31') <= endDate) {
        return {
          title: 'Sovjetunionen invaderer Polen',
          date: new Date('1939-09-17'),
          description: 'Sovjetunionen invaderte Øst-Polen 17. september 1939, som en del av den hemmelige Molotov-Ribbentrop-pakten med Nazi-Tyskland.',
          size: 'medium',
          color: 'red'
        };
      }
      // 1795 Third Partition of Poland
      else if (new Date('1795-01-01') >= startDate && new Date('1795-12-31') <= endDate) {
        return {
          title: 'Tredje deling av Polen',
          date: new Date('1795-10-24'),
          description: 'Den tredje delingen av Polen i 1795 resulterte i at Polen forsvant fra kartet, delt mellom Det russiske imperiet, Preussen og Østerrike.',
          size: 'medium',
          color: 'orange'
        };
      }
      // 1772 First Partition of Poland
      else if (new Date('1772-01-01') >= startDate && new Date('1772-12-31') <= endDate) {
        return {
          title: 'Første deling av Polen',
          date: new Date('1772-08-05'),
          description: 'Den første delingen av Polen-Litauen i 1772 hvor Russland, Preussen og Østerrike tok kontroll over deler av polsk territorium.',
          size: 'medium',
          color: 'orange'
        };
      }
      // Default to WWII invasion if in appropriate timeframe
      else if (startDate <= new Date('1939-09-01') && endDate >= new Date('1939-09-01')) {
        return {
          title: 'Tyskland invaderer Polen',
          date: new Date('1939-09-01'),
          description: 'Tyskland invaderte Polen 1. september 1939, noe som markerte starten på andre verdenskrig i Europa.',
          size: 'large',
          color: 'red'
        };
      }
    }
    
    // If we couldn't match a specific event or the timeline doesn't include the known dates,
    // we'll try to extract a date from the subject itself
    const dates = extractDatesFromText(subject);
    if (dates.length > 0) {
      // Find the first date that's within the timeline range
      const validDate = dates.find(date => date >= startDate && date <= endDate);
      
      if (validDate) {
        return {
          title: capitalizeFirstLetter(subject),
          date: validDate,
          description: '',
          size: 'medium',
          color: 'default'
        };
      }
    }
    
    // If we're specifically dealing with Poland but couldn't find a date,
    // let's attempt to place the event somewhere in the timeline as a best guess
    if (subject.includes('polen') && timelineSpansWWII(startDate, endDate)) {
      return {
        title: 'Tysk invasjon av Polen',
        date: new Date('1939-09-01'),
        description: 'Tyskland invaderte Polen 1. september 1939, noe som markerte starten på andre verdenskrig i Europa.',
        size: 'large',
        color: 'red'
      };
    }
    
    // For other subjects, let's try to find a relevant date within the timeline
    // This is a simplified approach; in a real-world application, this would
    // connect to an external API or knowledge base
    
    // Calculate a date roughly 20% into the timeline as a fallback
    const timelineRange = endDate.getTime() - startDate.getTime();
    const estimatedDate = new Date(startDate.getTime() + (timelineRange * 0.2));
    
    return {
      title: capitalizeFirstLetter(subject),
      date: estimatedDate,
      description: 'En hendelse om ' + subject,
      size: 'medium',
      color: 'default'
    };
  };
  
  /**
   * Find related events in the existing timeline
   * @param {string} subject - The subject to find related events for
   * @param {Array} events - The existing events in the timeline
   * @returns {Promise<Array>} - Array of related events
   */
  const findRelatedEvents = async (subject, events) => {
    // In a real implementation, this would use more sophisticated NLP
    // For now, we'll do a simple keyword matching
    
    // Extract keywords from the subject
    const keywords = subject.toLowerCase().split(/\s+/)
      .filter(word => word.length > 3); // Only consider words with more than 3 characters
    
    if (keywords.length === 0) {
      return [];
    }
    
    // Find events that match any of the keywords
    return events.filter(event => {
      const title = (event.plainTitle || event.title || '').toLowerCase();
      const description = (event.description || '').toLowerCase();
      
      return keywords.some(keyword => 
        title.includes(keyword) || description.includes(keyword)
      );
    });
  };
  
  /**
   * Extract dates from text using regex patterns
   * @param {string} text - The text to extract dates from
   * @returns {Array<Date>} - Array of found dates
   */
  const extractDatesFromText = (text) => {
    const dates = [];
    
    // Year only, e.g. "1969"
    const yearPattern = /\b(1[0-9]{3}|20[0-2][0-9])\b/g;
    let match;
    
    while ((match = yearPattern.exec(text)) !== null) {
      const year = parseInt(match[0]);
      dates.push(new Date(year, 0, 1)); // January 1st of the year
    }
    
    // Norwegian date format DD.MM.YYYY
    const norwegianDatePattern = /\b([0-3]?[0-9])\.(0?[1-9]|1[0-2])\.(\d{4})\b/g;
    let dateMatch;
    
    while ((dateMatch = norwegianDatePattern.exec(text)) !== null) {
      try {
        const day = dateMatch[1].padStart(2, '0');
        const month = dateMatch[2].padStart(2, '0');
        const year = dateMatch[3];
        dates.push(new Date(`${year}-${month}-${day}`));
      } catch (error) {
        console.warn('Invalid date found:', dateMatch[0]);
      }
    }
    
    return dates;
  };
  
  /**
   * Check if the timeline spans the World War II period
   * @param {Date} startDate - Timeline start date
   * @param {Date} endDate - Timeline end date
   * @returns {boolean} - True if the timeline includes WWII
   */
  const timelineSpansWWII = (startDate, endDate) => {
    const ww2Start = new Date('1939-01-01');
    const ww2End = new Date('1945-12-31');
    
    return (startDate <= ww2End && endDate >= ww2Start);
  };
  
  /**
   * Capitalize the first letter of a string
   * @param {string} str - The string to capitalize
   * @returns {string} - The capitalized string
   */
  const capitalizeFirstLetter = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
  
  export default {
    processTimelineCommand
  };