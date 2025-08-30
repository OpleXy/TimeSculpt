/**
 * API service for backend communication with image handling
 * Updated to support image upload and storage for timeline events
 */
import { db, auth, storage } from './firebase';
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
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';

// Collection references
const TIMELINES_COLLECTION = 'timelines';

/**
 * Upload image file to Firebase Storage
 * @param {File} imageFile - Image file to upload
 * @param {string} timelineId - Timeline ID for organizing files
 * @param {string} eventId - Event ID for unique file naming
 * @returns {Promise<Object>} Object with URL and storage path
 */
const uploadEventImage = async (imageFile, timelineId, eventId) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > maxSize) {
      throw new Error('File too large. Maximum size is 5MB.');
    }

    // Create unique filename with timestamp
    const timestamp = Date.now();
    const fileExtension = imageFile.name.split('.').pop();
    const fileName = `${eventId}_${timestamp}.${fileExtension}`;
    
    // Create storage path: users/{userId}/timelines/{timelineId}/events/{fileName}
    const storagePath = `users/${user.uid}/timelines/${timelineId}/events/${fileName}`;
    const storageRef = ref(storage, storagePath);

    // Upload file
    const snapshot = await uploadBytes(storageRef, imageFile);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      url: downloadURL,
      storagePath: storagePath,
      fileName: fileName
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Delete image from Firebase Storage
 * @param {string} storagePath - Storage path of the image to delete
 * @returns {Promise<void>}
 */
const deleteEventImage = async (storagePath) => {
  try {
    if (!storagePath) return;
    
    const imageRef = ref(storage, storagePath);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw error - we don't want to fail timeline operations if image deletion fails
  }
};

/**
 * Process events with image handling
 * @param {Array} events - Array of events to process
 * @param {string} timelineId - Timeline ID
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Promise<Array>} Processed events
 */
/**
 * Optimalisert processEventsWithImages funksjon som forhindrer duplikate uploads
 */
const processEventsWithImages = async (events, timelineId, isUpdate = false) => {
  const processedEvents = [];
  
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    let processedEvent = { ...event };

    // Handle image upload if there's a new image file
    if (event.imageFile && event.imageFile instanceof File) {
      try {
        // Sjekk om bildet allerede er lastet opp
        if (event.imageUrl && event.imageStoragePath && typeof event.imageFile === 'object') {
          // Bildet er allerede prosessert og lastet opp - ikke last opp igjen
          console.log('Image already uploaded, reusing existing URL');
          processedEvent.imageUrl = event.imageUrl;
          processedEvent.imageStoragePath = event.imageStoragePath;
          processedEvent.imageFileName = event.imageFileName;
          processedEvent.hasImage = true;
          delete processedEvent.imageFile;
        } else {
          // Generer stabilt event ID basert på innhold og posisjon
          const eventId = event.id || `event_${i}`;
          
          // Upload image og få URL
          const imageData = await uploadEventImage(event.imageFile, timelineId, eventId);
          
          // Hvis dette er en oppdatering og vi hadde et gammelt bilde, slett det
          if (isUpdate && event.imageStoragePath && event.imageStoragePath !== imageData.storagePath) {
            await deleteEventImage(event.imageStoragePath);
          }
          
          // Erstatt File objekt med bildedata
          processedEvent.imageUrl = imageData.url;
          processedEvent.imageStoragePath = imageData.storagePath;
          processedEvent.imageFileName = imageData.fileName;
          processedEvent.hasImage = true;
          delete processedEvent.imageFile;
        }
        
      } catch (error) {
        console.error('Error processing image for event:', error);
        // Fjern bildeegenskaper hvis opplasting feilet
        delete processedEvent.imageFile;
        processedEvent.hasImage = false;
      }
    }
    // Handle existing images (when imageFile is already a URL string)
    else if (event.imageFile && typeof event.imageFile === 'string') {
      processedEvent.imageUrl = event.imageFile;
      processedEvent.hasImage = true;
      delete processedEvent.imageFile; // Clean up - use imageUrl instead
    }
    // Handle existing imageUrl field
    else if (event.imageUrl) {
      processedEvent.imageUrl = event.imageUrl;
      processedEvent.hasImage = true;
    }
    // Handle case where image is removed
    else if (!event.imageFile && !event.imageUrl && event.hasImage) {
      // If updating and image was removed, mark for deletion
      if (isUpdate && event.imageStoragePath) {
        // Delete the old image
        await deleteEventImage(event.imageStoragePath);
      }
      
      processedEvent.hasImage = false;
      delete processedEvent.imageUrl;
      delete processedEvent.imageStoragePath;
      delete processedEvent.imageFileName;
    }

    // Process links in title and description
    const processedTitle = event.title ? processLinks(event.title) : event.title;
    const processedDescription = event.description ? processLinks(event.description) : event.description;
    
    processedEvent = {
      ...processedEvent,
      title: processedTitle,
      description: processedDescription,
      plainTitle: stripHtml(processedTitle),
      size: event.size || 'medium',
      color: event.color || 'default',
      xOffset: event.xOffset || 0,
      yOffset: event.yOffset || (event.offset || 0),
      offset: event.yOffset || event.offset || 0
    };

    processedEvents.push(processedEvent);
  }
  
  return processedEvents;
};

