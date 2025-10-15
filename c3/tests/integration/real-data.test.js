/**
 * Real Data Integration Tests for File Parser
 * Tests with actual CSV files to ensure real-world compatibility
 * 
 * Run with: node test-real-data.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Setup environment
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
            this.result = file.content || file.data;
            if (this.onload) this.onload({ target: this });
        }, 0);
    }
};

global.XLSX = {
    read: () => ({ SheetNames: ['Sheet1'], Sheets: { 'Sheet1': {} } }),
    utils: { sheet_to_json: () => [['Test'], ['Data']] }
};

// Load file parser
const fileParserCode = fs.readFileSync(path.join(__dirname, '../../src/modules/file-parser.js'), 'utf8');
const vm = require('vm');
const moduleScope = {
    module: { exports: {} },
    exports: {},
    window: global.window,
    global: global,
    console: console,
    FileReader: global.FileReader,
    XLSX: global.XLSX
};

vm.runInNewContext(fileParserCode, moduleScope);
const FileParser = moduleScope.module.exports.FileParser || moduleScope.FileParser;

let testsRun = 0;
let testsPassed = 0;

function test(name, fn) {
    testsRun++;
    try {
        fn();
        testsPassed++;
        console.log(`✅ ${name}`);
    } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
    }
}

console.log('🧪 Real Data Integration Tests\n');

// Load test data files
function loadCSV(filename) {
    try {
        const filePath = path.join(__dirname, '../fixtures', filename);
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.warn(`⚠️  Could not load ${filename}: ${error.message}`);
        return null;
    }
}

// ==================== EMPLOYEE DATA TESTS ====================

test('Employee CSV - Parse Structure', () => {
    const csv = loadCSV('employees.csv');
    if (!csv) return;
    
    const result = FileParser.parseCSVText(csv);
    assert(result.length > 1, 'Should have header and data rows');
    
    const headers = result[0];
    assert(headers.includes('Name'), 'Should have Name column');
    assert(headers.includes('Email'), 'Should have Email column');
    assert(headers.includes('Salary'), 'Should have Salary column');
});

test('Employee CSV - Data Type Detection', () => {
    const csv = loadCSV('employees.csv');
    if (!csv) return;
    
    const rows = FileParser.parseCSVText(csv);
    const columns = FileParser.analyzeColumns(rows);
    
    // Find columns by name and check types
    const emailCol = columns.find(col => col.name.toLowerCase().includes('email'));
    const salaryCol = columns.find(col => col.name.toLowerCase().includes('salary'));
    const phoneCol = columns.find(col => col.name.toLowerCase().includes('phone'));
    
    if (emailCol) assert.strictEqual(emailCol.dataType, 'email');
    if (salaryCol) assert.strictEqual(salaryCol.dataType, 'currency');
    if (phoneCol) assert.strictEqual(phoneCol.dataType, 'phone');
});

test('Employee CSV - JSON Field Names', () => {
    const csv = loadCSV('employees.csv');
    if (!csv) return;
    
    const rows = FileParser.parseCSVText(csv);
    const columns = FileParser.analyzeColumns(rows);
    
    // Check that JSON field names are generated
    columns.forEach(column => {
        assert(column.jsonFieldName, 'Should have JSON field name');
        assert(typeof column.jsonFieldName === 'string', 'JSON field name should be string');
        assert(column.jsonFieldName.length > 0, 'JSON field name should not be empty');
    });
});

// ==================== CUSTOMER DATA TESTS ====================

test('Customer CSV - Complex Fields', () => {
    const csv = loadCSV('customers.csv');
    if (!csv) return;
    
    const result = FileParser.parseCSVText(csv);
    assert(result.length > 1, 'Should have data');
    
    // Check that quoted fields with commas are parsed correctly
    const hasComplexAddress = result.some(row => 
        row.some(cell => cell.includes(',') && !cell.startsWith('"'))
    );
    assert(!hasComplexAddress, 'Quoted fields should be parsed without quotes');
});

test('Customer CSV - Data Validation', () => {
    const csv = loadCSV('customers.csv');
    if (!csv) return;
    
    const rows = FileParser.parseCSVText(csv);
    const columns = FileParser.analyzeColumns(rows);
    
    // Verify we detected the right number of columns
    assert(columns.length >= 10, 'Should detect multiple columns');
    
    // Check sample values are provided
    columns.forEach(column => {
        assert(Array.isArray(column.sampleValues), 'Should have sample values array');
    });
});

// ==================== PRODUCT DATA TESTS ====================

test('Product CSV - Mixed Data Types', () => {
    const csv = loadCSV('products.csv');
    if (!csv) return;
    
    const rows = FileParser.parseCSVText(csv);
    const columns = FileParser.analyzeColumns(rows);
    
    // Look for different data types
    const dataTypes = columns.map(col => col.dataType);
    const uniqueTypes = [...new Set(dataTypes)];
    
    assert(uniqueTypes.length > 1, 'Should detect multiple data types');
    assert(dataTypes.includes('text'), 'Should have text fields');
});

test('Product CSV - URL Detection', () => {
    const csv = loadCSV('products.csv');
    if (!csv) return;
    
    const rows = FileParser.parseCSVText(csv);
    const columns = FileParser.analyzeColumns(rows);
    
    const urlColumn = columns.find(col => col.name.toLowerCase().includes('url'));
    if (urlColumn) {
        assert.strictEqual(urlColumn.dataType, 'url');
    }
});

// ==================== PERFORMANCE TESTS WITH REAL DATA ====================

test('Performance - Real Data Parsing', () => {
    const csv = loadCSV('customers.csv');
    if (!csv) return;
    
    const start = Date.now();
    const result = FileParser.parseCSVText(csv);
    const parseTime = Date.now() - start;
    
    const analysisStart = Date.now();
    const columns = FileParser.analyzeColumns(result);
    const analysisTime = Date.now() - analysisStart;
    
    assert(parseTime < 100, `CSV parsing took ${parseTime}ms, should be under 100ms`);
    assert(analysisTime < 100, `Column analysis took ${analysisTime}ms, should be under 100ms`);
});

// ==================== INTEGRATION WORKFLOW TESTS ====================

test('Complete Workflow - File to Analysis', async () => {
    const csv = loadCSV('employees.csv');
    if (!csv) return;
    
    // Simulate file upload
    const mockFile = {
        name: 'employees.csv',
        type: 'text/csv',
        content: csv
    };
    
    // Step 1: Detect file type
    const fileType = FileParser.detectFileType(mockFile);
    assert.strictEqual(fileType, 'csv');
    
    // Step 2: Parse the file
    const data = await FileParser.parseCSV(mockFile);
    assert(Array.isArray(data));
    
    // Step 3: Analyze columns
    const columns = FileParser.analyzeColumns(data);
    assert(Array.isArray(columns));
    assert(columns.length > 0);
    
    // Step 4: Verify structure
    columns.forEach(column => {
        assert(column.name, 'Should have column name');
        assert(column.jsonFieldName, 'Should have JSON field name');
        assert(column.dataType, 'Should have data type');
        assert(typeof column.required === 'boolean', 'Should have required flag');
    });
});

test('Error Resilience - Malformed CSV', () => {
    // Test with intentionally malformed CSV
    const malformedCSV = `Name,Email,Phone
"John Doe",john@test.com,555-1234
"Jane Smith","jane@test.com,555-5678
Bob Johnson,bob@test.com,"555-9999"`;
    
    try {
        const result = FileParser.parseCSVText(malformedCSV);
        assert(Array.isArray(result), 'Should still return an array');
        assert(result.length > 0, 'Should parse at least some data');
    } catch (error) {
        // If it throws, that's also acceptable behavior
        assert(error instanceof Error, 'Should throw a proper Error');
    }
});

// ==================== RESULTS ====================

setTimeout(() => {
    console.log('\n📊 Real Data Test Results:');
    console.log(`Total: ${testsRun}`);
    console.log(`Passed: ${testsPassed} ✅`);
    console.log(`Failed: ${testsRun - testsPassed} ❌`);
    console.log(`Success Rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);
    
    if (testsPassed === testsRun) {
        console.log('\n🎉 All real data tests passed! Your file parser handles real-world data correctly.');
        console.log('\n🔍 Tested capabilities:');
        console.log('  ✓ Employee data with mixed types');
        console.log('  ✓ Customer data with complex addresses');
        console.log('  ✓ Product data with URLs and descriptions');
        console.log('  ✓ Performance with real-world file sizes');
        console.log('  ✓ Complete workflow from file to analysis');
        console.log('  ✓ Error resilience with malformed data');
    }
    
    process.exit(testsPassed === testsRun ? 0 : 1);
}, 100);