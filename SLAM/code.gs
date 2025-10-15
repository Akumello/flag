/**
 * SLA Tracker - Google Apps Script Backend
 * Handles data transfer between frontend and Google Sheets
 */

// Configuration constants
const SHEET_NAME = 'SLA_Data';
const ACTIVITY_LOG_SHEET = 'Activity_Log';
const METRICS_SHEET = 'Metrics';

/**
 * Function 1: Accept sample data and populate Google Sheet
 * @param {Object} slaData - The complete SLA data object from frontend
 * @returns {Object} - Success/error response
 */
function populateSheetWithSLAData(slaData) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // Create or clear the main SLA sheet
    let slaSheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!slaSheet) {
      slaSheet = spreadsheet.insertSheet(SHEET_NAME);
    } else {
      slaSheet.clear();
    }
    
    // Create or clear activity log sheet
    let activitySheet = spreadsheet.getSheetByName(ACTIVITY_LOG_SHEET);
    if (!activitySheet) {
      activitySheet = spreadsheet.insertSheet(ACTIVITY_LOG_SHEET);
    } else {
      activitySheet.clear();
    }
    
    // Create or clear metrics sheet
    let metricsSheet = spreadsheet.getSheetByName(METRICS_SHEET);
    if (!metricsSheet) {
      metricsSheet = spreadsheet.insertSheet(METRICS_SHEET);
    } else {
      metricsSheet.clear();
    }
    
    // Set up headers for main SLA sheet
    const slaHeaders = [
      'ID', 'SLA Name', 'Team Name', 'Description', 'Task Name', 'SLA Type',
      'Start Date', 'End Date', 'Status', 'Progress', 'Current Value',
      'Notifications On Risk', 'Notifications On Miss', 'Notification Email',
      'Config Action', 'Config Unit', 'Config Target Type', 'Config Target Min',
      'Config Target Max', 'Config Target Single', 'Config Cadence', 'Config Target Day',
      'Config Target Time', 'Config Schedule', 'Config Start Time', 'Config End Time',
      'Config Timezone', 'Config Days', 'Config Target Value', 'Created Date', 'Updated Date'
    ];
    
    slaSheet.getRange(1, 1, 1, slaHeaders.length).setValues([slaHeaders]);
    slaSheet.getRange(1, 1, 1, slaHeaders.length).setFontWeight('bold');
    
    // Set up headers for activity log sheet
    const activityHeaders = ['SLA ID', 'Type', 'Message', 'Timestamp', 'Created Date'];
    activitySheet.getRange(1, 1, 1, activityHeaders.length).setValues([activityHeaders]);
    activitySheet.getRange(1, 1, 1, activityHeaders.length).setFontWeight('bold');
    
    // Set up headers for metrics sheet (dynamic based on SLA type)
    const metricsHeaders = ['SLA ID', 'Metric Name', 'Metric Value', 'Data Type', 'Created Date'];
    metricsSheet.getRange(1, 1, 1, metricsHeaders.length).setValues([metricsHeaders]);
    metricsSheet.getRange(1, 1, 1, metricsHeaders.length).setFontWeight('bold');
    
    // Populate data
    const currentDate = new Date();
    let slaRowIndex = 2;
    let activityRowIndex = 2;
    let metricsRowIndex = 2;
    
    slaData.slas.forEach(sla => {
      // Prepare SLA row data
      const slaRow = [
        sla.id || '',
        sla.slaName || '',
        sla.teamName || '',
        sla.description || '',
        sla.taskName || '',
        sla.slaType || '',
        sla.startDate || '',
        sla.endDate || '',
        sla.status || '',
        sla.progress || 0,
        sla.currentValue || '',
        sla.notifications?.onRisk || false,
        sla.notifications?.onMiss || false,
        sla.notifications?.email || '',
        sla.configuration?.action || '',
        sla.configuration?.unit || '',
        sla.configuration?.targetType || '',
        sla.configuration?.target?.min || '',
        sla.configuration?.target?.max || '',
        typeof sla.configuration?.target === 'number' ? sla.configuration.target : '',
        sla.configuration?.cadence || '',
        sla.configuration?.targetDay || '',
        sla.configuration?.targetTime || '',
        sla.configuration?.schedule || '',
        sla.configuration?.startTime || '',
        sla.configuration?.endTime || '',
        sla.configuration?.timezone || '',
        Array.isArray(sla.configuration?.days) ? sla.configuration.days.join(',') : '',
        sla.configuration?.targetValue || '',
        currentDate,
        currentDate
      ];
      
      slaSheet.getRange(slaRowIndex, 1, 1, slaRow.length).setValues([slaRow]);
      slaRowIndex++;
      
      // Populate activity log
      if (sla.activityLog && Array.isArray(sla.activityLog)) {
        sla.activityLog.forEach(activity => {
          const activityRow = [
            sla.id,
            activity.type || '',
            activity.message || '',
            activity.timestamp || '',
            currentDate
          ];
          
          activitySheet.getRange(activityRowIndex, 1, 1, activityRow.length).setValues([activityRow]);
          activityRowIndex++;
        });
      }
      
      // Populate metrics
      if (sla.metrics && typeof sla.metrics === 'object') {
        Object.keys(sla.metrics).forEach(metricName => {
          const metricValue = sla.metrics[metricName];
          const dataType = typeof metricValue;
          
          const metricsRow = [
            sla.id,
            metricName,
            metricValue,
            dataType,
            currentDate
          ];
          
          metricsSheet.getRange(metricsRowIndex, 1, 1, metricsRow.length).setValues([metricsRow]);
          metricsRowIndex++;
        });
      }
    });
    
    // Add metadata sheet
    let metadataSheet = spreadsheet.getSheetByName('Metadata');
    if (!metadataSheet) {
      metadataSheet = spreadsheet.insertSheet('Metadata');
    } else {
      metadataSheet.clear();
    }
    
    const metadataHeaders = ['Key', 'Value', 'Updated'];
    metadataSheet.getRange(1, 1, 1, metadataHeaders.length).setValues([metadataHeaders]);
    metadataSheet.getRange(1, 1, 1, metadataHeaders.length).setFontWeight('bold');
    
    const metadataRows = [
      ['timestamp', slaData.timestamp || currentDate.toISOString(), currentDate],
      ['slaCount', slaData.slaCount || slaData.slas.length, currentDate],
      ['lastUpdate', currentDate.toISOString(), currentDate],
      ['version', '1.0', currentDate]
    ];
    
    metadataSheet.getRange(2, 1, metadataRows.length, 3).setValues(metadataRows);
    
    // Auto-resize columns
    slaSheet.autoResizeColumns(1, slaHeaders.length);
    activitySheet.autoResizeColumns(1, activityHeaders.length);
    metricsSheet.autoResizeColumns(1, metricsHeaders.length);
    metadataSheet.autoResizeColumns(1, 3);
    
    return {
      success: true,
      message: `Successfully populated ${slaData.slas.length} SLAs with ${activityRowIndex - 2} activity entries and ${metricsRowIndex - 2} metrics`,
      timestamp: currentDate.toISOString(),
      recordsProcessed: {
        slas: slaData.slas.length,
        activities: activityRowIndex - 2,
        metrics: metricsRowIndex - 2
      }
    };
    
  } catch (error) {
    console.error('Error populating sheet:', error);
    return {
      success: false,
      message: `Error populating sheet: ${error.message}`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Function 2: Read Google Sheet data and convert to JSON format
 * @returns {Object} - SLA data in JSON format matching frontend expectations
 */
function getSheetDataAsJSON() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // Get the main SLA sheet
    const slaSheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!slaSheet) {
      throw new Error(`Sheet "${SHEET_NAME}" not found`);
    }
    
    // Get activity log sheet
    const activitySheet = spreadsheet.getSheetByName(ACTIVITY_LOG_SHEET);
    const metricsSheet = spreadsheet.getSheetByName(METRICS_SHEET);
    const metadataSheet = spreadsheet.getSheetByName('Metadata');
    
    // Read SLA data
    const slaData = slaSheet.getDataRange().getValues();
    if (slaData.length <= 1) {
      return {
        success: true,
        data: {
          timestamp: new Date().toISOString(),
          slaCount: 0,
          slas: []
        }
      };
    }
    
    const slaHeaders = slaData[0];
    const slaRows = slaData.slice(1);
    
    // Read activity log data
    let activityData = {};
    if (activitySheet) {
      const activityValues = activitySheet.getDataRange().getValues();
      if (activityValues.length > 1) {
        const activityHeaders = activityValues[0];
        const activityRows = activityValues.slice(1);
        
        activityRows.forEach(row => {
          const slaId = row[0];
          if (!activityData[slaId]) {
            activityData[slaId] = [];
          }
          
          activityData[slaId].push({
            type: row[1] || '',
            message: row[2] || '',
            timestamp: row[3] || ''
          });
        });
      }
    }
    
    // Read metrics data
    let metricsData = {};
    if (metricsSheet) {
      const metricsValues = metricsSheet.getDataRange().getValues();
      if (metricsValues.length > 1) {
        const metricsHeaders = metricsValues[0];
        const metricsRows = metricsValues.slice(1);
        
        metricsRows.forEach(row => {
          const slaId = row[0];
          const metricName = row[1];
          const metricValue = row[2];
          const dataType = row[3];
          
          if (!metricsData[slaId]) {
            metricsData[slaId] = {};
          }
          
          // Convert metric value back to appropriate type
          switch (dataType) {
            case 'number':
              metricsData[slaId][metricName] = Number(metricValue);
              break;
            case 'boolean':
              metricsData[slaId][metricName] = Boolean(metricValue);
              break;
            default:
              metricsData[slaId][metricName] = metricValue;
          }
        });
      }
    }
    
    // Read metadata
    let metadata = {
      timestamp: new Date().toISOString(),
      slaCount: slaRows.length
    };
    
    if (metadataSheet) {
      const metadataValues = metadataSheet.getDataRange().getValues();
      if (metadataValues.length > 1) {
        const metadataRows = metadataValues.slice(1);
        metadataRows.forEach(row => {
          const key = row[0];
          const value = row[1];
          if (key === 'slaCount') {
            metadata[key] = Number(value);
          } else {
            metadata[key] = value;
          }
        });
      }
    }
    
    // Convert sheet data back to JSON format
    const slas = slaRows.map(row => {
      const slaId = row[0];
      
      // Build configuration object based on SLA type
      const slaType = row[5];
      let configuration = {
        action: row[14] || '',
        unit: row[15] || ''
      };
      
      // Add type-specific configuration
      if (slaType === 'quantity' || slaType === 'percentage') {
        configuration.targetType = row[16] || '';
        if (configuration.targetType === 'range') {
          configuration.target = {
            min: row[17] ? Number(row[17]) : null,
            max: row[18] ? Number(row[18]) : null
          };
        } else {
          configuration.target = row[19] ? Number(row[19]) : null;
        }
      } else if (slaType === 'timeliness') {
        configuration.cadence = row[20] || '';
        configuration.targetDay = row[21] ? Number(row[21]) : null;
        configuration.targetTime = row[22] || '';
      } else if (slaType === 'availability') {
        configuration.schedule = row[23] || '';
        configuration.startTime = row[24] || '';
        configuration.endTime = row[25] || '';
        configuration.timezone = row[26] || '';
        configuration.days = row[27] ? row[27].split(',') : [];
      } else if (slaType === 'compliance') {
        const targetValue = row[28];
        if (targetValue === 'true' || targetValue === true) {
          configuration.targetValue = true;
        } else if (targetValue === 'false' || targetValue === false) {
          configuration.targetValue = false;
        } else {
          configuration.targetValue = targetValue;
        }
      }
      
      return {
        id: slaId,
        slaName: row[1] || '',
        teamName: row[2] || '',
        description: row[3] || '',
        taskName: row[4] || '',
        slaType: slaType,
        startDate: row[6] || '',
        endDate: row[7] || '',
        status: row[8] || '',
        progress: row[9] ? Number(row[9]) : 0,
        currentValue: row[10] || '',
        notifications: {
          onRisk: row[11] === true || row[11] === 'true',
          onMiss: row[12] === true || row[12] === 'true',
          email: row[13] || ''
        },
        configuration: configuration,
        metrics: metricsData[slaId] || {},
        activityLog: activityData[slaId] || []
      };
    });
    
    return {
      success: true,
      data: {
        timestamp: metadata.timestamp,
        slaCount: metadata.slaCount,
        slas: slas
      },
      retrievedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error reading sheet data:', error);
    return {
      success: false,
      message: `Error reading sheet data: ${error.message}`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Web app entry point for handling HTTP requests
 * @param {GoogleAppsScript.Events.DoGet} e - The GET request event
 */
function doGet(e) {
  const action = e.parameter.action;
  
  try {
    switch (action) {
      case 'getAllSLAs':
        return ContentService
          .createTextOutput(JSON.stringify(getSheetDataAsJSON()))
          .setMimeType(ContentService.MimeType.JSON);
      
      default:
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            message: 'Invalid action parameter'
          }))
          .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: error.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Web app entry point for handling HTTP POST requests
 * @param {GoogleAppsScript.Events.DoPost} e - The POST request event
 */
function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    
    switch (action) {
      case 'populateSLAs':
        const result = populateSheetWithSLAData(requestData.data);
        return ContentService
          .createTextOutput(JSON.stringify(result))
          .setMimeType(ContentService.MimeType.JSON);
      
      default:
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            message: 'Invalid action parameter'
          }))
          .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: error.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Helper function to test the population function with sample data
 * This can be run manually from the Apps Script editor
 */
function testPopulateWithSampleData() {
  // Sample data structure for testing
  const sampleData = {
    timestamp: "2024-10-15T20:00:00.000Z",
    slaCount: 3,
    slas: [
      {
        id: "sla-test-001",
        slaName: "Test Document Processing",
        teamName: "Program Management Team",
        description: "Test SLA for document processing",
        taskName: "Task 1",
        slaType: "quantity",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        status: "met",
        progress: 85,
        notifications: {
          onRisk: true,
          onMiss: true,
          email: "test@company.com"
        },
        configuration: {
          action: "processing",
          unit: "documents",
          targetType: "range",
          target: {
            min: 100,
            max: 150
          }
        },
        currentValue: 125,
        metrics: {
          completed: 125,
          inProgress: 10,
          avgProcessingTime: 2.5
        },
        activityLog: [
          {
            type: "success",
            message: "Test activity 1",
            timestamp: "2 hours ago"
          },
          {
            type: "info",
            message: "Test activity 2",
            timestamp: "1 day ago"
          }
        ]
      }
    ]
  };
  
  const result = populateSheetWithSLAData(sampleData);
  console.log('Test result:', result);
  return result;
}

/**
 * Helper function to test the retrieval function
 * This can be run manually from the Apps Script editor
 */
function testGetSheetData() {
  const result = getSheetDataAsJSON();
  console.log('Retrieved data:', result);
  return result;
}