/**
 * Utility function to strip HTML for plaintext storage
 */
const stripHtml = (html) => {
  if (!html) return '';
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

/**
 * Process HTML content to make URLs clickable
 */
const processLinks = (html) => {
  if (!html) return '';
  
  if (html.includes('target="_blank" rel="noopener noreferrer"')) {
    return html;
  }
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  const processTextNodes = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const urlRegex = /(https?:\/\/[^\s<>]+)/g;
      const text = node.textContent;
      const fragments = text.split(urlRegex);
      
      if (fragments.length > 1) {
        const parent = node.parentNode;
        const nextSibling = node.nextSibling;
        
        parent.removeChild(node);
        
        fragments.forEach((fragment, i) => {
          if (i % 2 === 0) {
            if (fragment) {
              parent.insertBefore(document.createTextNode(fragment), nextSibling);
            }
          } else {
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
      Array.from(node.childNodes).forEach(processTextNodes);
    }
  };
  
  Array.from(tempDiv.childNodes).forEach(processTextNodes);
  
  return tempDiv.innerHTML;
};

/**
 * Save timeline to Firestore with image handling
 */
export const saveTimeline = async (timelineData) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('No authenticated user');
    }

    // Check timeline limit for new timelines
    if (!timelineData.id) {
      const timelinesQuery = query(
        collection(db, TIMELINES_COLLECTION),
        where('userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(timelinesQuery);
      
      if (querySnapshot.size >= 10) {
        throw new Error('Du har nådd grensen på 10 tidslinjer. Vennligst slett en eksisterende tidslinje før du oppretter en ny.');
      }
    }

    // Create temporary timeline ID for image uploads
    const tempTimelineId = timelineData.id || `temp_${Date.now()}`;

    // Process events with image handling
    const processedEvents = await processEventsWithImages(timelineData.events, tempTimelineId, false);

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
      userEmail: user.email,
      userDisplayName: user.displayName || user.email || 'Anonym bruker',
      backgroundColor: timelineData.backgroundColor || null,
      backgroundImage: timelineData.backgroundImage || null,
      timelineColor: timelineData.timelineColor || '#007bff',
      timelineThickness: timelineData.timelineThickness || 2,
      intervalSettings: intervalSettings,
      isPublic: timelineData.isPublic !== undefined ? timelineData.isPublic : false,
      collaborators: [],
      collaboratorRoles: {}
    };

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
 * Update an existing timeline in Firestore with image handling
 */
export const updateTimeline = async (timelineId, timelineData) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('No authenticated user');
    }

    const timelineRef = doc(db, TIMELINES_COLLECTION, timelineId);
    const timelineSnap = await getDoc(timelineRef);
    
    if (!timelineSnap.exists()) {
      throw new Error('Timeline not found');
    }
    
    const timelineDoc = timelineSnap.data();
    const isOwner = timelineDoc.userId === user.uid;
    
    let isEditor = false;
    if (user.email) {
      const userEmail = user.email.toLowerCase();
      const collaborators = timelineDoc.collaborators || [];
      const collaboratorRoles = timelineDoc.collaboratorRoles || {};
      
      if (collaborators.includes(userEmail) && collaboratorRoles[userEmail] === 'editor') {
        isEditor = true;
      }
    }
    
    if (!isOwner && !isEditor) {
      throw new Error('You do not have permission to update this timeline');
    }

    // Process events with image handling
    const processedEvents = await processEventsWithImages(timelineData.events, timelineId, true);

    const intervalSettings = {
      show: timelineData.showIntervals !== undefined ? timelineData.showIntervals : true, 
      count: timelineData.intervalCount !== undefined ? timelineData.intervalCount : 5,
      type: timelineData.intervalType !== undefined ? timelineData.intervalType : 'even'
    };

    let data = {
      title: timelineData.title,
      start: timelineData.start,
      end: timelineData.end,
      events: processedEvents,
      orientation: timelineData.orientation,
      updatedAt: serverTimestamp(),
      backgroundColor: timelineData.backgroundColor || null,
      backgroundImage: timelineData.backgroundImage || null,
      timelineColor: timelineData.timelineColor || '#007bff',
      timelineThickness: timelineData.timelineThickness || 2,
      intervalSettings: intervalSettings
    };
    
    if (isOwner) {
      data.isPublic = timelineData.isPublic !== undefined ? timelineData.isPublic : (timelineDoc.isPublic || false);
    }

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
 * Load timeline from Firestore with image handling
 */
export async function loadTimeline(timelineId) {
  try {
    const timelineRef = doc(db, TIMELINES_COLLECTION, timelineId);
    const timelineSnap = await getDoc(timelineRef);
    
    if (!timelineSnap.exists()) {
      throw new Error('Timeline not found');
    }
    
    const timelineData = timelineSnap.data();
    
    const currentUser = auth.currentUser;
    const isOwner = currentUser && timelineData.userId === currentUser.uid;
    
    const collaborators = timelineData.collaborators || [];
    const collaboratorRoles = timelineData.collaboratorRoles || {};
    
    let isCollaborator = false;
    let collaboratorRole = null;
    
    if (currentUser && currentUser.email) {
      const userEmail = currentUser.email.toLowerCase();
      isCollaborator = collaborators.includes(userEmail);
      if (isCollaborator) {
        collaboratorRole = collaboratorRoles[userEmail] || 'viewer';
      }
    }
    
    if (!timelineData.isPublic && !isOwner && !isCollaborator) {
      throw new Error('Denne tidslinjen er privat');
    }
    
    const start = timelineData.start?.toDate ? timelineData.start.toDate() : new Date(timelineData.start);
    const end = timelineData.end?.toDate ? timelineData.end.toDate() : new Date(timelineData.end);
    
    const intervalSettings = timelineData.intervalSettings || {
      show: true,
      count: 5,
      type: 'even'
    };
    
    return {
      id: timelineId,
      title: timelineData.title,
      start: start,
      end: end,
      orientation: timelineData.orientation || 'horizontal',
      events: timelineData.events.map(event => {
        return {
          title: event.title || '',
          plainTitle: event.plainTitle || stripHtml(event.title || ''),
          date: event.date?.toDate ? event.date.toDate() : new Date(event.date),
          xOffset: event.xOffset || 0,
          yOffset: event.yOffset || (event.offset || 0),
          offset: event.offset || 0,
          description: event.description || '',
          size: event.size || 'medium',
          color: event.color || 'default',
          // Handle images - use imageUrl if available, fallback to imageFile for backward compatibility
          hasImage: event.hasImage || false,
          imageFile: event.imageUrl || event.imageFile || null, // This will be the URL for display
          imageUrl: event.imageUrl || null,
          imageStoragePath: event.imageStoragePath || null,
          imageFileName: event.imageFileName || null
        };
      }),
      backgroundColor: timelineData.backgroundColor || null,
      backgroundImage: timelineData.backgroundImage || null,
      timelineColor: timelineData.timelineColor || '#007bff',
      timelineThickness: timelineData.timelineThickness || 2,
      showIntervals: intervalSettings.show,
      intervalCount: intervalSettings.count,
      intervalType: intervalSettings.type,
      intervalSettings: intervalSettings,
      isPublic: timelineData.isPublic || false,
      userId: timelineData.userId,
      userDisplayName: timelineData.userDisplayName || 'Anonym bruker',
      isOwner: isOwner,
      isCollaborator: isCollaborator,
      collaboratorRole: collaboratorRole,
      canEdit: isOwner || collaboratorRole === 'editor',
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
 */
export async function loadTimelineList() {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return [];
    }

    const timelinesQuery = query(
      collection(db, TIMELINES_COLLECTION),
      where('userId', '==', currentUser.uid)
    );
    
    const querySnapshot = await getDocs(timelinesQuery);
    
    const timelines = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      
      const start = data.start?.toDate ? data.start.toDate() : new Date(data.start);
      const end = data.end?.toDate ? data.end.toDate() : new Date(data.end);
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
      
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
        backgroundColor: data.backgroundColor || null,
        backgroundImage: data.backgroundImage || null,
        timelineColor: data.timelineColor || '#007bff',
        showIntervals: intervalSettings.show,
        intervalCount: intervalSettings.count,
        intervalType: intervalSettings.type,
        intervalSettings: intervalSettings,
        isPublic: data.isPublic || false,
        collaboratorCount: (data.collaborators || []).length
      });
    });
    
    return timelines.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error loading timeline list:', error);
    throw error;
  }
}

