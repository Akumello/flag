// CrudService.gs - CRUD operations for SLAs

// ============================================
// PUBLIC API - Core CRUD Operations
// ============================================

/**
 * Creates a new SLA record in the SLA_MASTER sheet with comprehensive validation and audit trail.
 * Generates auto-increment SLA ID, applies data validation, copies formulas from template row,
 * and logs the creation activity.
 * 
 * @param {Object} slaData - The SLA data object containing all required and optional fields
 * @param {string} [slaData.parentId] - Parent SLA ID for hierarchical relationships
 * @param {string} slaData.slaName - Name of the SLA (required)
 * @param {string} slaData.slaType - Type of SLA: 'quantity', 'percentage', 'timeliness', 'availability', 'compliance', 'composite', 'multi-metric', 'recurring' (required)
 * @param {string} [slaData.description] - Detailed description of the SLA
 * @param {string} slaData.teamId - Team identifier responsible for the SLA (required)
 * @param {Date|string} slaData.startDate - Start date of the SLA period (required)
 * @param {Date|string} slaData.endDate - End date of the SLA period (required)
 * @param {string} [slaData.status='not-started'] - Current status: 'met', 'at-risk', 'ontrack', 'exceeded', 'missed', 'pending', 'not-started'
 * @param {number} [slaData.currentValue=0] - Current measured value
 * @param {number} slaData.targetValue - Target value to achieve (required)
 * @param {string} [slaData.frequency='once'] - Frequency of measurement: 'once', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually'
 * @param {string[]} [slaData.notificationEmails] - Array of email addresses for notifications
 * @param {string} [slaData.externalTrackerUrl] - URL to external tracking system
 * @param {string[]} [slaData.tags] - Array of tags for categorization
 * @param {Object} [slaData.customFields] - Additional custom fields as key-value pairs
 * 
 * @returns {Object} Result object
 * @returns {boolean} return.success - Whether the operation succeeded
 * @returns {string} [return.slaId] - Generated SLA ID if successful
 * @returns {string} [return.message] - Success message
 * @returns {string} [return.error] - Error message if failed
 * 
 * @example
 * const result = createSLA({
 *   slaName: 'System Uptime',
 *   slaType: 'percentage',
 *   description: 'Maintain 99.9% uptime',
 *   teamId: 'TEAM-001',
 *   startDate: '2024-01-01',
 *   endDate: '2024-12-31',
 *   targetValue: 99.9,
 *   notificationEmails: ['ops@company.com']
 * });
 * // Returns: { success: true, slaId: 'SLA-000001', message: '...' }
 */
