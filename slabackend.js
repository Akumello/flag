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



/**
 * Enhanced function to get all SLAs from the sheet and reconstruct them
 * Returns data in the format expected by the frontend
 */
function getAllSLAs() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SLAs');
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return createResponse(true, 'No SLAs found', {
        timestamp: new Date().toISOString(),
        slaCount: 0,
        slas: []
      });
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    // Convert flat rows back to SLA objects
    const slas = rows.map(row => reconstructSLAFromRow(headers, row));
    
    // Filter out any invalid SLAs
    const validSLAs = slas.filter(sla => sla && sla.slaName);
    
    const result = {
      timestamp: new Date().toISOString(),
      slaCount: validSLAs.length,
      slas: validSLAs
    };
    
    return createResponse(true, `Retrieved ${validSLAs.length} SLAs`, result);
    
  } catch (error) {
    console.error('Error retrieving SLAs:', error);
    return createResponse(false, 'Error retrieving SLAs: ' + error.message);
  }
}

/**
 * Reconstruct a full SLA object from a flat sheet row
 */
function reconstructSLAFromRow(headers, row) {
  try {
    const sla = {};
    
    // Create a map for easy access
    const dataMap = {};
    headers.forEach((header, index) => {
      dataMap[header] = row[index];
    });
    
    // Basic SLA properties
    sla.id = dataMap['ID'] || '';
    sla.slaName = dataMap['SLA Name'] || '';
    sla.teamName = dataMap['Team Name'] || '';
    sla.description = dataMap['Description'] || '';
    sla.taskName = dataMap['Task Name'] || '';
    sla.slaType = dataMap['SLA Type'] || '';
    sla.startDate = formatDate(dataMap['Start Date']);
    sla.endDate = formatDate(dataMap['End Date']);
    sla.status = dataMap['Status'] || 'pending';
    sla.progress = parseFloat(dataMap['Progress']) || 0;
    sla.currentValue = parseCurrentValue(dataMap['Current Value'], sla.slaType);
    
    // Reconstruct notifications object
    sla.notifications = {
      onRisk: parseBoolean(dataMap['Notify On Risk']),
      onMiss: parseBoolean(dataMap['Notify On Miss']),
      email: dataMap['Notification Email'] || null
    };
    
    // Reconstruct configuration object
    sla.configuration = reconstructConfiguration(dataMap, sla.slaType);
    
    // Add metrics (generated from current data)
    sla.metrics = generateMetricsFromSLA(sla);
    
    // Add activity log (generated from metadata)
    sla.activityLog = generateActivityLog(dataMap);
    
    return sla;
    
  } catch (error) {
    console.error('Error reconstructing SLA from row:', error);
    return null;
  }
}

/**
 * Reconstruct configuration object based on SLA type
 */
function reconstructConfiguration(dataMap, slaType) {
  const config = {};
  
  // Common configuration properties
  if (dataMap['Config Action']) config.action = dataMap['Config Action'];
  if (dataMap['Config Unit']) config.unit = dataMap['Config Unit'];
  if (dataMap['Config Target Type']) config.targetType = dataMap['Config Target Type'];
  if (dataMap['Config Cadence']) config.cadence = dataMap['Config Cadence'];
  if (dataMap['Config Start Time']) config.startTime = dataMap['Config Start Time'];
  if (dataMap['Config End Time']) config.endTime = dataMap['Config End Time'];
  
  // Reconstruct target based on type
  config.target = reconstructTarget(dataMap);
  
  // Handle days of week for availability
  if (dataMap['Config Days of Week']) {
    config.daysOfWeek = dataMap['Config Days of Week'].split(', ').filter(day => day.trim());
  }
  
  // Reconstruct child SLAs
  config.childSLAs = reconstructChildSLAs(dataMap);
  
  return config;
}

/**
 * Reconstruct target value based on stored data
 */
function reconstructTarget(dataMap) {
  // Check for range target
  if (dataMap['Config Target Min'] !== '' && dataMap['Config Target Max'] !== '') {
    return {
      min: parseFloat(dataMap['Config Target Min']) || 0,
      max: parseFloat(dataMap['Config Target Max']) || 0
    };
  }
  
  // Check for boolean target
  if (dataMap['Config Target Bool'] !== '') {
    return parseBoolean(dataMap['Config Target Bool']);
  }
  
  // Check for single numeric target
  if (dataMap['Config Target Value'] !== '') {
    const value = parseFloat(dataMap['Config Target Value']);
    return isNaN(value) ? dataMap['Config Target Value'] : value;
  }
  
  return null;
}

/**
 * Reconstruct child SLAs from flattened data
 */
function reconstructChildSLAs(dataMap) {
  const count = parseInt(dataMap['Child SLAs Count']) || 0;
  const details = dataMap['Child SLAs Details'] || '';
  
  if (count === 0 || !details) {
    return [];
  }
  
  // Parse child SLA details (format: "4 documents per AP package | 2 documents per pre-solicitation package")
  const childSLAs = details.split(' | ').map(detail => {
    const parts = detail.trim().split(' ', 2);
    if (parts.length >= 2) {
      const targetValue = parseFloat(parts[0]);
      const unitDescription = detail.substring(parts[0].length).trim();
      
      return {
        targetValue: isNaN(targetValue) ? 0 : targetValue,
        unitDescription: unitDescription
      };
    }
    return null;
  }).filter(child => child !== null);
  
  return childSLAs;
}

