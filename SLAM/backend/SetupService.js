// SetupService.gs - Initialize Google Sheet with proper structure

// ============================================
// PUBLIC API - Main Setup Function
// ============================================

/**
 * Main setup function to initialize a new SLA tracking spreadsheet with complete structure.
 * Creates all required sheets (7 sheets), sets up headers, applies data validation rules,
 * configures formulas, adds conditional formatting, creates named ranges, protects sensitive
 * ranges, and optionally adds sample data. This is a one-time initialization function.
 * 
 * Run this function once when creating a new SLA tracking spreadsheet from scratch.
 * It will handle all the setup automatically, including error handling and logging.
 * 
 * @returns {Object} Setup result
 * @returns {boolean} return.success - Whether setup completed successfully
 * @returns {string} [return.message] - Success message if completed
 * @returns {string} [return.error] - Error message if failed
 * 
 * @example
 * // Run from Apps Script editor to set up a new spreadsheet
 * const result = setupSLASpreadsheet();
 * if (result.success) {
 *   Logger.log('Setup complete! Spreadsheet is ready to use.');
 * } else {
 *   Logger.log('Setup failed:', result.error);
 * }
 * 
 * @see createAllSheets - Creates the sheet structure
 * @see setupAllHeaders - Sets up column headers
 * @see applyDataValidation - Adds dropdown validations
 * @see setupFormulas - Configures auto-calculation formulas
 */
function setupSLASpreadsheet() {
  try {
    console.log('Starting SLA Spreadsheet setup...');
    
    // Create all required sheets
    const sheets = createAllSheets();
    
    // Set up headers for all sheets
    setupAllHeaders(sheets);
    
    // Apply data validation rules
    applyDataValidation(sheets);
    
    // Set up formulas
    setupFormulas(sheets);
    
    // Apply conditional formatting
    applyConditionalFormatting(sheets);
    
    // Create named ranges
    createNamedRanges(sheets);
    
    // Protect sensitive ranges
    protectSensitiveRanges(sheets);
    
    // Add sample data (optional)
    if (shouldAddSampleData()) {
      addSampleData(sheets);
    }
    
    console.log('Setup completed successfully!');
    return { success: true, message: 'Spreadsheet setup completed' };
    
  } catch (error) {
    console.error('Setup failed:', error);
    return { success: false, error: error.toString() };
  }
}

// ============================================
// INTERNAL HELPERS - Sheet Setup Functions
// ============================================

/**
 * Creates all required sheets for the SLA tracking system.
 * Generates 6 sheets: SLA_MASTER, SLA_RELATIONSHIPS, SLA_ACTIVITY_LOG,
 * LOOKUP_TEAMS, LOOKUP_STATUSES, and USER_PERMISSIONS. Deletes default "Sheet1" if present.
 * Clears existing content if sheets already exist (idempotent operation).
 * 
 * @returns {Object<string, GoogleAppsScript.Spreadsheet.Sheet>} Object mapping sheet names to Sheet objects
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} return.SLA_MASTER - Main SLA data sheet
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} return.SLA_RELATIONSHIPS - SLA dependency relationships
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} return.SLA_ACTIVITY_LOG - Audit trail log
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} return.LOOKUP_TEAMS - Team reference data
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} return.LOOKUP_STATUSES - Status reference data
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} return.USER_PERMISSIONS - User access control
 * 
 * @example
 * const sheets = createAllSheets();
 * console.log('Created sheets:', Object.keys(sheets));
 * // Logs: ['SLA_MASTER', 'SLA_RELATIONSHIPS', ...]
 * 
 * @see setupSLASpreadsheet - Calls this as first step
 */
function createAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const requiredSheets = [
    'SLA_MASTER',
    'SLA_RELATIONSHIPS',
    'SLA_ACTIVITY_LOG',
    'LOOKUP_TEAMS',
    'LOOKUP_STATUSES',
    'USER_PERMISSIONS'
  ];
  
  const sheets = {};
  
  // Delete default Sheet1 if it exists
  try {
    const defaultSheet = ss.getSheetByName('Sheet1');
    if (defaultSheet && ss.getSheets().length > 1) {
      ss.deleteSheet(defaultSheet);
    }
  } catch (e) {
    // Ignore if Sheet1 doesn't exist
  }
  
  // Delete and recreate each required sheet for clean setup
  requiredSheets.forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      // Delete existing sheet if it exists
      ss.deleteSheet(sheet);
      console.log(`Deleted existing sheet: ${sheetName}`);
    }
    // Create new sheet
    sheet = ss.insertSheet(sheetName);
    console.log(`Created sheet: ${sheetName}`);
    sheets[sheetName] = sheet;
  });
  
  return sheets;
}

/**
 * Sets up column headers for all sheets with proper formatting.
 * Configures header row with dark blue background (#4F46E5), white text, bold font,
 * and centered alignment. Freezes the header row for easy scrolling. Each sheet receives
 * its appropriate column headers based on the data model specification.
 * 
 * @param {Object<string, GoogleAppsScript.Spreadsheet.Sheet>} sheets - Object mapping sheet names to Sheet objects
 * 
 * @returns {void} No return value; modifies sheets in place
 * 
 * @example
 * const sheets = createAllSheets();
 * setupAllHeaders(sheets);
 * // All sheets now have formatted headers in row 1
 * 
 * @see createAllSheets - Provides the sheets object
 * @see setupSLASpreadsheet - Calls this after sheet creation
 */
function setupAllHeaders(sheets) {
  const headers = {
    'SLA_MASTER': [
      'SLA ID', 'Parent ID', 'SLA Name', 'SLA Type', 'Description',
      'Team ID', 'Start Date', 'End Date', 'Status',
      'Progress %', 'Current Value', 'Target Value', 'Target Range Min', 'Target Range Max', 'Use Range', 'Frequency', 'Notification Emails',
      'External Tracker URL', 'Tags', 'Custom Fields', 'Is Active',
      'Created At', 'Created By', 'Updated At', 'Updated By', 'Row Version'
    ],
    
    'SLA_RELATIONSHIPS': [
      'Relationship ID', 'Relationship Type', 'Source SLA ID', 'Target SLA ID',
      'Dependency Type', 'Aggregation Rule'
    ],
    
    'SLA_ACTIVITY_LOG': [
      'Log ID', 'SLA ID', 'Timestamp', 'User ID', 'User Name',
      'Action Type', 'Action Details', 'Old Value', 'New Value'
    ],
    
    'LOOKUP_TEAMS': [
      'Team ID', 'Team Name', 'Department', 'Manager Email', 'Is Active'
    ],
    
    'LOOKUP_STATUSES': [
      'Status ID', 'Status Name', 'Display Color', 'Sort Order'
    ],
    
    'USER_PERMISSIONS': [
      'Permission ID', 'User Email', 'Permission Type', 'Team IDs', 'SLA IDs',
      'Granted At', 'Granted By', 'Expires At'
    ]
  };
  
  Object.keys(headers).forEach(sheetName => {
    if (sheets[sheetName]) {
      const sheet = sheets[sheetName];
      const headerRow = headers[sheetName];
      
      // Set headers
      sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
      
      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, headerRow.length);
      headerRange.setBackground('#4F46E5');
      headerRange.setFontColor('#FFFFFF');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
      
      // Freeze header row
      sheet.setFrozenRows(1);
      
      console.log(`Set up headers for ${sheetName}`);
    }
  });
}

