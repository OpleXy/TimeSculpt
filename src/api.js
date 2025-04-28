/**
 * API service for backend communication
 * This will handle all API calls to your backend and Firebase Firestore
 * Updated to support rich text formatting in event titles and descriptions
 * Now also supports 2D positioning of events and background image storage
 */
import { db, auth } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';

// Collection references
const TIMELINES_COLLECTION = 'timelines';

/**
 * Utility function to strip HTML for plaintext storage
 * @param {string} html - HTML content to strip
 * @returns {string} Plain text content
 */
const stripHtml = (html) => {
  if (!html) return '';
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

/**
 * Process HTML content to make URLs clickable
 * FIXED: Now correctly checks if URL is already in an anchor tag
 * @param {string} html - HTML content to process
 * @returns {string} HTML with URLs converted to clickable links
 */
const processLinks = (html) => {
  if (!html) return '';
  
  // If already processed, don't process again
  if (html.includes('target="_blank" rel="noopener noreferrer"')) {
    return html;
  }
  
  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Function to process text nodes only
  const processTextNodes = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      // Process URLs in text nodes only
      const urlRegex = /(https?:\/\/[^\s<>]+)/g;
      const text = node.textContent;
      const fragments = text.split(urlRegex);
      
      if (fragments.length > 1) { // URL found
        const parent = node.parentNode;
        const nextSibling = node.nextSibling;
        
        // Remove the original text node
        parent.removeChild(node);
        
        // Add each fragment, with links for URLs
        fragments.forEach((fragment, i) => {
          if (i % 2 === 0) { // Text fragment
            if (fragment) {
              parent.insertBefore(document.createTextNode(fragment), nextSibling);
            }
          } else { // URL fragment
            const link = document.createElement('a');
            link.href = fragment;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = fragment;
            parent.insertBefore(link, nextSibling);
          }
        });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'A') {
      // Process child nodes of elements that are not links
      Array.from(node.childNodes).forEach(processTextNodes);
    }
  };
  
  // Process all non-link text nodes
  Array.from(tempDiv.childNodes).forEach(processTextNodes);
  
  return tempDiv.innerHTML;
};

/**
 * Save timeline to Firestore, handling both background colors and images
 * @param {Object} timelineData - Timeline data to save
 * @returns {Promise<Object>} Response with timeline ID
 */
export const saveTimeline = async (timelineData) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('No authenticated user');
    }

    // Check if user has reached the timeline limit (only when creating a new timeline)
    if (!timelineData.id) {
      const timelinesQuery = query(
        collection(db, TIMELINES_COLLECTION),
        where('userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(timelinesQuery);
      
      // If user already has 3 or more timelines, prevent creating a new one
      if (querySnapshot.size >= 3) {
        throw new Error('Du har nådd grensen på 3 tidslinjer. Vennligst slett en eksisterende tidslinje før du oppretter en ny.');
      }
    }

    // Process events to ensure they have plainTitle fields, size property, and process links
    // Now also preserving 2D positioning data (xOffset and yOffset) and color property
    const processedEvents = timelineData.events.map(event => {
      // Process links in title and description - ONLY IF NOT ALREADY PROCESSED
      const processedTitle = event.title ? processLinks(event.title) : event.title;
      const processedDescription = event.description ? processLinks(event.description) : event.description;
      
      return {
        ...event,
        title: processedTitle,
        description: processedDescription,
        plainTitle: stripHtml(processedTitle),
        size: event.size || 'medium', // Ensure size property exists, default to medium
        color: event.color || 'default', // Ensure color property exists, default to 'default'
        // Ensure 2D position is preserved
        xOffset: event.xOffset || 0,
        yOffset: event.yOffset || (event.offset || 0),
        offset: event.yOffset || event.offset || 0 // Keep for backward compatibility
      };
    });

    // FIXED: Use a more normalized structure for interval settings to avoid duplication
    const intervalSettings = {
      show: timelineData.showIntervals !== undefined ? timelineData.showIntervals : true, 
      count: timelineData.intervalCount !== undefined ? timelineData.intervalCount : 5,
      type: timelineData.intervalType !== undefined ? timelineData.intervalType : 'even'
    };

    const data = {
      title: timelineData.title,
      start: timelineData.start,
      end: timelineData.end,
      events: processedEvents,
      orientation: timelineData.orientation,
      createdAt: serverTimestamp(),
      userId: user.uid,
      // Store background properties separately - don't normalize
      backgroundColor: timelineData.backgroundColor || null,
      backgroundImage: timelineData.backgroundImage || null,
      timelineColor: timelineData.timelineColor || '#007bff',
      timelineThickness: timelineData.timelineThickness || 2,
      
      // FIXED: Store interval settings only in the intervalSettings object
      // This avoids duplication and potential recursion issues
      intervalSettings: intervalSettings
    };

    // Add document to Firestore
    const docRef = await addDoc(collection(db, TIMELINES_COLLECTION), data);
    
    return {
      success: true,
      timelineId: docRef.id
    };
  } catch (error) {
    console.error('Error saving timeline:', error);
    throw error;
  }
};