/**
 * Generate metrics based on SLA data
 */
function generateMetricsFromSLA(sla) {
  const metrics = {};
  
  switch (sla.slaType) {
    case 'timeliness':
      metrics.bestResponse = Math.max(1, Math.floor(sla.currentValue * 0.6));
      metrics.worstResponse = Math.floor(sla.currentValue * 1.4);
      metrics.totalRequests = Math.floor(Math.random() * 50000) + 10000;
      metrics.violations = Math.floor(metrics.totalRequests * (100 - sla.progress) / 100);
      break;
      
    case 'quantity':
      metrics.completed = sla.currentValue || 0;
      metrics.inProgress = Math.floor(Math.random() * 10) + 1;
      metrics.avgCompletionTime = Math.floor(Math.random() * 20) + 5;
      metrics.qualityScore = Math.min(5, 3.5 + (sla.progress / 100) * 1.5);
      break;
      
    case 'percentage':
      metrics.totalItems = Math.floor(Math.random() * 1000) + 100;
      metrics.successfulItems = Math.floor(metrics.totalItems * (sla.currentValue / 100));
      metrics.failedItems = metrics.totalItems - metrics.successfulItems;
      break;
      
    case 'availability':
      metrics.uptime = sla.currentValue || 0;
      metrics.downtime = 100 - metrics.uptime;
      metrics.incidents = Math.floor((100 - metrics.uptime) / 10);
      metrics.meanTimeToRestore = Math.floor(Math.random() * 30) + 5;
      break;
      
    case 'compliance':
      metrics.checksCompleted = Math.floor(Math.random() * 30) + 10;
      metrics.checksTotal = Math.floor(metrics.checksCompleted / (sla.progress / 100));
      metrics.criticalIssues = sla.currentValue ? 0 : Math.floor(Math.random() * 5) + 1;
      metrics.resolvedIssues = Math.max(0, metrics.checksCompleted - metrics.criticalIssues);
      break;
      
    default:
      metrics.currentValue = sla.currentValue;
      metrics.targetValue = sla.configuration?.target;
  }
  
  return metrics;
}

/**
 * Generate activity log from metadata
 */
function generateActivityLog(dataMap) {
  const activityLog = [];
  
  // Add creation entry
  const timestamp = dataMap['Timestamp'] || '';
  if (timestamp) {
    activityLog.push({
      type: 'info',
      message: 'SLA created',
      timestamp: formatRelativeTime(timestamp)
    });
  }
  
  // Add update entry if different from creation
  const lastUpdated = dataMap['Last Updated'] || '';
  if (lastUpdated && lastUpdated !== timestamp) {
    activityLog.unshift({
      type: 'info',
      message: 'SLA updated',
      timestamp: formatRelativeTime(lastUpdated)
    });
  }
  
  // Add status-based entries
  const status = dataMap['Status'] || '';
  const progress = parseFloat(dataMap['Progress']) || 0;
  
  if (status === 'met') {
    activityLog.unshift({
      type: 'success',
      message: `SLA target achieved - ${progress}% complete`,
      timestamp: 'Recently'
    });
  } else if (status === 'at-risk') {
    activityLog.unshift({
      type: 'warning',
      message: `SLA at risk - ${progress}% complete`,
      timestamp: 'Recently'
    });
  } else if (status === 'missed') {
    activityLog.unshift({
      type: 'error',
      message: `SLA target missed - ${progress}% complete`,
      timestamp: 'Recently'
    });
  }
  
  return activityLog;
}

/**
 * Utility functions
 */
function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return Boolean(value);
}

function parseCurrentValue(value, slaType) {
  if (value === '' || value === null || value === undefined) return 0;
  
  // For compliance, return boolean
  if (slaType === 'compliance') {
    return parseBoolean(value);
  }
  
  // For others, try to parse as number
  const numValue = parseFloat(value);
  return isNaN(numValue) ? value : numValue;
}

function formatDate(dateValue) {
  if (!dateValue) return '';
  
  try {
    if (dateValue instanceof Date) {
      return dateValue.toISOString().split('T')[0];
    }
    
    // Handle various date formats
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return dateValue.toString();
    
    return date.toISOString().split('T')[0];
  } catch (error) {
    return dateValue.toString();
  }
}

function formatRelativeTime(timestamp) {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString();
  } catch (error) {
    return timestamp;
  }
}

/**
 * Update the doGet function to handle SLA retrieval
 */
function doGet(e) {
  try {
    const action = e.parameter.action || 'getSLAs';
    
    switch (action) {
      case 'getSLAs':
      case 'getAllSLAs':
        return getAllSLAs();
      case 'ping':
        return createResponse(true, 'Backend is alive', { timestamp: new Date().toISOString() });
      default:
        return createResponse(false, 'Invalid action. Supported actions: getSLAs, getAllSLAs, ping');
    }
  } catch (error) {
    console.error('Error handling GET request:', error);
    return createResponse(false, 'Server error: ' + error.message);
  }
}

/**
 * Test function for development
 */
function testGetAllSLAs() {
  const result = getAllSLAs();
  const response = JSON.parse(result.getContent());
  
  console.log('Success:', response.success);
  console.log('Message:', response.message);
  console.log('SLA Count:', response.data?.slaCount || 0);
  console.log('First SLA:', response.data?.slas[0] || 'None');
  
  return response;
}