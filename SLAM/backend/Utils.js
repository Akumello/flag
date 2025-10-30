// Utils.gs - Utility functions

// ============================================
// PUBLIC API - ID Generation
// ============================================

/**
 * Generates the next unique SLA ID using PropertiesService to maintain counter.
 * IDs are in format SLA-000001, SLA-000002, etc. Thread-safe using script lock.
 * Initializes counter to 1 on first use or scans existing sheet for max ID if needed.
 * 
 * @returns {string} The next SLA ID (e.g., 'SLA-000001')
 * 
 * @example
 * const newId = getNextSlaId();
 * // Returns: 'SLA-000042'
 * 
 * @see createSLA - Calls this to generate unique ID
 * @see _initializeSlaIdCounter - Initializes counter from existing data
 */
function getNextSlaId() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000); // Wait up to 30 seconds for lock
  
  try {
    const props = PropertiesService.getScriptProperties();
    let counter = parseInt(props.getProperty('SLA_ID_COUNTER') || '0');
    
    // If counter is 0, initialize it by scanning existing data
    if (counter === 0) {
      counter = _initializeSlaIdCounter();
    }
    
    // Increment counter
    counter++;
    
    // Save updated counter
    props.setProperty('SLA_ID_COUNTER', counter.toString());
    
    // Format as SLA-000001
    const slaId = 'SLA-' + counter.toString().padStart(6, '0');
    console.log('Generated SLA ID:', slaId);
    
    return slaId;
    
  } finally {
    lock.releaseLock();
  }
}

// ============================================
// INTERNAL HELPERS - Private functions
// ============================================

/**
 * Initializes the SLA ID counter by scanning existing SLA_MASTER sheet for highest ID.
 * Extracts numeric portion from SLA IDs (e.g., 'SLA-000042' -> 42) and returns max + 1.
 * Returns 0 if no existing SLAs found. Called automatically by getNextSlaId if needed.
 * 
 * @private
 * @returns {number} The highest existing SLA ID number, or 0 if none exist
 * 
 * @example
 * const maxId = _initializeSlaIdCounter();
 * // Returns: 42 (if SLA-000042 is the highest existing ID)
 * 
 * @see getNextSlaId - Calls this when counter is uninitialized
 */
function _initializeSlaIdCounter() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('SLA_MASTER');
    
    if (!sheet) {
      console.log('SLA_MASTER sheet not found, starting counter at 0');
      return 0;
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const slaIdIndex = headers.indexOf('SLA ID');
    
    if (slaIdIndex === -1) {
      console.log('SLA ID column not found, starting counter at 0');
      return 0;
    }
    
    let maxId = 0;
    
    // Scan all rows for existing SLA IDs
    for (let i = 1; i < data.length; i++) {
      const slaId = data[i][slaIdIndex];
      
      if (slaId && typeof slaId === 'string' && slaId.startsWith('SLA-')) {
        // Extract numeric portion (e.g., 'SLA-000042' -> 42)
        const numericPart = parseInt(slaId.substring(4));
        if (!isNaN(numericPart) && numericPart > maxId) {
          maxId = numericPart;
        }
      }
    }
    
    console.log('Initialized SLA ID counter from existing data. Max ID found:', maxId);
    
    // Save to properties
    const props = PropertiesService.getScriptProperties();
    props.setProperty('SLA_ID_COUNTER', maxId.toString());
    
    return maxId;
    
  } catch (error) {
    console.error('Error initializing SLA ID counter:', error);
    return 0;
  }
}

/**
 * Resets the SLA ID counter to a specific value. USE WITH CAUTION!
 * This should only be used during setup or migration. Resetting to a value
 * lower than existing IDs will cause duplicate ID errors.
 * 
 * @param {number} value - The value to reset the counter to (default: 0)
 * 
 * @returns {Object} Result object
 * @returns {boolean} return.success - Whether reset was successful
 * @returns {string} [return.message] - Success message
 * @returns {string} [return.error] - Error message if failed
 * 
 * @example
 * // Reset counter (will auto-initialize from sheet data)
 * resetSlaIdCounter(0);
 * 
 * @example
 * // Set counter to start from 1000
 * resetSlaIdCounter(1000);
 */
