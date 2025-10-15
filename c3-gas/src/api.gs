/**
 * API and Data Management for Google Apps Script
 * 
 * Provides centralized data management, Google Sheets integration,
 * and list management for the Data Call Manager application.
 * 
 * Features:
 * - Google Sheets backend communication
 * - List management (CRUD operations)
 * - Dashboard statistics calculation
 * - Data persistence with Properties Service
 * - Error handling and logging
 */

/**
 * Main API call handler for client-side requests
 * @param {string} functionName - The function to call
 * @param {Object} params - Parameters to pass to the function
 * @return {*} - Function result
 */
function apiCall(functionName, params) {
  try {
    switch(functionName) {
      case 'getAllLists':
        return getAllLists();
      case 'createList':
        return createList(params);
      case 'getListItems':
        return getListItems(params.listId);
      case 'deleteList':
        return deleteList(params.listId);
      case 'createDataCall':
        return createDataCall(params);
      case 'getDataCalls':
        return getDataCalls();
      case 'updateDataCall':
        return updateDataCall(params);
      case 'getDashboardStats':
        return getDashboardStats();
      default:
        throw new Error('Unknown API function: ' + functionName);
    }
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
}

/**
 * Gets all validation lists
 * @return {Array} Array of list objects
 */
function getAllLists() {
  try {
    const properties = PropertiesService.getScriptProperties();
    const listsData = properties.getProperty('validationLists');
    
    if (!listsData) {
      return [];
    }
    
    return JSON.parse(listsData);
  } catch (error) {
    console.error('Error getting lists:', error);
    return [];
  }
}

/**
 * Creates a new validation list
 * @param {Object} listData - The list data to create
 * @return {Object} Result object with success status and list ID
 */
function createList(listData) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const existingLists = getAllLists();
    
    const newList = {
      listId: Utilities.getUuid(),
      name: listData.name,
      description: listData.description || '',
      dataType: listData.dataType || 'text',
      items: listData.items || [],
      itemCount: (listData.items || []).length,
      createdDate: new Date().toISOString(),
      createdBy: Session.getActiveUser().getEmail()
    };
    
    existingLists.push(newList);
    properties.setProperty('validationLists', JSON.stringify(existingLists));
    
    return { success: true, id: newList.listId };
  } catch (error) {
    console.error('Error creating list:', error);
    throw new Error('Failed to create list: ' + error.message);
  }
}

/**
 * Gets items from a specific list
 * @param {string} listId - The ID of the list
 * @return {Array} Array of list items
 */
function getListItems(listId) {
  try {
    const lists = getAllLists();
    const list = lists.find(function(l) { return l.listId === listId; });
    
    if (!list) {
      throw new Error('List not found');
    }
    
    return list.items || [];
  } catch (error) {
    console.error('Error getting list items:', error);
    throw error;
  }
}

/**
 * Deletes a validation list
 * @param {string} listId - The ID of the list to delete
 * @return {Object} Result object with success status
 */
function deleteList(listId) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const existingLists = getAllLists();
    
    const filteredLists = existingLists.filter(function(list) {
      return list.listId !== listId;
    });
    
    if (filteredLists.length === existingLists.length) {
      throw new Error('List not found');
    }
    
    properties.setProperty('validationLists', JSON.stringify(filteredLists));
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting list:', error);
    throw error;
  }
}

/**
 * Creates a new data call
 * @param {Object} callData - The data call information
 * @return {Object} Result object with success status and call ID
 */
function createDataCall(callData) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const existingCalls = getDataCalls();
    
    const newCall = {
      id: Utilities.getUuid(),
      title: callData.title,
      type: callData.type,
      description: callData.description,
      priority: callData.priority,
      frequency: callData.frequency,
      status: 'active',
      responses: 0,
      totalRequired: callData.totalRequired || 0,
      createdDate: new Date().toISOString(),
      createdBy: Session.getActiveUser().getEmail(),
      dueDate: callData.dueDate,
      columnsToComplete: callData.columnsToComplete || '',
      matchingCriteria: callData.matchingCriteria || '',
      requiredFields: callData.requiredFields || '',
      baseDataFile: callData.baseDataFile || ''
    };
    
    existingCalls.push(newCall);
    properties.setProperty('dataCalls', JSON.stringify(existingCalls));
    
    return { success: true, id: newCall.id };
  } catch (error) {
    console.error('Error creating data call:', error);
    throw new Error('Failed to create data call: ' + error.message);
  }
}

/**
 * Gets all data calls
 * @return {Array} Array of data call objects
 */
function getDataCalls() {
  try {
    const properties = PropertiesService.getScriptProperties();
    const callsData = properties.getProperty('dataCalls');
    
    if (!callsData) {
      return [];
    }
    
    return JSON.parse(callsData);
  } catch (error) {
    console.error('Error getting data calls:', error);
    return [];
  }
}

/**
 * Updates an existing data call
 * @param {Object} updateData - The update data including call ID
 * @return {Object} Result object with success status
 */
function updateDataCall(updateData) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const existingCalls = getDataCalls();
    
    const callIndex = existingCalls.findIndex(function(call) {
      return call.id === updateData.id;
    });
    
    if (callIndex === -1) {
      throw new Error('Data call not found');
    }
    
    // Update the call data
    Object.keys(updateData).forEach(function(key) {
      if (key !== 'id') {
        existingCalls[callIndex][key] = updateData[key];
      }
    });
    
    existingCalls[callIndex].lastModified = new Date().toISOString();
    existingCalls[callIndex].modifiedBy = Session.getActiveUser().getEmail();
    
    properties.setProperty('dataCalls', JSON.stringify(existingCalls));
    
    return { success: true };
  } catch (error) {
    console.error('Error updating data call:', error);
    throw error;
  }
}

