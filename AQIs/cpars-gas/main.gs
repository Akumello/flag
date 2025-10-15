/**
 * CPARS Performance Tracking - Main Google Apps Script Entry Point
 * Handles web app routing and server-side functionality
 */

/**
 * Serves the main HTML interface
 */
function doGet(e) {
  try {
    const htmlTemplate = HtmlService.createTemplateFromFile('index');
    
    // Pass any URL parameters to the template
    htmlTemplate.params = e.parameter;
    
    const htmlOutput = htmlTemplate.evaluate()
      .setTitle(CONFIG.APP.TITLE)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
    return htmlOutput;
    
  } catch (error) {
    console.error('Error in doGet:', error);
    return HtmlService.createHtmlOutput(`
      <html>
        <body>
          <h1>Error Loading Application</h1>
          <p>There was an error loading the CPARS Performance Tracking application.</p>
          <p>Error details: ${error.message}</p>
          <p>Please contact your administrator for assistance.</p>
        </body>
      </html>
    `);
  }
}

/**
 * Include HTML files (for modular HTML structure)
 */
function include(filename) {
  try {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  } catch (error) {
    console.error(`Error including file ${filename}:`, error);
    return `<!-- Error loading ${filename}: ${error.message} -->`;
  }
}

/**
 * Get CPARS data (called from client-side)
 * Returns either sample data or data from Google Sheets
 */
function getCPARSData() {
  try {
    let result;
    
    // Check if we should use Google Sheets or sample data
    if (CONFIG.SHEETS.SPREADSHEET_ID && CONFIG.SHEETS.SPREADSHEET_ID !== 'YOUR_SPREADSHEET_ID_HERE') {
      result = getDataFromSheets();
      
      // If Sheets access fails, fall back to sample data
      if (!result.success) {
        console.log('Sheets access failed, falling back to sample data:', result.error);
        result = {
          success: true,
          data: SAMPLE_CPARS_DATA,
          message: `Sample data loaded (Sheets error: ${result.error})`,
          fallback: true
        };
      }
    } else {
      // Return sample data for development/demo
      console.log('Using sample data - no Sheets ID configured');
      result = {
        success: true,
        data: SAMPLE_CPARS_DATA,
        message: 'Sample data loaded successfully'
      };
    }
    
    // Deep clone the result to avoid JSPB issues
    return JSON.parse(JSON.stringify(result));
    
  } catch (error) {
    console.error('Error getting CPARS data:', error);
    // Fall back to sample data in case of any error
    return {
      success: true,
      data: SAMPLE_CPARS_DATA,
      message: `Sample data loaded (Error: ${error.message})`,
      fallback: true
    };
  }
}

/**
 * Get data from Google Sheets
 */