function resetSlaIdCounter(value = 0) {
  try {
    const props = PropertiesService.getScriptProperties();
    props.setProperty('SLA_ID_COUNTER', value.toString());
    
    console.log('SLA ID counter reset to:', value);
    
    return {
      success: true,
      message: `SLA ID counter reset to ${value}`
    };
    
  } catch (error) {
    console.error('Error resetting counter:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

// ============================================
// PUBLIC API - Validation
// ============================================

/**
 * Validates SLA data against business rules and constraints.
 * Checks required fields, date logic, email formats, and type-specific constraints
 * (e.g., percentage targets must be 0-100). Returns validation status with error messages.
 * 
 * @param {Object} data - SLA data object to validate
 * @param {string} data.slaName - Name of the SLA (required)
 * @param {string} data.slaType - Type: 'percentage', 'numeric', 'time-based', 'multi-metric' (required)
 * @param {string} data.teamId - Team identifier (required)
 * @param {Date|string} data.startDate - Start date (required)
 * @param {Date|string} data.endDate - End date (required, must be after startDate)
 * @param {number} data.targetValue - Target value (required)
 * @param {string|string[]} [data.notificationEmails] - Email addresses (validated against regex)
 * @param {*} [data.*] - Other optional fields
 * 
 * @returns {Object} Validation result
 * @returns {boolean} return.valid - Whether the data passes all validation rules
 * @returns {string} return.error - Semicolon-separated error messages (empty if valid)
 * 
 * @example
 * const result = validateSLAData({
 *   slaName: 'Customer Response Time',
 *   slaType: 'percentage',
 *   teamId: 'TEAM-001',
 *   startDate: '2024-01-01',
 *   endDate: '2024-12-31',
 *   targetValue: 95
 * });
 * if (!result.valid) {
 *   console.error('Validation failed:', result.error);
 * }
 * // Returns: { valid: true, error: '' }
 * 
 * @see createSLA - Uses this for pre-creation validation
 * @see updateSLA - Uses this for pre-update validation
 */
function validateSLAData(data) {
  const errors = [];
  
  // Required fields
  if (!data.slaName) errors.push('SLA Name is required');
  if (!data.slaType) errors.push('SLA Type is required');
  if (!data.teamId) errors.push('Team ID is required');
  if (!data.startDate) errors.push('Start Date is required');
  if (!data.endDate) errors.push('End Date is required');
  
  // Target value validation - handle ranges properly
  const usingRange = data.useRange === true || data.useRange === 'true' || data.useRange === 1;
  
  if (usingRange) {
    // For range targets, validate range values
    if (data.targetRangeMin === undefined || data.targetRangeMin === null || data.targetRangeMin === '') {
      errors.push('Target Range Min is required when using range');
    }
    if (data.targetRangeMax === undefined || data.targetRangeMax === null || data.targetRangeMax === '') {
      errors.push('Target Range Max is required when using range');
    }
    if (data.targetRangeMin !== undefined && data.targetRangeMax !== undefined) {
      const min = parseFloat(data.targetRangeMin);
      const max = parseFloat(data.targetRangeMax);
      if (min > max) {
        errors.push('Target Range Min cannot be greater than Target Range Max');
      }
    }
    // targetValue is optional for ranges - will be calculated if not provided
    if (!data.targetValue && data.targetValue !== 0) {
      // Calculate midpoint if not provided
      const min = parseFloat(data.targetRangeMin) || 0;
      const max = parseFloat(data.targetRangeMax) || 0;
      data.targetValue = (min + max) / 2;
    }
  } else {
    // For single targets, targetValue is required
    if (data.targetValue === undefined || data.targetValue === null || data.targetValue === '') {
      errors.push('Target Value is required');
    }
  }
  
  // Date validation
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end <= start) {
      errors.push('End Date must be after Start Date');
    }
  }
  
  // Email validation
  if (data.notificationEmails) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emails = Array.isArray(data.notificationEmails) ? 
                  data.notificationEmails : data.notificationEmails.split(';');
    
    emails.forEach(email => {
      if (!emailRegex.test(email.trim())) {
        errors.push(`Invalid email: ${email}`);
      }
    });
  }
  
  // Type-specific validation
  if (data.slaType === 'percentage') {
    if (usingRange) {
      // For percentage ranges, both min and max should be 0-100
      const min = parseFloat(data.targetRangeMin);
      const max = parseFloat(data.targetRangeMax);
      if (min < 0 || min > 100 || max < 0 || max > 100) {
        errors.push('Percentage range values must be between 0 and 100');
      }
    } else {
      // For single percentage values
      if (data.targetValue < 0 || data.targetValue > 100) {
        errors.push('Percentage target must be between 0 and 100');
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    error: errors.join('; ')
  };
}

// ============================================
// INTERNAL HELPERS - Activity Logging & Query Helpers
// ============================================

/**
 * Logs an activity/action to the SLA_ACTIVITY_LOG audit trail sheet.
 * Creates a new log entry with timestamp, user info, action details, and before/after values.
 * Generates unique log ID for tracking. Used for compliance and debugging.
 * 
 * @private
 * @param {string} slaId - ID of the SLA being acted upon (e.g., 'SLA-001')
 * @param {string} actionType - Type of action: 'create', 'update', 'delete', 'view', 'comment', 'status-change', etc.
 * @param {string} actionDetails - Human-readable description of what was done (e.g., 'Changed status from on-track to at-risk')
 * @param {*} [oldValue] - Previous value(s) before the action (will be JSON stringified)
 * @param {*} [newValue] - New value(s) after the action (will be JSON stringified)
 * 
 * @returns {void} Does not return a value; logs silently (errors logged to console)
 * 
 * @example
 * _logActivity('SLA-001', 'status-change', 'Status changed from on-track to at-risk', 
 *   { status: 'on-track' }, 
 *   { status: 'at-risk' }
 * );
 * 
 * @example
 * _logActivity('SLA-002', 'create', 'New SLA created', null, { slaName: 'Response Time', targetValue: 95 });
 * 
 * @see updateSLA - Calls this after every update
 * @see deleteSLA - Calls this when soft-deleting
 */
function _logActivity(slaId, actionType, actionDetails, oldValue, newValue) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('SLA_ACTIVITY_LOG');
    const userId = Session.getActiveUser().getEmail();
    
    const lastRow = sheet.getLastRow();
    const newRow = lastRow + 1;
    
    const logData = [
      `LOG-${Date.now()}`,
      slaId,
      new Date(),
      userId,
      userId, // User name (could be enhanced with user lookup)
      actionType,
      actionDetails,
      oldValue ? JSON.stringify(oldValue) : '',
      newValue ? JSON.stringify(newValue) : ''
    ];
    
    sheet.getRange(newRow, 1, 1, logData.length).setValues([logData]);
    
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

/**
 * Applies filter criteria to an array of SLA objects, supporting multiple filter types.
 * Handles exact matches, string contains (case-insensitive), array includes, boolean matches,
 * and date range filters. All filters are AND-ed together (all must match).
 * 
 * @private
 * @param {Object[]} slas - Array of SLA objects to filter
 * @param {Object} filters - Filter criteria object
 * @param {*} [filters.fieldName] - Any field can be used as filter key with appropriate value
 * @param {string|number|boolean} [filters.exactMatch] - Exact value to match
 * @param {string[]} [filters.arrayMatch] - SLA value must be in this array
 * @param {Object} [filters.dateRange] - Date range filter
 * @param {Date|string} filters.dateRange.start - Range start date
 * @param {Date|string} filters.dateRange.end - Range end date
 * 
 * @returns {Object[]} Filtered array of SLA objects (original array unchanged)
 * 
 * @example
 * const filtered = _applyFilters(allSLAs, {
 *   status: 'at-risk',
 *   isActive: true,
 *   teamId: 'TEAM-001',
 *   slaName: 'response' // contains match (case-insensitive)
 * });
 * 
 * @example
 * const dateFiltered = _applyFilters(allSLAs, {
 *   dateRange: { start: '2024-01-01', end: '2024-12-31' },
 *   isActive: true
 * });
 * 
 * @see querySLAs - Uses this for query filtering
 */
function _applyFilters(slas, filters) {
  return slas.filter(sla => {
    for (const key in filters) {
      const filterValue = filters[key];
      const slaValue = sla[key];
      
      if (filterValue === null || filterValue === undefined) continue;
      
      // Handle array filters
      if (Array.isArray(filterValue)) {
        if (!filterValue.includes(slaValue)) return false;
      }
      // Handle date range filters
      else if (key === 'dateRange' && filterValue.start && filterValue.end) {
        const slaDate = new Date(sla.endDate);
        const startDate = new Date(filterValue.start);
        const endDate = new Date(filterValue.end);
        if (slaDate < startDate || slaDate > endDate) return false;
      }
      // Handle boolean filters
      else if (typeof filterValue === 'boolean') {
        if (slaValue !== filterValue) return false;
      }
      // Handle string contains filter
      else if (typeof filterValue === 'string' && typeof slaValue === 'string') {
        if (!slaValue.toLowerCase().includes(filterValue.toLowerCase())) return false;
      }
      // Handle exact match
      else {
        if (slaValue !== filterValue) return false;
      }
    }
    return true;
  });
}

/**
 * Sorts an array of SLA objects by a specified field in ascending or descending order.
 * Handles different data types intelligently: dates, numbers, and strings (case-insensitive).
 * Null/undefined values are treated as empty strings and sorted to the beginning/end.
 * 
 * @private
 * @param {Object[]} slas - Array of SLA objects to sort
 * @param {Object} sort - Sort configuration
 * @param {string} sort.field - Field name to sort by (e.g., 'endDate', 'slaName', 'progress', 'targetValue')
 * @param {string} [sort.direction='asc'] - Sort direction: 'asc' (ascending) or 'desc' (descending)
 * 
 * @returns {Object[]} Sorted array (modifies original array in place)
 * 
 * @example
 * const sorted = _applySorting(allSLAs, {
 *   field: 'endDate',
 *   direction: 'asc'
 * });
 * // SLAs sorted by end date, earliest first
 * 
 * @example
 * _applySorting(allSLAs, { field: 'progress', direction: 'desc' });
 * // SLAs sorted by progress, highest first
 * 
 * @see querySLAs - Uses this for result ordering
 */
function _applySorting(slas, sort) {
  const { field, direction = 'asc' } = sort;
  
  return slas.sort((a, b) => {
    let aVal = a[field];
    let bVal = b[field];
    
    // Handle null/undefined
    if (aVal === null || aVal === undefined) aVal = '';
    if (bVal === null || bVal === undefined) bVal = '';
    
    // Handle dates
    if (field.includes('Date') || field.includes('At')) {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }
    
    // Handle numbers
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    // Handle strings
    aVal = String(aVal).toLowerCase();
    bVal = String(bVal).toLowerCase();
    
    if (direction === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });
}

/**
 * Extracts a paginated subset from an array of SLA objects.
 * Calculates the correct slice indices based on page number and page size.
 * Pages are 1-indexed (first page is 1, not 0).
 * 
 * @private
 * @param {Object[]} slas - Array of SLA objects to paginate
 * @param {Object} pagination - Pagination configuration
 * @param {number} [pagination.page=1] - Page number (1-indexed)
 * @param {number} [pagination.pageSize=50] - Number of results per page
 * 
 * @returns {Object[]} Paginated subset of the array
 * 
 * @example
 * const page1 = _applyPagination(allSLAs, { page: 1, pageSize: 10 });
 * // Returns SLAs 1-10
 * 
 * @example
 * const page3 = _applyPagination(allSLAs, { page: 3, pageSize: 25 });
 * // Returns SLAs 51-75
 * 
 * @see querySLAs - Uses this for limiting result sets
 */
function _applyPagination(slas, pagination) {
  const { page = 1, pageSize = 50 } = pagination;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  return slas.slice(startIndex, endIndex);
}

// ============================================
// INTERNAL HELPERS - String Conversion
// ============================================

/**
 * Converts a Header Case string (e.g., "SLA Name") to camelCase (e.g., "slaName").
 * Properly handles acronyms by treating them as single words. Removes spaces and
 * capitalizes the first letter of each word except the first. Used for converting
 * Google Sheets column headers to JavaScript object keys.
 * 
 * IMPORTANT: Handles acronyms correctly:
 * - "SLA ID" → "slaId" (not "sLAID")
 * - "Team ID" → "teamId" (not "teamID") 
 * - "External Tracker URL" → "externalTrackerUrl" (not "externalTrackerURL")
 * 
 * @private
 * @param {string} str - Header Case string (typically from spreadsheet)
 * 
 * @returns {string} camelCase version with proper acronym handling
 * 
 * @example
 * _toCamelCase('SLA Name'); // Returns: 'slaName'
 * _toCamelCase('Team ID'); // Returns: 'teamId'
 * _toCamelCase('Target Range Min'); // Returns: 'targetRangeMin'
 * _toCamelCase('Progress Percent'); // Returns: 'progressPercent'
 * 
 * @see _toHeaderCase - Inverse conversion
 */
function _toCamelCase(str) {
  // Handle empty strings
  if (!str) return '';
  
  // Split by spaces and process each word
  return str
    .split(' ')
    .map((word, index) => {
      // First word is always lowercase
      if (index === 0) {
        return word.toLowerCase();
      }
      // For subsequent words, only capitalize first letter
      // This handles acronyms correctly: "ID" becomes "Id", "SLA" becomes "Sla"
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}

/**
 * Converts a camelCase string (e.g., "slaName") to Header Case (e.g., "SLA Name").
 * Uses explicit mapping to ensure correct capitalization for abbreviations (SLA, ID).
 * Used for converting JavaScript object keys to Google Sheets column headers.
 * 
 * @private
 * @param {string} str - camelCase string
 * 
 * @returns {string} Header Case version matching exact sheet headers
 * 
 * @example
 * _toHeaderCase('slaName'); // Returns: 'SLA Name'
 * _toHeaderCase('teamId'); // Returns: 'Team ID'
 * _toHeaderCase('endDate'); // Returns: 'End Date'
 * 
 * @see _toCamelCase - Inverse conversion
 */
function _toHeaderCase(str) {
  // Explicit mapping to handle abbreviations and ensure exact sheet header match
  const mapping = {
    'slaId': 'SLA ID',
    'parentId': 'Parent ID',
    'slaName': 'SLA Name',
    'slaType': 'SLA Type',
    'description': 'Description',
    'teamId': 'Team ID',
    'taskId': 'Task ID',
    'startDate': 'Start Date',
    'endDate': 'End Date',
    'status': 'Status',
    'currentValue': 'Current Value',
    'targetValue': 'Target Value',
    'targetRangeMin': 'Target Range Min',
    'targetRangeMax': 'Target Range Max',
    'useRange': 'Use Range',
    'frequency': 'Frequency',
    'notificationEmails': 'Notification Emails',
    'externalTrackerUrl': 'External Tracker URL',
    'tags': 'Tags',
    'customFields': 'Custom Fields',
    'isActive': 'Is Active',
    'createdAt': 'Created At',
    'createdBy': 'Created By',
    'updatedAt': 'Updated At',
    'updatedBy': 'Updated By',
    'lastUpdatedBy': 'Updated By',
    'rowVersion': 'Row Version',
    'dataSource': 'Data Source',
    'metricType': 'Metric Type',
    'calculationLogic': 'Calculation Logic',
    'measurementFrequency': 'Frequency',
    'complianceThreshold': 'Compliance Threshold',
    'priority': 'Priority',
    'owner': 'Owner',
    'escalationPath': 'Escalation Path',
    'notes': 'Notes',
    'lastReviewed': 'Last Reviewed',
    'nextReview': 'Next Review',
    'category': 'Category',
    'subcategory': 'Subcategory'
  };
  
  // Return mapped value if exists, otherwise fallback to old logic
  if (mapping[str]) {
    return mapping[str];
  }
  
  // Fallback for unmapped fields
  const result = str.replace(/([A-Z])/g, ' $1').trim();
  return result.charAt(0).toUpperCase() + result.slice(1);
}

// ============================================
// PUBLIC API - Permissions (placeholder)
// ============================================

/**
 * Retrieves permission settings for the currently active user from the USER_PERMISSIONS sheet.
 * Returns permission type (admin/editor/commenter/viewer) and access scopes (team/SLA restrictions).
 * Falls back to 'viewer' permissions if user is not found in the permissions sheet.
 * 
 * @returns {Object} User permission object
 * @returns {string} return.permissionType - Permission level: 'admin', 'editor', 'commenter', or 'viewer'
 * @returns {string[]} return.teamIds - Array of team IDs this user can access (empty = all teams)
 * @returns {string[]} return.slaIds - Array of SLA IDs this user can access (empty = all SLAs)
 * @returns {string} [return.userEmail] - User's email address
 * @returns {string} [return.userId] - User identifier
 * 
 * @example
 * const perms = getUserPermissions();
 * if (perms.permissionType === 'admin') {
 *   console.log('User has admin access to all SLAs');
 * } else if (perms.teamIds.length > 0) {
 *   console.log('User has access to specific teams:', perms.teamIds);
 * }
 * // Returns: { permissionType: 'editor', teamIds: ['TEAM-001', 'TEAM-002'], slaIds: [] }
 * 
 * @see checkPermission - Uses this to validate specific actions
 */
function getUserPermissions() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('USER_PERMISSIONS');
    const userEmail = Session.getActiveUser().getEmail();
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const emailIndex = headers.indexOf('User Email');
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][emailIndex] === userEmail) {
        const permission = {};
        headers.forEach((header, index) => {
          permission[toCamelCase(header)] = data[i][index];
        });
        
        // Parse team and SLA IDs
        if (permission.teamIds) {
          permission.teamIds = permission.teamIds.split(',').filter(id => id);
        }
        if (permission.slaIds) {
          permission.slaIds = permission.slaIds.split(',').filter(id => id);
        }
        
        return permission;
      }
    }
    
    // Default permission if not found
    return {
      permissionType: 'viewer',
      teamIds: [],
      slaIds: []
    };
    
  } catch (error) {
    console.error('Error getting permissions:', error);
    return {
      permissionType: 'viewer',
      teamIds: [],
      slaIds: []
    };
  }
}