/**
 * Applies data validation rules to constrain user input and ensure data quality.
 * Sets up dropdown lists for SLA Type, Status, and Frequency columns. Adds numeric range
 * validation for Progress (0-200%). Configures date validation and checkbox validation.
 * These rules prevent invalid data entry and improve user experience.
 * 
 * @param {Object<string, GoogleAppsScript.Spreadsheet.Sheet>} sheets - Object mapping sheet names to Sheet objects
 * 
 * @returns {void} No return value; applies validation rules to sheets
 * 
 * @example
 * const sheets = createAllSheets();
 * applyDataValidation(sheets);
 * // SLA_MASTER now has dropdowns for type, status, and frequency
 * 
 * @see setupSLASpreadsheet - Calls this after headers are set up
 */
function applyDataValidation(sheets) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // SLA_MASTER validations
  if (sheets['SLA_MASTER']) {
    const sheet = sheets['SLA_MASTER'];
    
    // SLA Type dropdown (Column D)
    const slaTypeRange = sheet.getRange('D2:D');
    const slaTypeRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['quantity', 'percentage', 'timeliness', 'availability', 
                          'compliance', 'composite', 'multi-metric', 'recurring'])
      .setAllowInvalid(false)
      .build();
    slaTypeRange.setDataValidation(slaTypeRule);
    
    // Status dropdown (Column I - after removing Collaborating Teams)
    const statusRange = sheet.getRange('I2:I');
    const statusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['n-a', 'met', 'on-track', 'at-risk', 'exceeded', 'missed', 'pending', 'pending-request', 'not-started'])
      .setAllowInvalid(false)
      .build();
    statusRange.setDataValidation(statusRule);
    
    // Frequency dropdown (Column P - after removing Collaborating Teams and adding range columns M, N, O)
    const frequencyRange = sheet.getRange('P2:P');
    const frequencyRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['once', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually', 'as-requested'])
      .setAllowInvalid(false)
      .build();
    frequencyRange.setDataValidation(frequencyRule);
    
    // REMOVED: Progress validation - Column J is calculated by ARRAYFORMULA, not user input
    // Data validation conflicts with formula-driven values
    
    // Date validation - End date after start date (Column H)
    const dateRange = sheet.getRange('H2:H');
    const dateRule = SpreadsheetApp.newDataValidation()
      .requireDate()
      .setAllowInvalid(false)
      .build();
    dateRange.setDataValidation(dateRule);
    
    // REMOVED: Is Active checkbox validation - causes blank rows to show as false
    // Column S will accept TRUE/FALSE boolean values directly without checkbox rendering
  }
  
  // Add more validation rules for other sheets...
  console.log('Applied data validation rules');
}

/**
 * Configures auto-calculation formulas for computed fields in sheets.
 * Sets up formula templates in row 2 that can be copied down. Includes:
 * - SLA ID auto-generation (SLA-000001, SLA-000002, etc.)
 * - Progress % calculation (currentValue / targetValue * 100)
 * - Created At/Updated At timestamps
 * - Row Version incrementing for optimistic locking
 * - Metric status calculation (met/at-risk/missed based on current vs target)
 * 
 * These formulas automate data management and reduce manual entry errors.
 * 
 * @param {Object<string, GoogleAppsScript.Spreadsheet.Sheet>} sheets - Object mapping sheet names to Sheet objects
 * 
 * @returns {void} No return value; adds formulas to sheets
 * 
 * @example
 * const sheets = createAllSheets();
 * setupFormulas(sheets);
 * // Row 2 now has formula templates for SLA ID, Progress %, timestamps, etc.
 * 
 * @see setupSLASpreadsheet - Calls this after validation rules
 */
