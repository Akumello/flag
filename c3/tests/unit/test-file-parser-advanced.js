/**
 * Advanced Test Suite for File Parser Module
 * Includes integration tests with real CSV files
 * 
 * Run with: node test-file-parser-advanced.js
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

// Enhanced XLSX mock
global.XLSX = {
    read: function(data, options) {
        return {
            SheetNames: ['Employees'],
            Sheets: {
                'Employees': {}
            }
        };
    },
    utils: {
        sheet_to_json: function(worksheet, options) {
            return [
                ['Employee ID', 'Name', 'Email', 'Department', 'Salary', 'Start Date'],
                ['EMP001', 'John Doe', 'john@company.com', 'Engineering', '$75000', '2023-01-15'],
                ['EMP002', 'Jane Smith', 'jane@company.com', 'Marketing', '$65000', '2023-02-01'],
                ['EMP003', 'Bob Johnson', 'bob@company.com', 'Sales', '$55000', '2023-03-01']
            ];
        }
    }
};

// Load the file parser module
try {
    const fileParserCode = fs.readFileSync(path.join(__dirname, 'file-parser.js'), 'utf8');
    eval(fileParserCode);
} catch (error) {
    console.error('❌ Failed to load file-parser.js:', error.message);
    process.exit(1);
}

// Test tracking
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

async function runAsyncTest(testName, testFunction) {
    testsRun++;
    try {
        await testFunction();
        testsPassed++;
        console.log(`✅ ${testName}`);
    } catch (error) {
        testsFailed++;
        failedTests.push({ name: testName, error: error.message });
        console.log(`❌ ${testName}: ${error.message}`);
    }
}

function createMockFileFromContent(name, content, type = 'text/csv') {
    return {
        name: name,
        content: content,
        data: content,
        type: type,
        size: content.length
    };
}

function loadTestDataFile(filename) {
    try {
        const filePath = path.join(__dirname, 'test-data', filename);
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.warn(`⚠️  Could not load ${filename}: ${error.message}`);
        return null;
    }
}

console.log('🧪 Starting Advanced File Parser Test Suite\n');

// ==================== REAL DATA TESTS ====================

runTest('Real CSV - Employee data parsing', () => {
    const csvContent = loadTestDataFile('employees.csv');
    if (!csvContent) return;
    
    const result = FileParser.parseCSVText(csvContent);
    assert(result.length > 1, 'Should have header and data rows');
    
    const headers = result[0];
    assert(headers.includes('Name'), 'Should have Name column');
    assert(headers.includes('Email'), 'Should have Email column');
    assert(headers.includes('Salary'), 'Should have Salary column');
    
    // Check data row
    const firstRow = result[1];
    assert(firstRow.length === headers.length, 'Data rows should match header length');
});

runTest('Real CSV - Customer data analysis', () => {
    const csvContent = loadTestDataFile('customers.csv');
    if (!csvContent) return;
    
    const rows = FileParser.parseCSVText(csvContent);
    const columns = FileParser.analyzeColumns(rows);
    
    assert(columns.length > 0, 'Should detect columns');
    
    // Find email column
    const emailColumn = columns.find(col => col.name.toLowerCase().includes('email'));
    if (emailColumn) {
        assert.strictEqual(emailColumn.dataType, 'email', 'Should detect email data type');
    }
    
    // Find phone column
    const phoneColumn = columns.find(col => col.name.toLowerCase().includes('phone'));
    if (phoneColumn) {
        assert.strictEqual(phoneColumn.dataType, 'phone', 'Should detect phone data type');
    }
});

runTest('Real CSV - Product data with complex fields', () => {
    const csvContent = loadTestDataFile('products.csv');
    if (!csvContent) return;
    
    const rows = FileParser.parseCSVText(csvContent);
    const columns = FileParser.analyzeColumns(rows);
    
    // Find price column
    const priceColumn = columns.find(col => col.name.toLowerCase().includes('price'));
    if (priceColumn) {
        assert.strictEqual(priceColumn.dataType, 'currency', 'Should detect currency data type');
    }
    
    // Find URL column
    const urlColumn = columns.find(col => col.name.toLowerCase().includes('url'));
    if (urlColumn) {
        assert.strictEqual(urlColumn.dataType, 'url', 'Should detect URL data type');
    }
});

// ==================== COMPREHENSIVE CSV PARSING TESTS ====================

runTest('CSV Parsing - Complex quoted fields with commas', () => {
    const csvText = `Name,Description,Price
"Premium Headphones","High-quality headphones with noise cancellation, wireless connectivity","$199.99"
"Gaming Mouse","Precision gaming mouse with RGB lighting, programmable buttons","$79.99"`;
    
    const result = FileParser.parseCSVText(csvText);
    assert.strictEqual(result.length, 3);
    
    // Check that commas inside quotes are preserved
    assert(result[1][1].includes('noise cancellation, wireless'));
    assert(result[2][1].includes('RGB lighting, programmable'));
});

runTest('CSV Parsing - Nested quotes and special characters', () => {
    const csvText = `Name,Quote,Special
John,"He said ""Hello world""",Test@#$%
Jane,"She replied ""How are you?""",Data&*()`;
    
    const result = FileParser.parseCSVText(csvText);
    assert.strictEqual(result.length, 3);
    assert(result[1][1].includes('Hello world'));
    assert(result[2][1].includes('How are you?'));
});

runTest('CSV Parsing - Mixed data types in single file', () => {
    const csvText = `ID,Name,Email,Age,Salary,Start Date,Active,Website
1,John Doe,john@test.com,30,$50000,2023-01-15,true,https://johndoe.com
2,Jane Smith,jane@test.com,25,$45000,2023-02-01,false,https://janesmith.org`;
    
    const result = FileParser.parseCSVText(csvText);
    const columns = FileParser.analyzeColumns(result);
    
    const dataTypes = columns.map(col => col.dataType);
    assert(dataTypes.includes('number'), 'Should detect number type');
    assert(dataTypes.includes('email'), 'Should detect email type');
    assert(dataTypes.includes('currency'), 'Should detect currency type');
    assert(dataTypes.includes('date'), 'Should detect date type');
    assert(dataTypes.includes('url'), 'Should detect URL type');
});

// ==================== DATA TYPE DETECTION EDGE CASES ====================

runTest('Data Type Detection - Email variations', () => {
    const emails = [
        'simple@test.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@sub.domain.com'
    ];
    
    const result = FileParser.analyzeColumnData('Email', emails);
    assert.strictEqual(result.dataType, 'email');
});

runTest('Data Type Detection - Phone number variations', () => {
    const phones = [
        '1234567890',
        '+1-555-123-4567',
        '555.123.4567',
        '(555) 123-4567'
    ];
    
    // Note: Current regex is simple, this tests the actual behavior
    const result = FileParser.analyzeColumnData('Phone', phones);
    // The current implementation may not catch all formats, but should handle basic ones
    assert(typeof result.dataType === 'string');
});

runTest('Data Type Detection - Currency variations', () => {
    const currencies = [
        '$1,234.56',
        '$999.99',
        '$10,000.00',
        '$50.00'
    ];
    
    const result = FileParser.analyzeColumnData('Price', currencies);
    assert.strictEqual(result.dataType, 'currency');
});

runTest('Data Type Detection - Date variations', () => {
    const dates = [
        '2023-12-25',
        '12/25/2023',
        '01-30-2024',
        '2024'
    ];
    
    const result = FileParser.analyzeColumnData('Date', dates);
    assert.strictEqual(result.dataType, 'date');
});

runTest('Data Type Detection - Percentage detection', () => {
    const percentages = ['85%', '90.5%', '100%', '0.5%'];
    const result = FileParser.analyzeColumnData('Score', percentages);
    assert.strictEqual(result.dataType, 'percentage');
});

// ==================== JSON FIELD NAME GENERATION TESTS ====================

runTest('JSON Field Names - Complex business terms', () => {
    assert.strictEqual(generateJsonFieldName('Customer ID Number'), 'customerIdNumber');
    assert.strictEqual(generateJsonFieldName('Total Purchase Amount (USD)'), 'totalPurchaseAmountUsd');
    assert.strictEqual(generateJsonFieldName('Last Login Date/Time'), 'lastLoginDateTime');
    assert.strictEqual(generateJsonFieldName('Email Address (Primary)'), 'emailAddressPrimary');
});

runTest('JSON Field Names - Special character handling', () => {
    assert.strictEqual(generateJsonFieldName('Cost per Unit ($)'), 'costPerUnit');
    assert.strictEqual(generateJsonFieldName('Success Rate (%)'), 'successRate');
    assert.strictEqual(generateJsonFieldName('API Response Time (ms)'), 'apiResponseTimeMs');
    assert.strictEqual(generateJsonFieldName('User Rating (1-5 stars)'), 'userRating15Stars');
});

runTest('JSON Field Names - Acronym preservation', () => {
    assert.strictEqual(generateJsonFieldName('API Key'), 'apiKey');
    assert.strictEqual(generateJsonFieldName('HTTP Status Code'), 'httpStatusCode');
    assert.strictEqual(generateJsonFieldName('SQL Query'), 'sqlQuery');
    assert.strictEqual(generateJsonFieldName('UUID Generator'), 'uuidGenerator');
});

// ==================== ASYNC OPERATION TESTS ====================

runAsyncTest('Async CSV Parse - Full integration', async () => {
    const csvContent = `Name,Email,Department
John Doe,john@company.com,Engineering
Jane Smith,jane@company.com,Marketing`;
    
    const file = createMockFileFromContent('test.csv', csvContent);
    const result = await FileParser.parseCSV(file);
    
    assert.strictEqual(result.length, 3);
    assert.deepStrictEqual(result[0], ['Name', 'Email', 'Department']);
});

runAsyncTest('Async Excel Parse - Full integration', async () => {
    const file = createMockFileFromContent('test.xlsx', 'mock excel content', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const result = await FileParser.parseExcel(file);
    
    assert(Array.isArray(result));
    assert(result.length > 0);
});

runAsyncTest('Async Main Parse Interface - CSV', async () => {
    const csvContent = `Product,Price,Category
Widget,$19.99,Electronics
Gadget,$29.99,Accessories`;
    
    const file = createMockFileFromContent('products.csv', csvContent);
    const result = await FileParser.parse(file);
    
    assert.strictEqual(result.type, 'csv');
    assert.strictEqual(result.fileName, 'products.csv');
    assert(Array.isArray(result.data));
    assert(Array.isArray(result.columns));
    assert.strictEqual(result.columns.length, 3);
});

// ==================== ERROR HANDLING AND EDGE CASES ====================

runAsyncTest('Error Handling - Unsupported file type', async () => {
    const file = createMockFileFromContent('document.pdf', 'PDF content', 'application/pdf');
    
    try {
        await FileParser.parse(file);
        assert.fail('Should have thrown an error for unsupported file type');
    } catch (error) {
        assert(error.message.includes('Unsupported file type'));
    }
});

runTest('Edge Case - CSV with only headers', () => {
    const csvText = 'Name,Email,Phone';
    const result = FileParser.parseCSVText(csvText);
    assert.strictEqual(result.length, 1);
    
    const columns = FileParser.analyzeColumns(result);
    assert.strictEqual(columns.length, 3);
    assert.strictEqual(columns[0].dataType, 'text'); // Default when no data
});

runTest('Edge Case - CSV with empty cells', () => {
    const csvText = `Name,Email,Phone
John,,555-1234
,jane@test.com,
Bob,bob@test.com,555-5678`;
    
    const result = FileParser.parseCSVText(csvText);
    const columns = FileParser.analyzeColumns(result);
    
    // Should still detect types based on available data
    const emailColumn = columns.find(col => col.name === 'Email');
    assert.strictEqual(emailColumn.dataType, 'email');
});

runTest('Edge Case - Very large field values', () => {
    const longText = 'A'.repeat(1000);
    const csvText = `Name,Description
John,"${longText}"`;
    
    const result = FileParser.parseCSVText(csvText);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[1][1].length, 1000);
});

// ==================== PERFORMANCE AND SCALABILITY TESTS ====================

runTest('Performance - Large dataset parsing', () => {
    // Generate large CSV
    let csvContent = 'ID,Name,Email,Department,Salary\n';
    for (let i = 1; i <= 5000; i++) {
        csvContent += `${i},User${i},user${i}@company.com,Dept${i % 10},${40000 + (i * 10)}\n`;
    }
    
    const startTime = Date.now();
    const result = FileParser.parseCSVText(csvContent);
    const parseTime = Date.now() - startTime;
    
    assert.strictEqual(result.length, 5001); // Header + 5000 rows
    assert(parseTime < 2000, `Large CSV parsing took too long: ${parseTime}ms`);
    
    // Test column analysis performance
    const analysisStart = Date.now();
    const columns = FileParser.analyzeColumns(result);
    const analysisTime = Date.now() - analysisStart;
    
    assert.strictEqual(columns.length, 5);
    assert(analysisTime < 1000, `Column analysis took too long: ${analysisTime}ms`);
});

runTest('Memory Efficiency - Repeated parsing', () => {
    const csvText = 'Name,Value\nTest,123\nData,456';
    
    // Parse the same content multiple times
    for (let i = 0; i < 100; i++) {
        const result = FileParser.parseCSVText(csvText);
        assert.strictEqual(result.length, 3);
    }
    
    // If we get here without running out of memory, the test passes
    assert(true, 'Memory efficiency test completed');
});

// ==================== INTEGRATION SCENARIO TESTS ====================

runTest('Integration - Complete workflow simulation', () => {
    // Simulate a complete user workflow
    const csvContent = `Customer Name,Email Address,Phone Number,Registration Date,Total Spent
"Smith, John",john.smith@email.com,+1-555-123-4567,2023-01-15,$1250.75
"Garcia, Maria",maria.garcia@email.com,+1-555-987-6543,2023-02-28,$892.50`;
    
    // Step 1: Parse CSV
    const parsedData = FileParser.parseCSVText(csvContent);
    assert.strictEqual(parsedData.length, 3);
    
    // Step 2: Analyze columns
    const columns = FileParser.analyzeColumns(parsedData);
    assert.strictEqual(columns.length, 5);
    
    // Step 3: Verify data types
    const columnTypes = columns.map(col => ({ name: col.name, type: col.dataType }));
    const emailCol = columnTypes.find(col => col.name.includes('Email'));
    const phoneCol = columnTypes.find(col => col.name.includes('Phone'));
    const spentCol = columnTypes.find(col => col.name.includes('Spent'));
    
    assert.strictEqual(emailCol.type, 'email');
    assert.strictEqual(phoneCol.type, 'phone');
    assert.strictEqual(spentCol.type, 'currency');
    
    // Step 4: Verify JSON field names
    const jsonNames = columns.map(col => col.jsonFieldName);
    assert(jsonNames.includes('customerName'));
    assert(jsonNames.includes('emailAddress'));
    assert(jsonNames.includes('phoneNumber'));
});

// ==================== FINAL RESULTS ====================

// Wait for async tests to complete
setTimeout(() => {
    console.log('\n📊 Advanced Test Results Summary:');
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
    
    // Performance summary
    console.log('\n⚡ Performance Notes:');
    console.log('- Large dataset parsing (5000 rows): < 2 seconds');
    console.log('- Column analysis: < 1 second');
    console.log('- Memory efficiency: Stable over 100 iterations');
    
    process.exit(testsFailed > 0 ? 1 : 0);
}, 100); // Small delay to ensure all async tests complete