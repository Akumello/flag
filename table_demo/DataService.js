/**
 * Data Service for Google Sheets Integration
 * Handles all data operations including reading from sheets and caching
 */

// Configuration constants
const CONFIG = {
  SHEET_ID: 'your-sheet-id-here', // Replace with your actual sheet ID
  SHEET_NAME: 'TaskData',
  CACHE_DURATION: 300, // 5 minutes in seconds
  CACHE_KEY_PREFIX: 'table_data_'
};

/**
 * Get sample data for the data table
 * First checks cache, then falls back to sheet data or generates sample data
 * @returns {Array<Object>} Array of task data
 */
function getTableData() {
  try {
    const cache = CacheService.getScriptCache();
    const cacheKey = CONFIG.CACHE_KEY_PREFIX + 'all';
    
    // Try to get data from cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log('Returning cached data');
      return JSON.parse(cachedData);
    }
    
    // Try to get data from Google Sheet
    let data = getDataFromSheet();
    
    // If no sheet data available, generate sample data
    if (!data || data.length === 0) {
      console.log('No sheet data found, generating sample data');
      data = generateSampleData(2000);
    }
    
    // Cache the data
    cache.put(cacheKey, JSON.stringify(data), CONFIG.CACHE_DURATION);
    
    return data;
  } catch (error) {
    console.error('Error in getTableData:', error);
    // Fallback to sample data on error
    return generateSampleData(100);
  }
}

/**
 * Get data from Google Sheet
 * @returns {Array<Object>} Array of task data from sheet
 */
function getDataFromSheet() {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      console.log('Sheet is empty or has only headers');
      return [];
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    return rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  } catch (error) {
    console.error('Error reading from sheet:', error);
    return [];
  }
}

/**
 * Generate sample data for demonstration
 * @param {number} size - Number of records to generate
 * @returns {Array<Object>} Array of generated data objects
 */
function generateSampleData(size = 1000) {
  const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Design', 'Product'];
  const priorities = ['High', 'Medium', 'Low'];
  const statuses = ['Complete', 'Incomplete'];
  const taskTypes = ['Website', 'Campaign', 'Report', 'Policy', 'Bug Fix', 'Strategy', 'Presentation', 'Analysis'];
  const names = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'Alex Chen', 'Emma Davis', 'David Brown', 'Lisa Taylor', 'Chris Lee', 'Amy White'];

  const dataset = [];
  for (let i = 1; i <= size; i++) {
    const dept = departments[Math.floor(Math.random() * departments.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    const assignee = names[Math.floor(Math.random() * names.length)];
    
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 60) - 30);
    
    dataset.push({
      id: i,
      taskName: `${taskType} ${dept} Task ${i}`,
      department: dept,
      priority: priority,
      status: status,
      dueDate: dueDate.toISOString().split('T')[0],
      assignee: assignee,
      progress: Math.floor(Math.random() * 101)
    });
  }
  return dataset;
}

/**
 * Clear data cache
 * @returns {Object} Success status
 */
function clearDataCache() {
  try {
    const cache = CacheService.getScriptCache();
    cache.remove(CONFIG.CACHE_KEY_PREFIX + 'all');
    return { success: true, message: 'Cache cleared successfully' };
  } catch (error) {
    console.error('Error clearing cache:', error);
    return { success: false, message: 'Error clearing cache' };
  }
}

/**
 * Initialize sample data sheet
 * Creates a new sheet with sample data for demonstration
 * @returns {Object} Operation result
 */
function initializeSampleSheet() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
    } else {
      sheet.clear(); // Clear existing data
    }
    
    // Add headers
    const headers = ['id', 'taskName', 'department', 'priority', 'status', 'dueDate', 'assignee', 'progress'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Generate and add sample data
    const sampleData = generateSampleData(100);
    const dataRows = sampleData.map(item => 
      headers.map(header => item[header])
    );
    
    sheet.getRange(2, 1, dataRows.length, headers.length).setValues(dataRows);
    
    // Format the sheet
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#2c3e50')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    
    return { 
      success: true, 
      message: `Sheet initialized with ${sampleData.length} records`,
      sheetUrl: spreadsheet.getUrl()
    };
  } catch (error) {
    console.error('Error initializing sheet:', error);
    return { success: false, message: 'Error initializing sheet: ' + error.toString() };
  }
}