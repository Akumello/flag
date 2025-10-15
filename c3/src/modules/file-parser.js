/**
 * File Parser Module
 * Handles parsing and analysis of CSV and Excel files
 * Dependencies: XLSX library (for Excel files)
 */

// XLSX Library Helper Function
function checkXLSXAvailability() {
    return new Promise((resolve, reject) => {
        // If already loaded, resolve immediately
        if (typeof XLSX !== 'undefined') {
            resolve(true);
            return;
        }
        
        // Wait a bit for the library to load
        let attempts = 0;
        const maxAttempts = 20; // 2 seconds total (100ms * 20)
        
        const checkInterval = setInterval(() => {
            attempts++;
            
            if (typeof XLSX !== 'undefined') {
                clearInterval(checkInterval);
                resolve(true);
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                reject(new Error('Excel parsing library (XLSX) failed to load. Please check your internet connection and refresh the page.'));
            }
        }, 100);
    });
}

// Utility function to convert user-friendly names to JSON-friendly camelCase
function generateJsonFieldName(displayName) {
    if (!displayName || typeof displayName !== 'string') return '';
    
    // Remove special characters except spaces, hyphens, underscores
    let cleaned = displayName.replace(/[^\w\s\-]/g, '');
    
    // Simple approach: split on spaces, hyphens, underscores
    let words = cleaned.split(/[\s\-_]+/);
    
    // For each word, check if it contains camelCase and split it
    let finalWords = [];
    for (let word of words) {
        if (word.length === 0) continue;
        
        // Simple camelCase detection: find transitions from lowercase to uppercase
        let subWords = [];
        let currentWord = '';
        
        for (let i = 0; i < word.length; i++) {
            let char = word[i];
            let prevChar = i > 0 ? word[i - 1] : '';
            
            // If we hit an uppercase letter and the previous was lowercase, start a new word
            if (char.toUpperCase() === char && prevChar.toLowerCase() === prevChar && currentWord.length > 0) {
                subWords.push(currentWord);
                currentWord = char;
            } else {
                currentWord += char;
            }
        }
        
        if (currentWord.length > 0) {
            subWords.push(currentWord);
        }
        
        finalWords.push(...subWords);
    }
    
    // Filter out empty strings and convert to camelCase
    return finalWords
        .filter(word => word.length > 0)
        .map((word, index) => {
            // First word is lowercase, subsequent words are capitalized
            if (index === 0) {
                return word.toLowerCase();
            } else {
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            }
        })
        .join('');
}