/**
 * Delete timeline from Firestore with image cleanup
 */
export async function deleteTimeline(timelineId) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('You must be logged in to delete timelines');
    }

    const timelineRef = doc(db, TIMELINES_COLLECTION, timelineId);
    const timelineSnap = await getDoc(timelineRef);
    
    if (!timelineSnap.exists()) {
      throw new Error('Timeline not found');
    }
    
    const timelineDoc = timelineSnap.data();
    if (timelineDoc.userId !== currentUser.uid) {
      throw new Error('You can only delete your own timelines');
    }

    // Delete associated images
    if (timelineDoc.events) {
      for (const event of timelineDoc.events) {
        if (event.imageStoragePath) {
          await deleteEventImage(event.imageStoragePath);
        }
      }
    }

    await deleteDoc(timelineRef);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error deleting timeline:', error);
    throw error;
  }
}

// Export other functions from original API
export async function updateTimelinePrivacy(timelineId, isPublic) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('You must be logged in to update timeline privacy');
    }

    const timelineRef = doc(db, TIMELINES_COLLECTION, timelineId);
    const timelineSnap = await getDoc(timelineRef);
    
    if (!timelineSnap.exists()) {
      throw new Error('Timeline not found');
    }
    
    const timelineDoc = timelineSnap.data();
    if (timelineDoc.userId !== currentUser.uid) {
      throw new Error('You can only update your own timelines');
    }

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