/**
 * Update an existing timeline in Firestore
 * @param {string} timelineId - ID of timeline to update
 * @param {Object} timelineData - Updated timeline data
 * @returns {Promise<Object>} Response indicating success
 */
export const updateTimeline = async (timelineId, timelineData) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('No authenticated user');
    }

    // Check if the timeline belongs to the current user
    const timelineRef = doc(db, TIMELINES_COLLECTION, timelineId);
    const timelineSnap = await getDoc(timelineRef);
    
    if (!timelineSnap.exists()) {
      throw new Error('Timeline not found');
    }
    
    const timelineDoc = timelineSnap.data();
    if (timelineDoc.userId !== user.uid) {
      throw new Error('You can only update your own timelines');
    }

    // Process events to ensure they have plainTitle fields, size property, process links
    // and preserve 2D positioning data and color property
    const processedEvents = timelineData.events.map(event => {
      // Process links in title and description - ONLY IF NOT ALREADY PROCESSED
      const processedTitle = event.title ? processLinks(event.title) : event.title;
      const processedDescription = event.description ? processLinks(event.description) : event.description;
      
      return {
        ...event,
        title: processedTitle,
        description: processedDescription,
        plainTitle: stripHtml(processedTitle),
        size: event.size || 'medium', // Ensure size property exists, default to medium
        color: event.color || 'default', // Ensure color property exists, default to 'default'
        // Ensure 2D position is preserved
        xOffset: event.xOffset || 0,
        yOffset: event.yOffset || (event.offset || 0),
        offset: event.yOffset || event.offset || 0 // Keep for backward compatibility
      };
    });

    // FIXED: Use a normalized structure for interval settings to avoid duplication
    const intervalSettings = {
      show: timelineData.showIntervals !== undefined ? timelineData.showIntervals : true, 
      count: timelineData.intervalCount !== undefined ? timelineData.intervalCount : 5,
      type: timelineData.intervalType !== undefined ? timelineData.intervalType : 'even'
    };

    const data = {
      title: timelineData.title,
      start: timelineData.start,
      end: timelineData.end,
      events: processedEvents,
      orientation: timelineData.orientation,
      updatedAt: serverTimestamp(),
      // Store background properties separately - don't normalize
      backgroundColor: timelineData.backgroundColor || null,
      backgroundImage: timelineData.backgroundImage || null,
      timelineColor: timelineData.timelineColor || '#007bff',
      timelineThickness: timelineData.timelineThickness || 2,
      
      // FIXED: Store interval settings only in the intervalSettings object
      // This avoids duplication and potential recursion issues
      intervalSettings: intervalSettings
    };

    // Update document in Firestore
    await updateDoc(timelineRef, data);
    
    return {
      success: true,
      timelineId
    };
  } catch (error) {
    console.error('Error updating timeline:', error);
    throw error;
  }
};

/**
 * Load timeline from Firestore
 * @param {string} timelineId - ID of timeline to load
 * @returns {Promise<Object>} Timeline data
 */