// Extensible file parser system
const FileParser = {
    // Registry of file type parsers
    parsers: {
        'csv': {
            extensions: ['.csv'],
            mimeTypes: ['text/csv', 'application/csv'],
            parse: function(file) {
                return FileParser.parseCSV(file);
            }
        },
        'excel': {
            extensions: ['.xlsx', '.xls'],
            mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
            parse: function(file) {
                return FileParser.parseExcel(file);
            }
        }
    },

    // Detect file type based on extension and mime type
    detectFileType: function(file) {
        const fileName = file.name.toLowerCase();
        const mimeType = file.type.toLowerCase();
        
        for (const [type, config] of Object.entries(this.parsers)) {
            const extensionMatch = config.extensions.some(ext => fileName.endsWith(ext));
            const mimeMatch = config.mimeTypes.includes(mimeType);
            
            if (extensionMatch || mimeMatch) {
                return type;
            }
        }
        return null;
    },

    // Main parse function that delegates to specific parsers
    parse: function(file) {
        return new Promise((resolve, reject) => {
            const fileType = this.detectFileType(file);
            
            if (!fileType) {
                reject(new Error(`Unsupported file type: ${file.name}`));
                return;
            }
            
            // Special check for Excel files
            if (fileType === 'excel') {
                // Use async check for XLSX library
                checkXLSXAvailability()
                    .then(() => {
                        const parser = this.parsers[fileType];
                        return parser.parse(file);
                    })
                    .then(data => {
                        resolve({
                            type: fileType,
                            fileName: file.name,
                            data: data,
                            columns: this.analyzeColumns(data)
                        });
                    })
                    .catch(reject);
            } else {
                const parser = this.parsers[fileType];
                parser.parse(file)
                    .then(data => {
                        resolve({
                            type: fileType,
                            fileName: file.name,
                            data: data,
                            columns: this.analyzeColumns(data)
                        });
                    })
                    .catch(reject);
            }
        });
    },

    // CSV parser implementation
    parseCSV: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const text = e.target.result;
                    const rows = FileParser.parseCSVText(text);
                    resolve(rows);
                } catch (error) {
                    reject(new Error(`Failed to parse CSV: ${error.message}`));
                }
            };
            
            reader.onerror = function() {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsText(file);
        });
    },

    // Parse CSV text into rows
    parseCSVText: function(text) {
        const rows = [];
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        
        for (const line of lines) {
            const row = this.parseCSVLine(line);
            if (row.length > 0) {
                rows.push(row);
            }
        }
        
        return rows;
    },

    // Parse a single CSV line (handles quoted fields)
    parseCSVLine: function(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    },

    // Analyze columns from parsed data
    analyzeColumns: function(rows) {
        if (!rows || rows.length === 0) {
            return [];
        }
        
        const headers = rows[0];
        const dataRows = rows.slice(1);
        const columns = [];
        
        headers.forEach((header, index) => {
            const columnData = dataRows.map(row => row[index]).filter(val => val != null && val !== '');
            const analysis = this.analyzeColumnData(header, columnData);
            
            columns.push({
                name: header || `Column ${index + 1}`,
                jsonFieldName: generateJsonFieldName(header || `Column ${index + 1}`),
                dataType: analysis.dataType,
                required: false, // User can decide
                strictDataType: true,
                validationListId: '',
                strictValidation: true,
                helpText: analysis.helpText,
                saved: false,
                sampleValues: analysis.sampleValues
            });
        });
        
        return columns;
    },

    // Analyze individual column data to determine type and characteristics
    analyzeColumnData: function(header, values) {
        if (!values || values.length === 0) {
            return {
                dataType: 'text',
                helpText: '',
                sampleValues: []
            };
        }
        
        const sampleValues = values.slice(0, 5); // Get first 5 non-empty values
        const allValues = values.slice(0, 100); // Analyze first 100 values
        
        // Type detection patterns
        const patterns = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: /^[\+]?[1-9][\d\-\.\(\)\s]{9,}$/,
            url: /^https?:\/\/.+/,
            date: /^\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}$|^\d{1,2}[-\/]\d{1,4}$|^\d{4}$/,
            number: /^-?\d*\.?\d+$/,
            currency: /^\$?\d{1,3}(,\d{3})*(\.\d{2})?$/,
            percentage: /^\d+(\.\d+)?%$/
        };
        
        // Count matches for each pattern
        const typeCounts = {};
        Object.keys(patterns).forEach(type => {
            typeCounts[type] = allValues.filter(val => patterns[type].test(val.toString().trim())).length;
        });
        
        // Determine most likely type
        let detectedType = 'text';
        let maxCount = 0;
        const threshold = Math.max(1, Math.floor(allValues.length * 0.7)); // 70% threshold
        
        Object.entries(typeCounts).forEach(([type, count]) => {
            if (count >= threshold && count > maxCount) {
                detectedType = type;
                maxCount = count;
            }
        });
        
        // Generate helpful text based on detected patterns
        let helpText = '';
        if (sampleValues.length > 0) {
            helpText = `Sample values: ${sampleValues.slice(0, 3).join(', ')}`;
            if (sampleValues.length > 3) {
                helpText += '...';
            }
        }
        
        return {
            dataType: detectedType,
            helpText: helpText,
            sampleValues: sampleValues
        };
    },

    // Parse Excel file to CSV-like data structure
    parseExcel: function(file) {
        return new Promise((resolve, reject) => {
            // Use the helper function to check XLSX availability
            checkXLSXAvailability()
                .then(() => {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        try {
                            const data = new Uint8Array(e.target.result);
                            const workbook = XLSX.read(data, { type: 'array' });
                            
                            // Get the first worksheet
                            const firstSheetName = workbook.SheetNames[0];
                            const worksheet = workbook.Sheets[firstSheetName];
                            
                            // Convert to JSON array
                            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                            
                            // Filter out empty rows
                            const filteredData = jsonData.filter(row => 
                                row && row.length > 0 && row.some(cell => cell !== null && cell !== undefined && cell !== '')
                            );
                            
                            resolve(filteredData);
                        } catch (error) {
                            reject(new Error('Failed to parse Excel file: ' + error.message));
                        }
                    };
                    
                    reader.onerror = function() {
                        reject(new Error('Failed to read Excel file'));
                    };
                    
                    reader.readAsArrayBuffer(file);
                })
                .catch(reject); // Catch the XLSX availability check rejection
        });
    },

    // Display analysis results by updating the global columnDefinitions and refreshing the display
    displayAnalysisResults: function(result) {
        // Handle both direct columns array and result object with columns property
        let columns;
        if (Array.isArray(result)) {
            columns = result;
        } else if (result && result.columns) {
            columns = result.columns;
        } else {
            console.error('Invalid result format for displayAnalysisResults:', result);
            return;
        }

        // Update global columnDefinitions
        if (typeof columnDefinitions !== 'undefined') {
            columnDefinitions.length = 0; // Clear existing
            columnDefinitions.push(...columns); // Add new columns
        }
        
        // Refresh the display if function exists
        if (typeof displayColumnDefinitions === 'function') {
            displayColumnDefinitions();
        }
    }
};

// Export for use (if using modules) or make globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FileParser, checkXLSXAvailability, generateJsonFieldName };
} else {
    // Make available globally for script tag usage
    window.FileParser = FileParser;
    window.checkXLSXAvailability = checkXLSXAvailability;
    window.generateJsonFieldName = generateJsonFieldName;
}