/**
 * Calculates and returns dashboard statistics
 * @return {Object} Dashboard statistics object
 */
function getDashboardStats() {
  try {
    const dataCalls = getDataCalls();
    const now = new Date();
    
    const stats = {
      activeCalls: 0,
      completedCalls: 0,
      overdueCalls: 0,
      pendingResponses: 0
    };
    
    dataCalls.forEach(function(call) {
      if (call.status === 'active') {
        stats.activeCalls++;
        
        // Check if overdue
        if (call.dueDate && new Date(call.dueDate) < now) {
          stats.overdueCalls++;
        }
        
        // Calculate pending responses
        const required = call.totalRequired || 0;
        const responses = call.responses || 0;
        stats.pendingResponses += Math.max(0, required - responses);
      } else if (call.status === 'completed') {
        stats.completedCalls++;
      }
    });
    
    return stats;
  } catch (error) {
    console.error('Error calculating dashboard stats:', error);
    return { activeCalls: 0, completedCalls: 0, overdueCalls: 0, pendingResponses: 0 };
  }
}

/**
 * Communicates with Google Sheets backend
 * @param {string} functionName - The backend function to call
 * @param {Object} data - Data to pass to the backend function
 * @return {Object} Backend response
 */
function callGoogleAppsScriptBackend(functionName, data) {
  try {
    switch(functionName) {
      case 'importGoogleSheet':
        return importGoogleSheet(data.url, data.requestId);
      case 'validateSheetAccess':
        return validateSheetAccess(data.url);
      default:
        throw new Error('Unknown backend function: ' + functionName);
    }
  } catch (error) {
    console.error('Backend call error:', error);
    throw error;
  }
}

/**
 * Imports data from a Google Sheet
 * @param {string} sheetUrl - The Google Sheets URL
 * @param {string} requestId - Request identifier
 * @return {Object} Import result with data and metadata
 */
function importGoogleSheet(sheetUrl, requestId) {
  try {
    // Extract spreadsheet ID from URL
    const spreadsheetId = extractSpreadsheetId(sheetUrl);
    if (!spreadsheetId) {
      throw new Error('Invalid Google Sheets URL format');
    }
    
    // Open the spreadsheet
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getActiveSheet();
    
    // Get data from the sheet
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    if (values.length === 0) {
      throw new Error('The spreadsheet is empty');
    }
    
    // Separate headers and data rows
    const headers = values[0];
    const rows = values.slice(1);
    
    return {
      success: true,
      data: {
        headers: headers,
        rows: rows
      },
      metadata: {
        sheetName: sheet.getName(),
        importedAt: new Date().toISOString(),
        requestId: requestId,
        totalRows: rows.length,
        totalColumns: headers.length
      }
    };
  } catch (error) {
    console.error('Error importing Google Sheet:', error);
    
    if (error.message.includes('Permission denied') || error.message.includes('not found')) {
      throw new Error('Access denied: The Google Sheet is not publicly accessible or not shared properly.');
    } else if (error.message.includes('Invalid')) {
      throw new Error('Invalid Google Sheets URL format or sheet not found.');
    } else {
      throw new Error('Error importing sheet: ' + error.message);
    }
  }
}

/**
 * Validates access to a Google Sheet
 * @param {string} sheetUrl - The Google Sheets URL
 * @return {Object} Validation result
 */
function validateSheetAccess(sheetUrl) {
  try {
    const spreadsheetId = extractSpreadsheetId(sheetUrl);
    if (!spreadsheetId) {
      return { success: false, error: 'Invalid Google Sheets URL format' };
    }
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getActiveSheet();
    
    return {
      success: true,
      metadata: {
        title: spreadsheet.getName(),
        sheetName: sheet.getName(),
        lastModified: new Date(spreadsheet.getLastUpdated()).toISOString()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: 'Cannot access sheet: ' + error.message
    };
  }
}

/**
 * Extracts spreadsheet ID from Google Sheets URL
 * @param {string} url - The Google Sheets URL
 * @return {string|null} The spreadsheet ID or null if invalid
 */
function extractSpreadsheetId(url) {
  try {
    const patterns = [
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      /\/file\/d\/([a-zA-Z0-9-_]+)/
    ];
    
    for (let i = 0; i < patterns.length; i++) {
      const match = url.match(patterns[i]);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Initializes sample data for testing (optional)
 */
function initializeSampleData() {
  try {
    const properties = PropertiesService.getScriptProperties();
    
    // Check if data already exists
    if (properties.getProperty('dataCalls')) {
      return;
    }
    
    // Create sample data calls
    const sampleCalls = [
      {
        id: '1',
        title: 'GSA Internal Orders - Funding Office Update',
        type: 'enrichment',
        description: 'Complete columns E and F with the funding office and discount rate for all GSA internal orders.',
        priority: 'high',
        frequency: 'monthly',
        status: 'active',
        responses: 15,
        totalRequired: 20,
        columnsToComplete: 'Column E (Funding Office), Column F (Discount Rate)',
        baseDataFile: 'gsa_internal_orders.xlsx',
        createdDate: new Date().toISOString(),
        createdBy: Session.getActiveUser().getEmail()
      }
    ];
    
    // Create sample validation lists
    const sampleLists = [
      {
        listId: '1',
        name: 'Funding Offices',
        description: 'List of available funding offices',
        dataType: 'text',
        items: ['Office A', 'Office B', 'Office C'],
        itemCount: 3,
        createdDate: new Date().toISOString(),
        createdBy: Session.getActiveUser().getEmail()
      }
    ];
    
    properties.setProperty('dataCalls', JSON.stringify(sampleCalls));
    properties.setProperty('validationLists', JSON.stringify(sampleLists));
    
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
}