export async function getPublicTimelines(limitCount = 10) {
  try {
    const publicTimelinesQuery = query(
      collection(db, TIMELINES_COLLECTION),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(publicTimelinesQuery);
    
    const timelines = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      
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
        userId: data.userId,
        userDisplayName: data.userDisplayName || 'Anonym bruker',
        isPublic: true
      });
    });
    
    return timelines;
  } catch (error) {
    console.error('Error getting public timelines:', error);
    throw error;
  }
}

// Add collaborator functions (keeping original implementation)
export async function addTimelineCollaborator(timelineId, email, role = "viewer") {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('You must be logged in to add collaborators');
    }

    if (role !== "viewer" && role !== "editor") {
      throw new Error('Invalid role. Role must be "viewer" or "editor"');
    }

    const timelineRef = doc(db, TIMELINES_COLLECTION, timelineId);
    const timelineSnap = await getDoc(timelineRef);
    
    if (!timelineSnap.exists()) {
      throw new Error('Timeline not found');
    }
    
    const timelineData = timelineSnap.data();
    if (timelineData.userId !== currentUser.uid) {
      throw new Error('You can only add collaborators to your own timelines');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const collaborators = timelineData.collaborators || [];
    if (collaborators.includes(normalizedEmail)) {
      throw new Error('This user is already a collaborator');
    }
    
    const updatedCollaborators = [...collaborators, normalizedEmail];
    const collaboratorRoles = timelineData.collaboratorRoles || {};
    collaboratorRoles[normalizedEmail] = role;
    
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

export async function removeTimelineCollaborator(timelineId, email) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('You must be logged in to remove collaborators');
    }

    const timelineRef = doc(db, TIMELINES_COLLECTION, timelineId);
    const timelineSnap = await getDoc(timelineRef);
    
    if (!timelineSnap.exists()) {
      throw new Error('Timeline not found');
    }
    
    const timelineData = timelineSnap.data();
    if (timelineData.userId !== currentUser.uid) {
      throw new Error('You can only remove collaborators from your own timelines');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const collaborators = timelineData.collaborators || [];
    const updatedCollaborators = collaborators.filter(e => e !== normalizedEmail);
    
    const collaboratorRoles = timelineData.collaboratorRoles || {};
    if (collaboratorRoles[normalizedEmail]) {
      delete collaboratorRoles[normalizedEmail];
    }
    
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

export async function updateCollaboratorRole(timelineId, email, role) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('You must be logged in to update collaborator roles');
    }

    if (role !== "viewer" && role !== "editor") {
      throw new Error('Invalid role. Role must be "viewer" or "editor"');
    }

    const timelineRef = doc(db, TIMELINES_COLLECTION, timelineId);
    const timelineSnap = await getDoc(timelineRef);
    
    if (!timelineSnap.exists()) {
      throw new Error('Timeline not found');
    }
    
    const timelineData = timelineSnap.data();
    if (timelineData.userId !== currentUser.uid) {
      throw new Error('You can only update collaborators for your own timelines');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const collaborators = timelineData.collaborators || [];
    if (!collaborators.includes(normalizedEmail)) {
      throw new Error('This user is not a collaborator');
    }
    
    const collaboratorRoles = timelineData.collaboratorRoles || {};
    collaboratorRoles[normalizedEmail] = role;
    
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

export async function getTimelineCollaborators(timelineId) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('You must be logged in to view collaborators');
    }

    const timelineRef = doc(db, TIMELINES_COLLECTION, timelineId);
    const timelineSnap = await getDoc(timelineRef);
    
    if (!timelineSnap.exists()) {
      throw new Error('Timeline not found');
    }
    
    const timelineData = timelineSnap.data();
    const isOwner = timelineData.userId === currentUser.uid;
    const collaborators = timelineData.collaborators || [];
    const collaboratorRoles = timelineData.collaboratorRoles || {};
    const isCollaborator = currentUser.email && collaborators.includes(currentUser.email.toLowerCase());
    
    if (!isOwner && !isCollaborator) {
      throw new Error('You do not have permission to view collaborators for this timeline');
    }
    
    const collaboratorList = collaborators.map(email => ({
      email: email,
      role: collaboratorRoles[email] || "viewer"
    }));
    
    return collaboratorList;
  } catch (error) {
    console.error('Error getting collaborators:', error);
    throw error;
  }
}