/**
 * Checks if the current user has permission to perform a specific action on an SLA.
 * Validates permission type against action requirements and checks SLA/team-level access restrictions.
 * Permission hierarchy: viewer < commenter < editor < admin.
 * 
 * @param {string} slaId - ID of the SLA to check permission for (e.g., 'SLA-001')
 * @param {string} action - Action to validate: 'read', 'comment', 'edit', or 'delete'
 * 
 * @returns {boolean} true if user has permission, false otherwise
 * 
 * @example
 * if (checkPermission('SLA-001', 'edit')) {
 *   // User can edit this SLA
 *   updateSLA('SLA-001', { status: 'at-risk' });
 * } else {
 *   console.error('Permission denied: User cannot edit this SLA');
 * }
 * 
 * @example
 * // Check before deletion
 * if (!checkPermission('SLA-002', 'delete')) {
 *   return { success: false, error: 'You do not have permission to delete this SLA' };
 * }
 * 
 * @see getUserPermissions - Retrieves user's permission settings
 */
function checkPermission(slaId, action) {
  const permissions = getUserPermissions();
  
  // Admin has all permissions
  if (permissions.permissionType === 'admin') {
    return true;
  }
  
  // Check action-specific permissions
  const actionPermissions = {
    'read': ['viewer', 'commenter', 'editor', 'admin'],
    'comment': ['commenter', 'editor', 'admin'],
    'edit': ['editor', 'admin'],
    'delete': ['admin']
  };
  
  const allowedRoles = actionPermissions[action] || [];
  if (!allowedRoles.includes(permissions.permissionType)) {
    return false;
  }
  
  // Check SLA-specific permissions
  if (permissions.slaIds && permissions.slaIds.length > 0) {
    return permissions.slaIds.includes(slaId);
  }
  
  // Check team-based permissions
  if (permissions.teamIds && permissions.teamIds.length > 0) {
    const sla = readSLA(slaId);
    if (sla.success) {
      return permissions.teamIds.includes(sla.data.teamId);
    }
  }
  
  return false;
}