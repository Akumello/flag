// File: Library.gs
/**
 * Core functionality for the Template Manager system
 */

/**
 * Creates a copy of a template spreadsheet with its scripts
 * @param {string} templateId - The ID of the template spreadsheet
 * @param {string} newName - Name for the new spreadsheet
 * @param {string} destinationFolderId - Folder ID where copy should be placed
 * @return {Object} Information about the created copy
 */
function cloneTemplate(templateId, newName, destinationFolderId) {
  try {
    // Get the template file and destination folder
    const templateFile = DriveApp.getFileById(templateId);
    const destinationFolder = DriveApp.getFolderById(destinationFolderId);
    
    // Create a copy of the spreadsheet in the destination folder
    const newFile = templateFile.makeCopy(newName, destinationFolder);
    const newSpreadsheet = SpreadsheetApp.openById(newFile.getId());
    
    // Record this clone in our tracking spreadsheet
    const cloneInfo = {
      id: newFile.getId(),
      name: newName,
      templateSource: templateId,
      createdAt: new Date().toISOString(),
      createdBy: Session.getEffectiveUser().getEmail(),
      url: newFile.getUrl()
    };
    
    recordClone(cloneInfo);
    
    return cloneInfo;
  } catch (error) {
    console.error('Error cloning template:', error);
    throw new Error('Failed to clone template: ' + error.message);
  }
}

/**
 * Record information about a cloned template in the tracking spreadsheet
 * @param {Object} cloneInfo - Information about the clone
 */
function recordClone(cloneInfo) {
  const trackingSpreadsheetId = getTrackingSpreadsheetId();
  const sheet = SpreadsheetApp.openById(trackingSpreadsheetId).getSheetByName('Clones');
  
  sheet.appendRow([
    cloneInfo.id, 
    cloneInfo.name, 
    cloneInfo.templateSource,
    cloneInfo.createdAt,
    cloneInfo.createdBy,
    cloneInfo.url
  ]);
}

/**
 * Get the ID of the tracking spreadsheet, creating it if it doesn't exist
 * @return {string} The ID of the tracking spreadsheet
 */
function getTrackingSpreadsheetId() {
  const scriptProperties = PropertiesService.getScriptProperties();
  let trackingId = scriptProperties.getProperty('TRACKING_SPREADSHEET_ID');
  
  if (!trackingId) {
    // Create a new tracking spreadsheet
    const spreadsheet = SpreadsheetApp.create('Template Manager - Tracking');
    trackingId = spreadsheet.getId();
    
    // Save the ID to script properties
    scriptProperties.setProperty('TRACKING_SPREADSHEET_ID', trackingId);
    
    // Set up the tracking sheet
    const sheet = spreadsheet.getActiveSheet().setName('Clones');
    sheet.appendRow(['ID', 'Name', 'Template Source', 'Created At', 'Created By', 'URL']);
    sheet.setFrozenRows(1);
  }
  
  return trackingId;
}

/**
 * Get all templates that are available for cloning
 * @return {Array} List of available templates
 */
function getAvailableTemplates() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const templateFolderId = scriptProperties.getProperty('TEMPLATES_FOLDER_ID');
  
  if (!templateFolderId) {
    return [];
  }
  
  const folder = DriveApp.getFolderById(templateFolderId);
  const files = folder.getFilesByType(MimeType.GOOGLE_SHEETS);
  const templates = [];
  
  while (files.hasNext()) {
    const file = files.next();
    templates.push({
      id: file.getId(),
      name: file.getName(),
      url: file.getUrl(),
      lastUpdated: file.getLastUpdated()
    });
  }
  
  return templates;
}

/**
 * Get all cloned spreadsheets
 * @return {Array} List of all clones
 */
function getClones() {
  try {
    const trackingSpreadsheetId = getTrackingSpreadsheetId();
    const sheet = SpreadsheetApp.openById(trackingSpreadsheetId).getSheetByName('Clones');
    
    const data = sheet.getDataRange().getValues();
    const headers = data.shift(); // Remove header row
    
    return data.map(row => {
      const clone = {};
      headers.forEach((header, index) => {
        clone[header.toLowerCase().replace(' ', '_')] = row[index];
      });
      return clone;
    });
  } catch (error) {
    console.error('Error getting clones:', error);
    return [];
  }
}

/**
 * Setup configurations for the template system
 * @param {string} templatesFolderId - Folder containing template spreadsheets
 * @param {string} destinationFolderId - Default folder for new clones
 */
function setupConfig(templatesFolderId, destinationFolderId) {
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('TEMPLATES_FOLDER_ID', templatesFolderId);
  scriptProperties.setProperty('DESTINATION_FOLDER_ID', destinationFolderId);
}