/**
 * Main entry point for the Google Apps Script Web App
 * Handles HTTP requests and serves the main HTML page
 */
function doGet() {
  try {
    const template = HtmlService.createTemplateFromFile('index');
    return template.evaluate()
      .setTitle('Advanced Data Table System')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
  } catch (error) {
    console.error('Error in doGet:', error);
    return HtmlService.createHtmlOutput('<h1>Error loading application</h1>');
  }
}

/**
 * Include function for HTML templates
 * Allows including CSS and JavaScript files in HTML templates
 * @param {string} filename - Name of the file to include
 * @returns {string} Content of the file
 */
function include(filename) {
  try {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  } catch (error) {
    console.error(`Error including file ${filename}:`, error);
    return `<!-- Error loading ${filename} -->`;
  }
}

/**
 * Get application configuration
 * Returns configuration data for the frontend
 * @returns {Object} Configuration object
 */
function getAppConfig() {
  return {
    title: 'Advanced Data Table System',
    version: '1.0.0',
    maxRows: 2000,
    defaultPageSize: 30
  };
}

/**
 * Health check endpoint
 * @returns {Object} Health status
 */
function healthCheck() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  };
}