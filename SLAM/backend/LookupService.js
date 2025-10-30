// LookupService.js - Lookup data retrieval operations

// ============================================
// PUBLIC API - Lookup Operations
// ============================================

/**
 * Retrieves all teams from the LOOKUP_TEAMS sheet.
 * Returns team IDs and names for dropdown population and validation.
 * 
 * @returns {Object} Result object
 * @returns {boolean} return.success - Whether the operation succeeded
 * @returns {Array<Object>} [return.teams] - Array of team objects with id and name
 * @returns {string} [return.error] - Error message if failed
 * 
 * @example
 * const result = getTeamsFromLookup();
 * // Returns: { success: true, teams: [{id: 'TEAM-001', name: 'Program Management Team'}, ...] }
 */
function getTeamsFromLookup() {
    try {
        console.log('[LookupService] Getting teams from LOOKUP_TEAMS sheet');
        
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const sheet = ss.getSheetByName('LOOKUP_TEAMS');
        
        if (!sheet) {
            console.warn('[LookupService] LOOKUP_TEAMS sheet not found');
            return {
                success: false,
                error: 'LOOKUP_TEAMS sheet not found'
            };
        }
        
        const data = sheet.getDataRange().getValues();
        
        if (data.length <= 1) {
            console.warn('[LookupService] No team data found in LOOKUP_TEAMS');
            return {
                success: true,
                teams: []
            };
        }
        
        const headers = data[0];
        const teamIdIndex = headers.indexOf('Team ID');
        const teamNameIndex = headers.indexOf('Team Name');
        
        if (teamIdIndex === -1 || teamNameIndex === -1) {
            console.error('[LookupService] Required columns not found in LOOKUP_TEAMS');
            return {
                success: false,
                error: 'Required columns (Team ID, Team Name) not found in LOOKUP_TEAMS'
            };
        }
        
        const teams = [];
        for (let i = 1; i < data.length; i++) {
            const teamId = data[i][teamIdIndex];
            const teamName = data[i][teamNameIndex];
            
            if (teamId && teamName) {
                teams.push({
                    id: String(teamId).trim(),
                    name: String(teamName).trim()
                });
            }
        }
        
        console.log(`[LookupService] Retrieved ${teams.length} teams from LOOKUP_TEAMS`);
        
        return {
            success: true,
            teams: teams
        };
        
    } catch (error) {
        console.error('[LookupService] Error getting teams from lookup:', error);
        return {
            success: false,
            error: error.message || 'Unknown error occurred'
        };
    }
}

/**
 * Retrieves all tasks from the LOOKUP_TASKS sheet.
 * Returns task IDs and names for dropdown population.
 * 
 * @returns {Object} Result object
 * @returns {boolean} return.success - Whether the operation succeeded
 * @returns {Array<Object>} [return.tasks] - Array of task objects with id and name
 * @returns {string} [return.error] - Error message if failed
 * 
 * @example
 * const result = getTasksFromLookup();
 * // Returns: { success: true, tasks: [{id: 'TASK-001', name: 'Task 1'}, ...] }
 */
function getTasksFromLookup() {
    try {
        console.log('[LookupService] Getting tasks from LOOKUP_TASKS sheet');
        
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const sheet = ss.getSheetByName('LOOKUP_TASKS');
        
        if (!sheet) {
            console.warn('[LookupService] LOOKUP_TASKS sheet not found');
            return {
                success: false,
                error: 'LOOKUP_TASKS sheet not found'
            };
        }
        
        const data = sheet.getDataRange().getValues();
        
        if (data.length <= 1) {
            console.warn('[LookupService] No task data found in LOOKUP_TASKS');
            return {
                success: true,
                tasks: []
            };
        }
        
        const headers = data[0];
        const taskIdIndex = headers.indexOf('Task ID');
        const taskNameIndex = headers.indexOf('Task Name');
        
        if (taskIdIndex === -1 || taskNameIndex === -1) {
            console.error('[LookupService] Required columns not found in LOOKUP_TASKS');
            return {
                success: false,
                error: 'Required columns (Task ID, Task Name) not found in LOOKUP_TASKS'
            };
        }
        
        const tasks = [];
        for (let i = 1; i < data.length; i++) {
            const taskId = data[i][taskIdIndex];
            const taskName = data[i][taskNameIndex];
            
            if (taskId && taskName) {
                tasks.push({
                    id: String(taskId).trim(),
                    name: String(taskName).trim()
                });
            }
        }
        
        console.log(`[LookupService] Retrieved ${tasks.length} tasks from LOOKUP_TASKS`);
        
        return {
            success: true,
            tasks: tasks
        };
        
    } catch (error) {
        console.error('[LookupService] Error getting tasks from lookup:', error);
        return {
            success: false,
            error: error.message || 'Unknown error occurred'
        };
    }
}