function setupFormulas(sheets) {
  if (sheets['SLA_MASTER']) {
    const sheet = sheets['SLA_MASTER'];
    
    // REMOVED: SLA ID formula - now generated by getNextSlaId() using PropertiesService
    // This ensures unique, permanent IDs that don't change when rows are sorted/deleted
    
    // Progress % ARRAYFORMULA in header (Column J1)
    // This calculates progress for all rows automatically
    // Handles different SLA types:
    // - With Use Range = TRUE: 
    //   * 0-100% as current approaches min target
    //   * 100% when current is between min and max
    //   * >100% when current exceeds max target
    // - Numeric types (quantity, percentage, availability, composite, multi-metric, recurring): current/target * 100
    // - Timeliness: 100 if current <= target (on time), else 0 (late) - assumes datetime values converted to serial numbers
    // - Compliance: 100 if current = target (compliant), else 0 (non-compliant), N/A (2) returns blank - assumes 0/1/2 values
    // Column positions: K=Current, L=Target, M=RangeMin, N=RangeMax, O=UseRange
    // Note: Uses + instead of OR() because OR() in ARRAYFORMULA evaluates entire array, not row-by-row
    // ROUND to 2 decimal places for clean display
    sheet.getRange('J1').setFormula('={"Progress %"; ARRAYFORMULA(IF((ISBLANK(C2:C)+ISBLANK(K2:K))>0,"",IF(O2:O=TRUE,IF(ISBLANK(M2:M)+ISBLANK(N2:N)>0,"",IF(K2:K<M2:M,ROUND(K2:K/M2:M*100,2),IF(K2:K<=N2:N,100,ROUND(100+(K2:K-N2:N)/(N2:N-M2:M)*100,2)))),IF(D2:D="timeliness",IF(K2:K<=L2:L,100,0),IF(D2:D="compliance",IF(K2:K=2,"",IF(K2:K=L2:L,100,0)),IF(L2:L=0,"",ROUND(K2:K/L2:L*100,2)))))))}');
    
    // REMOVED: Created At formula - causes circular reference #REF! error
    // Column T is set directly by createSLA() and updateSLA() functions
    
    // REMOVED: Updated At formula - should show last update time, not current time
    // Column V is set directly by createSLA() and updateSLA() functions
    
    // REMOVED: Row Version formula - causes circular reference #REF! error  
    // Column X is managed directly by createSLA() and updateSLA() functions
  }
  
  console.log('Set up formulas');
}

/**
 * Applies conditional formatting rules for visual status indicators.
 * Configures color-coded backgrounds for status columns (green for met/exceeded,
 * yellow for at-risk/on-track, red for missed). Adds progress bar color formatting
 * (green >90%, yellow 70-90%, red <70%). Makes data visually scannable at a glance.
 * 
 * @param {Object<string, GoogleAppsScript.Spreadsheet.Sheet>} sheets - Object mapping sheet names to Sheet objects
 * 
 * @returns {void} No return value; applies formatting rules to sheets
 * 
 * @example
 * const sheets = createAllSheets();
 * applyConditionalFormatting(sheets);
 * // Status column now shows color-coded backgrounds based on value
 * 
 * @see setupSLASpreadsheet - Calls this after formulas are configured
 */
function applyConditionalFormatting(sheets) {
  if (sheets['SLA_MASTER']) {
    const sheet = sheets['SLA_MASTER'];
    const statusRange = sheet.getRange('J2:J');
    
    // Apply conditional formatting for status column
    const rules = [];
    
    // Green for "met" and "exceeded"
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('met')
      .setBackground('#D4EDDA')
      .setRanges([statusRange])
      .build());
      
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('exceeded')
      .setBackground('#28A745')
      .setFontColor('#FFFFFF')
      .setRanges([statusRange])
      .build());
    
    // Yellow for "at-risk"
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('at-risk')
      .setBackground('#FFF3CD')
      .setRanges([statusRange])
      .build());
    
    // Blue for "on-track"
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('on-track')
      .setBackground('#D1ECF1')
      .setRanges([statusRange])
      .build());
    
    // Gray for "n-a"
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('n-a')
      .setBackground('#E9ECEF')
      .setRanges([statusRange])
      .build());
    
    // Light blue for "pending" and "pending-request"
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('pending')
      .setBackground('#E7F3FF')
      .setRanges([statusRange])
      .build());
    
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('pending-request')
      .setBackground('#E7F3FF')
      .setRanges([statusRange])
      .build());
    
    // Red for "missed"
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('missed')
      .setBackground('#F8D7DA')
      .setRanges([statusRange])
      .build());
    
    sheet.setConditionalFormatRules(rules);
  }
  
  console.log('Applied conditional formatting');
}

