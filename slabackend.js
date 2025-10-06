/**
 * Google Apps Script Backend for SLA Tracker
 * Handles SLA data submission and appends to Google Sheets
 */

// Main function to handle web app requests
function doPost(e) {
  try {
    // Parse the JSON data from the request
    const data = JSON.parse(e.postData.contents);
    
    // Validate the data structure
    if (!data.slas || !Array.isArray(data.slas)) {
      return createResponse(false, 'Invalid data structure');
    }
    
    // Process each SLA in the submission
    const results = processSLAs(data);
    
    return createResponse(true, 'SLAs processed successfully', {
      processedCount: results.successful,
      failedCount: results.failed,
      totalCount: data.slaCount
    });
    
  } catch (error) {
    console.error('Error processing SLA data:', error);
    return createResponse(false, 'Server error: ' + error.message);
  }
}

// Process all SLAs and append to sheet
function processSLAs(data) {
  const sheet = getOrCreateSheet('SLAs');
  const results = { successful: 0, failed: 0 };
  
  // Initialize headers if sheet is empty
  initializeHeaders(sheet);
  
  // Process each SLA
  data.slas.forEach(sla => {
    try {
      const rowData = flattenSLAData(sla, data.timestamp);
      appendToSheet(sheet, rowData);
      results.successful++;
    } catch (error) {
      console.error('Error processing SLA:', sla.slaName, error);
      results.failed++;
    }
  });
  
  return results;
}

// Get or create the SLAs sheet
function getOrCreateSheet(sheetName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    console.log('Created new sheet:', sheetName);
  }
  
  return sheet;
}

// Initialize headers if sheet is empty
function initializeHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    const headers = [
      'ID',
      'Timestamp',
      'SLA Name',
      'Team Name',
      'Description',
      'Task Name',
      'SLA Type',
      'Start Date',
      'End Date',
      'Status',
      'Progress',
      'Current Value',
      // Notifications
      'Notify On Risk',
      'Notify On Miss',
      'Notification Email',
      // Configuration (flattened)
      'Config Action',
      'Config Unit',
      'Config Target Type',
      'Config Target Value',
      'Config Target Min',
      'Config Target Max',
      'Config Target Bool',
      'Config Cadence',
      'Config Start Time',
      'Config End Time',
      'Config Days of Week',
      'Child SLAs Count',
      'Child SLAs Details',
      // Metadata
      'Created By Script',
      'Last Updated'
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format header row
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#004F87');
    headerRange.setFontColor('#FFFFFF');
    
    // Freeze header row
    sheet.setFrozenRows(1);
    
    console.log('Initialized headers for SLAs sheet');
  }
}

// Flatten SLA data into a single row for the sheet
function flattenSLAData(sla, timestamp) {
  // Generate unique ID if not provided
  const id = sla.id || generateSLAId();
  
  // Basic SLA data
  const baseData = [
    id,
    timestamp,
    sla.slaName || '',
    sla.teamName || '',
    sla.description || '',
    sla.taskName || '',
    sla.slaType || '',
    sla.startDate || '',
    sla.endDate || '',
    sla.status || 'pending',
    sla.progress || 0,
    sla.currentValue || ''
  ];
  
  // Notifications data
  const notificationData = [
    sla.notifications?.onRisk || false,
    sla.notifications?.onMiss || false,
    sla.notifications?.email || ''
  ];
  
  // Configuration data (flattened based on SLA type)
  const configData = flattenConfiguration(sla.configuration, sla.slaType);
  
  // Child SLAs
  const childSLAData = flattenChildSLAs(sla.configuration?.childSLAs);
  
  // Metadata
  const metadata = [
    'Google Apps Script',
    new Date().toISOString()
  ];
  
  return [...baseData, ...notificationData, ...configData, ...childSLAData, ...metadata];
}

