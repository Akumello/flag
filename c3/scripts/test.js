#!/usr/bin/env node

/**
 * Test Runner for File Parser Module
 * Runs both basic and advanced test suites
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 File Parser Test Suite Runner\n');

async function runTestFile(filename, description) {
    return new Promise((resolve) => {
        console.log(`📋 Running ${description}...`);
        
        const testProcess = spawn('node', [filename], {
            cwd: __dirname,
            stdio: 'pipe'
        });
        
        let output = '';
        let errorOutput = '';
        
        testProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        testProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        testProcess.on('close', (code) => {
            console.log(output);
            if (errorOutput && code !== 0) {
                console.error('Error output:', errorOutput);
            }
            
            resolve({
                success: code === 0,
                output: output,
                errors: errorOutput
            });
        });
        
        testProcess.on('error', (error) => {
            console.error(`❌ Failed to run ${filename}: ${error.message}`);
            resolve({ success: false, output: '', errors: error.message });
        });
    });
}

async function runAllTests() {
    const tests = [
        {
            file: 'test-file-parser.js',
            description: 'Basic File Parser Tests'
        },
        {
            file: 'test-file-parser-advanced.js',
            description: 'Advanced File Parser Tests'
        }
    ];
    
    let totalSuccess = true;
    
    for (const test of tests) {
        const result = await runTestFile(test.file, test.description);
        if (!result.success) {
            totalSuccess = false;
        }
        console.log('─'.repeat(60));
    }
    
    console.log('\n🏁 Test Suite Complete');
    console.log(`Overall Result: ${totalSuccess ? '✅ PASS' : '❌ FAIL'}`);
    
    if (totalSuccess) {
        console.log('\n🎉 All test suites passed! Your file parser is working correctly.');
    } else {
        console.log('\n⚠️  Some tests failed. Please review the output above.');
    }
    
    process.exit(totalSuccess ? 0 : 1);
}

// Check if files exist before running
const fs = require('fs');

const requiredFiles = [
    'file-parser.js',
    'test-file-parser.js',
    'test-file-parser-advanced.js'
];

console.log('🔍 Checking required files...');
for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(__dirname, file))) {
        console.error(`❌ Required file missing: ${file}`);
        process.exit(1);
    }
    console.log(`✅ Found: ${file}`);
}

console.log('\n🎯 All required files found. Starting tests...\n');

runAllTests().catch(error => {
    console.error('❌ Test runner error:', error);
    process.exit(1);
});