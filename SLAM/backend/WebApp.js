// WebApp.gs - REST API endpoints
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Handles HTTP GET requests to the web app for reading and querying SLA data.
 * Supports three actions: 'read' (single SLA by ID), 'query' (filtered/sorted SLAs),
 * and 'getPermissions' (current user permissions). Returns JSON responses.
 * 
 * To deploy: Publish > Deploy as web app > Execute as: Me > Who has access: Anyone with Google account
 * 
 * @param {Object} e - Event object from Google Apps Script
 * @param {Object} e.parameter - URL parameters
 * @param {string} e.parameter.action - Action to perform: 'read', 'query', or 'getPermissions'
 * @param {string} [e.parameter.id] - SLA ID for 'read' action
 * @param {string} [e.parameter.filters] - JSON string of filter criteria for 'query'
 * @param {string} [e.parameter.sort] - JSON string of sort config for 'query'
 * @param {string} [e.parameter.pagination] - JSON string of pagination config for 'query'
 * 
 * @returns {GoogleAppsScript.Content.TextOutput} JSON response with success/data or error
 * 
 * @example
 * // Read single SLA
 * // GET: https://script.google.com/macros/s/{deploymentId}/exec?action=read&id=SLA-001
 * 
 * @example
 * // Query SLAs with filters
 * // GET: https://script.google.com/macros/s/{deploymentId}/exec?action=query&filters={"status":"at-risk"}
 * 
 * @see readSLA - Handles 'read' action
 * @see querySLAs - Handles 'query' action
 * @see getUserPermissions - Handles 'getPermissions' action
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    const slaId = e.parameter.id;

    if(!action) {
      return HtmlService.createTemplateFromFile('command-center').evaluate().setTitle('Command Center');
    }
    
    let result;
    
    switch (action) {
      case 'read':
        result = readSLA(slaId);
        break;
        
      case 'query':
        const filters = e.parameter.filters ? JSON.parse(e.parameter.filters) : {};
        const sort = e.parameter.sort ? JSON.parse(e.parameter.sort) : null;
        const pagination = e.parameter.pagination ? JSON.parse(e.parameter.pagination) : null;
        
        result = querySLAs({
          filters: filters,
          sort: sort,
          pagination: pagination
        });
        break;
        
      case 'getPermissions':
        result = {
          success: true,
          data: getUserPermissions()
        };
        break;
        
      default:
        result = {
          success: false,
          error: 'Invalid action'
        };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles HTTP POST requests to the web app for creating, updating, and deleting SLAs.
 * Supports five actions: 'create' (single SLA), 'update' (single SLA), 'delete' (soft delete),
 * 'bulkCreate' (multiple SLAs), and 'bulkUpdate' (multiple updates). Expects JSON payload.
 * Returns JSON responses with success status and results/errors.
 * 
 * @param {Object} e - Event object from Google Apps Script
 * @param {Object} e.postData - POST payload
 * @param {string} e.postData.contents - JSON string containing action and data
 * 
 * @returns {GoogleAppsScript.Content.TextOutput} JSON response with success/data or error
 * 
 * @example
 * // Create single SLA
 * // POST: https://script.google.com/macros/s/{deploymentId}/exec
 * // Body: { "action": "create", "sla": { "slaName": "...", "teamId": "...", ... } }
 * 
 * @example
 * // Update single SLA
 * // POST: https://script.google.com/macros/s/{deploymentId}/exec
 * // Body: { "action": "update", "slaId": "SLA-001", "updates": { "status": "at-risk" } }
 * 
 * @example
 * // Bulk create
 * // POST: https://script.google.com/macros/s/{deploymentId}/exec
 * // Body: { "action": "bulkCreate", "slas": [{ ... }, { ... }] }
 * 
 * @see createSLA - Handles 'create' action
 * @see updateSLA - Handles 'update' action
 * @see deleteSLA - Handles 'delete' action
 * @see bulkCreateSLAs - Handles 'bulkCreate' action
 * @see bulkUpdateSLAs - Handles 'bulkUpdate' action
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    let result;
    
    switch (action) {
      case 'create':
        result = createSLA(data.sla);
        break;
        
      case 'update':
        result = updateSLA(data.slaId, data.updates);
        break;
        
      case 'delete':
        result = deleteSLA(data.slaId);
        break;
        
      case 'bulkCreate':
        result = bulkCreateSLAs(data.slas);
        break;
        
      case 'bulkUpdate':
        result = bulkUpdateSLAs(data.updates);
        break;
        
      default:
        result = {
          success: false,
          error: 'Invalid action'
        };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Creates multiple SLAs in a single batch operation.
 * Iterates through array of SLA data objects, creating each one individually.
 * Collects successes and errors separately. Returns summary with created IDs and any failures.
 * Continues processing even if individual SLAs fail (partial success possible).
 * 
 * @param {Object[]} slas - Array of SLA data objects to create
 * @param {string} slas[].slaName - Name of each SLA (required)
 * @param {string} slas[].slaType - Type of each SLA (required)
 * @param {*} slas[].*  - Other SLA fields as per createSLA requirements
 * 
 * @returns {Object} Bulk creation result
 * @returns {boolean} return.success - true only if ALL creations succeeded
 * @returns {string[]} return.created - Array of successfully created SLA IDs
 * @returns {Object[]} return.errors - Array of error objects for failed creations
 * @returns {number} return.errors[].index - Array index of failed SLA
 * @returns {string} return.errors[].error - Error message for that SLA
 * 
 * @example
 * const result = bulkCreateSLAs([
 *   { slaName: 'SLA 1', teamId: 'TEAM-001', ... },
 *   { slaName: 'SLA 2', teamId: 'TEAM-002', ... }
 * ]);
 * // Returns: { success: true, created: ['SLA-001', 'SLA-002'], errors: [] }
 * 
 * @see createSLA - Called for each SLA in the array
 * @see doPost - Calls this when action='bulkCreate'
 */
function bulkCreateSLAs(slas) {
  const results = [];
  const errors = [];
  
  slas.forEach((sla, index) => {
    const result = createSLA(sla);
    if (result.success) {
      results.push(result.slaId);
    } else {
      errors.push({
        index: index,
        error: result.error
      });
    }
  });
  
  return {
    success: errors.length === 0,
    created: results,
    errors: errors
  };
}

/**
 * Updates multiple SLAs in a single batch operation.
 * Iterates through array of update objects, applying each update individually.
 * Collects successes and errors separately. Returns summary with updated IDs and any failures.
 * Continues processing even if individual updates fail (partial success possible).
 * 
 * @param {Object[]} updates - Array of update objects
 * @param {string} updates[].slaId - ID of the SLA to update
 * @param {Object} updates[].data - Update data object (fields to change)
 * @param {*} updates[].data.* - Any fields from the SLA to update
 * 
 * @returns {Object} Bulk update result
 * @returns {boolean} return.success - true only if ALL updates succeeded
 * @returns {string[]} return.updated - Array of successfully updated SLA IDs
 * @returns {Object[]} return.errors - Array of error objects for failed updates
 * @returns {string} return.errors[].slaId - SLA ID that failed to update
 * @returns {string} return.errors[].error - Error message for that update
 * 
 * @example
 * const result = bulkUpdateSLAs([
 *   { slaId: 'SLA-001', data: { status: 'at-risk' } },
 *   { slaId: 'SLA-002', data: { currentValue: 98 } }
 * ]);
 * // Returns: { success: true, updated: ['SLA-001', 'SLA-002'], errors: [] }
 * 
 * @see updateSLA - Called for each update in the array
 * @see doPost - Calls this when action='bulkUpdate'
 */
function bulkUpdateSLAs(updates) {
  const results = [];
  const errors = [];
  
  updates.forEach(update => {
    const result = updateSLA(update.slaId, update.data);
    if (result.success) {
      results.push(update.slaId);
    } else {
      errors.push({
        slaId: update.slaId,
        error: result.error
      });
    }
  });
  
  return {
    success: errors.length === 0,
    updated: results,
    errors: errors
  };
}