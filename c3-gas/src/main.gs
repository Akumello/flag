/**
 * Main Google Apps Script Application
 * Server-side logic for the Data Call Manager
 * 
 * This file contains the core business logic that would run on the server side
 * in Google Apps Script, handling data management, calculations, and API endpoints.
 */

/**
 * Main entry point for the web app
 * @return {HtmlOutput} The main application HTML
 */
function doGet() {
  initializeSampleData();
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Data Call Manager')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Include helper for HTML templates
 * @param {string} filename - The filename to include
 * @return {string} - The file content
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Application state management using Properties Service
 */
var AppState = {
  /**
   * Get all data calls
   * @return {Array} Array of data call objects
   */
  getDataCalls: function() {
    try {
      var data = PropertiesService.getScriptProperties().getProperty('dataCalls');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting data calls:', error);
      return [];
    }
  },

  /**
   * Set data calls
   * @param {Array} dataCalls - Array of data call objects
   */
  setDataCalls: function(dataCalls) {
    try {
      PropertiesService.getScriptProperties().setProperty('dataCalls', JSON.stringify(dataCalls));
    } catch (error) {
      console.error('Error setting data calls:', error);
      throw error;
    }
  },

  /**
   * Get notifications
   * @return {Array} Array of notification objects
   */
  getNotifications: function() {
    try {
      var data = PropertiesService.getScriptProperties().getProperty('notifications');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  },

  /**
   * Set notifications
   * @param {Array} notifications - Array of notification objects
   */
  setNotifications: function(notifications) {
    try {
      PropertiesService.getScriptProperties().setProperty('notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error setting notifications:', error);
      throw error;
    }
  },

  /**
   * Get responses
   * @return {Array} Array of response objects
   */
  getResponses: function() {
    try {
      var data = PropertiesService.getScriptProperties().getProperty('responses');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting responses:', error);
      return [];
    }
  },

  /**
   * Set responses
   * @param {Array} responses - Array of response objects
   */
  setResponses: function(responses) {
    try {
      PropertiesService.getScriptProperties().setProperty('responses', JSON.stringify(responses));
    } catch (error) {
      console.error('Error setting responses:', error);
      throw error;
    }
  }
};

/**
 * Data Call Management Functions
 */

/**
 * Creates a new data call
 * @param {Object} callData - The data call information
 * @return {Object} Result with success status and call ID
 */
function createDataCall(callData) {
  try {
    var dataCalls = AppState.getDataCalls();
    
    var newCall = {
      id: Utilities.getUuid(),
      title: callData.title,
      type: callData.type,
      description: callData.description,
      dueDate: callData.dueDate,
      priority: callData.priority,
      frequency: callData.frequency,
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: Session.getActiveUser().getEmail(),
      responses: 0,
      totalRequired: callData.totalRequired || 10,
      columnDefinitions: callData.columnDefinitions || [],
      matchingCriteria: callData.matchingCriteria || '',
      requiredFields: callData.requiredFields || ''
    };
    
    // Process calculated columns if present
    if (newCall.columnDefinitions && newCall.columnDefinitions.length > 0) {
      newCall.columnDefinitions = processCalculatedColumns(newCall.columnDefinitions);
    }
    
    dataCalls.push(newCall);
    AppState.setDataCalls(dataCalls);
    
    // Create notification for the new call
    createNotificationForCall(newCall);
    
    return { success: true, id: newCall.id };
  } catch (error) {
    console.error('Error creating data call:', error);
    throw new Error('Failed to create data call: ' + error.message);
  }
}

/**
 * Process calculated columns and their conditional logic
 * @param {Array} columnDefinitions - Array of column definition objects
 * @return {Array} Processed column definitions
 */
function processCalculatedColumns(columnDefinitions) {
  return columnDefinitions.map(function(column) {
    if (column.purpose === 'calculated') {
      // Validate conditional rules if present
      if (column.calculationType === 'conditional' && column.conditionalRules) {
        column.conditionalRules = validateConditionalRules(column.conditionalRules);
      }
      
      // Validate formulas if present
      if (column.calculationType === 'formula' && column.formula) {
        column.formula = validateFormula(column.formula);
      }
      
      // Process lookup tables if present
      if (column.calculationType === 'lookup' && column.lookupTable) {
        column.lookupTable = processLookupTable(column.lookupTable);
      }
    }
    
    return column;
  });
}

/**
 * Validate conditional rules for calculated columns
 * @param {Array} rules - Array of conditional rule objects
 * @return {Array} Validated rules
 */
function validateConditionalRules(rules) {
  return rules.filter(function(rule) {
    return rule.sourceColumn && 
           rule.operator && 
           rule.value !== undefined && 
           rule.result !== undefined;
  }).map(function(rule) {
    return {
      sourceColumn: rule.sourceColumn,
      operator: rule.operator,
      value: rule.value,
      result: rule.result,
      isValid: true
    };
  });
}

/**
 * Validate formula syntax (basic validation)
 * @param {string} formula - The formula to validate
 * @return {string} Validated formula
 */
function validateFormula(formula) {
  // Basic formula validation - ensure it doesn't contain dangerous functions
  var dangerousFunctions = ['eval', 'Function', 'setTimeout', 'setInterval'];
  var formulaUpper = formula.toUpperCase();
  
  for (var i = 0; i < dangerousFunctions.length; i++) {
    if (formulaUpper.indexOf(dangerousFunctions[i].toUpperCase()) !== -1) {
      throw new Error('Formula contains restricted function: ' + dangerousFunctions[i]);
    }
  }
  
  return formula;
}

/**
 * Process lookup table data
 * @param {string} lookupTable - The lookup table data
 * @return {Object} Processed lookup table
 */
function processLookupTable(lookupTable) {
  try {
    // If it's already an object, return it
    if (typeof lookupTable === 'object') {
      return lookupTable;
    }
    
    // Try to parse as JSON
    return JSON.parse(lookupTable);
  } catch (error) {
    // If parsing fails, treat as CSV data
    return parseLookupTableCSV(lookupTable);
  }
}

/**
 * Parse CSV lookup table data
 * @param {string} csvData - CSV data for lookup table
 * @return {Object} Parsed lookup table
 */
function parseLookupTableCSV(csvData) {
  var lines = csvData.split('\n').filter(function(line) {
    return line.trim().length > 0;
  });
  
  if (lines.length < 2) {
    throw new Error('Lookup table must have at least header and one data row');
  }
  
  var headers = lines[0].split(',').map(function(h) { return h.trim(); });
  var data = {};
  
  for (var i = 1; i < lines.length; i++) {
    var values = lines[i].split(',').map(function(v) { return v.trim(); });
    if (values.length >= 2) {
      data[values[0]] = values[1];
    }
  }
  
  return {
    type: 'csv',
    headers: headers,
    data: data
  };
}

/**
 * Execute calculated column logic
 * @param {Object} column - Column definition with calculation rules
 * @param {Object} rowData - Row data to apply calculations to
 * @return {*} Calculated value
 */
function executeCalculatedColumn(column, rowData) {
  if (column.purpose !== 'calculated') {
    return null;
  }
  
  switch (column.calculationType) {
    case 'conditional':
      return executeConditionalLogic(column.conditionalRules, rowData);
    case 'formula':
      return executeFormula(column.formula, rowData);
    case 'lookup':
      return executeLookup(column.lookupTable, column.lookupSource, rowData);
    case 'static':
      return column.staticValue;
    default:
      return null;
  }
}

/**
 * Execute conditional logic rules
 * @param {Array} rules - Array of conditional rules
 * @param {Object} rowData - Row data to evaluate
 * @return {*} Result value from first matching rule
 */
function executeConditionalLogic(rules, rowData) {
  for (var i = 0; i < rules.length; i++) {
    var rule = rules[i];
    var sourceValue = rowData[rule.sourceColumn];
    var conditionValue = rule.value;
    var match = false;
    
    switch (rule.operator) {
      case '>':
        match = parseFloat(sourceValue) > parseFloat(conditionValue);
        break;
      case '<':
        match = parseFloat(sourceValue) < parseFloat(conditionValue);
        break;
      case '=':
        match = sourceValue == conditionValue;
        break;
      case '!=':
        match = sourceValue != conditionValue;
        break;
      case '>=':
        match = parseFloat(sourceValue) >= parseFloat(conditionValue);
        break;
      case '<=':
        match = parseFloat(sourceValue) <= parseFloat(conditionValue);
        break;
      case 'contains':
        match = sourceValue && sourceValue.toString().toLowerCase().indexOf(conditionValue.toLowerCase()) !== -1;
        break;
      case 'starts':
        match = sourceValue && sourceValue.toString().toLowerCase().indexOf(conditionValue.toLowerCase()) === 0;
        break;
    }
    
    if (match) {
      return rule.result;
    }
  }
  
  return null; // No rules matched
}

/**
 * Execute basic formula calculations
 * @param {string} formula - The formula to execute
 * @param {Object} rowData - Row data for variable substitution
 * @return {*} Formula result
 */
function executeFormula(formula, rowData) {
  try {
    // Simple variable substitution (replace {columnName} with actual values)
    var processedFormula = formula;
    
    for (var columnName in rowData) {
      var value = rowData[columnName];
      var placeholder = '{' + columnName + '}';
      
      // Replace all occurrences of the placeholder
      while (processedFormula.indexOf(placeholder) !== -1) {
        processedFormula = processedFormula.replace(placeholder, value);
      }
    }
    
    // Basic arithmetic evaluation (very limited for security)
    return evaluateBasicArithmetic(processedFormula);
  } catch (error) {
    console.error('Formula execution error:', error);
    return null;
  }
}

/**
 * Execute lookup table queries
 * @param {Object} lookupTable - The lookup table data
 * @param {string} sourceColumn - Column to use for lookup
 * @param {Object} rowData - Row data
 * @return {*} Lookup result
 */
function executeLookup(lookupTable, sourceColumn, rowData) {
  var lookupValue = rowData[sourceColumn];
  
  if (lookupTable && lookupTable.data && lookupValue) {
    return lookupTable.data[lookupValue] || null;
  }
  
  return null;
}

/**
 * Basic arithmetic evaluation (security-limited)
 * @param {string} expression - Mathematical expression
 * @return {number} Result
 */
function evaluateBasicArithmetic(expression) {
  // Only allow numbers, basic operators, and parentheses
  if (!/^[\d\+\-\*\/\(\)\.\s]+$/.test(expression)) {
    throw new Error('Invalid characters in formula');
  }
  
  try {
    // Use JavaScript's eval in a controlled way (only for basic math)
    return eval(expression);
  } catch (error) {
    throw new Error('Formula evaluation failed: ' + error.message);
  }
}

/**
 * Create notification for a new data call
 * @param {Object} call - The data call object
 */
function createNotificationForCall(call) {
  try {
    var notifications = AppState.getNotifications();
    
    var notification = {
      id: Utilities.getUuid(),
      callId: call.id,
      title: 'New Data Call: ' + call.title,
      message: call.description,
      type: 'new_call',
      priority: call.priority,
      createdAt: new Date().toISOString(),
      read: false
    };
    
    notifications.push(notification);
    AppState.setNotifications(notifications);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

/**
 * Save a response to a data call
 * @param {Object} responseData - The response data
 * @return {Object} Result with success status
 */
function saveDataCallResponse(responseData) {
  try {
    var responses = AppState.getResponses();
    
    var newResponse = {
      id: Utilities.getUuid(),
      callId: responseData.callId,
      submittedBy: Session.getActiveUser().getEmail(),
      submittedAt: new Date().toISOString(),
      data: responseData.data,
      notes: responseData.notes || ''
    };
    
    responses.push(newResponse);
    AppState.setResponses(responses);
    
    // Update response count in data call
    updateDataCallResponseCount(responseData.callId);
    
    return { success: true, id: newResponse.id };
  } catch (error) {
    console.error('Error saving response:', error);
    throw new Error('Failed to save response: ' + error.message);
  }
}

/**
 * Update response count for a data call
 * @param {string} callId - The data call ID
 */
function updateDataCallResponseCount(callId) {
  try {
    var dataCalls = AppState.getDataCalls();
    var responses = AppState.getResponses();
    
    var callIndex = -1;
    for (var i = 0; i < dataCalls.length; i++) {
      if (dataCalls[i].id === callId) {
        callIndex = i;
        break;
      }
    }
    
    if (callIndex !== -1) {
      var responseCount = 0;
      for (var j = 0; j < responses.length; j++) {
        if (responses[j].callId === callId) {
          responseCount++;
        }
      }
      
      dataCalls[callIndex].responses = responseCount;
      AppState.setDataCalls(dataCalls);
    }
  } catch (error) {
    console.error('Error updating response count:', error);
  }
}

/**
 * Get dashboard statistics
 * @return {Object} Dashboard statistics
 */
function getDashboardStatistics() {
  try {
    var dataCalls = AppState.getDataCalls();
    var responses = AppState.getResponses();
    var now = new Date();
    
    var stats = {
      activeCalls: 0,
      completedCalls: 0,
      overdueCalls: 0,
      pendingResponses: 0
    };
    
    for (var i = 0; i < dataCalls.length; i++) {
      var call = dataCalls[i];
      
      if (call.status === 'active') {
        stats.activeCalls++;
        
        // Check if overdue
        if (call.dueDate && new Date(call.dueDate) < now) {
          stats.overdueCalls++;
        }
        
        // Calculate pending responses
        var required = call.totalRequired || 0;
        var responseCount = call.responses || 0;
        stats.pendingResponses += Math.max(0, required - responseCount);
      } else if (call.status === 'completed') {
        stats.completedCalls++;
      }
    }
    
    return stats;
  } catch (error) {
    console.error('Error calculating dashboard stats:', error);
    return { activeCalls: 0, completedCalls: 0, overdueCalls: 0, pendingResponses: 0 };
  }
}

/**
 * Get recent activity for dashboard
 * @return {Array} Array of recent activity items
 */
function getRecentActivity() {
  try {
    var dataCalls = AppState.getDataCalls();
    var responses = AppState.getResponses();
    var notifications = AppState.getNotifications();
    
    var activities = [];
    
    // Add recent data calls
    dataCalls.slice(-5).forEach(function(call) {
      activities.push({
        type: 'call_created',
        title: 'New data call created',
        description: call.title,
        timestamp: call.createdAt,
        priority: call.priority
      });
    });
    
    // Add recent responses
    responses.slice(-5).forEach(function(response) {
      activities.push({
        type: 'response_submitted',
        title: 'Response submitted',
        description: 'Response to data call',
        timestamp: response.submittedAt,
        priority: 'medium'
      });
    });
    
    // Sort by timestamp (newest first) and return top 10
    activities.sort(function(a, b) {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    return activities.slice(0, 10);
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return [];
  }
}