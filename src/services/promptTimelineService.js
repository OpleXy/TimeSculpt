/**
 * This service handles the generation of timelines from natural language prompts
 * It analyzes the prompt to determine appropriate time periods and settings
 */

/**
 * Main function to generate a timeline configuration from a prompt
 * @param {string} prompt - The user's prompt describing the desired timeline
 * @returns {Promise<Object>} - A timeline configuration object
 */
export const generateTimelineFromPrompt = async (prompt) => {
    try {
      // In a real implementation, this would call an external AI service
      // For now, we'll implement a simple rule-based approach
      
      // Add artificial delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Extract information from the prompt
      const { title, timeRange, orientation } = extractTimelineInfoFromPrompt(prompt);
      
      // Create and return the timeline configuration
      return {
        title: title,
        start: timeRange.start,
        end: timeRange.end,
        orientation: orientation,
        events: [], // Start with empty events - they'll be added later
        backgroundColor: 'white',
        timelineColor: '#007bff',
        timelineThickness: 2,
        generatedFromPrompt: true,
        promptText: prompt
      };
    } catch (error) {
      console.error('Error generating timeline from prompt:', error);
      throw new Error('Kunne ikke generere tidslinje fra prompt');
    }
  };
  
  /**
   * Extract timeline information from the prompt text
   * @param {string} prompt - The user's prompt
   * @returns {Object} - Extracted timeline info
   */
  const extractTimelineInfoFromPrompt = (prompt) => {
    // Extract title (use first sentence or the whole prompt if it's short)
    let title = '';
    const firstSentence = prompt.split(/[.!?]/).filter(s => s.trim().length > 0)[0] || '';
    
    if (firstSentence.length < 60) {
      title = firstSentence.trim();
    } else {
      // If first sentence is too long, extract keywords
      const keywords = extractKeywords(prompt, 5);
      title = keywords.join(' ') || 'Ny tidslinje';
    }
    
    // Extract time range
    const timeRange = extractTimeRangeFromPrompt(prompt);
    
    // Determine orientation (default to horizontal)
    const orientationHints = {
      vertical: ['vertikal', 'vertikalt', 'ovenfra-ned', 'topp-til-bunn'],
      horizontal: ['horisontal', 'horisontalt', 'venstre-til-høyre', 'tidslinje på tvers']
    };
    
    let orientation = 'horizontal';
    const promptLower = prompt.toLowerCase();
    
    // Check for vertical orientation hints
    if (orientationHints.vertical.some(hint => promptLower.includes(hint))) {
      orientation = 'vertical';
    }
    
    return {
      title,
      timeRange,
      orientation
    };
  };
  
  /**
   * Extract keywords from the prompt
   * @param {string} text - The prompt text
   * @param {number} maxKeywords - Maximum number of keywords to extract
   * @returns {Array} - Array of extracted keywords
   */
  const extractKeywords = (text, maxKeywords) => {
    // Remove common stop words
    const stopWords = ['en', 'et', 'og', 'i', 'på', 'med', 'for', 'til', 'fra', 'om', 'av', 'den', 'det', 'som', 'er', 'var', 'har', 'hadde', 'vil', 'skal', 'kan', 'kunne'];
    
    // Tokenize the text
    const tokens = text.toLowerCase()
      .replace(/[.,!?;:()\[\]{}]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 0);
    
    // Count word frequencies (excluding stop words)
    const wordCounts = {};
    tokens.forEach(token => {
      if (!stopWords.includes(token) && token.length > 2) {
        wordCounts[token] = (wordCounts[token] || 0) + 1;
      }
    });
    
    // Sort words by frequency
    const sortedWords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);
    
    // Return the top keywords
    return sortedWords.slice(0, maxKeywords);
  };
  
  /**
   * Extract time range from the prompt
   * @param {string} prompt - The user's prompt
   * @returns {Object} - Start and end dates
   */
  const extractTimeRangeFromPrompt = (prompt) => {
    const promptLower = prompt.toLowerCase();
    
    // Define patterns to look for
    const yearPattern = /\b(1[0-9]{3}|20[0-2][0-9])\b/g;
    const periodPatterns = [
      { 
        regex: /\bfra\s+(\d{4})\s+til\s+(\d{4})\b/i,
        extract: (match) => ({
          start: new Date(`${match[1]}-01-01`),
          end: new Date(`${match[2]}-12-31`)
        })
      },
      { 
        regex: /\bi\s+(\d{4})\b/i,
        extract: (match) => {
          const year = parseInt(match[1]);
          return {
            start: new Date(`${year}-01-01`),
            end: new Date(`${year}-12-31`)
          };
        }
      },
      {
        regex: /\b(\d{4})-(\d{4})\b/,
        extract: (match) => ({
          start: new Date(`${match[1]}-01-01`),
          end: new Date(`${match[2]}-12-31`)
        })
      }
    ];
    
    // Check for specific time periods
    const specificPeriods = [
      { 
        terms: ['andre verdenskrig', 'ww2', 'world war 2', 'world war ii'], 
        range: { start: new Date('1939-09-01'), end: new Date('1945-09-02') }
      },
      { 
        terms: ['første verdenskrig', 'ww1', 'world war 1', 'world war i'], 
        range: { start: new Date('1914-07-28'), end: new Date('1918-11-11') }
      },
      { 
        terms: ['den kalde krigen', 'cold war'], 
        range: { start: new Date('1947-01-01'), end: new Date('1991-12-26') }
      },
      { 
        terms: ['vikingtiden', 'viking age', 'vikinger'], 
        range: { start: new Date('793-01-01'), end: new Date('1066-12-31') }
      },
      { 
        terms: ['mellomkrigstiden', 'interwar period'], 
        range: { start: new Date('1918-11-11'), end: new Date('1939-09-01') }
      },
      { 
        terms: ['renessansen', 'renaissance'], 
        range: { start: new Date('1400-01-01'), end: new Date('1600-12-31') }
      },
      {
        terms: ['antikken', 'ancient times', 'oldtiden'],
        range: { start: new Date('800-01-01 BC'), end: new Date('500-12-31') }
      },
      {
        terms: ['middelalderen', 'middle ages'],
        range: { start: new Date('500-01-01'), end: new Date('1500-12-31') }
      }
    ];
    
    // First, check for specific named periods
    for (const period of specificPeriods) {
      if (period.terms.some(term => promptLower.includes(term))) {
        return period.range;
      }
    }
    
    // Then, check for explicit patterns in the text
    for (const pattern of periodPatterns) {
      const match = promptLower.match(pattern.regex);
      if (match) {
        return pattern.extract(match);
      }
    }
    
    // Extract all years mentioned in the text
    const years = [];
    let match;
    while ((match = yearPattern.exec(promptLower)) !== null) {
      years.push(parseInt(match[0]));
    }
    
    // If we found multiple years, use the earliest and latest
    if (years.length >= 2) {
      const sortedYears = [...years].sort((a, b) => a - b);
      return {
        start: new Date(`${sortedYears[0]}-01-01`),
        end: new Date(`${sortedYears[sortedYears.length - 1]}-12-31`)
      };
    }
    
    // If we found one year, use it as the central year with a 5-year span
    if (years.length === 1) {
      const year = years[0];
      return {
        start: new Date(`${year - 2}-01-01`),
        end: new Date(`${year + 2}-12-31`)
      };
    }
    
    // Default to a recent 5-year period
    const currentYear = new Date().getFullYear();
    return {
      start: new Date(`${currentYear - 5}-01-01`),
      end: new Date(`${currentYear}-12-31`)
    };
  };
  
  export default {
    generateTimelineFromPrompt
  };