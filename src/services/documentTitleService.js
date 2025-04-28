/**
 * Document Title Service
 * 
 * This service provides functions to manage the document title
 * without requiring a hook, making it usable in both components and non-component code.
 */

// App name to use as suffix
const APP_NAME = 'TimeSculpt';

/**
 * Set the document title with an optional suffix
 * @param {string} title - The title to set
 * @param {boolean} withSuffix - Whether to append the app name suffix
 */
export const setDocumentTitle = (title, withSuffix = true) => {
  const newTitle = withSuffix ? `${title} - ${APP_NAME}` : title;
  document.title = newTitle;
};

/**
 * Reset the document title to the app name
 */
export const resetDocumentTitle = () => {
  document.title = APP_NAME;
};

export default {
  setDocumentTitle,
  resetDocumentTitle
};