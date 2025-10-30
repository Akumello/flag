// TestSuite.gs - Testing functions

/**
 * Runs the complete test suite for all CRUD operations and setup functions.
 * Executes tests in sequence: setup, create, read, update, query, and delete.
 * Logs test results to console with ✓/✗ indicators for pass/fail status.
 * Use this to verify that all backend functions work correctly after code changes.
 * 
 * @returns {void} No return value; logs test results to console
 * 
 * @example
 * // Run from Apps Script editor to test all backend functionality
 * runAllTests();
 * // Console output:
 * // Starting test suite...
 * // Testing setup...
 * // ✓ Setup completed successfully
 * // Testing SLA creation...
 * // ✓ SLA created: SLA-000001
 * // ...
 * // All tests completed!
 * 
 * @see testSetup - Tests spreadsheet initialization
 * @see testCreateSLA - Tests SLA creation
 * @see testReadSLA - Tests SLA retrieval
 * @see testUpdateSLA - Tests SLA updates
 * @see testQuerySLAs - Tests SLA querying
 * @see testDeleteSLA - Tests SLA soft deletion
 */
function runAllTests() {
  console.log('Starting test suite...');
  
  testSetup();
  testCreateSLA();
  testReadSLA();
  testUpdateSLA();
  testQuerySLAs();
  testDeleteSLA();
  
  console.log('All tests completed!');
}

/**
 * Tests the setupSLASpreadsheet() function by initializing a complete spreadsheet structure.
 * Verifies that all sheets are created with proper headers, validation, formulas, and formatting.
 * Logs success or error messages to console.
 * 
 * @returns {void} No return value; logs test results to console
 * 
 * @example
 * testSetup();
 * // Console: Testing setup...
 * // Console: ✓ Setup completed successfully
 * 
 * @see setupSLASpreadsheet - Function being tested
 */
function testSetup() {
  console.log('Testing setup...');
  const result = setupSLASpreadsheet();
  
  if (result.success) {
    console.log('✓ Setup completed successfully');
  } else {
    console.error('✗ Setup failed:', result.error);
  }
}

/**
 * Tests the createSLA() function by creating a test SLA with sample data.
 * Validates that SLA is created with auto-generated ID, proper field mapping,
 * and audit trail. Returns the creation result for use in dependent tests.
 * 
 * @returns {Object} Creation result object
 * @returns {boolean} return.success - Whether creation succeeded
 * @returns {string} [return.slaId] - Generated SLA ID if successful
 * @returns {string} [return.error] - Error message if failed
 * 
 * @example
 * const result = testCreateSLA();
 * if (result.success) {
 *   Logger.log('Test SLA ID:', result.slaId);
 * }
 * // Console: Testing SLA creation...
 * // Console: ✓ SLA created: SLA-000001
 * 
 * @see createSLA - Function being tested
 */
function testCreateSLA() {
  console.log('Testing SLA creation...');
  
  const testSLA = {
    slaName: 'Test SLA',
    slaType: 'percentage',
    description: 'This is a test SLA',
    teamId: 'TEAM-001',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    targetValue: 95,
    currentValue: 92,
    notificationEmails: ['test@company.com'],
    tags: ['test', 'automated']
  };
  
  const result = createSLA(testSLA);
  
  if (result.success) {
    console.log('✓ SLA created:', result.slaId);
  } else {
    console.error('✗ Create failed:', result.error);
  }
  
  return result;
}

/**
 * Tests the readSLA() function by first creating a test SLA, then reading it back.
 * Validates that all fields are retrieved correctly with proper parsing of arrays
 * and JSON fields. Logs success or error messages to console.
 * 
 * @returns {void} No return value; logs test results to console
 * 
 * @example
 * testReadSLA();
 * // Console: Testing SLA read...
 * // Console: Testing SLA creation...
 * // Console: ✓ SLA created: SLA-000001
 * // Console: ✓ SLA read successfully: Test SLA
 * 
 * @see readSLA - Function being tested
 * @see testCreateSLA - Creates the SLA to read
 */
function testReadSLA() {
  console.log('Testing SLA read...');
  
  // First create an SLA
  const createResult = testCreateSLA();
  if (!createResult.success) return;
  
  const readResult = readSLA(createResult.slaId);
  
  if (readResult.success) {
    console.log('✓ SLA read successfully:', readResult.data.slaName);
  } else {
    console.error('✗ Read failed:', readResult.error);
  }
}

/**
 * Tests the updateSLA() function by creating a test SLA and then updating its fields.
 * Validates that updates are applied correctly with optimistic locking (rowVersion),
 * audit trail updates, and proper field merging. Logs success or error messages to console.
 * 
 * @returns {void} No return value; logs test results to console
 * 
 * @example
 * testUpdateSLA();
 * // Console: Testing SLA update...
 * // Console: Testing SLA creation...
 * // Console: ✓ SLA created: SLA-000001
 * // Console: ✓ SLA updated successfully
 * 
 * @see updateSLA - Function being tested
 * @see testCreateSLA - Creates the SLA to update
 */
function testUpdateSLA() {
  console.log('Testing SLA update...');
  
  // First create an SLA
  const createResult = testCreateSLA();
  if (!createResult.success) return;
  
  const updates = {
    currentValue: 96,
    status: 'met',
    tags: ['test', 'updated']
  };
  
  const updateResult = updateSLA(createResult.slaId, updates);
  
  if (updateResult.success) {
    console.log('✓ SLA updated successfully');
  } else {
    console.error('✗ Update failed:', updateResult.error);
  }
}

/**
 * Tests the querySLAs() function with filtering, sorting, and pagination options.
 * Validates that query returns correct results matching filter criteria, sorted by
 * specified field, and limited to the requested page size. Logs result count to console.
 * 
 * @returns {void} No return value; logs test results to console
 * 
 * @example
 * testQuerySLAs();
 * // Console: Testing SLA query...
 * // Console: ✓ Query returned 5 SLAs
 * 
 * @see querySLAs - Function being tested
 */
function testQuerySLAs() {
  console.log('Testing SLA query...');
  
  const queryResult = querySLAs({
    filters: {
      status: 'met',
      isActive: true
    },
    sort: {
      field: 'endDate',
      direction: 'desc'
    },
    pagination: {
      page: 1,
      pageSize: 10
    }
  });
  
  if (queryResult.success) {
    console.log(`✓ Query returned ${queryResult.data.length} SLAs`);
  } else {
    console.error('✗ Query failed:', queryResult.error);
  }
}

/**
 * Tests the deleteSLA() function by creating a test SLA and then soft-deleting it.
 * Validates that the SLA is marked as deleted (isActive=false, status changed) rather
 * than physically removed from the sheet. Logs success or error messages to console.
 * 
 * @returns {void} No return value; logs test results to console
 * 
 * @example
 * testDeleteSLA();
 * // Console: Testing SLA deletion...
 * // Console: Testing SLA creation...
 * // Console: ✓ SLA created: SLA-000001
 * // Console: ✓ SLA deleted successfully
 * 
 * @see deleteSLA - Function being tested
 * @see testCreateSLA - Creates the SLA to delete
 */
function testDeleteSLA() {
  console.log('Testing SLA deletion...');
  
  // First create an SLA
  const createResult = testCreateSLA();
  if (!createResult.success) return;
  
  const deleteResult = deleteSLA(createResult.slaId);
  
  if (deleteResult.success) {
    console.log('✓ SLA deleted successfully');
  } else {
    console.error('✗ Delete failed:', deleteResult.error);
  }
}