export async function getSharedTimelines() {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      return [];
    }

    const sharedTimelinesQuery = query(
      collection(db, TIMELINES_COLLECTION),
      where('collaborators', 'array-contains', currentUser.email.toLowerCase())
    );
    
    const querySnapshot = await getDocs(sharedTimelinesQuery);
    const timelines = [];
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      
      const start = data.start?.toDate ? data.start.toDate() : new Date(data.start);
      const end = data.end?.toDate ? data.end.toDate() : new Date(data.end);
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
      
      const collaboratorRoles = data.collaboratorRoles || {};
      const userEmail = currentUser.email.toLowerCase();
      const collaboratorRole = collaboratorRoles[userEmail] || 'viewer';
      
      const intervalSettings = data.intervalSettings || {
        show: true,
        count: 5, 
        type: 'even'
      };
      
      let ownerEmail = data.userEmail || '';
      if (!ownerEmail && data.userId) {
        ownerEmail = data.userDisplayName || data.userId;
      }
      
      timelines.push({
        id: doc.id,
        title: data.title,
        start: start,
        end: end,
        createdAt: createdAt,
        backgroundColor: data.backgroundColor || null,
        backgroundImage: data.backgroundImage || null,
        timelineColor: data.timelineColor || '#007bff',
        showIntervals: intervalSettings.show,
        intervalCount: intervalSettings.count,
        intervalType: intervalSettings.type,
        intervalSettings: intervalSettings,
        userId: data.userId,
        userDisplayName: data.userDisplayName || '',
        ownerName: data.userDisplayName || ownerEmail || 'Eier',
        ownerEmail: ownerEmail,
        isShared: true,
        collaboratorRole: collaboratorRole,
        canEdit: collaboratorRole === 'editor'
      });
    }
    
    return timelines.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error getting shared timelines:', error);
    throw error;
  }
}

export function canEditTimeline(timelineData) {
  if (!timelineData) return false;
  
  const currentUser = auth.currentUser;
  if (!currentUser) return false;
  
  if (timelineData.userId === currentUser.uid) return true;
  
  const collaborators = timelineData.collaborators || [];
  const collaboratorRoles = timelineData.collaboratorRoles || {};
  const userEmail = currentUser.email?.toLowerCase();
  
  if (userEmail && collaborators.includes(userEmail)) {
    return collaboratorRoles[userEmail] === "editor";
  }
  
  return false;
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
  canEditTimeline
};