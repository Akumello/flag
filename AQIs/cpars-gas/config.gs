/**
 * CPARS Performance Tracking - Configuration and Sample Data
 * Contains application settings and sample data for local development
 */

/**
 * Application Configuration
 */
const CONFIG = {
  // Environment detection
  isLocalDevelopment: () => {
    try {
      return typeof ScriptApp === 'undefined';
    } catch (e) {
      return true;
    }
  },
  
  // Google Sheets configuration (for production)
  SHEETS: {
    SPREADSHEET_ID: '14ZV2H5ATeVZb7ZFK1pq89ryuSaVuzG8OZeelxBUfKWI', // Replace with actual ID or use "Initialize Sheet" button
    DATA_RANGE: 'CPARS Data!A:K', // Adjust range as needed (sheet name matches the initialized sheet)
  },
  
  // Application settings
  APP: {
    TITLE: 'CPARS Performance Tracking',
    VERSION: '1.0.0',
    MAX_RECORDS_DISPLAY: 1000,
    SEARCH_DEBOUNCE_MS: 300,
  },
  
  // Status classifications
  STATUS: {
    COMPLETE: ['Complete: Timely', 'Complete: Untimely'],
    INCOMPLETE: ['Incomplete: Due', 'Incomplete: Almost Due', 'Incomplete: In Progress', 'Incomplete: Overdue']
  }
};

/**
 * Sample CPARS Performance Data
 * Used for local development and testing
 */
