/**
 * Server-Side Data Validation for Google Apps Script
 * 
 * Provides server-side validation functions that work with Google Apps Script backend.
 * Client-side validation is handled in the HTML/JavaScript frontend.
 */

/**
 * Validates a data call form before creation
 * @param {Object} formData - The form data to validate
 * @returns {Object} - {isValid: boolean, errors: Array}
 */
function validateDataCallForm(formData) {
  try {
    const errors = [];
    
    // Required fields validation
    if (!formData.title || formData.title.trim() === '') {
      errors.push('Title is required');
    }
    
    if (!formData.type || formData.type.trim() === '') {
      errors.push('Call type is required');
    }
    
    if (!formData.description || formData.description.trim() === '') {
      errors.push('Description is required');
    }
    
    if (!formData.dueDate) {
      errors.push('Due date is required');
    } else {
      // Validate due date is in the future
      const dueDate = new Date(formData.dueDate);
      const now = new Date();
      if (dueDate <= now) {
        errors.push('Due date must be in the future');
      }
    }
    
    if (!formData.priority) {
      errors.push('Priority is required');
    }
    
    if (!formData.frequency) {
      errors.push('Frequency is required');
    }
    
    // Type-specific validation
    if (formData.type === 'enrichment') {
      if (!formData.columnsToComplete || formData.columnsToComplete.trim() === '') {
        errors.push('Columns to complete are required for enrichment calls');
      }
    }
    
    if (formData.type === 'collection') {
      if (!formData.matchingCriteria || formData.matchingCriteria.trim() === '') {
        errors.push('Matching criteria is required for collection calls');
      }
      if (!formData.requiredFields || formData.requiredFields.trim() === '') {
        errors.push('Required fields are required for collection calls');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
    
  } catch (error) {
    console.error('Error validating data call form:', error);
    return {
      isValid: false,
      errors: ['Validation error: ' + error.message]
    };
  }
}

/**
 * Validates email format (server-side)
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates that a number is positive
 * @param {number} value - Value to validate
 * @returns {boolean} - True if positive number
 */
function validatePositiveNumber(value) {
  return typeof value === 'number' && value > 0;
}

/**
 * Validates that a date is in the future
 * @param {Date|string} dateValue - Date to validate
 * @returns {boolean} - True if date is in the future
 */
function validateFutureDate(dateValue) {
  try {
    const date = new Date(dateValue);
    const now = new Date();
    return date > now;
  } catch (error) {
    return false;
  }
}

/**
 * Validates a value against a specific data type
 * @param {string} value - The value to validate
 * @param {string} dataType - The expected data type
 * @return {Object} - {isValid: boolean, error?: string, validatedValue?: any}
 */
function validateDataType(value, dataType) {
  if (!value || value.toString().trim() === '') {
    return { isValid: false, error: 'Empty value' };
  }
  
  const trimmedValue = value.toString().trim();
  
  switch (dataType) {
    case 'number':
      const num = parseFloat(trimmedValue);
      if (isNaN(num)) {
        return { isValid: false, error: '"' + trimmedValue + '" is not a valid number' };
      }
      return { isValid: true, validatedValue: num };
      
    case 'currency':
      // Remove currency symbols and validate as number
      const cleanedCurrency = trimmedValue.replace(/[$,\s]/g, '');
      const currencyNum = parseFloat(cleanedCurrency);
      if (isNaN(currencyNum)) {
        return { isValid: false, error: '"' + trimmedValue + '" is not a valid currency amount' };
      }
      return { isValid: true, validatedValue: currencyNum };
      
    case 'percentage':
      // Remove % symbol and validate as number
      const cleanedPercent = trimmedValue.replace(/%/g, '');
      const percentNum = parseFloat(cleanedPercent);
      if (isNaN(percentNum) || percentNum < 0 || percentNum > 100) {
        return { isValid: false, error: '"' + trimmedValue + '" is not a valid percentage (0-100)' };
      }
      return { isValid: true, validatedValue: percentNum };
      
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedValue)) {
        return { isValid: false, error: '"' + trimmedValue + '" is not a valid email address' };
      }
      return { isValid: true, validatedValue: trimmedValue };
      
    case 'date':
      const dateObj = new Date(trimmedValue);
      if (isNaN(dateObj.getTime())) {
        return { isValid: false, error: '"' + trimmedValue + '" is not a valid date' };
      }
      return { isValid: true, validatedValue: trimmedValue };
      
    case 'phone':
      // Basic phone validation - digits and common separators
      const phoneRegex = /^[\d\s\-\(\)\+\.]+$/;
      if (!phoneRegex.test(trimmedValue) || trimmedValue.replace(/\D/g, '').length < 10) {
        return { isValid: false, error: '"' + trimmedValue + '" is not a valid phone number' };
      }
      return { isValid: true, validatedValue: trimmedValue };
      
    case 'url':
      // Basic URL validation for Google Apps Script
      if (!trimmedValue.match(/^https?:\/\/.+/)) {
        return { isValid: false, error: '"' + trimmedValue + '" is not a valid URL' };
      }
      return { isValid: true, validatedValue: trimmedValue };
      
    case 'boolean':
      const booleanValue = trimmedValue.toLowerCase();
      const validBooleans = ['true', 'false', 'yes', 'no', '1', '0', 'y', 'n'];
      if (validBooleans.indexOf(booleanValue) === -1) {
        return { isValid: false, error: '"' + trimmedValue + '" is not a valid yes/no value (use: yes/no, true/false, 1/0, y/n)' };
      }
      return { isValid: true, validatedValue: ['true', 'yes', '1', 'y'].indexOf(booleanValue) !== -1 };
      
    case 'text':
    default:
      return { isValid: true, validatedValue: trimmedValue };
  }
}