/**
 * Retrieves the complete task-team mapping configuration.
 * This is the single source of truth for which teams belong to which tasks.
 * Returns mapping object with task names as keys and team arrays as values,
 * plus reverse lookup maps for convenience.
 * 
 * @returns {Object} Result object
 * @returns {boolean} return.success - Whether the operation succeeded
 * @returns {Object} [return.mapping] - Task to teams mapping {taskName: [{id, name}, ...]}
 * @returns {Object} [return.teamToTask] - Team ID to task name reverse lookup
 * @returns {Object} [return.teamIdToName] - Team ID to team name lookup
 * @returns {Object} [return.teamNameToId] - Team name to team ID lookup
 * @returns {string} [return.error] - Error message if failed
 * 
 * @example
 * const result = getTaskTeamMapping();
 * // Returns: { 
 * //   success: true, 
 * //   mapping: {'Task 1': [{id: 'TEAM-001', name: 'Program Management Team'}], ...},
 * //   teamToTask: {'TEAM-001': 'Task 1', ...},
 * //   teamIdToName: {'TEAM-001': 'Program Management Team', ...},
 * //   teamNameToId: {'Program Management Team': 'TEAM-001', ...}
 * // }
 */
function getTaskTeamMapping() {
    try {
        console.log('[LookupService] Building task-team mapping');
        
        // This is the single source of truth for task-team relationships
        // Update this mapping when teams change
        const mapping = {
            'Task 1': [
                {id: 'TEAM-001', name: 'Program Management Team'}
            ],
            'Task 2': [
                {id: 'TEAM-002', name: 'APM Team'},
                {id: 'TEAM-010', name: 'TW/Template Team'},
                {id: 'TEAM-011', name: 'Cost Team'}
            ],
            'Task 3': [
                {id: 'TEAM-003', name: 'PPM Team'}
            ],
            'Task 4': [
                {id: 'TEAM-004', name: 'Technical Evaluation Team'}
            ],
            'Task 5': [
                {id: 'TEAM-005', name: 'Training Support Team'}
            ],
            'Task 6': [
                {id: 'TEAM-006', name: 'Business Intelligence Team'}
            ],
            'Task 7': [
                {id: 'TEAM-007', name: 'Operational Support Team'}
            ],
            'Task 8': [
                {id: 'TEAM-008', name: 'Quality Support Team'}
            ],
            'Task 9': [
                {id: 'TEAM-009', name: 'Communication Team'}
            ]
        };
        
        // Build reverse lookup: team ID -> task name
        const teamToTask = {};
        const teamIdToName = {};
        const teamNameToId = {};
        
        for (const [taskName, teams] of Object.entries(mapping)) {
            teams.forEach(team => {
                teamToTask[team.id] = taskName;
                teamIdToName[team.id] = team.name;
                teamNameToId[team.name] = team.id;
            });
        }
        
        console.log('[LookupService] Task-team mapping built successfully');
        console.log(`[LookupService] Total tasks: ${Object.keys(mapping).length}`);
        console.log(`[LookupService] Total teams: ${Object.keys(teamToTask).length}`);
        
        return {
            success: true,
            mapping: mapping,
            teamToTask: teamToTask,
            teamIdToName: teamIdToName,
            teamNameToId: teamNameToId
        };
        
    } catch (error) {
        console.error('[LookupService] Error building task-team mapping:', error);
        return {
            success: false,
            error: error.message || 'Unknown error occurred'
        };
    }
}