const SAMPLE_CPARS_DATA = [
  {
    contractNumber: 'GS-35F-0119Y',
    orderNumber: '47QMCA22D0001',
    businessUnit: 'FAS IT Category',
    sector: 'Information Technology',
    division: 'Enterprise Infrastructure Solutions',
    coName: 'Sarah Johnson',
    periodOfPerformance: '10/1/2023 - 9/30/2024',
    evaluationStatus: 'In Progress',
    completionStatus: 'Incomplete: Due',
    estimatedEvaluationDate: '11/15/2024',
    daysUntilDue: 15
  },
  {
    contractNumber: 'GS-35F-0122W',
    orderNumber: '47QMCA22D0002',
    businessUnit: 'FAS Professional Services',
    sector: 'Professional Services',
    division: 'Management Consulting',
    coName: 'Michael Chen',
    periodOfPerformance: '3/1/2023 - 2/28/2024',
    evaluationStatus: 'Complete',
    completionStatus: 'Complete: Timely',
    estimatedEvaluationDate: '3/30/2024',
    daysUntilDue: 0
  },
  {
    contractNumber: 'GS-35F-0145T',
    orderNumber: '47QMCA22D0003',
    businessUnit: 'FAS IT Category',
    sector: 'Information Technology',
    division: 'Software Development',
    coName: 'Emily Rodriguez',
    periodOfPerformance: '7/1/2023 - 6/30/2024',
    evaluationStatus: 'Pending Review',
    completionStatus: 'Incomplete: Almost Due',
    estimatedEvaluationDate: '11/10/2024',
    daysUntilDue: 10
  },
  {
    contractNumber: 'GS-35F-0178K',
    orderNumber: '47QMCA22D0004',
    businessUnit: 'FAS Acquisition Services',
    sector: 'Acquisition Management',
    division: 'Strategic Sourcing',
    coName: 'Robert Williams',
    periodOfPerformance: '1/1/2023 - 12/31/2023',
    evaluationStatus: 'Complete',
    completionStatus: 'Complete: Untimely',
    estimatedEvaluationDate: '2/15/2024',
    daysUntilDue: 0
  },
  {
    contractNumber: 'GS-35F-0201M',
    orderNumber: '47QMCA22D0005',
    businessUnit: 'FAS Professional Services',
    sector: 'Professional Services',
    division: 'Financial Management',
    coName: 'Jessica Lee',
    periodOfPerformance: '5/1/2024 - 4/30/2025',
    evaluationStatus: 'Not Started',
    completionStatus: 'Incomplete: In Progress',
    estimatedEvaluationDate: '12/1/2024',
    daysUntilDue: 31
  },
  {
    contractNumber: 'GS-35F-0223P',
    orderNumber: '47QMCA22D0006',
    businessUnit: 'FAS IT Category',
    sector: 'Information Technology',
    division: 'Cybersecurity Services',
    coName: 'David Thompson',
    periodOfPerformance: '8/1/2023 - 7/31/2024',
    evaluationStatus: 'Overdue',
    completionStatus: 'Incomplete: Overdue',
    estimatedEvaluationDate: '9/15/2024',
    daysUntilDue: -56
  },
  {
    contractNumber: 'GS-35F-0267R',
    orderNumber: '47QMCA22D0007',
    businessUnit: 'FAS Acquisition Services',
    sector: 'Acquisition Management',
    division: 'Contract Administration',
    coName: 'Amanda Davis',
    periodOfPerformance: '11/1/2023 - 10/31/2024',
    evaluationStatus: 'Complete',
    completionStatus: 'Complete: Timely',
    estimatedEvaluationDate: '11/30/2024',
    daysUntilDue: 0
  },
  {
    contractNumber: 'GS-35F-0289F',
    orderNumber: '47QMCA22D0008',
    businessUnit: 'FAS Professional Services',
    sector: 'Professional Services',
    division: 'Human Resources',
    coName: 'Christopher Moore',
    periodOfPerformance: '4/1/2024 - 3/31/2025',
    evaluationStatus: 'In Progress',
    completionStatus: 'Incomplete: Due',
    estimatedEvaluationDate: '11/20/2024',
    daysUntilDue: 20
  },
  {
    contractNumber: 'GS-35F-0312N',
    orderNumber: '47QMCA22D0009',
    businessUnit: 'FAS IT Category',
    sector: 'Information Technology',
    division: 'Cloud Computing',
    coName: 'Lisa Anderson',
    periodOfPerformance: '6/1/2023 - 5/31/2024',
    evaluationStatus: 'Complete',
    completionStatus: 'Complete: Timely',
    estimatedEvaluationDate: '6/30/2024',
    daysUntilDue: 0
  },
  {
    contractNumber: 'GS-35F-0334H',
    orderNumber: '47QMCA22D0010',
    businessUnit: 'FAS Acquisition Services',
    sector: 'Acquisition Management',
    division: 'Vendor Management',
    coName: 'Matthew Wilson',
    periodOfPerformance: '9/1/2024 - 8/31/2025',
    evaluationStatus: 'Not Started',
    completionStatus: 'Incomplete: In Progress',
    estimatedEvaluationDate: '1/15/2025',
    daysUntilDue: 76
  },
  {
    contractNumber: 'GS-35F-0356B',
    orderNumber: '47QMCA22D0011',
    businessUnit: 'FAS Professional Services',
    sector: 'Professional Services',
    division: 'Legal Services',
    coName: 'Nicole Garcia',
    periodOfPerformance: '2/1/2024 - 1/31/2025',
    evaluationStatus: 'Pending Review',
    completionStatus: 'Incomplete: Almost Due',
    estimatedEvaluationDate: '11/8/2024',
    daysUntilDue: 8
  },
  {
    contractNumber: 'GS-35F-0378V',
    orderNumber: '47QMCA22D0012',
    businessUnit: 'FAS IT Category',
    sector: 'Information Technology',
    division: 'Data Analytics',
    coName: 'Kevin Martinez',
    periodOfPerformance: '12/1/2023 - 11/30/2024',
    evaluationStatus: 'Overdue',
    completionStatus: 'Incomplete: Overdue',
    estimatedEvaluationDate: '10/15/2024',
    daysUntilDue: -16
  }
];

/**
 * Get unique filter options from data
 */
function getFilterOptions(data = SAMPLE_CPARS_DATA) {
  const businessUnits = [...new Set(data.map(item => item.businessUnit))].sort();
  const completionStatuses = [...new Set(data.map(item => item.completionStatus))].sort();
  
  return {
    businessUnits,
    completionStatuses
  };
}

/**
 * Classify records by completion status
 */
function classifyRecords(data = SAMPLE_CPARS_DATA) {
  const complete = data.filter(record => 
    CONFIG.STATUS.COMPLETE.includes(record.completionStatus)
  );
  
  const incomplete = data.filter(record => 
    CONFIG.STATUS.INCOMPLETE.includes(record.completionStatus)
  );
  
  return { complete, incomplete };
}

// Make functions available globally for Google Apps Script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CONFIG,
    SAMPLE_CPARS_DATA,
    getFilterOptions,
    classifyRecords
  };
}