function getDataFromSheets() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEETS.SPREADSHEET_ID);
    
    // Parse the range to extract sheet name and range
    let values;
    if (CONFIG.SHEETS.DATA_RANGE.includes('!')) {
      // Range includes sheet name (e.g., "Sheet1!A:K")
      const [sheetName, rangeStr] = CONFIG.SHEETS.DATA_RANGE.split('!');
      const sheet = spreadsheet.getSheetByName(sheetName);
      
      if (!sheet) {
        return {
          success: false,
          data: [],
          error: `Sheet "${sheetName}" not found in the spreadsheet`
        };
      }
      
      // Get the range from the specific sheet
      if (rangeStr) {
        values = sheet.getRange(rangeStr).getValues();
      } else {
        // If no range specified after !, get all data
        values = sheet.getDataRange().getValues();
      }
    } else {
      // Range doesn't include sheet name, use active sheet
      const range = spreadsheet.getRange(CONFIG.SHEETS.DATA_RANGE);
      values = range.getValues();
    }
    
    if (values.length === 0) {
      return {
        success: false,
        data: [],
        error: 'No data found in the specified range'
      };
    }
    
    // Assume first row contains headers
    const headers = values[0];
    const data = values.slice(1)
      .filter(row => {
        // Filter out empty rows - check if any of the first few key columns have data
        // This prevents processing rows that are completely empty or only have trailing spaces
        const hasData = row.slice(0, Math.min(4, row.length)).some(cell => 
          cell && String(cell).trim() !== ''
        );
        return hasData;
      })
      .map(row => {
        const record = {};
        headers.forEach((header, index) => {
          // Convert header to camelCase property name
          const propName = header.toLowerCase()
            .replace(/[^a-zA-Z0-9]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .split(' ')
            .map((word, i) => i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
          
          // Ensure we're working with plain values, not Sheets objects
          record[propName] = String(row[index] || '');
        });
        return record;
      })
      .filter(record => {
        // Additional filter to remove records where key fields are empty
        // Check for essential fields like contract number, order number, or business unit
        const hasEssentialData = 
          (record.contractNumber && record.contractNumber.trim() !== '') ||
          (record.orderNumber && record.orderNumber.trim() !== '') ||
          (record.businessUnit && record.businessUnit.trim() !== '');
        return hasEssentialData;
      });
    
    const result = {
      success: true,
      data: data,
      message: `${data.length} records loaded from Google Sheets`
    };
    
    // Deep clone to ensure plain objects
    return JSON.parse(JSON.stringify(result));
    
  } catch (error) {
    console.error('Error reading from Google Sheets:', error);
    
    // Provide more specific error messages
    let errorMessage = error.message;
    if (error.message.includes('not found')) {
      errorMessage = `Spreadsheet not found. Please check the spreadsheet ID: ${CONFIG.SHEETS.SPREADSHEET_ID}`;
    } else if (error.message.includes('permission')) {
      errorMessage = `Permission denied. Please ensure the spreadsheet is shared with the script or make it publicly viewable.`;
    } else if (error.message.includes('Range')) {
      errorMessage = `Invalid range "${CONFIG.SHEETS.DATA_RANGE}". Please check the sheet name and range format.`;
    }
    
    return {
      success: false,
      data: [],
      error: errorMessage
    };
  }
}

/**
 * Get filter options for the UI
 */
function getFilterOptions() {
  try {
    const result = getCPARSData();
    if (!result.success) {
      return result;
    }
    
    const options = getFilterOptions(result.data);
    
    return {
      success: true,
      options: options,
      message: 'Filter options generated successfully'
    };
    
  } catch (error) {
    console.error('Error getting filter options:', error);
    return {
      success: false,
      options: { businessUnits: [], completionStatuses: [] },
      error: error.message
    };
  }
}

/**
 * Export data to a new Google Sheet
 */
function exportToGoogleSheets(data, sheetName = 'CPARS Export') {
  try {
    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'No data provided for export'
      };
    }
    
    // Ensure data is plain objects (avoid JSPB issues)
    const plainData = JSON.parse(JSON.stringify(data));
    
    // Create new spreadsheet
    const spreadsheet = SpreadsheetApp.create(`${sheetName} - ${new Date().toISOString().split('T')[0]}`);
    const sheet = spreadsheet.getActiveSheet();
    
    // Set up headers
    const headers = Object.keys(plainData[0]);
    const headerRow = headers.map(header => {
      // Convert camelCase to Title Case
      return header.replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
    });
    
    // Prepare data rows (ensure all values are strings)
    const rows = plainData.map(record => headers.map(header => String(record[header] || '')));
    
    // Write to sheet
    const range = sheet.getRange(1, 1, rows.length + 1, headers.length);
    range.setValues([headerRow, ...rows]);
    
    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1f4e79'); // GSA Blue
    headerRange.setFontColor('#ffffff');
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, headers.length);
    
    // Make spreadsheet public for viewing
    const file = DriveApp.getFileById(spreadsheet.getId());
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const result = {
      success: true,
      url: spreadsheet.getUrl(),
      id: spreadsheet.getId(),
      message: `Data exported successfully to new Google Sheet with ${plainData.length} records`
    };
    
    // Return plain object to avoid JSPB issues
    return JSON.parse(JSON.stringify(result));
    
  } catch (error) {
    console.error('Error exporting to Google Sheets:', error);
    return {
      success: false,
      error: `Export error: ${error.message}`
    };
  }
}

/**
 * Log application usage (optional analytics)
 */
