// services/eventLayoutService.js
// Service for automatisk strukturering av timeline-hendelser for å unngå overlapping

/**
 * Automatisk strukturerer hendelser på tidslinjen for å unngå overlapping
 * @param {Array} events - Array av timeline-hendelser
 * @param {string} orientation - Timeline-orientering ('horizontal' eller 'vertical')
 * @param {Date} timelineStart - Timeline start-dato
 * @param {Date} timelineEnd - Timeline slutt-dato
 * @returns {Array} - Array av hendelser med oppdaterte posisjoner
 */
export function autoLayoutEvents(events, orientation = 'horizontal', timelineStart, timelineEnd) {
  if (!events || events.length === 0) return events;
  
  console.log('🔄 Auto-strukturerer', events.length, 'hendelser...');
  
  // Sorter hendelser etter dato
  const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Beregn posisjonsprosent for hver hendelse
  const totalDuration = timelineEnd.getTime() - timelineStart.getTime();
  const eventsWithPositions = sortedEvents.map(event => ({
    ...event,
    positionPercent: ((new Date(event.date).getTime() - timelineStart.getTime()) / totalDuration) * 100
  }));
  
  // Auto-strukturer basert på orientering
  if (orientation === 'horizontal') {
    return autoLayoutHorizontal(eventsWithPositions);
  } else {
    return autoLayoutVertical(eventsWithPositions);
  }
}

/**
 * Auto-strukturerer hendelser for horisontal tidslinje
 * Bruker "lanes" over og under tidslinjen for å unngå overlapping
 */
function autoLayoutHorizontal(events) {
  const LANE_HEIGHT = 80; // Avstand mellom "lanes" i pixels
  const MIN_DISTANCE = 3; // Minimum avstand mellom hendelser i prosent
  const MAX_LANES = 5; // Maksimum antall lanes på hver side
  
  // Tracks for å holde styr på okkuperte posisjoner
  const upperLanes = Array(MAX_LANES).fill().map(() => []);
  const lowerLanes = Array(MAX_LANES).fill().map(() => []);
  
  const layoutedEvents = events.map((event, index) => {
    const positionPercent = event.positionPercent;
    
    // Finn nærmeste ledig lane
    const { lane, isUpper } = findBestLane(positionPercent, upperLanes, lowerLanes, MIN_DISTANCE);
    
    // Beregn y-offset basert på lane
    const yOffset = isUpper ? -(lane + 1) * LANE_HEIGHT : (lane + 1) * LANE_HEIGHT;
    
    // Registrer denne posisjonen som okkupert
    const targetLanes = isUpper ? upperLanes : lowerLanes;
    targetLanes[lane].push(positionPercent);
    
    return {
      ...event,
      xOffset: 0, // Ingen horisontal offset trengs
      yOffset: yOffset,
      offset: yOffset, // Backward compatibility
      autoLayouted: true
    };
  });
  
  console.log('✅ Horisontal auto-layout fullført');
  return layoutedEvents;
}

/**
 * Auto-strukturerer hendelser for vertikal tidslinje
 * Bruker "lanes" til høyre og venstre for tidslinjen
 */
function autoLayoutVertical(events) {
  const LANE_WIDTH = 120; // Avstand mellom "lanes" i pixels
  const MIN_DISTANCE = 3; // Minimum avstand mellom hendelser i prosent
  const MAX_LANES = 4; // Maksimum antall lanes på hver side
  
  // Tracks for å holde styr på okkuperte posisjoner
  const leftLanes = Array(MAX_LANES).fill().map(() => []);
  const rightLanes = Array(MAX_LANES).fill().map(() => []);
  
  const layoutedEvents = events.map((event, index) => {
    const positionPercent = event.positionPercent;
    
    // Finn nærmeste ledig lane
    const { lane, isLeft } = findBestLaneVertical(positionPercent, leftLanes, rightLanes, MIN_DISTANCE);
    
    // Beregn x-offset basert på lane
    const xOffset = isLeft ? -(lane + 1) * LANE_WIDTH : (lane + 1) * LANE_WIDTH;
    
    // Registrer denne posisjonen som okkupert
    const targetLanes = isLeft ? leftLanes : rightLanes;
    targetLanes[lane].push(positionPercent);
    
    return {
      ...event,
      xOffset: xOffset,
      yOffset: 0, // Ingen vertikal offset trengs
      offset: 0, // Backward compatibility
      autoLayouted: true
    };
  });
  
  console.log('✅ Vertikal auto-layout fullført');
  return layoutedEvents;
}

/**
 * Finner beste lane for horisontal layout
 */
function findBestLane(positionPercent, upperLanes, lowerLanes, minDistance) {
  // Prøv øvre lanes først
  for (let lane = 0; lane < upperLanes.length; lane++) {
    if (isLaneFree(positionPercent, upperLanes[lane], minDistance)) {
      return { lane, isUpper: true };
    }
  }
  
  // Deretter nedre lanes
  for (let lane = 0; lane < lowerLanes.length; lane++) {
    if (isLaneFree(positionPercent, lowerLanes[lane], minDistance)) {
      return { lane, isUpper: false };
    }
  }
  
  // Fallback: bruk første øvre lane (overlapping kan skje)
  return { lane: 0, isUpper: true };
}