function createSLA(slaData = {
    slaName: 'System Uptime',
    slaType: 'percentage',
    description: 'Maintain 99.9% uptime',
    teamId: 'TEAM-001',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    targetValue: 99.9,
    notificationEmails: ['ops@company.com']
  }) {
  try {
    console.log('=== createSLA START ===');
    console.log('Input slaData:', JSON.stringify(slaData, null, 2));
    
    console.log('Getting active spreadsheet...');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    console.log('Spreadsheet retrieved:', ss.getName());
    console.log('Spreadsheet ID:', ss.getId());
    
    console.log('Getting all sheet names...');
    const allSheets = ss.getSheets();
    console.log('Total sheets found:', allSheets.length);
    allSheets.forEach(function(s) {
      console.log('  - Sheet name:', s.getName(), '| Sheet ID:', s.getSheetId());
    });
    
    console.log('Attempting to get sheet by name: SLA_MASTER');
    const sheet = ss.getSheetByName('SLA_MASTER');
    console.log('Sheet retrieved:', sheet ? sheet.getName() : 'NULL');
    console.log('Sheet object type:', typeof sheet);
    
    if (!sheet) {
      console.error('ERROR: SLA_MASTER sheet not found!');
      return { success: false, error: 'SLA_MASTER sheet not found' };
    }
    
    console.log('Getting user email...');
    const userId = Session.getActiveUser().getEmail();
    console.log('User ID:', userId);
    
    // Validate required fields
    console.log('Starting validation...');
    const validation = validateSLAData(slaData);
    console.log('Validation result:', JSON.stringify(validation));
    if (!validation.valid) {
      console.log('Validation failed:', validation.error);
      return { success: false, error: validation.error };
    }
    console.log('Validation passed');
    
    // Get next available row by finding first empty row in SLA Name column (C)
    // Note: getLastRow() returns last row with content OR formulas (including ARRAYFORMULA)
    // So we need to find the actual last row with data in column C
    const slaIdColumn = sheet.getRange('A:A').getValues();
    let lastDataRow = 1; // Start from header row
    for (let i = 1; i < slaIdColumn.length; i++) { // Skip header at index 0
      if (slaIdColumn[i][0] !== '') {
        lastDataRow = i + 1; // Convert 0-indexed array to 1-indexed row number
      } else if (i > 1 && slaIdColumn[i][0] === '') {
        // Found first empty row after data
        break;
      }
    }
    const newRow = lastDataRow + 1;
    console.log('Last data row:', lastDataRow, '| New row will be:', newRow);
    
    // Generate unique SLA ID using PropertiesService counter
    console.log('Generating unique SLA ID...');
    const slaId = getNextSlaId();
    console.log('Generated SLA ID:', slaId);
    
    // Prepare row data
    console.log('Preparing row data...');
    const rowData = [
      slaId, // SLA ID (generated by getNextSlaId, not formula)
      slaData.parentId || '',
      slaData.slaName,
      slaData.slaType,
      slaData.description || '',
      slaData.teamId,
      slaData.startDate,
      slaData.endDate,
      slaData.status || 'not-started',
      null, // Progress (calculated by ARRAYFORMULA in header - must be null/empty)
      slaData.currentValue || 0,
      slaData.targetValue,
      slaData.targetRangeMin || '',
      slaData.targetRangeMax || '',
      slaData.useRange || false,
      slaData.frequency || 'once',
      slaData.notificationEmails ? slaData.notificationEmails.join(';') : '',
      slaData.externalTrackerUrl || '',
      slaData.tags ? slaData.tags.join(',') : '',
      slaData.customFields ? JSON.stringify(slaData.customFields) : '',
      true, // Is Active
      new Date(), // Created At
      userId, // Created By
      new Date(), // Updated At
      userId, // Updated By
      1 // Row Version
    ];
    console.log('Row data prepared. Length:', rowData.length);
    console.log('Row data:', JSON.stringify(rowData));
    
    // Insert the data
    console.log('Inserting data into sheet...');
    sheet.getRange(newRow, 1, 1, rowData.length).setValues([rowData]);
    console.log('Data inserted successfully');
    
    // No formulas to copy - all calculated fields are managed directly by code or ARRAYFORMULA
    // - SLA ID: Generated by getNextSlaId() using PropertiesService
    // - Progress %: Calculated by ARRAYFORMULA in header (K1)
    // - Created At / Updated At: Set directly by code
    // - Row Version: Managed by updateSLA()
    
    // SLA ID already generated above - no need to read it back
    console.log('Flushing spreadsheet to apply any formulas...');
    SpreadsheetApp.flush();
    
    // Log activity
    console.log('Logging activity...');
    try {
      _logActivity(slaId, 'created', 'SLA created', null, slaData);
      console.log('Activity logged successfully');
    } catch (activityError) {
      console.error('Error logging activity (non-fatal):', activityError);
    }
    
    console.log('=== createSLA SUCCESS ===');
    return {
      success: true,
      slaId: slaId,
      message: 'SLA created successfully'
    };
    
  } catch (error) {
    console.error('=== createSLA ERROR ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Retrieves a complete SLA record by its ID from the SLA_MASTER sheet.
 * Parses all fields including arrays (notification emails, tags),
 * JSON custom fields, and retrieves associated relationships.
 * 
 * @param {string} slaId - The unique identifier of the SLA to retrieve (e.g., 'SLA-000001')
 * 
 * @returns {Object} Result object
 * @returns {boolean} return.success - Whether the operation succeeded
 * @returns {Object} [return.data] - The complete SLA object with all fields if found
 * @returns {string} return.data.slaId - Unique SLA identifier
 * @returns {string} [return.data.parentId] - Parent SLA ID if hierarchical
 * @returns {string} return.data.slaName - Name of the SLA
 * @returns {string} return.data.slaType - Type of SLA
 * @returns {string} return.data.description - SLA description
 * @returns {string} return.data.teamId - Responsible team ID
 * @returns {Date} return.data.startDate - Start date
 * @returns {Date} return.data.endDate - End date
 * @returns {string} return.data.status - Current status
 * @returns {number} return.data.progress - Progress percentage (0-200)
 * @returns {number} return.data.currentValue - Current measured value
 * @returns {number} return.data.targetValue - Target value
 * @returns {string} return.data.frequency - Measurement frequency
 * @returns {string[]} return.data.notificationEmails - Notification email addresses
 * @returns {string} return.data.externalTrackerUrl - External tracker URL
 * @returns {string[]} return.data.tags - Tags array
 * @returns {Object} return.data.customFields - Custom fields object
 * @returns {boolean} return.data.isActive - Whether SLA is active
 * @returns {Date} return.data.createdAt - Creation timestamp
 * @returns {string} return.data.createdBy - Creator email
 * @returns {Date} return.data.updatedAt - Last update timestamp
 * @returns {string} return.data.updatedBy - Last updater email
 * @returns {number} return.data.rowVersion - Version number for optimistic locking
 * @returns {Object[]} return.data.relationships - Related SLA relationships
 * @returns {string} [return.error] - Error message if failed or not found
 * 
 * @example
 * const result = readSLA('SLA-000001');
 * if (result.success) {
 *   console.log(result.data.slaName); // 'System Uptime'
 *   console.log(result.data.status);  // 'ontrack'
 * }
 */
function readSLA(slaId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('SLA_MASTER');
    
    // Find the SLA row
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const slaIdIndex = headers.indexOf('SLA ID');
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][slaIdIndex] === slaId) {
        // Build SLA object
        const sla = {};
        headers.forEach((header, index) => {
          const key = _toCamelCase(header);
          let value = data[i][index];
          
          // Convert Date objects to ISO strings for proper serialization
          if (value instanceof Date) {
            value = value.toISOString();
          }
          // Parse special fields
          else if (key === 'notificationEmails' && value) {
            value = value.split(';');
          } else if (key === 'tags' && value) {
            value = value.split(',');
          } else if (key === 'customFields' && value) {
            try {
              value = JSON.parse(value);
            } catch (e) {
              // Keep as string if not valid JSON
            }
          }
          
          sla[key] = value;
        });
        
        
        // Get relationships
        sla.relationships = getSLARelationships(slaId);
        
        return {
          success: true,
          data: sla
        };
      }
    }
    
    return {
      success: false,
      error: 'SLA not found'
    };
    
  } catch (error) {
    console.error('Error reading SLA:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Updates an existing SLA record with optimistic locking to prevent concurrent modification conflicts.
 * Validates row version, stores old values for audit trail, applies updates to specified fields,
 * automatically increments row version, updates audit timestamps, and logs the activity.
 * 
 * @param {string} slaId - The unique identifier of the SLA to update (e.g., 'SLA-000001')
 * @param {Object} updates - Object containing the fields to update (only specified fields are modified)
 * @param {string} [updates.slaName] - Updated SLA name
 * @param {string} [updates.slaType] - Updated SLA type
 * @param {string} [updates.description] - Updated description
 * @param {string} [updates.teamId] - Updated team ID
 * @param {Date|string} [updates.startDate] - Updated start date
 * @param {Date|string} [updates.endDate] - Updated end date
 * @param {string} [updates.status] - Updated status
 * @param {number} [updates.currentValue] - Updated current value
 * @param {number} [updates.targetValue] - Updated target value
 * @param {string} [updates.frequency] - Updated frequency
 * @param {string[]} [updates.notificationEmails] - Updated notification emails
 * @param {string} [updates.externalTrackerUrl] - Updated external tracker URL
 * @param {string[]} [updates.tags] - Updated tags array
 * @param {Object} [updates.customFields] - Updated custom fields
 * @param {boolean} [updates.isActive] - Updated active status
 * @param {number} [updates.rowVersion] - Current row version for optimistic locking (prevents concurrent edit conflicts)
 * 
 * @returns {Object} Result object
 * @returns {boolean} return.success - Whether the operation succeeded
 * @returns {string} [return.message] - Success message
 * @returns {string} [return.error] - Error message if failed (including 'SLA not found' or version conflict message)
 * 
 * @example
 * // Update with optimistic locking
 * const result = updateSLA('SLA-000001', {
 *   currentValue: 96.5,
 *   status: 'met',
 *   rowVersion: 3  // Current version number
 * });
 * // Returns: { success: true, message: 'SLA updated successfully' }
 * // Or if version mismatch: { success: false, error: 'SLA has been modified by another user...' }
 * 
 * @example
 * // Update multiple fields
 * const result = updateSLA('SLA-000002', {
 *   tags: ['priority', 'q1'],
 *   notificationEmails: ['team@company.com', 'manager@company.com']
 * });
 */
function updateSLA(slaId, updates) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('SLA_MASTER');
    const userId = Session.getActiveUser().getEmail();
    
    // Find the SLA row
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const slaIdIndex = headers.indexOf('SLA ID');
    let rowIndex = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][slaIdIndex] === slaId) {
        rowIndex = i + 1; // Sheet rows are 1-indexed
        break;
      }
    }
    
    if (rowIndex === -1) {
      return {
        success: false,
        error: 'SLA not found'
      };
    }
    
    // Check row version for optimistic locking
    const versionIndex = headers.indexOf('Row Version');
    const currentVersion = sheet.getRange(rowIndex, versionIndex + 1).getValue();
    
    if (updates.rowVersion && updates.rowVersion !== currentVersion) {
      return {
        success: false,
        error: 'SLA has been modified by another user. Please refresh and try again.'
      };
    }
    
    // Store old values for audit
    const oldValues = {};
    
    // Apply updates
    console.log('updateSLA: Processing updates for', slaId, updates);
    Object.keys(updates).forEach(key => {
      // Skip meta fields and calculated fields
      if (['rowVersion', 'updatedAt', 'updatedBy', 'progress', 'progressPercent'].includes(key)) {
        console.log('updateSLA: Skipping meta field:', key);
        return;
      }
      
      const header = _toHeaderCase(key);
      const colIndex = headers.indexOf(header);
      console.log('updateSLA: Field mapping -', key, '→', header, '→ colIndex:', colIndex);
      
      // Skip Progress % column - it's calculated by ARRAYFORMULA in header
      if (header === 'Progress %') {
        return;
      }
      
      if (colIndex !== -1) {
        const cellRow = rowIndex;
        const cellCol = colIndex + 1;
        
        // Store old value
        const oldValue = sheet.getRange(cellRow, cellCol).getValue();
        oldValues[key] = oldValue;
        
        // Prepare value
        let value = updates[key];
        if (Array.isArray(value)) {
          if (key === 'tags') {
            value = value.join(',');
          } else if (key === 'notificationEmails') {
            value = value.join(';');
          }
        } else if (typeof value === 'object' && key === 'customFields') {
          value = JSON.stringify(value);
        }
        
        // Update cell
        console.log('updateSLA: Updating', header, 'from', oldValue, 'to', value);
        sheet.getRange(cellRow, cellCol).setValue(value);
      } else {
        console.warn('updateSLA: Column not found for field', key, '(header:', header + ')');
      }
    });
    
    // Update audit fields
    const updatedAtIndex = headers.indexOf('Updated At');
    const updatedByIndex = headers.indexOf('Updated By');
    const versionCol = versionIndex + 1;
    
    sheet.getRange(rowIndex, updatedAtIndex + 1).setValue(new Date());
    sheet.getRange(rowIndex, updatedByIndex + 1).setValue(userId);
    sheet.getRange(rowIndex, versionCol).setValue(currentVersion + 1);
    
    // Log activity
    _logActivity(slaId, 'updated', 'SLA updated', oldValues, updates);
    
    return {
      success: true,
      message: 'SLA updated successfully'
    };
    
  } catch (error) {
    console.error('Error updating SLA:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Performs a soft delete on an SLA by setting its status to 'deleted' and isActive to false.
 * The record remains in the database for audit purposes but is excluded from normal queries.
 * Logs the deletion activity in the activity log.
 * 
 * @param {string} slaId - The unique identifier of the SLA to delete (e.g., 'SLA-000001')
 * 
 * @returns {Object} Result object
 * @returns {boolean} return.success - Whether the operation succeeded
 * @returns {string} [return.message] - Success message: 'SLA deleted successfully'
 * @returns {string} [return.error] - Error message if failed or SLA not found
 * 
 * @example
 * const result = deleteSLA('SLA-000001');
 * // Returns: { success: true, message: 'SLA deleted successfully' }
 * 
 * @see updateSLA - Soft delete is implemented via updateSLA with specific flags
 * @see logActivity - Activity is logged for audit trail
 */
function deleteSLA(slaId) {
  try {
    const result = updateSLA(slaId, {
      isActive: false,
      status: 'deleted'
    });
    
    if (result.success) {
      _logActivity(slaId, 'deleted', 'SLA deleted (soft)', null, null);
      return {
        success: true,
        message: 'SLA deleted successfully'
      };
    }
    
    return result;
    
  } catch (error) {
    console.error('Error deleting SLA:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Queries and retrieves SLAs with advanced filtering, sorting, and pagination capabilities.
 * Parses all array and JSON fields, applies filters (exact match, contains, array, date range),
 * sorts results by any field in ascending or descending order, and supports paginated results.
 * 
 * @param {Object} [options={}] - Query configuration object
 * @param {Object} [options.filters] - Filter criteria to apply to SLAs
 * @param {string} [options.filters.status] - Filter by exact status value
 * @param {string} [options.filters.slaType] - Filter by SLA type
 * @param {string} [options.filters.teamId] - Filter by team ID
 * @param {boolean} [options.filters.isActive] - Filter by active status (commonly set to true)
 * @param {string[]} [options.filters.tags] - Filter by tags (array match)
 * @param {Object} [options.filters.dateRange] - Filter by date range
 * @param {Date|string} [options.filters.dateRange.start] - Start date for range filter
 * @param {Date|string} [options.filters.dateRange.end] - End date for range filter
 * @param {*} [options.filters.*] - Any other field can be filtered (exact match, contains for strings)
 * @param {Object} [options.sort] - Sorting configuration
 * @param {string} options.sort.field - Field name to sort by (e.g., 'endDate', 'slaName', 'progress')
 * @param {string} [options.sort.direction='asc'] - Sort direction: 'asc' (ascending) or 'desc' (descending)
 * @param {Object} [options.pagination] - Pagination configuration
 * @param {number} [options.pagination.page=1] - Page number (1-indexed)
 * @param {number} [options.pagination.pageSize=50] - Number of results per page
 * 
 * @returns {Object} Result object
 * @returns {boolean} return.success - Whether the operation succeeded
 * @returns {Object[]} return.data - Array of SLA objects matching the query
 * @returns {number} return.total - Total number of SLAs matching filters (before pagination)
 * @returns {number} return.page - Current page number
 * @returns {number} return.pageSize - Number of results per page
 * @returns {string} [return.error] - Error message if failed
 * 
 * @example
 * // Query active SLAs with filtering and sorting
 * const result = querySLAs({
 *   filters: {
 *     status: 'at-risk',
 *     isActive: true,
 *     teamId: 'TEAM-001'
 *   },
 *   sort: {
 *     field: 'endDate',
 *     direction: 'asc'
 *   },
 *   pagination: {
 *     page: 1,
 *     pageSize: 10
 *   }
 * });
 * // Returns: { success: true, data: [...], total: 25, page: 1, pageSize: 10 }
 * 
 * @example
 * // Query all active SLAs without pagination
 * const result = querySLAs({
 *   filters: { isActive: true },
 *   sort: { field: 'updatedAt', direction: 'desc' }
 * });
 * 
 * @see applyFilters - Handles filter logic
 * @see applySorting - Handles sorting logic
 * @see applyPagination - Handles pagination logic
 */
function querySLAs(options = {}) {
  console.log('=== querySLAs BACKEND START ===');
  console.log('Received options:', JSON.stringify(options, null, 2));
  
  try {
    console.log('Getting spreadsheet...');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    console.log('Spreadsheet name:', ss.getName());
    
    console.log('Getting SLA_MASTER sheet...');
    const sheet = ss.getSheetByName('SLA_MASTER');
    console.log('Sheet found:', sheet ? 'YES' : 'NO');
    
    console.log('Getting data range...');
    const data = sheet.getDataRange().getValues();
    console.log('Data rows retrieved:', data.length);
    
    const headers = data[0];
    console.log('Headers:', JSON.stringify(headers));
    
    // Convert to objects
    let slas = [];
    console.log('Converting rows to objects...');
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0]) {
        console.log('Skipping empty row at index', i);
        continue; // Skip empty rows
      }
      
      const sla = {};
      headers.forEach((header, index) => {
        const key = _toCamelCase(header);
        let value = row[index];
        
        // Convert Date objects to ISO strings for proper serialization
        if (value instanceof Date) {
          value = value.toISOString();
        }
        
        sla[key] = value;
      });
      
      // Parse arrays
      if (sla.notificationEmails) {
        sla.notificationEmails = sla.notificationEmails.split(';').filter(e => e);
      }
      if (sla.tags) {
        sla.tags = sla.tags.split(',').filter(t => t);
      }
      
      slas.push(sla);
    }
    
    console.log('Total SLAs before filtering:', slas.length);
    console.log('First SLA (if any):', slas.length > 0 ? JSON.stringify(slas[0]) : 'NONE');
    
    // Apply filters
    if (options.filters) {
      console.log('Applying filters:', JSON.stringify(options.filters));
      slas = _applyFilters(slas, options.filters);
      console.log('SLAs after filtering:', slas.length);
    }
    
    // Apply sorting
    if (options.sort) {
      console.log('Applying sorting:', JSON.stringify(options.sort));
      slas = _applySorting(slas, options.sort);
    }
    
    // Calculate total before pagination
    const total = slas.length;
    console.log('Total SLAs for pagination:', total);
    
    // Apply pagination
    if (options.pagination) {
      console.log('Applying pagination:', JSON.stringify(options.pagination));
      slas = _applyPagination(slas, options.pagination);
      console.log('SLAs after pagination:', slas.length);
    }
    
    const result = {
      success: true,
      data: slas,
      total: total,
      page: options.pagination?.page || 1,
      pageSize: options.pagination?.pageSize || slas.length
    };
    
    console.log('=== querySLAs BACKEND SUCCESS ===');
    console.log('Returning result with', result.data.length, 'SLAs');
    return result;
    
  } catch (error) {
    console.error('=== querySLAs BACKEND ERROR ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return {
      success: false,
      error: error.toString()
    };
  }
}

// ============================================
// PUBLIC API - Relationships
// ============================================

/**
 * Retrieves relationship records for a specific SLA from the SLA_RELATIONSHIPS sheet.
 * Returns all relationships where the given SLA is either the source or target,
 * including the relationship type (depends-on, blocks, related-to) and both SLA IDs.
 * 
 * @param {string} slaId - The ID of the SLA to get relationships for (e.g., 'SLA-001')
 * 
 * @returns {Object[]} Array of relationship objects
 * @returns {string} return[].sourceSlaId - The ID of the source SLA
 * @returns {string} return[].targetSlaId - The ID of the target/related SLA
 * @returns {string} return[].relationshipType - Type: 'depends-on', 'blocks', or 'related-to'
 * @returns {string} [return[].notes] - Optional notes about the relationship
 * 
 * @example
 * const relationships = getSLARelationships('SLA-001');
 * relationships.forEach(rel => {
 *   console.log(`${rel.sourceSlaId} ${rel.relationshipType} ${rel.targetSlaId}`);
 * });
 * // Returns: [{ sourceSlaId: 'SLA-001', targetSlaId: 'SLA-002', relationshipType: 'depends-on' }, ...]
 * 
 * @see readSLA - Returns SLA with embedded relationships array
 */
function getSLARelationships(slaId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('SLA_RELATIONSHIPS');
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return [];
    
    const headers = data[0];
    const relationships = [];
    const sourceIndex = headers.indexOf('Source SLA ID');
    const targetIndex = headers.indexOf('Target SLA ID');
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][sourceIndex] === slaId || data[i][targetIndex] === slaId) {
        const rel = {};
        headers.forEach((header, index) => {
          rel[_toCamelCase(header)] = data[i][index];
        });
        relationships.push(rel);
      }
    }
    
    return relationships;
    
  } catch (error) {
    console.error('Error getting relationships:', error);
    return [];
  }
}