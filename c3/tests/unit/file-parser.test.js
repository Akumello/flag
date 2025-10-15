/**
 * Simple Working Test Suite for File Parser Module
 * Focuses on core functionality with correct test assertions
 * 
 * Run with: node test-file-parser-simple.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock browser environment
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
    
    readAsArrayBuffer(file) {
        setTimeout(() => {
            this.result = Buffer.from(file.content || file.data);
            if (this.onload) this.onload({ target: this });
        }, 0);
    }
};

global.XLSX = {
    read: function(data, options) {
        return {
            SheetNames: ['Sheet1'],
            Sheets: { 'Sheet1': {} }
        };
    },
    utils: {
        sheet_to_json: function(worksheet, options) {
            return [
                ['Name', 'Email', 'Age'],
                ['John Doe', 'john@example.com', '30'],
                ['Jane Smith', 'jane@example.com', '25']
            ];
        }
    }
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

const FileParser = moduleScope.module.exports.FileParser || moduleScope.FileParser || global.FileParser;
const generateJsonFieldName = moduleScope.module.exports.generateJsonFieldName || moduleScope.generateJsonFieldName || global.generateJsonFieldName;

// Make FileReader available globally for the parser
global.FileReader = moduleScope.FileReader;

// Test tracking
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
    testsRun++;
    try {
        fn();
        testsPassed++;
        console.log(`✅ ${name}`);
    } catch (error) {
        testsFailed++;
        console.log(`❌ ${name}: ${error.message}`);
    }
}

console.log('🧪 Simple File Parser Test Suite\n');

// ==================== JSON FIELD NAME TESTS ====================

test('JSON Field Names - Basic', () => {
    assert.strictEqual(generateJsonFieldName('Customer Name'), 'customerName');
    assert.strictEqual(generateJsonFieldName('Email Address'), 'emailAddress');
});

test('JSON Field Names - Special chars', () => {
    assert.strictEqual(generateJsonFieldName('Customer ID#'), 'customerId');
    assert.strictEqual(generateJsonFieldName('Email (Primary)'), 'emailPrimary');
});

test('JSON Field Names - Edge cases', () => {
    assert.strictEqual(generateJsonFieldName(''), '');
    assert.strictEqual(generateJsonFieldName('A'), 'a');
});

// ==================== CSV PARSING TESTS ====================

test('CSV Line Parsing - Simple', () => {
    const result = FileParser.parseCSVLine('John,Doe,30');
    assert(Array.isArray(result));
    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0], 'John');
    assert.strictEqual(result[1], 'Doe');
    assert.strictEqual(result[2], '30');
});

test('CSV Line Parsing - Quoted', () => {
    const result = FileParser.parseCSVLine('"Smith, John",Engineer');
    assert(Array.isArray(result));
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0], 'Smith, John');
    assert.strictEqual(result[1], 'Engineer');
});

test('CSV Text Parsing', () => {
    const csv = 'Name,Age\nJohn,30\nJane,25';
    const result = FileParser.parseCSVText(csv);
    assert(Array.isArray(result));
    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0][0], 'Name');
    assert.strictEqual(result[1][0], 'John');
});

// ==================== DATA TYPE DETECTION TESTS ====================

test('Data Type - Email', () => {
    const result = FileParser.analyzeColumnData('Email', ['john@test.com', 'jane@test.com']);
    assert.strictEqual(result.dataType, 'email');
});

test('Data Type - Numbers', () => {
    const result = FileParser.analyzeColumnData('Age', ['30', '25', '35']);
    assert.strictEqual(result.dataType, 'number');
});

test('Data Type - Currency', () => {
    const result = FileParser.analyzeColumnData('Price', ['$10.99', '$25.50', '$100.00']);
    assert.strictEqual(result.dataType, 'currency');
});

test('Data Type - URLs', () => {
    const result = FileParser.analyzeColumnData('Website', ['https://test.com', 'http://example.org']);
    assert.strictEqual(result.dataType, 'url');
});

test('Data Type - Percentage', () => {
    const result = FileParser.analyzeColumnData('Rate', ['85%', '90%', '95%']);
    assert.strictEqual(result.dataType, 'percentage');
});

// ==================== COLUMN ANALYSIS TESTS ====================

test('Column Analysis - Basic', () => {
    const rows = [
        ['Name', 'Email', 'Count'],
        ['John', 'john@test.com', '5'],
        ['Jane', 'jane@test.com', '10']
    ];
    
    const columns = FileParser.analyzeColumns(rows);
    assert(Array.isArray(columns));
    assert.strictEqual(columns.length, 3);
    
    // Check first column
    assert.strictEqual(columns[0].name, 'Name');
    assert.strictEqual(columns[0].jsonFieldName, 'name');
    
    // Check email column
    assert.strictEqual(columns[1].name, 'Email');
    assert.strictEqual(columns[1].dataType, 'email');
    
    // Check number column
    assert.strictEqual(columns[2].name, 'Count');
    assert.strictEqual(columns[2].dataType, 'number');
});

// ==================== FILE TYPE DETECTION TESTS ====================

test('File Type Detection - CSV', () => {
    const file = { name: 'data.csv', type: 'text/csv' };
    assert.strictEqual(FileParser.detectFileType(file), 'csv');
});

test('File Type Detection - Excel', () => {
    const file = { name: 'data.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
    assert.strictEqual(FileParser.detectFileType(file), 'excel');
});

test('File Type Detection - Unsupported', () => {
    const file = { name: 'document.pdf', type: 'application/pdf' };
    assert.strictEqual(FileParser.detectFileType(file), null);
});

// ==================== INTEGRATION TESTS ====================

test('CSV Parse Integration', async () => {
    const file = { 
        content: 'Name,Email\nJohn,john@test.com\nJane,jane@test.com',
        name: 'test.csv'
    };
    
    const result = await FileParser.parseCSV(file);
    assert(Array.isArray(result));
    assert.strictEqual(result.length, 3);
});

test('Main Parse Interface', async () => {
    const file = { 
        content: 'Name,Value\nTest,123',
        name: 'test.csv',
        type: 'text/csv'
    };
    
    const result = await FileParser.parse(file);
    assert.strictEqual(result.type, 'csv');
    assert.strictEqual(result.fileName, 'test.csv');
    assert(Array.isArray(result.data));
    assert(Array.isArray(result.columns));
});

// ==================== ERROR HANDLING TESTS ====================

test('Error Handling - Unsupported file', async () => {
    const file = { name: 'test.txt', type: 'text/plain' };
    
    try {
        await FileParser.parse(file);
        assert.fail('Should have thrown error');
    } catch (error) {
        assert(error.message.includes('Unsupported file type'));
    }
});

// ==================== PERFORMANCE TESTS ====================

test('Performance - Large CSV', () => {
    let csv = 'Name,Email,Age\n';
    for (let i = 0; i < 1000; i++) {
        csv += `User${i},user${i}@test.com,${25 + (i % 40)}\n`;
    }
    
    const start = Date.now();
    const result = FileParser.parseCSVText(csv);
    const time = Date.now() - start;
    
    assert.strictEqual(result.length, 1001);
    assert(time < 1000, `Parsing took ${time}ms, should be under 1000ms`);
});

// ==================== RESULTS ====================

setTimeout(() => {
    console.log('\n📊 Test Results:');
    console.log(`Total: ${testsRun}`);
    console.log(`Passed: ${testsPassed} ✅`);
    console.log(`Failed: ${testsFailed} ❌`);
    console.log(`Success Rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);
    
    if (testsFailed === 0) {
        console.log('\n🎉 All tests passed! File parser is working correctly.');
    }
    
    process.exit(testsFailed > 0 ? 1 : 0);
}, 100);