/**
 * Finner beste lane for vertikal layout
 */
function findBestLaneVertical(positionPercent, leftLanes, rightLanes, minDistance) {
  // Alternér mellom venstre og høyre for bedre balanse
  const preferLeft = Math.random() > 0.5;
  
  if (preferLeft) {
    // Prøv venstre lanes først
    for (let lane = 0; lane < leftLanes.length; lane++) {
      if (isLaneFree(positionPercent, leftLanes[lane], minDistance)) {
        return { lane, isLeft: true };
      }
    }
    
    // Deretter høyre lanes
    for (let lane = 0; lane < rightLanes.length; lane++) {
      if (isLaneFree(positionPercent, rightLanes[lane], minDistance)) {
        return { lane, isLeft: false };
      }
    }
  } else {
    // Prøv høyre lanes først
    for (let lane = 0; lane < rightLanes.length; lane++) {
      if (isLaneFree(positionPercent, rightLanes[lane], minDistance)) {
        return { lane, isLeft: false };
      }
    }
    
    // Deretter venstre lanes
    for (let lane = 0; lane < leftLanes.length; lane++) {
      if (isLaneFree(positionPercent, leftLanes[lane], minDistance)) {
        return { lane, isLeft: true };
      }
    }
  }
  
  // Fallback: bruk første venstre lane
  return { lane: 0, isLeft: true };
}

/**
 * Sjekker om en lane er ledig på en gitt posisjon
 */
function isLaneFree(positionPercent, occupiedPositions, minDistance) {
  return !occupiedPositions.some(occupied => 
    Math.abs(occupied - positionPercent) < minDistance
  );
}

/**
 * Tilbakestiller auto-layout på alle hendelser
 * @param {Array} events - Array av hendelser
 * @returns {Array} - Array av hendelser med tilbakestilt layout
 */
export function resetEventLayout(events) {
  return events.map(event => ({
    ...event,
    xOffset: 0,
    yOffset: 0,
    offset: 0,
    autoLayouted: false
  }));
}

/**
 * Kompakt layout - pakker hendelser tettere sammen
 * @param {Array} events - Array av hendelser
 * @param {string} orientation - Timeline-orientering
 * @returns {Array} - Array av hendelser med kompakt layout
 */
export function compactLayout(events, orientation = 'horizontal') {
  if (orientation === 'horizontal') {
    const COMPACT_HEIGHT = 50; // Mindre avstand mellom lanes
    return events.map((event, index) => {
      const side = index % 2 === 0 ? 1 : -1; // Alternér over/under
      const layer = Math.floor(index / 2) + 1;
      
      return {
        ...event,
        xOffset: 0,
        yOffset: side * layer * COMPACT_HEIGHT,
        offset: side * layer * COMPACT_HEIGHT,
        autoLayouted: true
      };
    });
  } else {
    const COMPACT_WIDTH = 80; // Mindre avstand mellom lanes
    return events.map((event, index) => {
      const side = index % 2 === 0 ? 1 : -1; // Alternér høyre/venstre
      const layer = Math.floor(index / 2) + 1;
      
      return {
        ...event,
        xOffset: side * layer * COMPACT_WIDTH,
        yOffset: 0,
        offset: 0,
        autoLayouted: true
      };
    });
  }
}

/**
 * Sjekker om hendelser trenger re-layout
 * @param {Array} events - Array av hendelser
 * @returns {boolean} - True hvis re-layout er nødvendig
 */
export function needsRelayout(events) {
  // Sjekk om mange hendelser har samme eller svært like offsets
  const offsets = events.map(e => e.yOffset || e.offset || 0);
  const uniqueOffsets = new Set(offsets);
  
  // Hvis mer enn 70% av hendelsene har samme offset, trenger vi layout
  return uniqueOffsets.size / events.length < 0.3 && events.length > 3;
}

/**
 * Smart layout som velger beste metode basert på antall hendelser
 * @param {Array} events - Array av hendelser
 * @param {string} orientation - Timeline-orientering
 * @param {Date} timelineStart - Timeline start-dato
 * @param {Date} timelineEnd - Timeline slutt-dato
 * @returns {Array} - Array av hendelser med optimalt layout
 */
export function smartLayout(events, orientation, timelineStart, timelineEnd) {
  if (!events || events.length <= 2) {
    // For få hendelser, bruk enkel layout
    return events.map((event, index) => ({
      ...event,
      xOffset: 0,
      yOffset: orientation === 'horizontal' ? (index % 2 === 0 ? -60 : 60) : 0,
      offset: orientation === 'horizontal' ? (index % 2 === 0 ? -60 : 60) : 0
    }));
  }
  
  if (events.length <= 8) {
    // Få hendelser, bruk kompakt layout
    return compactLayout(events, orientation);
  }
  
  // Mange hendelser, bruk full auto-layout
  return autoLayoutEvents(events, orientation, timelineStart, timelineEnd);
}

export default {
  autoLayoutEvents,
  resetEventLayout,
  compactLayout,
  needsRelayout,
  smartLayout
};