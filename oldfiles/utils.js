// File: Utils.gs - additional utility functions for the library

/**
 * Format a date for display
 * @param {Date} date - The date to format
 * @return {string} Formatted date string
 */
function formatDate(date) {
  return Utilities.formatDate(new Date(date), Session.getScriptProperties().getProperty('TIMEZONE') || 'GMT', 'MMM dd, yyyy HH:mm');
}

/**
 * Get the default destination folder ID
 * @return {string} Folder ID for new clones
 */
function getDefaultDestinationFolderId() {
  return PropertiesService.getScriptProperties().getProperty('DESTINATION_FOLDER_ID');
}