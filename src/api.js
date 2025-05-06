/**
 * API service for backend communication
 * This will handle all API calls to your backend and Firebase Firestore
 * Updated to support rich text formatting in event titles and descriptions,
 * 2D positioning of events, background image storage, timeline privacy features,
 * and role-based collaboration
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
  orderBy,
  limit,
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
      
      // If user already has 10 or more timelines, prevent creating a new one
      if (querySnapshot.size >= 10) {
        throw new Error('Du har nådd grensen på 10 tidslinjer. Vennligst slett en eksisterende tidslinje før du oppretter en ny.');
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
      userEmail: user.email, // Store user email explicitly
      userDisplayName: user.displayName || user.email || 'Anonym bruker',
      // Store background properties separately - don't normalize
      backgroundColor: timelineData.backgroundColor || null,
      backgroundImage: timelineData.backgroundImage || null,
      timelineColor: timelineData.timelineColor || '#007bff',
      timelineThickness: timelineData.timelineThickness || 2,
      
      // FIXED: Store interval settings only in the intervalSettings object
      // This avoids duplication and potential recursion issues
      intervalSettings: intervalSettings,
      
      // Add privacy setting - default to private if not specified
      isPublic: timelineData.isPublic !== undefined ? timelineData.isPublic : false,
      
      // Initialize empty collaborators array and roles object
      collaborators: [],
      collaboratorRoles: {}
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

    // Check if the timeline belongs to the current user or if user is an editor
    const timelineRef = doc(db, TIMELINES_COLLECTION, timelineId);
    const timelineSnap = await getDoc(timelineRef);
    
    if (!timelineSnap.exists()) {
      throw new Error('Timeline not found');
    }
    
    const timelineDoc = timelineSnap.data();
    const isOwner = timelineDoc.userId === user.uid;
    
    // Check if user is a collaborator with editor role
    let isEditor = false;
    if (user.email) {
      const userEmail = user.email.toLowerCase();
      const collaborators = timelineDoc.collaborators || [];
      const collaboratorRoles = timelineDoc.collaboratorRoles || {};
      
      if (collaborators.includes(userEmail) && collaboratorRoles[userEmail] === 'editor') {
        isEditor = true;
      }
    }
    
    // Only owner or editor can update the timeline
    if (!isOwner && !isEditor) {
      throw new Error('You do not have permission to update this timeline');
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

    // Prepare update data
    let data = {
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
    
    // Only owner can update privacy setting
    if (isOwner) {
      data.isPublic = timelineData.isPublic !== undefined ? timelineData.isPublic : (timelineDoc.isPublic || false);
    }

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
    
    // Check if the timeline is public or belongs to the current user
    const currentUser = auth.currentUser;
    const isOwner = currentUser && timelineData.userId === currentUser.uid;
    
    // Get collaborator information
    const collaborators = timelineData.collaborators || [];
    const collaboratorRoles = timelineData.collaboratorRoles || {};
    
    // Check if current user is a collaborator and get their role
    let isCollaborator = false;
    let collaboratorRole = null;
    
    if (currentUser && currentUser.email) {
      const userEmail = currentUser.email.toLowerCase();
      isCollaborator = collaborators.includes(userEmail);
      if (isCollaborator) {
        collaboratorRole = collaboratorRoles[userEmail] || 'viewer'; // Default to viewer
      }
    }
    
    // If timeline is not public and the current user is not the owner or a collaborator, deny access
    if (!timelineData.isPublic && !isOwner && !isCollaborator) {
      throw new Error('Denne tidslinjen er privat');
    }
    
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
      intervalSettings: intervalSettings,
      
      // Include privacy setting and owner info
      isPublic: timelineData.isPublic || false,
      userId: timelineData.userId,
      userDisplayName: timelineData.userDisplayName || 'Anonym bruker',
      isOwner: isOwner,
      isCollaborator: isCollaborator,
      collaboratorRole: collaboratorRole, // Include the user's role if they're a collaborator
      canEdit: isOwner || collaboratorRole === 'editor', // Add a convenience property
      collaborators: collaborators,
      collaboratorRoles: collaboratorRoles
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
        intervalSettings: intervalSettings,
        // Include privacy setting
        isPublic: data.isPublic || false,
        // Include collaborator count
        collaboratorCount: (data.collaborators || []).length
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

/**
 * Update just the privacy setting of a timeline
 * @param {string} timelineId - ID of timeline to update
 * @param {boolean} isPublic - New privacy setting (true for public, false for private)
 * @returns {Promise<Object>} Response indicating success
 */
