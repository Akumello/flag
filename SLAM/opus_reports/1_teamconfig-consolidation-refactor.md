I'll analyze the code for duplicates and refactoring opportunities. Here's what I found:

## Duplicate Functions and Data

### 1. **Task Count Initialization (Hardcoded vs Dynamic)**

There's still a hardcoded loop reference in command-center.html:

**Line 1479-1481** (the snippet you highlighted):
```javascript
for (let i = 1; i <= 10; i++) {
    taskCounts[`Task ${i}`] = 0;
}
```

But we already fixed this to be dynamic using TEAM_CONFIG. This appears to be leftover code that wasn't fully updated.

### 2. **Team Name Resolution - Multiple Approaches**

We have THREE different ways to get team names:

**a) In `utils.html`** - Now uses TEAM_CONFIG (good):
```javascript
function getTeamName(teamId) {
    if (window.TEAM_CONFIG && window.TEAM_CONFIG._initialized) {
        return window.TEAM_CONFIG.getTeamName(teamId);
    }
    return teamId; // fallback
}
```

**b) In command-center.html line ~1589** - Direct TEAM_CONFIG call:
```javascript
const teamName = window.TEAM_CONFIG.getTaskFromTeamId(teamId);
```

**c) In various render functions** - Mix of both approaches:
```javascript
${getTeamName(sla.teamId) || 'Unknown Team'}  // uses utils function
window.TEAM_CONFIG.getTaskFromTeamId(teamId)  // direct call
```

### 3. **Task Card HTML - Hardcoded in Multiple Places**

Task cards (Task 1-10) are hardcoded in HTML:
- Lines 291-435 in command-center.html
- Similar structure likely exists in `sla.html`

This could be dynamically generated from TEAM_CONFIG data.

### 4. **SLA Data Access Pattern Inconsistencies**

Multiple ways to access SLA data:
```javascript
// Pattern 1
const slaData = window.APP_DATA?.slas || [];

// Pattern 2  
const slas = window.APP_DATA.slas || [];

// Pattern 3
if (!window.APP_DATA || !window.APP_DATA.slas) { ... }
```

### 5. **Custom Fields Extraction**

There's a `getCustomFields()` function being called but not defined in the main file - likely in a module. However, there's also inline parsing:
```javascript
// Pattern 1
const customFields = getCustomFields(sla);

// Pattern 2 (various places)
const cf = JSON.parse(sla.custom_fields_json || sla.customFields || '{}');
```

## Refactoring Recommendations

### 1. **Create a Data Access Layer**

Create a single module for all data access:

```javascript
window.DATA = {
    getSLAs() {
        return window.APP_DATA?.slas || [];
    },
    
    getSLA(slaId) {
        return this.getSLAs().find(s => s.slaId === slaId);
    },
    
    getUserData() {
        return window.APP_DATA?.userData || null;
    },
    
    getCustomFields(sla) {
        if (!sla) return {};
        if (typeof sla.customFields === 'object') return sla.customFields;
        if (typeof sla.customFields === 'string') return JSON.parse(sla.customFields);
        if (typeof sla.custom_fields_json === 'string') return JSON.parse(sla.custom_fields_json);
        return {};
    }
};
```

### 2. **Dynamic Task Card Generation**

Replace hardcoded task cards with dynamic generation:

```javascript
function generateTaskCards() {
    const container = document.getElementById('task-list-container');
    const tasks = window.TEAM_CONFIG.getAllTasks();
    
    container.innerHTML = tasks.map(taskName => {
        const taskNum = taskName.match(/\d+/)[0];
        const teams = window.TEAM_CONFIG.getTeamsForTask(taskName);
        const icon = getTaskIcon(taskNum); // new function for icons
        
        return `
            <div onclick="showTaskSLAs('${taskName}')" class="task-card cursor-pointer...">
                <!-- generated HTML -->
            </div>
        `;
    }).join('');
}
```

### 3. **Consolidate Team/Task Resolution**

Always use TEAM_CONFIG through the utils wrapper:

```javascript
// In utils.html - expand to handle all cases
window.TeamUtils = {
    getTeamName(teamId) {
        return window.TEAM_CONFIG?.getTeamName(teamId) || teamId;
    },
    
    getTaskForTeam(teamId) {
        return window.TEAM_CONFIG?.getTaskFromTeamId(teamId) || null;
    },
    
    getTeamsForTask(taskName) {
        return window.TEAM_CONFIG?.getTeamsForTask(taskName) || [];
    }
};
```

### 4. **Centralize Update Functions**

Consolidate the various update patterns:

```javascript
window.UIUpdater = {
    async refreshAll() {
        await this.refreshSLAs();
        this.updateDashboard();
        this.updateTaskCounts();
        this.updateProfile();
    },
    
    refreshSLAs() {
        return loadSLAsFromBackend();
    },
    
    updateDashboard() {
        if (isDashboardVisible()) {
            updateDashboardStats();
            updateDashboardRecentSLAs();
        }
    },
    
    updateTaskCounts() {
        // Single implementation
    }
};
```

### 5. **Fix Remaining Hardcoded References**

Update line 1479-1481 to use the dynamic approach that's already implemented elsewhere:

```javascript
// REPLACE hardcoded loop
// OLD: for (let i = 1; i <= 10; i++) {

// NEW: Use TEAM_CONFIG
const allTasks = window.TEAM_CONFIG.getAllTasks();
allTasks.forEach(taskName => {
    taskCounts[taskName] = 0;
});
```

### 6. **Create Constants Module**

Move all repeated strings and config to one place:

```javascript
window.CONSTANTS = {
    SLA_TYPES: ['quantity', 'percentage', 'timeliness', 'availability', 'compliance'],
    STATUSES: ['met', 'at-risk', 'ontrack', 'exceeded', 'missed', 'pending', 'not-started'],
    FREQUENCIES: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    
    // Task icons mapping
    TASK_ICONS: {
        'Task 1': 'bi-briefcase',
        'Task 2': 'bi-diagram-3',
        // etc...
    }
};
```

## Immediate Actions Needed

1. **Fix the hardcoded loop** at line 1479-1481
2. **Standardize data access** - use the same pattern everywhere
3. **Generate task cards dynamically** instead of hardcoding HTML
4. **Create a single data access layer** for consistency

Would you like me to implement any of these refactoring suggestions?