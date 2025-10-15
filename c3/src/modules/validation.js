/**
 * Data Validation Utilities Module
 * 
 * Provides comprehensive validation functions for various data types,
 * file validation, Google Sheets URL validation, and list compatibility checking.
 * 
 * Features:
 * - Data type validation (text, number, currency, email, etc.)
 * - CSV/Excel file validation with detailed error reporting
 * - Google Sheets URL validation
 * - Validation list compatibility checking
 * - Error handling and user feedback
 */

// Validation utilities object
const ValidationUtils = {
    /**
     * Validates a value against a specific data type
     * @param {string} value - The value to validate
     * @param {string} dataType - The expected data type
     * @returns {Object} - {isValid: boolean, error?: string, validatedValue?: any}
     */
    validateDataType(value, dataType) {
        if (!value || value.trim() === '') {
            return { isValid: false, error: 'Empty value' };
        }
        
        const trimmedValue = value.trim();
        
        switch (dataType) {
            case 'number':
                const num = parseFloat(trimmedValue);
                if (isNaN(num)) {
                    return { isValid: false, error: `"${trimmedValue}" is not a valid number` };
                }
                return { isValid: true, validatedValue: num };
                
            case 'currency':
                // Remove currency symbols and validate as number
                const cleanedCurrency = trimmedValue.replace(/[$,\s]/g, '');
                const currencyNum = parseFloat(cleanedCurrency);
                if (isNaN(currencyNum)) {
                    return { isValid: false, error: `"${trimmedValue}" is not a valid currency amount` };
                }
                return { isValid: true, validatedValue: currencyNum };
                
            case 'percentage':
                // Remove % symbol and validate as number
                const cleanedPercent = trimmedValue.replace(/%/g, '');
                const percentNum = parseFloat(cleanedPercent);
                if (isNaN(percentNum) || percentNum < 0 || percentNum > 100) {
                    return { isValid: false, error: `"${trimmedValue}" is not a valid percentage (0-100)` };
                }
                return { isValid: true, validatedValue: percentNum };
                
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(trimmedValue)) {
                    return { isValid: false, error: `"${trimmedValue}" is not a valid email address` };
                }
                return { isValid: true, validatedValue: trimmedValue };
                
            case 'date':
                const dateObj = new Date(trimmedValue);
                if (isNaN(dateObj.getTime())) {
                    return { isValid: false, error: `"${trimmedValue}" is not a valid date` };
                }
                return { isValid: true, validatedValue: trimmedValue };
                
            case 'phone':
                // Basic phone validation - digits and common separators
                const phoneRegex = /^[\d\s\-\(\)\+\.]+$/;
                if (!phoneRegex.test(trimmedValue) || trimmedValue.replace(/\D/g, '').length < 10) {
                    return { isValid: false, error: `"${trimmedValue}" is not a valid phone number` };
                }
                return { isValid: true, validatedValue: trimmedValue };
                
            case 'url':
                try {
                    new URL(trimmedValue);
                    return { isValid: true, validatedValue: trimmedValue };
                } catch {
                    return { isValid: false, error: `"${trimmedValue}" is not a valid URL` };
                }
                
            case 'boolean':
                const booleanValue = trimmedValue.toLowerCase();
                const validBooleans = ['true', 'false', 'yes', 'no', '1', '0', 'y', 'n'];
                if (!validBooleans.includes(booleanValue)) {
                    return { isValid: false, error: `"${trimmedValue}" is not a valid yes/no value (use: yes/no, true/false, 1/0, y/n)` };
                }
                return { isValid: true, validatedValue: ['true', 'yes', '1', 'y'].includes(booleanValue) };
                
            case 'text':
            default:
                return { isValid: true, validatedValue: trimmedValue };
        }
    },

    /**
     * Validates CSV data against a specific data type
     * @param {string} csvData - The CSV data to validate
     * @param {string} dataType - The expected data type
     * @returns {Promise} - Resolves with validation results or rejects with error
     */
    validateCSVData(csvData, dataType) {
        return new Promise((resolve, reject) => {
            try {
                const lines = csvData.split('\n').map(line => line.trim()).filter(line => line.length > 0);
                
                if (lines.length === 0) {
                    reject(new Error('File is empty'));
                    return;
                }
                
                const errors = [];
                const validatedData = [];
                
                lines.forEach((line, index) => {
                    // Split by comma, but handle quoted values
                    const values = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
                    
                    values.forEach((value, valueIndex) => {
                        // Remove quotes if present
                        const cleanValue = value.replace(/^"(.*)"$/, '$1');
                        const validation = this.validateDataType(cleanValue, dataType);
                        
                        if (!validation.isValid) {
                            errors.push(`Row ${index + 1}, Column ${valueIndex + 1}: ${validation.error}`);
                        } else {
                            validatedData.push(validation.validatedValue);
                        }
                    });
                });
                
                if (errors.length > 0) {
                    // Show only first 5 errors to avoid overwhelming the user
                    const errorMessage = `File validation failed:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... and ${errors.length - 5} more errors` : ''}`;
                    reject(new Error(errorMessage));
                } else {
                    resolve({
                        totalItems: validatedData.length,
                        validatedData: validatedData
                    });
                }
            } catch (error) {
                reject(new Error(`Error processing file data: ${error.message}`));
            }
        });
    },

    /**
     * Validates a CSV or Excel file against a specific data type
     * @param {File} file - The file to validate
     * @param {string} dataType - The expected data type
     * @returns {Promise} - Resolves with validation results or rejects with error
     */
    validateCSVFile(file, dataType) {
        return new Promise((resolve, reject) => {
            const fileName = file.name.toLowerCase();
            
            // Handle Excel files  
            if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                // Use FileParser to parse Excel file directly
                FileParser.parseExcel(file)
                    .then((data) => {
                        // Convert array data to CSV string for validation
                        const csvData = data.map(row => row.join(',')).join('\n');
                        return this.validateCSVData(csvData, dataType);
                    })
                    .then(resolve)
                    .catch(reject);
            } else {
                // Handle CSV files
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    try {
                        const csv = e.target.result;
                        this.validateCSVData(csv, dataType)
                            .then(resolve)
                            .catch(reject);
                    } catch (error) {
                        reject(new Error(`Error parsing CSV file: ${error.message}`));
                    }
                };
                
                reader.onerror = () => {
                    reject(new Error('Error reading CSV file'));
                };
                
                reader.readAsText(file);
            }
        });
    },

    /**
     * Validates Google Sheets URL format
     * @param {string} url - The URL to validate
     * @returns {boolean} - True if URL appears to be a valid Google Sheets URL
     */
    validateSheetsUrl(url) {
        if (!url || typeof url !== 'string') return false;
        
        const trimmedUrl = url.trim();
        return trimmedUrl.length > 0 && (
            trimmedUrl.includes('docs.google.com/spreadsheets') ||
            trimmedUrl.includes('drive.google.com/file')
        );
    },

    /**
     * Shows data type compatibility error in the UI
     * @param {HTMLElement} container - The container element to show error in
     * @param {string} listDataType - The list's data type
     * @param {string} columnDataType - The column's expected data type
     */
    showDataTypeError(container, listDataType, columnDataType) {
        // Remove existing error if present
        this.clearDataTypeError(container);
        
        // Create error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'mt-2 p-2 datatype-error border rounded text-sm';
        errorDiv.id = 'datatype-error';
        errorDiv.innerHTML = `
            <div class="flex items-center">
                <i class="bi bi-exclamation-triangle mr-2" aria-hidden="true"></i>
                <span><strong>Data Type Mismatch:</strong> This list contains <strong>${listDataType}</strong> values, but the column expects <strong>${columnDataType}</strong> values. Please select a compatible list or change the column data type.</span>
            </div>
        `;
        
        container.appendChild(errorDiv);
    },

    /**
     * Clears data type error message from the UI
     * @param {HTMLElement} container - The container element to clear error from
     */
    clearDataTypeError(container) {
        const existingError = container.querySelector('#datatype-error');
        if (existingError) {
            existingError.remove();
        }
    }
};

// List Selection Validation Functions
function validateSingleColumnListSelection(event) {
    const select = event.target;
    const selectedListId = select.value;
    
    if (!selectedListId) return;
    
    // Get current column data type
    const columnDataTypeSelect = document.getElementById('columnDataType');
    const columnDataType = columnDataTypeSelect ? columnDataTypeSelect.value : '';
    
    if (!columnDataType) {
        showErrorMessage('Please select a data type for the column first.');
        select.value = '';
        return;
    }
    
    // Find the selected list
    const availableLists = AppState.getAvailableLists();
    const selectedList = availableLists.find(list => list.listId === selectedListId);
    
    if (!selectedList) return;
    
    // Check data type compatibility
    if (selectedList.dataType !== columnDataType) {
        // Show error message
        const container = select.closest('.space-y-4') || select.parentElement;
        ValidationUtils.showDataTypeError(container, selectedList.dataType, columnDataType);
        select.value = ''; // Clear the selection
    } else {
        // Clear any existing error
        const container = select.closest('.space-y-4') || select.parentElement;
        ValidationUtils.clearDataTypeError(container);
    }
}

function validateListSelection(event) {
    const select = event.target;
    const selectedListId = select.value;
    
    if (!selectedListId) return;
    
    // Find the column index from the select element's container
    const container = select.closest('[id^="validationListSection_"]');
    const index = parseInt(container.id.split('_')[1]);
    const column = modalColumns[index];
    
    // Find the selected list
    const availableLists = AppState.getAvailableLists();
    const selectedList = availableLists.find(list => list.listId === selectedListId);
    
    if (!selectedList) return;
    
    // Check data type compatibility
    if (selectedList.dataType !== column.dataType) {
        // Show error message
        ValidationUtils.showDataTypeError(container, selectedList.dataType, column.dataType);
        select.value = ''; // Clear the selection
    } else {
        // Clear any existing error
        ValidationUtils.clearDataTypeError(container);
    }
}

// Google Sheets URL Validation Functions
function validateSheetsUrl() {
    const input = document.getElementById('sheetsUrlInput');
    const button = document.getElementById('importSheetsBtn');
    
    if (!input || !button) return;
    
    const url = input.value.trim();
    const isValidUrl = ValidationUtils.validateSheetsUrl(url);
    
    button.disabled = !isValidUrl;
}

function updateSheetsUrlButton() {
    validateSheetsUrl();
}

// Backward compatibility: expose main validation function globally
function validateDataType(value, dataType) {
    return ValidationUtils.validateDataType(value, dataType);
}

function validateCSVFile(file, dataType) {
    return ValidationUtils.validateCSVFile(file, dataType);
}

function validateCSVData(csvData, dataType) {
    return ValidationUtils.validateCSVData(csvData, dataType);
}

function showDataTypeError(container, listDataType, columnDataType) {
    return ValidationUtils.showDataTypeError(container, listDataType, columnDataType);
}

function clearDataTypeError(container) {
    return ValidationUtils.clearDataTypeError(container);
}

// Export for ES6 modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ValidationUtils,
        validateSingleColumnListSelection,
        validateListSelection,
        validateSheetsUrl,
        updateSheetsUrlButton,
        validateDataType,
        validateCSVFile,
        validateCSVData,
        showDataTypeError,
        clearDataTypeError
    };
}

// Make available globally for script tag usage
if (typeof window !== 'undefined') {
    window.ValidationUtils = ValidationUtils;
    window.validateSingleColumnListSelection = validateSingleColumnListSelection;
    window.validateListSelection = validateListSelection;
    window.validateSheetsUrl = validateSheetsUrl;
    window.updateSheetsUrlButton = updateSheetsUrlButton;
    window.validateDataType = validateDataType;
    window.validateCSVFile = validateCSVFile;
    window.validateCSVData = validateCSVData;
    window.showDataTypeError = showDataTypeError;
    window.clearDataTypeError = clearDataTypeError;
}