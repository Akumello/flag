// File: WebApp.gs
/**
 * Create a web app interface for cloning templates
 */

/**
 * Serve the web app HTML
 */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Template Manager')
    .setFaviconUrl('https://www.google.com/images/about/sheets-icon.svg');
}

/**
 * Get all available templates to display in the UI
 */
function getAvailableTemplates() {
  return TemplateManager.getAvailableTemplates();
}

/**
 * Get all clones to display in the UI
 */
function getClones() {
  return TemplateManager.getClones();
}

/**
 * Create a new clone from a template
 */
function createClone(templateId, newName, destinationFolderId) {
  if (!destinationFolderId) {
    destinationFolderId = TemplateManager.getDefaultDestinationFolderId();
  }
  
  return TemplateManager.cloneTemplate(templateId, newName, destinationFolderId);
}

/**
 * Include HTML files
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}