export async function updateTimelinePrivacy(timelineId, isPublic) {
  try {
    // Check if user is logged in
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('You must be logged in to update timeline privacy');
    }

    // Check if the timeline belongs to the current user
    const timelineRef = doc(db, TIMELINES_COLLECTION, timelineId);
    const timelineSnap = await getDoc(timelineRef);
    
    if (!timelineSnap.exists()) {
      throw new Error('Timeline not found');
    }
    
    const timelineDoc = timelineSnap.data();
    if (timelineDoc.userId !== currentUser.uid) {
      throw new Error('You can only update your own timelines');
    }

    // Update only the privacy setting and updatedAt timestamp
    await updateDoc(timelineRef, {
      isPublic: isPublic,
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true,
      timelineId,
      isPublic
    };
  } catch (error) {
    console.error('Error updating timeline privacy:', error);
    throw error;
  }
}

/**
 * Get a list of public timelines
 * @param {number} limit - Maximum number of timelines to return (default 10)
 * @returns {Promise<Array>} List of public timelines
 */
export async function getPublicTimelines(limitCount = 10) {
  try {
    // Query public timelines, sorted by creation date (newest first)
    const publicTimelinesQuery = query(
      collection(db, TIMELINES_COLLECTION),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(publicTimelinesQuery);
    
    // Convert query snapshot to array of timeline objects
    const timelines = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      
      // Handle Firestore timestamps properly
      const start = data.start?.toDate ? data.start.toDate() : new Date(data.start);
      const end = data.end?.toDate ? data.end.toDate() : new Date(data.end);
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
      
      timelines.push({
        id: doc.id,
        title: data.title,
        start: start,
        end: end,
        createdAt: createdAt,
        backgroundColor: data.backgroundColor || null,
        backgroundImage: data.backgroundImage || null,
        timelineColor: data.timelineColor || '#007bff',
        // Include userId and displayName for attribution
        userId: data.userId,
        userDisplayName: data.userDisplayName || 'Anonym bruker',
        // This is a public timeline
        isPublic: true
      });
    });
    
    return timelines;
  } catch (error) {
    console.error('Error getting public timelines:', error);
    throw error;
  }
}

/**
 * Add a collaborator to a timeline with a specific role
 * @param {string} timelineId - ID of timeline to add collaborator to
 * @param {string} email - Email of user to add as collaborator
 * @param {string} role - Role for the collaborator ("viewer" or "editor")
 * @returns {Promise<Object>} Response indicating success
 */
