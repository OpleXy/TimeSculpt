// src/services/backgroundImageService.js
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { auth } from '../firebase';

const storage = getStorage();

// Konfigurasjonsinnstillinger
const CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  storagePath: 'timeline-backgrounds'
};

/**
 * Validerer en bildefil før opplasting
 * @param {File} file - Filen som skal valideres
 * @throws {Error} Hvis filen ikke oppfyller kravene
 */
export const validateImageFile = (file) => {
  if (!file) {
    throw new Error('Ingen fil valgt');
  }

  if (!CONFIG.allowedTypes.includes(file.type)) {
    throw new Error(`Filtypen ${file.type} er ikke støttet. Kun JPEG, PNG og WebP er tillatt.`);
  }

  if (file.size > CONFIG.maxFileSize) {
    const maxSizeMB = CONFIG.maxFileSize / (1024 * 1024);
    throw new Error(`Filen er for stor. Maksimal størrelse er ${maxSizeMB}MB.`);
  }

  return true;
};

/**
 * Genererer et unikt filnavn for Firebase Storage
 * @param {string} userId - Brukerens ID
 * @param {string} originalFileName - Opprinnelig filnavn
 * @returns {string} Unikt filnavn
 */
const generateUniqueFileName = (userId, originalFileName) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileExtension = originalFileName.split('.').pop();
  
  return `${userId}_${timestamp}_${randomString}.${fileExtension}`;
};

/**
 * Laster opp et bakgrunnsbilde til Firebase Storage
 * @param {File} file - Bildefilen som skal lastes opp
 * @param {string} userId - Brukerens ID
 * @param {Function} onProgress - Callback for opplastingsprogress (valgfritt)
 * @returns {Promise<string>} URL til det opplastede bildet
 */
export const uploadBackgroundImage = async (file, userId, onProgress = null) => {
  try {
    // Valider filen
    validateImageFile(file);

    // Sjekk at brukeren er autentisert
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
      throw new Error('Uautorisert: Du må være logget inn for å laste opp bilder');
    }

    // Generer unikt filnavn
    const uniqueFileName = generateUniqueFileName(userId, file.name);
    const storagePath = `${CONFIG.storagePath}/${userId}/${uniqueFileName}`;
    
    // Opprett en referanse til storage-loksjonen
    const storageRef = ref(storage, storagePath);

    // Start opplastingen med progress tracking
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Beregn og rapporter progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          
          if (onProgress && typeof onProgress === 'function') {
            onProgress(progress);
          }
        },
        (error) => {
          console.error('Feil ved opplasting:', error);
          
          // Håndter spesifikke Firebase Storage-feil
          switch (error.code) {
            case 'storage/unauthorized':
              reject(new Error('Du har ikke tillatelse til å laste opp bilder'));
              break;
            case 'storage/canceled':
              reject(new Error('Opplastingen ble avbrutt'));
              break;
            case 'storage/quota-exceeded':
              reject(new Error('Lagringskvoten er overskredet'));
              break;
            case 'storage/invalid-format':
              reject(new Error('Ugyldig filformat'));
              break;
            case 'storage/invalid-checksum':
              reject(new Error('Filen ble skadet under opplasting'));
              break;
            default:
              reject(new Error(`Opplasting feilet: ${error.message}`));
          }
        },
        async () => {
          try {
            // Opplasting fullført - hent nedlastings-URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(new Error(`Kunne ikke hente bilde-URL: ${error.message}`));
          }
        }
      );
    });
  } catch (error) {
    console.error('Feil ved opplasting av bakgrunnsbilde:', error);
    throw error;
  }
};

/**
 * Sletter et bakgrunnsbilde fra Firebase Storage
 * @param {string} imageUrl - URL til bildet som skal slettes
 * @returns {Promise<void>}
 */
export const deleteBackgroundImage = async (imageUrl) => {
  try {
    // Sjekk at brukeren er autentisert
    if (!auth.currentUser) {
      throw new Error('Du må være logget inn for å slette bilder');
    }

    // Ekstraher storage-referansen fra URL-en
    const storageRef = ref(storage, imageUrl);
    
    // Sjekk at bildet tilhører den innloggede brukeren
    const pathSegments = storageRef.fullPath.split('/');
    if (pathSegments.length < 3 || pathSegments[1] !== auth.currentUser.uid) {
      throw new Error('Du kan kun slette dine egne bilder');
    }

    // Slett bildet
    await deleteObject(storageRef);
    console.log('Bakgrunnsbilde slettet successfully');
  } catch (error) {
    console.error('Feil ved sletting av bakgrunnsbilde:', error);
    
    // Håndter spesifikke Firebase Storage-feil
    switch (error.code) {
      case 'storage/object-not-found':
        throw new Error('Bildet finnes ikke');
      case 'storage/unauthorized':
        throw new Error('Du har ikke tillatelse til å slette dette bildet');
      default:
        throw new Error(`Sletting feilet: ${error.message}`);
    }
  }
};

/**
 * Henter en liste over brukerens opplastede bakgrunnsbilder
 * @param {string} userId - Brukerens ID
 * @returns {Promise<Array>} Array med bilde-URLs
 */
export const getUserBackgroundImages = async (userId) => {
  try {
    // Sjekk at brukeren er autentisert
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
      throw new Error('Uautorisert: Du kan kun hente dine egne bilder');
    }

    // Note: listAll krever Firebase Storage Rules som tillater listing
    // Dette er en begrenset funksjon som kan være deaktivert av sikkerhetshensyn
    const { listAll } = await import('firebase/storage');
    const userStorageRef = ref(storage, `${CONFIG.storagePath}/${userId}`);
    
    const result = await listAll(userStorageRef);
    
    // Hent nedlastings-URLs for alle bilder
    const imagePromises = result.items.map(itemRef => getDownloadURL(itemRef));
    const imageUrls = await Promise.all(imagePromises);
    
    return imageUrls;
  } catch (error) {
    console.error('Feil ved henting av brukerbilder:', error);
    
    if (error.code === 'storage/unauthorized') {
      // Hvis listing ikke er tillatt, returnerer vi en tom array
      console.warn('Listing av brukerbilder er ikke tillatt av sikkerhetshensyn');
      return [];
    }
    
    throw error;
  }
};

/**
 * Komprimerer et bilde før opplasting (valgfritt)
 * @param {File} file - Bildefilen som skal komprimeres
 * @param {number} maxWidth - Maksimal bredde
 * @param {number} maxHeight - Maksimal høyde
 * @param {number} quality - Bildekvalitet (0.1 - 1.0)
 * @returns {Promise<File>} Komprimert bildefil
 */
export const compressImage = (file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Beregn nye dimensjoner
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Sett canvas-dimensjoner
      canvas.width = width;
      canvas.height = height;

      // Tegn og komprimer bildet
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Opprett en ny File fra blob
            const compressedFile = new File([blob], file.name, {
              type: blob.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Kunne ikke komprimere bildet'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Kunne ikke laste bildet for komprimering'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Henter metadata om et bilde
 * @param {File} file - Bildefilen
 * @returns {Promise<Object>} Bildemetadata
 */
export const getImageMetadata = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const metadata = {
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      };
      
      URL.revokeObjectURL(img.src);
      resolve(metadata);
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Kunne ikke lese bildemetadata'));
    };

    img.src = URL.createObjectURL(file);
  });
};

export default {
  uploadBackgroundImage,
  deleteBackgroundImage,
  getUserBackgroundImages,
  validateImageFile,
  compressImage,
  getImageMetadata,
  CONFIG
};