/**
 * Validates CSV data against a specific data type
 * @param {string} csvData - The CSV data to validate
 * @param {string} dataType - The expected data type
 * @return {Object} - {success: boolean, data?: any, error?: string}
 */
function validateCSVData(csvData, dataType) {
  try {
    const lines = csvData.split('\n')
      .map(function(line) { return line.trim(); })
      .filter(function(line) { return line.length > 0; });
    
    if (lines.length === 0) {
      return { success: false, error: 'File is empty' };
    }
    
    const errors = [];
    const validatedData = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Split by comma, handling quoted values
      const values = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
      
      for (let j = 0; j < values.length; j++) {
        const value = values[j];
        // Remove quotes if present
        const cleanValue = value.replace(/^"(.*)"$/, '$1');
        const validation = validateDataType(cleanValue, dataType);
        
        if (!validation.isValid) {
          errors.push('Row ' + (i + 1) + ', Column ' + (j + 1) + ': ' + validation.error);
        } else {
          validatedData.push(validation.validatedValue);
        }
      }
    }
    
    if (errors.length > 0) {
      // Show only first 5 errors to avoid overwhelming the user
      const errorMessage = 'File validation failed:\n' + 
        errors.slice(0, 5).join('\n') + 
        (errors.length > 5 ? '\n... and ' + (errors.length - 5) + ' more errors' : '');
      return { success: false, error: errorMessage };
    } else {
      return {
        success: true,
        data: {
          totalItems: validatedData.length,
          validatedData: validatedData
        }
      };
    }
  } catch (error) {
    return { success: false, error: 'Error processing file data: ' + error.message };
  }
}

/**
 * Validates Google Sheets URL format
 * @param {string} url - The URL to validate
 * @return {boolean} - True if URL appears to be a valid Google Sheets URL
 */
function validateSheetsUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  const trimmedUrl = url.trim();
  return trimmedUrl.length > 0 && (
    trimmedUrl.indexOf('docs.google.com/spreadsheets') !== -1 ||
    trimmedUrl.indexOf('drive.google.com/file') !== -1
  );
}

/**
 * Checks if two data types are compatible
 * @param {string} sourceType - The source data type
 * @param {string} targetType - The target data type
 * @return {boolean} - True if types are compatible
 */
function areDataTypesCompatible(sourceType, targetType) {
  if (sourceType === targetType) return true;
  
  // Define compatible type groups
  const numericTypes = ['number', 'currency', 'percentage'];
  const textTypes = ['text', 'email', 'url'];
  
  return (numericTypes.indexOf(sourceType) !== -1 && numericTypes.indexOf(targetType) !== -1) ||
         (textTypes.indexOf(sourceType) !== -1 && textTypes.indexOf(targetType) !== -1);
}

/**
 * Validates that a validation list is compatible with a column data type
 * @param {Object} validationList - The validation list object
 * @param {string} columnDataType - The column's data type
 * @return {Object} - {isValid: boolean, error?: string}
 */
function validateListCompatibility(validationList, columnDataType) {
  if (!validationList || !validationList.dataType) {
    return { isValid: false, error: 'Invalid validation list' };
  }
  
  if (!areDataTypesCompatible(validationList.dataType, columnDataType)) {
    return { 
      isValid: false, 
      error: 'Data type mismatch: List contains ' + validationList.dataType + 
             ' values, but column expects ' + columnDataType + ' values' 
    };
  }
  
  return { isValid: true };
}

/**
 * Validates form data for data call creation
 * @param {Object} formData - The form data to validate
 * @return {Object} - {isValid: boolean, errors: Array}
 */
function validateDataCallForm(formData) {
  const errors = [];
  
  if (!formData.title || formData.title.trim() === '') {
    errors.push('Title is required');
  }
  
  if (!formData.type || formData.type === '') {
    errors.push('Call type is required');
  }
  
  if (!formData.description || formData.description.trim() === '') {
    errors.push('Description is required');
  }
  
  if (!formData.priority || formData.priority === '') {
    errors.push('Priority is required');
  }
  
  if (!formData.frequency || formData.frequency === '') {
    errors.push('Frequency is required');
  }
  
  // Type-specific validation
  if (formData.type === 'enrichment') {
    if (!formData.columnsToComplete || formData.columnsToComplete.trim() === '') {
      errors.push('Columns to complete is required for enrichment calls');
    }
  }
  
  if (formData.type === 'collection') {
    if (!formData.matchingCriteria || formData.matchingCriteria.trim() === '') {
      errors.push('Matching criteria is required for collection calls');
    }
    if (!formData.requiredFields || formData.requiredFields.trim() === '') {
      errors.push('Required fields is required for collection calls');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * Validates email addresses
 * @param {string} email - The email address to validate
 * @return {boolean} - True if email is valid
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates that a value is a positive number
 * @param {*} value - The value to validate
 * @return {boolean} - True if value is a positive number
 */
function validatePositiveNumber(value) {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
}

/**
 * Validates that a date is in the future
 * @param {*} dateValue - The date value to validate
 * @return {boolean} - True if date is in the future
 */
function validateFutureDate(dateValue) {
  const date = new Date(dateValue);
  const now = new Date();
  return !isNaN(date.getTime()) && date > now;
}