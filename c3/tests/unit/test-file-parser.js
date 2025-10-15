/**
 * Comprehensive Test Suite for File Parser Module
 * Uses Node.js built-in assert module - no external dependencies required
 * 
 * Run with: node test-file-parser.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock browser environment for Node.js testing
global.window = {};
global.document = {};
global.FileReader = class FileReader {
    constructor() {
        this.result = null;
        this.onload = null;
        this.onerror = null;
    }
    
    readAsText(file) {
        setTimeout(() => {
            this.result = file.content;
            if (this.onload) this.onload({ target: this });
        }, 0);
    }
    
    readAsArrayBuffer(file) {
        setTimeout(() => {
            this.result = Buffer.from(file.content);
            if (this.onload) this.onload({ target: this });
        }, 0);
    }
};

// Mock XLSX library for Excel testing
global.XLSX = {
    read: function(data, options) {
        // Simple mock that returns test data
        return {
            SheetNames: ['Sheet1'],
            Sheets: {
                'Sheet1': {}
            }
        };
    },
    utils: {
        sheet_to_json: function(worksheet, options) {
            // Return mock Excel data
            return [
                ['Name', 'Email', 'Age', 'Salary'],
                ['John Doe', 'john@example.com', '30', '$50,000'],
                ['Jane Smith', 'jane@example.com', '25', '$45,000']
            ];
        }
    }
};

// Load the file parser module
const fileParserCode = fs.readFileSync(path.join(__dirname, 'file-parser.js'), 'utf8');

// Create a clean module environment
const moduleExports = { exports: {} };
const moduleScope = {
    module: moduleExports,
    exports: moduleExports.exports,
    window: global.window,
    global: global
};

// Evaluate the file parser code in our context
const vm = require('vm');
vm.runInNewContext(fileParserCode, moduleScope);

// Extract the exports if they exist, otherwise use global objects
const FileParser = moduleScope.module.exports.FileParser || moduleScope.FileParser || global.FileParser;
const generateJsonFieldName = moduleScope.module.exports.generateJsonFieldName || moduleScope.generateJsonFieldName || global.generateJsonFieldName;

// Test Results Tracking
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;
const failedTests = [];

function runTest(testName, testFunction) {
    testsRun++;
    try {
        testFunction();
        testsPassed++;
        console.log(`✅ ${testName}`);
    } catch (error) {
        testsFailed++;
        failedTests.push({ name: testName, error: error.message });
        console.log(`❌ ${testName}: ${error.message}`);
    }
}

function createMockFile(name, content, type = 'text/csv') {
    return {
        name: name,
        content: content,
        type: type,
        size: content.length
    };
}

console.log('🧪 Starting File Parser Test Suite\n');

// ==================== UTILITY FUNCTION TESTS ====================

runTest('generateJsonFieldName - Basic conversion', () => {
    assert.strictEqual(generateJsonFieldName('Customer Name'), 'customerName');
    assert.strictEqual(generateJsonFieldName('Email Address'), 'emailAddress');
    assert.strictEqual(generateJsonFieldName('phone_number'), 'phoneNumber');
    assert.strictEqual(generateJsonFieldName('First-Name'), 'firstName');
});

runTest('generateJsonFieldName - Special characters', () => {
    assert.strictEqual(generateJsonFieldName('Customer ID#'), 'customerId');
    assert.strictEqual(generateJsonFieldName('Email (Primary)'), 'emailPrimary');
    assert.strictEqual(generateJsonFieldName('Age & Income'), 'ageIncome');
});

runTest('generateJsonFieldName - Edge cases', () => {
    assert.strictEqual(generateJsonFieldName(''), '');
    assert.strictEqual(generateJsonFieldName(null), '');
    assert.strictEqual(generateJsonFieldName(undefined), '');
    assert.strictEqual(generateJsonFieldName('A'), 'a');
    assert.strictEqual(generateJsonFieldName('123'), '123');
});

runTest('generateJsonFieldName - CamelCase preservation', () => {
    assert.strictEqual(generateJsonFieldName('customerID'), 'customerId');
    assert.strictEqual(generateJsonFieldName('XMLHttpRequest'), 'xmlHttpRequest');
});

// ==================== CSV PARSING TESTS ====================

runTest('parseCSVLine - Simple comma-separated values', () => {
    const result = FileParser.parseCSVLine('John,Doe,30,Manager');
    assert.deepStrictEqual(result, ['John', 'Doe', '30', 'Manager']);
});

runTest('parseCSVLine - Quoted fields with commas', () => {
    const result = FileParser.parseCSVLine('"Smith, John",Engineer,"San Francisco, CA",50000');
    assert.deepStrictEqual(result, ['Smith, John', 'Engineer', 'San Francisco, CA', '50000']);
});

runTest('parseCSVLine - Escaped quotes', () => {
    const result = FileParser.parseCSVLine('"He said ""Hello""",World');
    assert.deepStrictEqual(result, ['He said "Hello"', 'World']);
});

runTest('parseCSVLine - Mixed quoted and unquoted', () => {
    const result = FileParser.parseCSVLine('John,"Doe, Jr",30,"Software Engineer"');
    assert.deepStrictEqual(result, ['John', 'Doe, Jr', '30', 'Software Engineer']);
});

runTest('parseCSVLine - Empty fields', () => {
    const result = FileParser.parseCSVLine('John,,30,');
    assert.deepStrictEqual(result, ['John', '', '30', '']);
});

runTest('parseCSVText - Multi-line CSV', () => {
    const csvText = `Name,Email,Age
John Doe,john@example.com,30
Jane Smith,jane@example.com,25
Bob Johnson,bob@example.com,35`;
    
    const result = FileParser.parseCSVText(csvText);
    assert.strictEqual(result.length, 4);
    assert.deepStrictEqual(result[0], ['Name', 'Email', 'Age']);
    assert.deepStrictEqual(result[1], ['John Doe', 'john@example.com', '30']);
});

runTest('parseCSVText - Handles empty lines', () => {
    const csvText = `Name,Email,Age

John Doe,john@example.com,30

Jane Smith,jane@example.com,25

`;
    
    const result = FileParser.parseCSVText(csvText);
    assert.strictEqual(result.length, 3); // Header + 2 data rows
});

// ==================== DATA TYPE DETECTION TESTS ====================

runTest('analyzeColumnData - Email detection', () => {
    const values = ['john@example.com', 'jane@test.org', 'bob@company.co.uk'];
    const result = FileParser.analyzeColumnData('Email', values);
    assert.strictEqual(result.dataType, 'email');
});

runTest('analyzeColumnData - Phone number detection', () => {
    const values = ['1234567890', '+1234567890', '123-456-7890'];
    const result = FileParser.analyzeColumnData('Phone', values);
    assert.strictEqual(result.dataType, 'phone');
});

runTest('analyzeColumnData - Number detection', () => {
    const values = ['123', '45.67', '-89', '0.001'];
    const result = FileParser.analyzeColumnData('Amount', values);
    assert.strictEqual(result.dataType, 'number');
});

runTest('analyzeColumnData - Currency detection', () => {
    const values = ['$1,234.56', '$999.99', '$10,000.00'];
    const result = FileParser.analyzeColumnData('Salary', values);
    assert.strictEqual(result.dataType, 'currency');
});

runTest('analyzeColumnData - URL detection', () => {
    const values = ['https://example.com', 'http://test.org', 'https://company.co.uk/page'];
    const result = FileParser.analyzeColumnData('Website', values);
    assert.strictEqual(result.dataType, 'url');
});

runTest('analyzeColumnData - Date detection', () => {
    const values = ['2023-01-15', '12/25/2023', '01-30-2024'];
    const result = FileParser.analyzeColumnData('Date', values);
    assert.strictEqual(result.dataType, 'date');
});

runTest('analyzeColumnData - Percentage detection', () => {
    const values = ['85%', '90.5%', '100%'];
    const result = FileParser.analyzeColumnData('Score', values);
    assert.strictEqual(result.dataType, 'percentage');
});

runTest('analyzeColumnData - Mixed data defaults to text', () => {
    const values = ['John', '123', 'test@email.com', 'random text'];
    const result = FileParser.analyzeColumnData('Mixed', values);
    assert.strictEqual(result.dataType, 'text');
});

runTest('analyzeColumnData - Empty values', () => {
    const values = [];
    const result = FileParser.analyzeColumnData('Empty', values);
    assert.strictEqual(result.dataType, 'text');
});

runTest('analyzeColumnData - Threshold testing', () => {
    // Mix emails with non-emails - should still detect as email if majority are emails
    const values = ['john@test.com', 'jane@test.com', 'bob@test.com', 'invalid', 'also invalid'];
    const result = FileParser.analyzeColumnData('Mixed Email', values);
    assert.strictEqual(result.dataType, 'email'); // 60% are emails, should pass threshold
});

// ==================== COLUMN ANALYSIS TESTS ====================

runTest('analyzeColumns - Basic analysis', () => {
    const rows = [
        ['Name', 'Email', 'Phone'],
        ['John Doe', 'john@example.com', '555-1234'],
        ['Jane Smith', 'jane@example.com', '555-5678']
    ];
    
    const columns = FileParser.analyzeColumns(rows);
    assert.strictEqual(columns.length, 3);
    assert.strictEqual(columns[0].name, 'Name');
    assert.strictEqual(columns[0].dataType, 'text');
    assert.strictEqual(columns[1].name, 'Email');
    assert.strictEqual(columns[1].dataType, 'email');
    assert.strictEqual(columns[2].name, 'Phone');
    assert.strictEqual(columns[2].dataType, 'phone');
});

runTest('analyzeColumns - JSON field name generation', () => {
    const rows = [
        ['Customer Name', 'Email Address', 'Phone Number'],
        ['John Doe', 'john@example.com', '1234567890']
    ];
    
    const columns = FileParser.analyzeColumns(rows);
    assert.strictEqual(columns[0].jsonFieldName, 'customerName');
    assert.strictEqual(columns[1].jsonFieldName, 'emailAddress');
    assert.strictEqual(columns[2].jsonFieldName, 'phoneNumber');
});

runTest('analyzeColumns - Empty headers handling', () => {
    const rows = [
        ['Name', '', 'Age'],
        ['John', 'Data', '30']
    ];
    
    const columns = FileParser.analyzeColumns(rows);
    assert.strictEqual(columns[1].name, 'Column 2');
    assert.strictEqual(columns[1].jsonFieldName, 'column2');
});

runTest('analyzeColumns - Sample values inclusion', () => {
    const rows = [
        ['Name', 'Email'],
        ['John Doe', 'john@example.com'],
        ['Jane Smith', 'jane@example.com']
    ];
    
    const columns = FileParser.analyzeColumns(rows);
    assert(columns[0].sampleValues.includes('John Doe'));
    assert(columns[1].sampleValues.includes('john@example.com'));
});

// ==================== FILE TYPE DETECTION TESTS ====================

runTest('detectFileType - CSV files', () => {
    const csvFile = createMockFile('data.csv', 'test', 'text/csv');
    assert.strictEqual(FileParser.detectFileType(csvFile), 'csv');
});

runTest('detectFileType - Excel files', () => {
    const xlsxFile = createMockFile('data.xlsx', 'test', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    assert.strictEqual(FileParser.detectFileType(xlsxFile), 'excel');
    
    const xlsFile = createMockFile('data.xls', 'test', 'application/vnd.ms-excel');
    assert.strictEqual(FileParser.detectFileType(xlsFile), 'excel');
});

runTest('detectFileType - Extension-based detection', () => {
    const csvFile = createMockFile('data.csv', 'test', 'application/octet-stream');
    assert.strictEqual(FileParser.detectFileType(csvFile), 'csv');
    
    const xlsxFile = createMockFile('data.xlsx', 'test', 'application/octet-stream');
    assert.strictEqual(FileParser.detectFileType(xlsxFile), 'excel');
});

runTest('detectFileType - Unsupported files', () => {
    const txtFile = createMockFile('data.txt', 'test', 'text/plain');
    assert.strictEqual(FileParser.detectFileType(txtFile), null);
    
    const pdfFile = createMockFile('data.pdf', 'test', 'application/pdf');
    assert.strictEqual(FileParser.detectFileType(pdfFile), null);
});

// ==================== INTEGRATION TESTS ====================

runTest('parseCSV - Complete flow', async () => {
    const csvContent = `Name,Email,Age,Salary
John Doe,john@example.com,30,$50000
Jane Smith,jane@example.com,25,$45000`;
    
    const file = createMockFile('test.csv', csvContent);
    
    const result = await FileParser.parseCSV(file);
    assert.strictEqual(result.length, 3);
    assert.deepStrictEqual(result[0], ['Name', 'Email', 'Age', 'Salary']);
    assert.deepStrictEqual(result[1], ['John Doe', 'john@example.com', '30', '$50000']);
});

runTest('parseExcel - Complete flow', async () => {
    const file = createMockFile('test.xlsx', 'mock excel content');
    
    const result = await FileParser.parseExcel(file);
    assert.strictEqual(result.length, 3);
    assert.deepStrictEqual(result[0], ['Name', 'Email', 'Age', 'Salary']);
});

runTest('parse - Main interface CSV', async () => {
    const csvContent = `Name,Email
John,john@test.com
Jane,jane@test.com`;
    
    const file = createMockFile('test.csv', csvContent);
    
    const result = await FileParser.parse(file);
    assert.strictEqual(result.type, 'csv');
    assert.strictEqual(result.fileName, 'test.csv');
    assert(Array.isArray(result.data));
    assert(Array.isArray(result.columns));
    assert.strictEqual(result.columns.length, 2);
});

runTest('parse - Main interface Excel', async () => {
    const file = createMockFile('test.xlsx', 'mock content', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    const result = await FileParser.parse(file);
    assert.strictEqual(result.type, 'excel');
    assert.strictEqual(result.fileName, 'test.xlsx');
    assert(Array.isArray(result.data));
    assert(Array.isArray(result.columns));
});

// ==================== ERROR HANDLING TESTS ====================

runTest('parse - Unsupported file type', async () => {
    const file = createMockFile('test.txt', 'content', 'text/plain');
    
    try {
        await FileParser.parse(file);
        assert.fail('Should have thrown an error');
    } catch (error) {
        assert(error.message.includes('Unsupported file type'));
    }
});

runTest('parseCSVLine - Malformed quotes handling', () => {
    // Test with unclosed quotes - should handle gracefully
    const result = FileParser.parseCSVLine('"Unclosed quote,Another field');
    assert(Array.isArray(result));
    assert(result.length > 0);
});

runTest('analyzeColumnData - Null safety', () => {
    const result = FileParser.analyzeColumnData('Test', null);
    assert.strictEqual(result.dataType, 'text');
    assert(Array.isArray(result.sampleValues));
});

// ==================== PERFORMANCE TESTS ====================

runTest('Performance - Large CSV parsing', () => {
    // Generate large CSV content
    const headers = ['Name', 'Email', 'Age', 'Salary'];
    let csvContent = headers.join(',') + '\n';
    
    for (let i = 0; i < 1000; i++) {
        csvContent += `User${i},user${i}@example.com,${25 + (i % 40)},${40000 + (i * 100)}\n`;
    }
    
    const startTime = Date.now();
    const result = FileParser.parseCSVText(csvContent);
    const endTime = Date.now();
    
    assert.strictEqual(result.length, 1001); // Header + 1000 rows
    assert(endTime - startTime < 1000, `Parsing took too long: ${endTime - startTime}ms`);
});

runTest('Performance - Data type analysis on large dataset', () => {
    // Generate large array of emails
    const emails = [];
    for (let i = 0; i < 1000; i++) {
        emails.push(`user${i}@example.com`);
    }
    
    const startTime = Date.now();
    const result = FileParser.analyzeColumnData('Email', emails);
    const endTime = Date.now();
    
    assert.strictEqual(result.dataType, 'email');
    assert(endTime - startTime < 500, `Analysis took too long: ${endTime - startTime}ms`);
});

// ==================== EDGE CASES ====================

runTest('Edge case - Single column CSV', () => {
    const result = FileParser.parseCSVText('Name\nJohn\nJane');
    assert.strictEqual(result.length, 3);
    assert.deepStrictEqual(result[0], ['Name']);
    assert.deepStrictEqual(result[1], ['John']);
});

runTest('Edge case - CSV with only headers', () => {
    const result = FileParser.parseCSVText('Name,Email,Age');
    assert.strictEqual(result.length, 1);
    assert.deepStrictEqual(result[0], ['Name', 'Email', 'Age']);
});

runTest('Edge case - Empty CSV', () => {
    const result = FileParser.parseCSVText('');
    assert.strictEqual(result.length, 0);
});

runTest('Edge case - CSV with special characters', () => {
    const csvText = 'Name,Description\n"John",\"Special chars: !@#$%^&*()\"';
    const result = FileParser.parseCSVText(csvText);
    assert.strictEqual(result.length, 2);
    assert(result[1][1].includes('Special chars'));
});

runTest('Edge case - analyzeColumns with no data', () => {
    const columns = FileParser.analyzeColumns([]);
    assert.strictEqual(columns.length, 0);
});

runTest('Edge case - analyzeColumns with empty headers', () => {
    const columns = FileParser.analyzeColumns([[]]);
    assert.strictEqual(columns.length, 0);
});

// ==================== TEST RESULTS ====================

console.log('\n📊 Test Results Summary:');
console.log(`Total Tests: ${testsRun}`);
console.log(`Passed: ${testsPassed} ✅`);
console.log(`Failed: ${testsFailed} ❌`);

if (testsFailed > 0) {
    console.log('\n❌ Failed Tests:');
    failedTests.forEach(test => {
        console.log(`  - ${test.name}: ${test.error}`);
    });
} else {
    console.log('\n🎉 All tests passed!');
}

console.log(`\nSuccess Rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);

// Exit with appropriate code
process.exit(testsFailed > 0 ? 1 : 0);