export async function loadTimeline(timelineId) {
  try {
    const timelineRef = doc(db, TIMELINES_COLLECTION, timelineId);
    const timelineSnap = await getDoc(timelineRef);
    
    if (!timelineSnap.exists()) {
      throw new Error('Timeline not found');
    }
    
    const timelineData = timelineSnap.data();
    
    // Convert Firestore timestamps to JS Date objects if present
    const start = timelineData.start?.toDate ? timelineData.start.toDate() : new Date(timelineData.start);
    const end = timelineData.end?.toDate ? timelineData.end.toDate() : new Date(timelineData.end);
    
    // Extract interval settings
    const intervalSettings = timelineData.intervalSettings || {
      show: true,
      count: 5,
      type: 'even'
    };
    
    // Return complete timeline data with style properties and 2D positioning
    return {
      id: timelineId,
      title: timelineData.title,
      start: start,
      end: end,
      orientation: timelineData.orientation || 'horizontal',
      events: timelineData.events.map(event => {
        // Don't reprocess links - just use existing values
        return {
          title: event.title || '',
          plainTitle: event.plainTitle || stripHtml(event.title || ''), // Ensure plainTitle exists
          date: event.date?.toDate ? event.date.toDate() : new Date(event.date),
          // Load full 2D position
          xOffset: event.xOffset || 0,
          yOffset: event.yOffset || (event.offset || 0),
          offset: event.offset || 0, // Keep for backward compatibility
          description: event.description || '',
          size: event.size || 'medium', // Load size property, default to medium if not present
          color: event.color || 'default' // Ensure color property exists, default to 'default'
        };
      }),
      // Include both background properties separately
      backgroundColor: timelineData.backgroundColor || null,
      backgroundImage: timelineData.backgroundImage || null,
      timelineColor: timelineData.timelineColor || '#007bff',
      timelineThickness: timelineData.timelineThickness || 2,
      
      // Include interval settings both as direct properties (for backward compatibility)
      // and as an object
      showIntervals: intervalSettings.show,
      intervalCount: intervalSettings.count,
      intervalType: intervalSettings.type,
      intervalSettings: intervalSettings
    };
  } catch (error) {
    console.error('Error loading timeline:', error);
    throw error;
  }
}

/**
 * Load list of timelines for the current user
 * @returns {Promise<Array>} List of timelines
 */
export async function loadTimelineList() {
  try {
    // Check if user is logged in
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return [];
    }

    // Query timelines for the current user
    const timelinesQuery = query(
      collection(db, TIMELINES_COLLECTION),
      where('userId', '==', currentUser.uid)
    );
    
    const querySnapshot = await getDocs(timelinesQuery);
    
    // Convert query snapshot to array of timeline objects
    const timelines = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      
      // Handle Firestore timestamps properly
      const start = data.start?.toDate ? data.start.toDate() : new Date(data.start);
      const end = data.end?.toDate ? data.end.toDate() : new Date(data.end);
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
      
      // Extract interval settings
      const intervalSettings = data.intervalSettings || {
        show: true,
        count: 5, 
        type: 'even'
      };
      
      timelines.push({
        id: doc.id,
        title: data.title,
        start: start,
        end: end,
        createdAt: createdAt,
        // Include both background properties separately for list
        backgroundColor: data.backgroundColor || null,
        backgroundImage: data.backgroundImage || null,
        timelineColor: data.timelineColor || '#007bff',
        // Include interval settings from the object
        showIntervals: intervalSettings.show,
        intervalCount: intervalSettings.count,
        intervalType: intervalSettings.type,
        intervalSettings: intervalSettings
      });
    });
    
    // Sort by creation date, newest first
    return timelines.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error loading timeline list:', error);
    throw error;
  }
}

/**
 * Delete timeline from Firestore
 * @param {string} timelineId - ID of timeline to delete
 * @returns {Promise<Object>} Response indicating success
 */
export async function deleteTimeline(timelineId) {
  try {
    // Check if user is logged in
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('You must be logged in to delete timelines');
    }

    // Check if the timeline belongs to the current user
    const timelineRef = doc(db, TIMELINES_COLLECTION, timelineId);
    const timelineSnap = await getDoc(timelineRef);
    
    if (!timelineSnap.exists()) {
      throw new Error('Timeline not found');
    }
    
    const timelineDoc = timelineSnap.data();
    if (timelineDoc.userId !== currentUser.uid) {
      throw new Error('You can only delete your own timelines');
    }

    // Delete document from Firestore
    await deleteDoc(timelineRef);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error deleting timeline:', error);
    throw error;
  }
}

export default {
  saveTimeline,
  updateTimeline,
  loadTimeline,
  loadTimelineList,
  deleteTimeline
};