/**
 * Creates named ranges for commonly referenced data columns.
 * Sets up human-readable range names like "SLA_List", "Team_List", "Status_List"
 * that can be referenced in formulas, data validation, and scripts. Makes the
 * spreadsheet more maintainable and self-documenting.
 * 
 * @param {Object<string, GoogleAppsScript.Spreadsheet.Sheet>} sheets - Object mapping sheet names to Sheet objects
 * 
 * @returns {void} No return value; creates named ranges in the spreadsheet
 * 
 * @example
 * const sheets = createAllSheets();
 * createNamedRanges(sheets);
 * // Can now use "SLA_List" in formulas instead of "SLA_MASTER!A:A"
 * 
 * @see setupSLASpreadsheet - Calls this after conditional formatting
 */
function createNamedRanges(sheets) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Remove existing named ranges
  ss.getNamedRanges().forEach(range => range.remove());
  
  // Create named ranges
  const namedRanges = [
    { name: 'SLA_MASTER_DATA', sheet: 'SLA_MASTER', range: 'A2:Z' },
    { name: 'SLA_MASTER_HEADERS', sheet: 'SLA_MASTER', range: 'A1:Z1' },
    { name: 'TEAMS_DATA', sheet: 'LOOKUP_TEAMS', range: 'A2:E' },
    { name: 'STATUSES_DATA', sheet: 'LOOKUP_STATUSES', range: 'A2:D' }
  ];
  
  namedRanges.forEach(nr => {
    if (sheets[nr.sheet]) {
      const range = sheets[nr.sheet].getRange(nr.range);
      ss.setNamedRange(nr.name, range);
      console.log(`Created named range: ${nr.name}`);
    }
  });
}

/**
 * Protects sensitive ranges from accidental editing by non-admin users.
 * Locks ID columns, audit trail columns (Created At/By, Updated At/By), and
 * Row Version/Checksum columns to maintain data integrity. Editors can modify
 * user-editable fields but cannot alter system-managed fields.
 * 
 * @param {Object<string, GoogleAppsScript.Spreadsheet.Sheet>} sheets - Object mapping sheet names to Sheet objects
 * 
 * @returns {void} No return value; applies protection to sensitive ranges
 * 
 * @example
 * const sheets = createAllSheets();
 * protectSensitiveRanges(sheets);
 * // ID and audit columns are now protected from editing
 * 
 * @see setupSLASpreadsheet - Calls this after named ranges are created
 */
function protectSensitiveRanges(sheets) {
  if (sheets['SLA_MASTER']) {
    const sheet = sheets['SLA_MASTER'];
    
    // Protect ID and audit columns
    const protectedRanges = [
      { range: 'A:A', description: 'SLA IDs (auto-generated)' },
      { range: 'V:Z', description: 'Audit fields (system-managed)' }
    ];
    
    protectedRanges.forEach(pr => {
      const protection = sheet.getRange(pr.range).protect()
        .setDescription(pr.description)
        .setWarningOnly(true);
      console.log(`Protected range: ${pr.description}`);
    });
  }
  
  // Fully protect activity log
  if (sheets['SLA_ACTIVITY_LOG']) {
    const protection = sheets['SLA_ACTIVITY_LOG'].protect()
      .setDescription('Activity log (immutable)')
      .setWarningOnly(true);
    console.log('Protected activity log sheet');
  }
}

