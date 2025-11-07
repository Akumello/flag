/**
 * Data Injection Service
 * 
 * Provides functions for server-side data injection into HTML pages.
 * This enables faster initial page loads by embedding data directly in the HTML
 * rather than requiring a round-trip google.script.run call after page load.
 * 
 * @version 1.0.0
 */

/**
 * Gets initial SLA data for server-side injection
 * Called by scriptlet when rendering the HTML page
 * 
 * @returns {Array<Object>} Array of SLA objects in frontend format, or empty array on error
 */
function getInitialSLAData() {
  try {
    console.log('DataInjectionService: Fetching initial SLA data for server-side injection');
    
    // Call querySLAs with no filters to get all data
    const result = querySLAs({
      filters: {},  // No filters - get everything
      sort: { field: 'lastUpdatedAt', direction: 'desc' }
    });
    
    if (!result.success) {
      console.error('DataInjectionService: Failed to query SLAs:', result.error);
      return [];
    }
    
    console.log(`DataInjectionService: Successfully fetched ${result.data.length} SLAs for injection`);
    
    // Convert arrays to strings for frontend compatibility
    // Backend _toCamelCase now produces consistent field names (slaId, slaName, teamId, etc.)
    const transformedData = result.data.map(sla => {
      return {
        ...sla,
        // Convert arrays to comma/semicolon-separated strings
        tags: Array.isArray(sla.tags) ? sla.tags.join(',') : (sla.tags || ''),
        notificationEmails: Array.isArray(sla.notificationEmails) 
          ? sla.notificationEmails.join(';') 
          : (sla.notificationEmails || '')
      };
    });
    
    console.log('DataInjectionService: Data prepared for injection');
    console.log('Sample data format:', transformedData[0] ? Object.keys(transformedData[0]).join(', ') : 'No data');
    return transformedData;
    
  } catch (error) {
    console.error('DataInjectionService: Error fetching initial data:', error);
    console.error('Stack trace:', error.stack);
    return [];
  }
}

/**
 * Gets current user data for server-side injection
 * Looks up user's task assignment from LOOKUP_TEAMS sheet based on email
 * 
 * @returns {Object|null} User data object or null on error
 */
function getInitialUserData() {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    
    if (!userEmail) {
      console.warn('DataInjectionService: No active user email found');
      return null;
    }
    
    console.log('DataInjectionService: Fetching user data for:', userEmail);
    
    // Extract name from email (before @)
    const name = userEmail.split('@')[0];
    
    // Look up user's task from LOOKUP_TEAMS sheet
    let taskTeam = 'Task 1'; // Default fallback
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const teamsSheet = ss.getSheetByName('LOOKUP_TEAMS');
      
      if (teamsSheet) {
        const data = teamsSheet.getDataRange().getValues();
        // Headers: Team ID, Team Name, Department (Task), Manager Email, Is Active
        // Find row where Manager Email (column D, index 3) matches user email
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          const managerEmail = row[3]; // Column D (0-indexed: 3)
          const department = row[2];   // Column C (0-indexed: 2) - contains Task name
          const isActive = row[4];     // Column E (0-indexed: 4)
          
          if (managerEmail === userEmail && isActive) {
            taskTeam = department;
            console.log('DataInjectionService: Found user task assignment:', taskTeam);
            break;
          }
        }
      } else {
        console.warn('DataInjectionService: LOOKUP_TEAMS sheet not found, using default task');
      }
    } catch (error) {
      console.error('DataInjectionService: Error looking up user task:', error);
      // Fall back to default Task 1
    }
    
    // You can expand this to fetch from a users/permissions table if needed
    const userData = {
      email: userEmail,
      name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize first letter
      employeeId: userEmail,
      department: 'General',
      role: 'User',
      taskTeam: taskTeam, // Now dynamically fetched from LOOKUP_TEAMS sheet
      profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4F46E5&color=fff`,
      office: 'Not specified',
      securityLevel: 'Level 1',
      lastLogin: new Date().toISOString(),
      tasksAssigned: 0,
      tasksCompleted: 0,
      tasksOverdue: 0
    };
    
    console.log('DataInjectionService: User data prepared:', userData.email, 'Task:', userData.taskTeam);
    return userData;
    
  } catch (error) {
    console.error('DataInjectionService: Error fetching user data:', error);
    console.error('Stack trace:', error.stack);
    return null;
  }
}

/**
 * Generates the data injection script tag for HTML
 * This is the main function called by the scriptlet in command-center.html
 * 
 * @returns {string} JavaScript code to inject into HTML
 */
function generateDataInjectionScript() {
  try {
    console.log('DataInjectionService: Generating data injection script');
    
    const slas = getInitialSLAData();
    const userData = getInitialUserData();
    const timestamp = new Date().toISOString();
    
    // Create the injection object
    const injectionData = {
      slas: slas,
      userData: userData,
      isDemo: false,
      source: 'server-injection',
      lastSync: timestamp,
      injectedAt: timestamp
    };
    
    // Generate the script content
    const scriptContent = `
// Server-side data injection - Generated at ${timestamp}
window.APP_DATA = ${JSON.stringify(injectionData, null, 2)};

console.log('✅ Server-side data injection complete:', {
  slaCount: window.APP_DATA.slas.length,
  hasUserData: !!window.APP_DATA.userData,
  source: window.APP_DATA.source,
  injectedAt: window.APP_DATA.injectedAt
});
`;
    
    console.log('DataInjectionService: Script generated successfully', {
      slaCount: slas.length,
      hasUserData: !!userData,
      scriptLength: scriptContent.length
    });
    
    return scriptContent;
    
  } catch (error) {
    console.error('DataInjectionService: Error generating injection script:', error);
    console.error('Stack trace:', error.stack);
    
    // Return safe fallback that initializes empty structure
    return `
// Data injection failed - falling back to empty structure
window.APP_DATA = {
  slas: [],
  userData: null,
  isDemo: false,
  source: 'server-injection-failed',
  error: 'Failed to inject data - will attempt to load via google.script.run'
};
console.warn('⚠️ Server-side data injection failed, will load via backend call');
`;
  }
}
