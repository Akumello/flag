/**
 * Simple test to verify the local development environment setup
 */

const MockPropertiesService = require('../local/mocks/PropertiesService');
const MockUtilities = require('../local/mocks/Utilities');
const MockSession = require('../local/mocks/Session');

console.log('🧪 Testing Local Development Environment...\n');

// Test Mock Services
console.log('1. Testing MockPropertiesService...');
try {
  const mockProps = new MockPropertiesService();
  const props = mockProps.getScriptProperties();
  
  props.setProperty('testKey', 'testValue');
  const value = props.getProperty('testKey');
  
  if (value === 'testValue') {
    console.log('   ✅ PropertiesService mock working correctly');
  } else {
    console.log('   ❌ PropertiesService mock failed');
  }
} catch (error) {
  console.log('   ❌ PropertiesService mock error:', error.message);
}

console.log('2. Testing MockUtilities...');
try {
  const mockUtils = new MockUtilities();
  const uuid = mockUtils.getUuid();
  
  if (uuid && uuid.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
    console.log('   ✅ Utilities mock working correctly');
  } else {
    console.log('   ❌ Utilities mock failed');
  }
} catch (error) {
  console.log('   ❌ Utilities mock error:', error.message);
}

console.log('3. Testing MockSession...');
try {
  const mockSession = new MockSession();
  const user = mockSession.getActiveUser();
  const email = user.getEmail();
  
  if (email === 'developer@localhost.local') {
    console.log('   ✅ Session mock working correctly');
  } else {
    console.log('   ❌ Session mock failed');
  }
} catch (error) {
  console.log('   ❌ Session mock error:', error.message);
}

// Test GAS file loading
console.log('4. Testing GAS file loading...');
try {
  const fs = require('fs');
  const path = require('path');
  
  const gasFiles = [
    '../src/config.gs',
    '../src/validation.gs',
    '../src/api.gs',
    '../src/main.gs'
  ];
  
  let allFilesExist = true;
  for (const file of gasFiles) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.log(`   ❌ Missing file: ${file}`);
      allFilesExist = false;
    }
  }
  
  if (allFilesExist) {
    console.log('   ✅ All GAS files found');
  }
} catch (error) {
  console.log('   ❌ GAS file loading error:', error.message);
}

console.log('\n🎉 Basic environment test completed!');
console.log('\nTo start the development server, run:');
console.log('   npm run dev');
console.log('\nOr use the quick start script:');
console.log('   node local/start.js');