function logUsage(action, details = {}) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      action,
      details,
      user: Session.getActiveUser().getEmail()
    };
    
    console.log('Usage log:', JSON.stringify(logEntry));
    
    // Optional: Write to a logging sheet
    // You can uncomment and modify this if you want persistent logging
    /*
    const logSpreadsheetId = 'YOUR_LOG_SPREADSHEET_ID';
    if (logSpreadsheetId && logSpreadsheetId !== 'YOUR_LOG_SPREADSHEET_ID') {
      const logSpreadsheet = SpreadsheetApp.openById(logSpreadsheetId);
      const logSheet = logSpreadsheet.getActiveSheet();
      logSheet.appendRow([timestamp, action, JSON.stringify(details), logEntry.user]);
    }
    */
    
  } catch (error) {
    console.error('Error logging usage:', error);
  }
}

/**
 * Health check endpoint
 */
function healthCheck() {
  try {
    return {
      success: true,
      timestamp: new Date().toISOString(),
      version: CONFIG.APP.VERSION,
      environment: 'Google Apps Script',
      status: 'healthy'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Initialize a new Google Sheet with sample CPARS data
 * This function creates a new spreadsheet with headers and sample data
 */
function initializeCPARSSheet() {
  try {
    // Create new spreadsheet
    const timestamp = new Date().toISOString().split('T')[0];
    const spreadsheet = SpreadsheetApp.create(`CPARS Data - ${timestamp}`);
    const sheet = spreadsheet.getActiveSheet();
    
    // Set sheet name
    sheet.setName('CPARS Data');
    
    // Define headers based on sample data structure
    const headers = [
      'Contract Number',
      'Order Number', 
      'Business Unit',
      'Sector',
      'Division',
      'CO Name',
      'Period of Performance',
      'Evaluation Status',
      'Completion Status',
      'Estimated Evaluation Date',
      'Days Until Due'
    ];
    
    // Set headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    
    // Format headers
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1f4e79'); // GSA Blue
    headerRange.setFontColor('#ffffff');
    headerRange.setHorizontalAlignment('center');
    
    // Add sample data
    const sampleData = SAMPLE_CPARS_DATA.map(record => [
      record.contractNumber,
      record.orderNumber,
      record.businessUnit,
      record.sector,
      record.division,
      record.coName,
      record.periodOfPerformance,
      record.evaluationStatus,
      record.completionStatus,
      record.estimatedEvaluationDate,
      record.daysUntilDue
    ]);
    
    // Insert data
    if (sampleData.length > 0) {
      const dataRange = sheet.getRange(2, 1, sampleData.length, headers.length);
      dataRange.setValues(sampleData);
      
      // Format data rows
      dataRange.setHorizontalAlignment('left');
      
      // Format completion status column with conditional formatting
      const statusColumn = 9; // Completion Status column
      const statusRange = sheet.getRange(2, statusColumn, sampleData.length, 1);
      
      // Add conditional formatting for status
      const rules = [];
      
      // Complete: Timely - Green
      rules.push(SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('Complete: Timely')
        .setBackground('#d1fae5')
        .setFontColor('#065f46')
        .setRanges([statusRange])
        .build());
      
      // Complete: Untimely - Yellow
      rules.push(SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('Complete: Untimely')
        .setBackground('#fef3c7')
        .setFontColor('#92400e')
        .setRanges([statusRange])
        .build());
      
      // Incomplete statuses - Red/Orange
      rules.push(SpreadsheetApp.newConditionalFormatRule()
        .whenTextContains('Incomplete')
        .setBackground('#fee2e2')
        .setFontColor('#991b1b')
        .setRanges([statusRange])
        .build());
      
      sheet.setConditionalFormatRules(rules);
    }
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, headers.length);
    
    // Set column widths for better display
    sheet.setColumnWidth(1, 150); // Contract Number
    sheet.setColumnWidth(2, 150); // Order Number
    sheet.setColumnWidth(3, 200); // Business Unit
    sheet.setColumnWidth(6, 150); // CO Name
    sheet.setColumnWidth(7, 200); // Period of Performance
    sheet.setColumnWidth(9, 180); // Completion Status
    sheet.setColumnWidth(10, 180); // Estimated Evaluation Date
    
    // Freeze header row
    sheet.setFrozenRows(1);
    
    // Make spreadsheet accessible (view only)
    const file = DriveApp.getFileById(spreadsheet.getId());
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Log the creation
    logUsage('sheet_initialized', {
      spreadsheetId: spreadsheet.getId(),
      recordCount: sampleData.length
    });
    
    return {
      success: true,
      spreadsheetId: spreadsheet.getId(),
      spreadsheetUrl: spreadsheet.getUrl(),
      recordCount: sampleData.length,
      message: `CPARS data sheet initialized successfully with ${sampleData.length} sample records`,
      instructions: {
        nextSteps: [
          '1. Copy the Spreadsheet ID to your CONFIG.SHEETS.SPREADSHEET_ID',
          '2. Verify the data range matches CONFIG.SHEETS.DATA_RANGE',
          '3. Replace sample data with your actual CPARS data',
          '4. Share the sheet with appropriate team members'
        ],
        configUpdate: `Update CONFIG.SHEETS.SPREADSHEET_ID to: "${spreadsheet.getId()}"`
      }
    };
    
  } catch (error) {
    console.error('Error initializing CPARS sheet:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to initialize CPARS data sheet'
    };
  }
}

/**
 * Test Google Sheets connection and configuration
 */
function testSheetsConnection() {
  try {
    if (!CONFIG.SHEETS.SPREADSHEET_ID || CONFIG.SHEETS.SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID_HERE') {
      return {
        success: false,
        error: 'No spreadsheet ID configured',
        details: 'Please set CONFIG.SHEETS.SPREADSHEET_ID to a valid Google Sheets ID'
      };
    }
    
    // Try to open the spreadsheet
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEETS.SPREADSHEET_ID);
    const spreadsheetName = spreadsheet.getName();
    
    // Check if the specified range exists
    let sheetExists = false;
    let rangeValid = false;
    let dataRowCount = 0;
    let actualDataRows = 0;
    
    if (CONFIG.SHEETS.DATA_RANGE.includes('!')) {
      const [sheetName, rangeStr] = CONFIG.SHEETS.DATA_RANGE.split('!');
      const sheet = spreadsheet.getSheetByName(sheetName);
      
      if (sheet) {
        sheetExists = true;
        try {
          const values = sheet.getRange(rangeStr || 'A:Z').getValues();
          rangeValid = true;
          dataRowCount = values.length;
          
          // Count actual data rows (excluding header and empty rows)
          if (values.length > 1) {
            actualDataRows = values.slice(1)
              .filter(row => {
                // Same filtering logic as in getDataFromSheets
                return row.slice(0, Math.min(4, row.length)).some(cell => 
                  cell && String(cell).trim() !== ''
                );
              }).length;
          }
        } catch (e) {
          rangeValid = false;
        }
      }
    } else {
      // Assume active sheet
      try {
        const range = spreadsheet.getRange(CONFIG.SHEETS.DATA_RANGE);
        const values = range.getValues();
        sheetExists = true;
        rangeValid = true;
        dataRowCount = values.length;
        
        // Count actual data rows
        if (values.length > 1) {
          actualDataRows = values.slice(1)
            .filter(row => {
              return row.slice(0, Math.min(4, row.length)).some(cell => 
                cell && String(cell).trim() !== ''
              );
            }).length;
        }
      } catch (e) {
        rangeValid = false;
      }
    }
    
    return {
      success: true,
      spreadsheetName: spreadsheetName,
      spreadsheetId: CONFIG.SHEETS.SPREADSHEET_ID,
      dataRange: CONFIG.SHEETS.DATA_RANGE,
      sheetExists: sheetExists,
      rangeValid: rangeValid,
      dataRowCount: dataRowCount,
      actualDataRows: actualDataRows,
      message: `Connection test successful. Found ${actualDataRows} data rows (${dataRowCount} total rows including header and empty rows).`
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      details: 'Check spreadsheet ID, permissions, and range configuration'
    };
  }
}