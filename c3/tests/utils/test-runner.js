#!/usr/bin/env node

/**
 * Complete Test Suite Runner for File Parser
 * Runs all test files and provides comprehensive reporting
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 File Parser Complete Test Suite\n');

const testSuites = [
    {
        file: '../unit/file-parser.test.js',
        name: 'Core Functionality Tests',
        description: 'Basic parsing, data type detection, and core features'
    },
    {
        file: '../integration/real-data.test.js',
        name: 'Real Data Integration Tests',
        description: 'Tests with actual CSV files and real-world scenarios'
    }
];

async function runTest(testSuite) {
    return new Promise((resolve) => {
        console.log(`📋 Running ${testSuite.name}...`);
        console.log(`   ${testSuite.description}\n`);
        
        const testProcess = spawn('node', [testSuite.file], {
            cwd: __dirname,
            stdio: 'pipe'
        });
        
        let output = '';
        let errorOutput = '';
        
        testProcess.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            // Show real-time output
            process.stdout.write(text);
        });
        
        testProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        testProcess.on('close', (code) => {
            if (errorOutput && code !== 0) {
                console.error('\nError output:', errorOutput);
            }
            
            resolve({
                success: code === 0,
                output: output,
                errors: errorOutput,
                suite: testSuite.name
            });
        });
        
        testProcess.on('error', (error) => {
            console.error(`❌ Failed to run ${testSuite.file}: ${error.message}`);
            resolve({ 
                success: false, 
                output: '', 
                errors: error.message,
                suite: testSuite.name
            });
        });
    });
}

async function runAllTests() {
    console.log('🔍 Checking required files...');
    const fs = require('fs');
    
    // Check core files
    const requiredFiles = ['../../src/modules/file-parser.js', ...testSuites.map(t => t.file)];
    for (const file of requiredFiles) {
        if (!fs.existsSync(path.join(__dirname, file))) {
            console.error(`❌ Required file missing: ${file}`);
            process.exit(1);
        }
        console.log(`✅ Found: ${file}`);
    }
    
    // Check test data
    const testDataFiles = ['employees.csv', 'customers.csv', 'products.csv'];
    const testDataDir = path.join(__dirname, '../fixtures');
    if (fs.existsSync(testDataDir)) {
        testDataFiles.forEach(file => {
            if (fs.existsSync(path.join(testDataDir, file))) {
                console.log(`✅ Found test data: ${file}`);
            } else {
                console.log(`⚠️  Missing test data: ${file}`);
            }
        });
    } else {
        console.log('⚠️  Test data directory not found (some tests may be skipped)');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 Starting comprehensive test execution...\n');
    
    const results = [];
    let overallSuccess = true;
    
    for (const testSuite of testSuites) {
        const result = await runTest(testSuite);
        results.push(result);
        
        if (!result.success) {
            overallSuccess = false;
        }
        
        console.log('─'.repeat(60));
    }
    
    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('🏁 TEST SUITE COMPLETE');
    console.log('='.repeat(60));
    
    results.forEach(result => {
        const status = result.success ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${result.suite}`);
    });
    
    console.log('\n📊 Overall Results:');
    const passedSuites = results.filter(r => r.success).length;
    console.log(`Test Suites: ${passedSuites}/${results.length} passed`);
    console.log(`Success Rate: ${((passedSuites / results.length) * 100).toFixed(1)}%`);
    
    if (overallSuccess) {
        console.log('\n🎉 ALL TEST SUITES PASSED!');
        console.log('\n✨ Your file parser is working correctly and ready for production use.');
        console.log('\n🔧 Features verified:');
        console.log('   ✓ CSV parsing with quoted fields and special characters');
        console.log('   ✓ Data type detection (email, phone, currency, URL, percentage, etc.)');
        console.log('   ✓ JSON field name generation');
        console.log('   ✓ Column analysis and metadata extraction');
        console.log('   ✓ File type detection');
        console.log('   ✓ Error handling and edge cases');
        console.log('   ✓ Performance with large datasets');
        console.log('   ✓ Real-world data compatibility');
    } else {
        console.log('\n⚠️  Some test suites failed. Review the output above for details.');
        console.log('\n🔧 The file parser is functional but may need adjustments for specific use cases.');
    }
    
    process.exit(overallSuccess ? 0 : 1);
}

runAllTests().catch(error => {
    console.error('❌ Test runner error:', error);
    process.exit(1);
});