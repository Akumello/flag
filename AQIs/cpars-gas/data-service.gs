/**
 * CPARS Performance Tracking - Data Service
 * Handles data retrieval, processing, and Google Sheets integration
 */

/**
 * Main data service class for CPARS data management
 */
class CPARSDataService {
  
  constructor() {
    this.config = CONFIG;
    this.cache = {
      data: null,
      timestamp: null,
      ttl: 5 * 60 * 1000 // 5 minutes cache TTL
    };
  }
  
  /**
   * Get CPARS data with caching
   */
  getData() {
    try {
      // Check cache first
      if (this.isCacheValid()) {
        console.log('Returning cached data');
        return {
          success: true,
          data: this.cache.data,
          message: 'Data retrieved from cache',
          cached: true
        };
      }
      
      // Fetch fresh data
      return this.fetchFreshData();
      
    } catch (error) {
      console.error('Error in getData:', error);
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  }
  
  /**
   * Check if cache is valid
   */
  isCacheValid() {
    return this.cache.data && 
           this.cache.timestamp && 
           (Date.now() - this.cache.timestamp) < this.cache.ttl;
  }
  
  /**
   * Fetch fresh data from source
   */
  fetchFreshData() {
    try {
      let data;
      
      // Check if Google Sheets is configured
      if (this.config.SHEETS.SPREADSHEET_ID && 
          this.config.SHEETS.SPREADSHEET_ID !== 'YOUR_SPREADSHEET_ID_HERE') {
        
        console.log('Fetching data from Google Sheets');
        data = this.getDataFromSheets();
        
      } else {
        console.log('Using sample data - no Sheets configuration');
        data = SAMPLE_CPARS_DATA;
      }
      
      // Process and validate data
      const processedData = this.processData(data);
      
      // Update cache
      this.cache.data = processedData;
      this.cache.timestamp = Date.now();
      
      return {
        success: true,
        data: processedData,
        message: `${processedData.length} records loaded successfully`,
        cached: false
      };
      
    } catch (error) {
      console.error('Error fetching fresh data:', error);
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  }
  
  /**
   * Get data from Google Sheets
   */
  getDataFromSheets() {
    try {
      const spreadsheet = SpreadsheetApp.openById(this.config.SHEETS.SPREADSHEET_ID);
      const sheet = spreadsheet.getActiveSheet();
      
      // Get data range
      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();
      
      if (lastRow <= 1) {
        throw new Error('No data found in the spreadsheet');
      }
      
      const range = sheet.getRange(1, 1, lastRow, lastCol);
      const values = range.getValues();
      
      // First row contains headers
      const headers = values[0];
      const dataRows = values.slice(1);
      
      // Convert to objects
      const data = dataRows.map((row, index) => {
        const record = {};
        
        headers.forEach((header, colIndex) => {
          const propName = this.sanitizePropertyName(header);
          let value = row[colIndex];
          
          // Handle different data types
          if (value instanceof Date) {
            value = value.toLocaleDateString();
          } else if (typeof value === 'number') {
            value = value;
          } else {
            value = value ? value.toString().trim() : '';
          }
          
          record[propName] = value;
        });
        
        // Add row number for debugging
        record._rowNumber = index + 2; // +2 because index is 0-based and we skip header
        
        return record;
      });
      
      return data;
      
    } catch (error) {
      console.error('Error reading from Google Sheets:', error);
      throw new Error(`Google Sheets error: ${error.message}`);
    }
  }
  
  /**
   * Process and validate data
   */
  processData(rawData) {
    return rawData.map(record => {
      // Ensure required fields exist
      const processedRecord = {
        contractNumber: record.contractNumber || record.contract_number || '',
        orderNumber: record.orderNumber || record.order_number || '',
        businessUnit: record.businessUnit || record.business_unit || '',
        sector: record.sector || '',
        division: record.division || '',
        coName: record.coName || record.co_name || record.contracting_officer || '',
        periodOfPerformance: record.periodOfPerformance || record.period_of_performance || '',
        evaluationStatus: record.evaluationStatus || record.evaluation_status || '',
        completionStatus: record.completionStatus || record.completion_status || '',
        estimatedEvaluationDate: record.estimatedEvaluationDate || record.estimated_evaluation_date || '',
        daysUntilDue: this.calculateDaysUntilDue(record.estimatedEvaluationDate || record.estimated_evaluation_date)
      };
      
      // Add original record for debugging
      if (record._rowNumber) {
        processedRecord._rowNumber = record._rowNumber;
      }
      
      return processedRecord;
    }).filter(record => {
      // Filter out records with missing critical data
      return record.contractNumber && record.orderNumber;
    });
  }
  
  /**
   * Calculate days until due date
   */
  calculateDaysUntilDue(dateString) {
    if (!dateString) return 0;
    
    try {
      const dueDate = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      dueDate.setHours(0, 0, 0, 0);
      
      const diffTime = dueDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays;
    } catch (error) {
      console.error('Error calculating days until due:', error);
      return 0;
    }
  }
  
  /**
   * Sanitize property names for JavaScript
   */
  sanitizePropertyName(header) {
    return header.toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }
  
  /**
   * Get filter options from current data
   */
  getFilterOptions() {
    try {
      const dataResult = this.getData();
      
      if (!dataResult.success) {
        return dataResult;
      }
      
      const data = dataResult.data;
      
      const businessUnits = [...new Set(data.map(item => item.businessUnit))]
        .filter(unit => unit) // Remove empty values
        .sort();
        
      const completionStatuses = [...new Set(data.map(item => item.completionStatus))]
        .filter(status => status) // Remove empty values
        .sort();
        
      const sectors = [...new Set(data.map(item => item.sector))]
        .filter(sector => sector)
        .sort();
        
      const divisions = [...new Set(data.map(item => item.division))]
        .filter(division => division)
        .sort();
      
      return {
        success: true,
        options: {
          businessUnits,
          completionStatuses,
          sectors,
          divisions
        },
        message: 'Filter options generated successfully'
      };
      
    } catch (error) {
      console.error('Error getting filter options:', error);
      return {
        success: false,
        options: {
          businessUnits: [],
          completionStatuses: [],
          sectors: [],
          divisions: []
        },
        error: error.message
      };
    }
  }
  
  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    try {
      const dataResult = this.getData();
      
      if (!dataResult.success) {
        return dataResult;
      }
      
      const data = dataResult.data;
      
      const stats = {
        total: data.length,
        complete: {
          timely: data.filter(r => r.completionStatus === 'Complete: Timely').length,
          untimely: data.filter(r => r.completionStatus === 'Complete: Untimely').length
        },
        incomplete: {
          due: data.filter(r => r.completionStatus === 'Incomplete: Due').length,
          almostDue: data.filter(r => r.completionStatus === 'Incomplete: Almost Due').length,
          inProgress: data.filter(r => r.completionStatus === 'Incomplete: In Progress').length,
          overdue: data.filter(r => r.completionStatus === 'Incomplete: Overdue').length
        },
        byBusinessUnit: this.getStatsByGroup(data, 'businessUnit'),
        bySector: this.getStatsByGroup(data, 'sector')
      };
      
      return {
        success: true,
        stats: stats,
        message: 'Performance statistics generated successfully'
      };
      
    } catch (error) {
      console.error('Error getting performance stats:', error);
      return {
        success: false,
        stats: {},
        error: error.message
      };
    }
  }
  
  /**
   * Get statistics grouped by a field
   */
  getStatsByGroup(data, groupField) {
    const groups = {};
    
    data.forEach(record => {
      const groupValue = record[groupField] || 'Unknown';
      
      if (!groups[groupValue]) {
        groups[groupValue] = {
          total: 0,
          complete: 0,
          incomplete: 0
        };
      }
      
      groups[groupValue].total++;
      
      if (record.completionStatus.startsWith('Complete:')) {
        groups[groupValue].complete++;
      } else {
        groups[groupValue].incomplete++;
      }
    });
    
    return groups;
  }
  
  /**
   * Clear cache manually
   */
  clearCache() {
    this.cache.data = null;
    this.cache.timestamp = null;
    
    return {
      success: true,
      message: 'Cache cleared successfully'
    };
  }
  
  /**
   * Get cache status
   */
  getCacheStatus() {
    return {
      success: true,
      status: {
        hasData: !!this.cache.data,
        timestamp: this.cache.timestamp,
        isValid: this.isCacheValid(),
        recordCount: this.cache.data ? this.cache.data.length : 0,
        ttl: this.cache.ttl
      }
    };
  }
}

// Create global instance
const dataService = new CPARSDataService();

// Export functions for Google Apps Script
function getCPARSData() {
  return dataService.getData();
}

function getFilterOptions() {
  return dataService.getFilterOptions();
}

function getPerformanceStats() {
  return dataService.getPerformanceStats();
}

function clearDataCache() {
  return dataService.clearCache();
}

function getDataCacheStatus() {
  return dataService.getCacheStatus();
}

/**
 * Refresh data by clearing cache and fetching fresh data
 */
function refreshCPARSData() {
  try {
    dataService.clearCache();
    return dataService.getData();
  } catch (error) {
    console.error('Error refreshing CPARS data:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update a record in Google Sheets (if using Sheets as data source)
 */
function updateCPARSRecord(recordId, updates) {
  try {
    if (!dataService.config.SHEETS.SPREADSHEET_ID || 
        dataService.config.SHEETS.SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID_HERE') {
      throw new Error('Google Sheets not configured for updates');
    }
    
    // Implementation would depend on specific update requirements
    // This is a placeholder for future enhancement
    
    return {
      success: false,
      error: 'Record updates not implemented yet'
    };
    
  } catch (error) {
    console.error('Error updating CPARS record:', error);
    return {
      success: false,
      error: error.message
    };
  }
}