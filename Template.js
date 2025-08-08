// Template.gs - This would be in your template spreadsheet

/**
 * This script is part of a template spreadsheet.
 * Core functionality is in the TemplateManager library.
 */

/**
 * Example function that uses the library
 */
function doSomething() {
  // Use library functions
  TemplateManager.someHelperFunction();
  
  // Template-specific code
  // ...
}

/**
 * Function that runs when the spreadsheet opens
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Template Tools')
    .addItem('Do Something', 'doSomething')
    .addToUi();
}