// Flatten configuration based on SLA type
function flattenConfiguration(config, slaType) {
  const defaultConfig = ['', '', '', '', '', '', '', '', '', '', '', 0, ''];
  
  if (!config) return defaultConfig;
  
  let configData = [
    config.action || '',           // Config Action
    config.unit || '',            // Config Unit
    config.targetType || '',      // Config Target Type
    '', '', '', '',               // Target values (filled based on type)
    config.cadence || '',         // Config Cadence
    config.startTime || '',       // Config Start Time
    config.endTime || '',         // Config End Time
    '', '', ''                    // Days of week, child count, child details (filled later)
  ];
  
  // Handle different target types
  if (config.target) {
    if (config.targetType === 'range' && typeof config.target === 'object') {
      configData[4] = config.target.min || '';  // Config Target Min
      configData[5] = config.target.max || '';  // Config Target Max
    } else if (typeof config.target === 'boolean') {
      configData[6] = config.target;            // Config Target Bool
    } else {
      configData[3] = config.target;            // Config Target Value
    }
  }
  
  // Handle days of week for availability
  if (config.daysOfWeek && Array.isArray(config.daysOfWeek)) {
    configData[10] = config.daysOfWeek.join(', ');
  }
  
  return configData;
}

// Flatten child SLAs data
function flattenChildSLAs(childSLAs) {
  if (!childSLAs || !Array.isArray(childSLAs) || childSLAs.length === 0) {
    return [0, ''];
  }
  
  const count = childSLAs.length;
  const details = childSLAs.map(child => 
    `${child.targetValue} ${child.unitDescription}`
  ).join(' | ');
  
  return [count, details];
}

// Generate unique SLA ID
function generateSLAId() {
  const timestamp = new Date().getTime();
  const random = Math.random().toString(36).substring(2, 7);
  return `sla-${timestamp}-${random}`;
}

// Append data to sheet
function appendToSheet(sheet, rowData) {
  try {
    sheet.appendRow(rowData);
    
    // Format the newly added row
    const lastRow = sheet.getLastRow();
    const range = sheet.getRange(lastRow, 1, 1, rowData.length);
    
    // Alternate row colors for better readability
    if (lastRow % 2 === 0) {
      range.setBackground('#f8f9fa');
    }
    
    // Auto-resize columns if needed
    if (lastRow === 2) { // Only on first data row to avoid performance issues
      sheet.autoResizeColumns(1, rowData.length);
    }
    
  } catch (error) {
    console.error('Error appending to sheet:', error);
    throw error;
  }
}

// Create standardized response
function createResponse(success, message, data = null) {
  const response = {
    success: success,
    message: message,
    timestamp: new Date().toISOString()
  };
  
  if (data) {
    response.data = data;
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// Test function for development
function testSLASubmission() {
  const testData = {
    timestamp: new Date().toISOString(),
    slaCount: 1,
    slas: [
      {
        slaName: "Test SLA",
        teamName: "Test Team",
        description: "Test description",
        taskName: "Test task",
        slaType: "quantity",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        notifications: {
          onRisk: true,
          onMiss: true,
          email: "test@example.com"
        },
        configuration: {
          action: "testing",
          unit: "items",
          targetType: "single",
          target: 100
        }
      }
    ]
  };
  
  const result = processSLAs(testData);
  console.log('Test result:', result);
}

// Helper function to get SLA data from sheet (for reading)
function getSLAs(limit = null) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SLAs');
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return createResponse(true, 'No SLAs found', []);
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    // Convert to objects
    const slas = rows.map(row => {
      const sla = {};
      headers.forEach((header, index) => {
        sla[header] = row[index];
      });
      return sla;
    });
    
    // Apply limit if specified
    const result = limit ? slas.slice(0, limit) : slas;
    
    return createResponse(true, `Retrieved ${result.length} SLAs`, result);
    
  } catch (error) {
    console.error('Error retrieving SLAs:', error);
    return createResponse(false, 'Error retrieving SLAs: ' + error.message);
  }
}

// Function to handle GET requests (optional - for retrieving data)
function doGet(e) {
  try {
    const action = e.parameter.action;
    const limit = e.parameter.limit ? parseInt(e.parameter.limit) : null;
    
    switch (action) {
      case 'getSLAs':
        return getSLAs(limit);
      default:
        return createResponse(false, 'Invalid action or method not supported');
    }
  } catch (error) {
    console.error('Error handling GET request:', error);
    return createResponse(false, 'Server error: ' + error.message);
  }
}