export async function addTimelineCollaborator(timelineId, email, role = "viewer") {
  try {
    // Check if user is logged in
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('You must be logged in to add collaborators');
    }

    // Validate role
    if (role !== "viewer" && role !== "editor") {
      throw new Error('Invalid role. Role must be "viewer" or "editor"');
    }

    // Check if the timeline belongs to the current user
    const timelineRef = doc(db, TIMELINES_COLLECTION, timelineId);
    const timelineSnap = await getDoc(timelineRef);
    
    if (!timelineSnap.exists()) {
      throw new Error('Timeline not found');
    }
    
    const timelineData = timelineSnap.data();
    if (timelineData.userId !== currentUser.uid) {
      throw new Error('You can only add collaborators to your own timelines');
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();
    
    // Check if email is already a collaborator
    const collaborators = timelineData.collaborators || [];
    if (collaborators.includes(normalizedEmail)) {
      throw new Error('This user is already a collaborator');
    }
    
    // Add email to collaborators array
    const updatedCollaborators = [...collaborators, normalizedEmail];
    
    // Update or create the collaborator roles object
    const collaboratorRoles = timelineData.collaboratorRoles || {};
    collaboratorRoles[normalizedEmail] = role;
    
    // Update document in Firestore
    await updateDoc(timelineRef, {
      collaborators: updatedCollaborators,
      collaboratorRoles: collaboratorRoles,
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true,
      timelineId,
      collaborators: updatedCollaborators,
      collaboratorRoles: collaboratorRoles
    };
  } catch (error) {
    console.error('Error adding collaborator:', error);
    throw error;
  }
}

/**
 * Remove a collaborator from a timeline
 * @param {string} timelineId - ID of timeline to remove collaborator from
 * @param {string} email - Email of user to remove as collaborator
 * @returns {Promise<Object>} Response indicating success
 */
export async function removeTimelineCollaborator(timelineId, email) {
  try {
    // Check if user is logged in
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('You must be logged in to remove collaborators');
    }

    // Check if the timeline belongs to the current user
    const timelineRef = doc(db, TIMELINES_COLLECTION, timelineId);
    const timelineSnap = await getDoc(timelineRef);
    
    if (!timelineSnap.exists()) {
      throw new Error('Timeline not found');
    }
    
    const timelineData = timelineSnap.data();
    if (timelineData.userId !== currentUser.uid) {
      throw new Error('You can only remove collaborators from your own timelines');
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();
    
    // Remove email from collaborators array
    const collaborators = timelineData.collaborators || [];
    const updatedCollaborators = collaborators.filter(e => e !== normalizedEmail);
    
    // Update the collaborator roles object
    const collaboratorRoles = timelineData.collaboratorRoles || {};
    if (collaboratorRoles[normalizedEmail]) {
      delete collaboratorRoles[normalizedEmail];
    }
    
    // Update document in Firestore
    await updateDoc(timelineRef, {
      collaborators: updatedCollaborators,
      collaboratorRoles: collaboratorRoles,
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true,
      timelineId,
      collaborators: updatedCollaborators,
      collaboratorRoles: collaboratorRoles
    };
  } catch (error) {
    console.error('Error removing collaborator:', error);
    throw error;
  }
}

/**
 * Update a collaborator's role for a timeline
 * @param {string} timelineId - ID of timeline to update collaborator's role
 * @param {string} email - Email of the collaborator
 * @param {string} role - New role ("viewer" or "editor")
 * @returns {Promise<Object>} Response indicating success
 */
export async function updateCollaboratorRole(timelineId, email, role) {
  try {
    // Check if user is logged in
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('You must be logged in to update collaborator roles');
    }

    // Validate role
    if (role !== "viewer" && role !== "editor") {
      throw new Error('Invalid role. Role must be "viewer" or "editor"');
    }

    // Check if the timeline belongs to the current user
    const timelineRef = doc(db, TIMELINES_COLLECTION, timelineId);
    const timelineSnap = await getDoc(timelineRef);
    
    if (!timelineSnap.exists()) {
      throw new Error('Timeline not found');
    }
    
    const timelineData = timelineSnap.data();
    if (timelineData.userId !== currentUser.uid) {
      throw new Error('You can only update collaborators for your own timelines');
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();
    
    // Check if email is a collaborator
    const collaborators = timelineData.collaborators || [];
    if (!collaborators.includes(normalizedEmail)) {
      throw new Error('This user is not a collaborator');
    }
    
    // Update the collaborator roles object
    const collaboratorRoles = timelineData.collaboratorRoles || {};
    collaboratorRoles[normalizedEmail] = role;
    
    // Update document in Firestore
    await updateDoc(timelineRef, {
      collaboratorRoles: collaboratorRoles,
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true,
      timelineId,
      collaboratorEmail: normalizedEmail,
      collaboratorRole: role
    };
  } catch (error) {
    console.error('Error updating collaborator role:', error);
    throw error;
  }
}

/**
 * Get list of collaborators for a timeline with their roles
 * @param {string} timelineId - ID of timeline to get collaborators for
 * @returns {Promise<Array>} List of collaborator objects with email and role
 */
export async function getTimelineCollaborators(timelineId) {
  try {
    // Check if user is logged in
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('You must be logged in to view collaborators');
    }

    // Get the timeline document
    const timelineRef = doc(db, TIMELINES_COLLECTION, timelineId);
    const timelineSnap = await getDoc(timelineRef);
    
    if (!timelineSnap.exists()) {
      throw new Error('Timeline not found');
    }
    
    const timelineData = timelineSnap.data();
    
    // Check if the current user is the owner or a collaborator
    const isOwner = timelineData.userId === currentUser.uid;
    const collaborators = timelineData.collaborators || [];
    const collaboratorRoles = timelineData.collaboratorRoles || {};
    const isCollaborator = currentUser.email && collaborators.includes(currentUser.email.toLowerCase());
    
    if (!isOwner && !isCollaborator) {
      throw new Error('You do not have permission to view collaborators for this timeline');
    }
    
    // Map collaborators to include their roles
    const collaboratorList = collaborators.map(email => ({
      email: email,
      role: collaboratorRoles[email] || "viewer" // Default to viewer if role not specified
    }));
    
    return collaboratorList;
  } catch (error) {
    console.error('Error getting collaborators:', error);
    throw error;
  }
}

/**
 * Get a list of timelines shared with the current user
 * @returns {Promise<Array>} List of shared timelines
 */
/**
 * Get a list of timelines shared with the current user
 * @returns {Promise<Array>} List of shared timelines
 */
export async function getSharedTimelines() {
  try {
    // Check if user is logged in
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      return [];
    }

    // Query timelines where the current user's email is in the collaborators array
    const sharedTimelinesQuery = query(
      collection(db, TIMELINES_COLLECTION),
      where('collaborators', 'array-contains', currentUser.email.toLowerCase())
    );
    
    const querySnapshot = await getDocs(sharedTimelinesQuery);
    
    // Convert query snapshot to array of timeline objects
    const timelines = [];
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      
      // Handle Firestore timestamps properly
      const start = data.start?.toDate ? data.start.toDate() : new Date(data.start);
      const end = data.end?.toDate ? data.end.toDate() : new Date(data.end);
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
      
      // Get collaborator role for current user
      const collaboratorRoles = data.collaboratorRoles || {};
      const userEmail = currentUser.email.toLowerCase();
      const collaboratorRole = collaboratorRoles[userEmail] || 'viewer'; // Default to viewer
      
      // Extract interval settings
      const intervalSettings = data.intervalSettings || {
        show: true,
        count: 5, 
        type: 'even'
      };
      
      // Get owner information - including email if possible
      let ownerEmail = data.userEmail || '';
      
      // If we don't have the owner's email directly, try to look it up
      if (!ownerEmail && data.userId) {
        try {
          // Look up the user's email from Firebase Auth
          // This would require a function in your backend since client-side code 
          // can't directly look up user details by ID
          // Alternatively, we'll use a placeholder
          ownerEmail = data.userDisplayName || data.userId;
        } catch (err) {
          console.error('Error fetching owner info:', err);
          ownerEmail = data.userId; // Fallback
        }
      }
      
      timelines.push({
        id: doc.id,
        title: data.title,
        start: start,
        end: end,
        createdAt: createdAt,
        // Include both background properties separately
        backgroundColor: data.backgroundColor || null,
        backgroundImage: data.backgroundImage || null,
        timelineColor: data.timelineColor || '#007bff',
        // Include interval settings from the object
        showIntervals: intervalSettings.show,
        intervalCount: intervalSettings.count,
        intervalType: intervalSettings.type,
        intervalSettings: intervalSettings,
        // Include owner info
        userId: data.userId,
        userDisplayName: data.userDisplayName || '',
        ownerName: data.userDisplayName || ownerEmail || 'Eier',
        ownerEmail: ownerEmail, // Explicitly include owner email
        // This is a shared timeline
        isShared: true,
        // Include collaboration info
        collaboratorRole: collaboratorRole,
        canEdit: collaboratorRole === 'editor'
      });
    }
    
    // Sort by creation date, newest first
    return timelines.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error getting shared timelines:', error);
    throw error;
  }
}