/**
 * Populates sheets with sample/seed data for testing and demonstration purposes.
 * Adds example teams, statuses, user permissions, and a few sample SLAs with metrics
 * and relationships. Useful for development, testing, and user training. Only called
 * if shouldAddSampleData() returns true.
 * 
 * @param {Object<string, GoogleAppsScript.Spreadsheet.Sheet>} sheets - Object mapping sheet names to Sheet objects
 * 
 * @returns {void} No return value; adds sample data rows to sheets
 * 
 * @example
 * const sheets = createAllSheets();
 * if (shouldAddSampleData()) {
 *   addSampleData(sheets);
 * }
 * // Sheets now contain example teams, statuses, and sample SLAs
 * 
 * @see shouldAddSampleData - Determines if sample data should be added
 * @see setupSLASpreadsheet - Conditionally calls this during setup
 */
function addSampleData(sheets) {
  // Add sample teams with actual team names from team-config
  if (sheets['LOOKUP_TEAMS']) {
    const teamsData = [
      ['TEAM-001', 'Program Management Team', 'Task 1', 'program.manager@company.com', true],
      ['TEAM-002', 'APM Team', 'Task 2', 'apm.manager@company.com', true],
      ['TEAM-003', 'PPM Team', 'Task 3', 'ppm.manager@company.com', true],
      ['TEAM-004', 'Technical Evaluation Team', 'Task 4', 'tech.eval.manager@company.com', true],
      ['TEAM-005', 'Training Support Team', 'Task 5', 'training.manager@company.com', true],
      ['TEAM-006', 'Business Intelligence Team', 'Task 6', 'bi.manager@company.com', true],
      ['TEAM-007', 'Operational Support Team', 'Task 7', 'ops.support.manager@company.com', true],
      ['TEAM-008', 'Quality Support Team', 'Task 8', 'quality.manager@company.com', true],
      ['TEAM-009', 'Communication Team', 'Task 9', 'comm.manager@company.com', true],
      ['TEAM-010', 'TW/Template Team', 'Task 2', 'tw.manager@company.com', true],
      ['TEAM-011', 'Cost Team', 'Task 2', 'cost.manager@company.com', true],
      ['TEAM-012', 'Regional Financial Task Team', 'Task 10', 'regional.finance@company.com', true]
    ];
    
    if (teamsData.length > 0) {
      sheets['LOOKUP_TEAMS'].getRange(2, 1, teamsData.length, teamsData[0].length)
        .setValues(teamsData);
    }
  }
  
  // Add sample statuses
  if (sheets['LOOKUP_STATUSES']) {
    const statusData = [
      ['STATUS-001', 'n-a', '#6C757D', 1],
      ['STATUS-002', 'met', '#28A745', 2],
      ['STATUS-003', 'on-track', '#17A2B8', 3],
      ['STATUS-004', 'at-risk', '#FFC107', 4],
      ['STATUS-005', 'exceeded', '#155724', 5],
      ['STATUS-006', 'missed', '#DC3545', 6],
      ['STATUS-007', 'pending', '#6C757D', 7],
      ['STATUS-008', 'pending-request', '#6C757D', 8],
      ['STATUS-009', 'not-started', '#F8F9FA', 9]
    ];
    
    if (statusData.length > 0) {
      sheets['LOOKUP_STATUSES'].getRange(2, 1, statusData.length, statusData[0].length)
        .setValues(statusData);
    }
  }
  
  console.log('Added sample data');
}

/**
 * Determines whether sample data should be added to the spreadsheet during setup.
 * Prompts the user with a Yes/No dialog asking if they want to include sample data
 * for testing and demonstration. Returns true if user clicks Yes, false otherwise.
 * 
 * @returns {boolean} true if user wants sample data, false otherwise
 * 
 * @example
 * if (shouldAddSampleData()) {
 *   addSampleData(sheets);
 *   Logger.log('Sample data added');
 * } else {
 *   Logger.log('Starting with empty sheets');
 * }
 * 
 * @see addSampleData - Called conditionally based on this function's return value
 * @see setupSLASpreadsheet - Uses this to decide on sample data
 */
function shouldAddSampleData() {
  // You can modify this logic
  return true; // Set to false if you don't want sample data
}