/**
 * Check if the current user can edit a timeline
 * @param {Object} timelineData - Timeline data object
 * @returns {boolean} True if the user can edit, false otherwise
 */
export function canEditTimeline(timelineData) {
  if (!timelineData) return false;
  
  const currentUser = auth.currentUser;
  if (!currentUser) return false;
  
  // Owner can always edit
  if (timelineData.userId === currentUser.uid) return true;
  
  // Check if user is an editor collaborator
  const collaborators = timelineData.collaborators || [];
  const collaboratorRoles = timelineData.collaboratorRoles || {};
  const userEmail = currentUser.email?.toLowerCase();
  
  if (userEmail && collaborators.includes(userEmail)) {
    return collaboratorRoles[userEmail] === "editor";
  }
  
  return false;
}

/**
 * Migrate existing timelines to support role-based collaboration
 * Use this function if you have existing timelines with collaborators
 * but without collaborator roles
 * @returns {Promise<Object>} Response indicating success
 */
export async function migrateTimelinesToRoles() {
  try {
    // Check if user is logged in
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('You must be logged in to migrate timelines');
    }

    // Query timelines for the current user
    const timelinesQuery = query(
      collection(db, TIMELINES_COLLECTION),
      where('userId', '==', currentUser.uid)
    );
    
    const querySnapshot = await getDocs(timelinesQuery);
    
    // Count of migrated timelines
    let migratedCount = 0;
    
    // Iterate over each timeline
    for (const timelineDoc of querySnapshot.docs) {
      const data = timelineDoc.data();
      
      // Skip if already has collaboratorRoles
      if (data.collaboratorRoles) continue;
      
      // Skip if no collaborators
      if (!data.collaborators || data.collaborators.length === 0) continue;
      
      // Create collaboratorRoles object with default "viewer" role
      const collaboratorRoles = {};
      data.collaborators.forEach(email => {
        collaboratorRoles[email] = "viewer";
      });
      
      // Update the document
      await updateDoc(timelineDoc.ref, { 
        collaboratorRoles: collaboratorRoles,
        updatedAt: serverTimestamp()
      });
      
      migratedCount++;
    }
    
    return {
      success: true,
      migratedCount
    };
  } catch (error) {
    console.error('Error migrating timelines:', error);
    throw error;
  }
}

export default {
  saveTimeline,
  updateTimeline,
  loadTimeline,
  loadTimelineList,
  deleteTimeline,
  updateTimelinePrivacy,
  addTimelineCollaborator,
  removeTimelineCollaborator,
  updateCollaboratorRole,
  getTimelineCollaborators,
  getSharedTimelines,
  getPublicTimelines,
  canEditTimeline,
  migrateTimelinesToRoles
};