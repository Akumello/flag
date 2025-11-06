# SLA Tracking App Requirements
Created: 9/22/2025, 9:48:07 PM
Last Updated: 9/22/2025, 9:48:07 PM
---

### User

I have to make an app to track service level agreements across tasks. I need the following requirements:
- I need a page to submit a new SLA, which will be tied to a task name.
- SLAs can come in many forms like counting towards a goal, uptime, checking off predefined tasks toward a goal, and many more. I want the ability to pick a type which switches the interface to take the data that is related to that type of SLA
- Please throw in any other features you know of that is standard for SLA tracking software
- Follow best practices and make a professional app
- This should be vanilla html, css, javascript with tailwind


---

### Assistant (claude-4-sonnet-reasoning)

<details>
<summary>Reasoning</summary>

The user wants an SLA tracking application with specific requirements. Let me break down what they need:

1. A page to submit new SLAs tied to task names
2. Different SLA types with dynamic interfaces:
   - Counting towards a goal
   - Uptime monitoring
   - Predefined task checklists
   - Other types
3. Standard SLA tracking features
4. Professional, best practices
5. Vanilla HTML/CSS/JS with Tailwind

Standard SLA tracking features typically include:
- Dashboard/overview
- SLA templates
- Monitoring and alerts
- Reporting and analytics
- Status tracking (met/missed/at risk)
- Historical data
- Notifications
- User management
- Categories/tags
- Priority levels
- Time periods (daily, weekly, monthly, etc.)
- Escalation procedures
- Comments/notes

I'll create a multi-page application with:
1. Dashboard page
2. Create SLA page with dynamic forms
3. SLA list/management page
4. Individual SLA detail page

For SLA types, I'll include:
- Performance Goal (counting towards target)
- Uptime Monitoring (percentage based)
- Task Checklist (completion based)
- Response Time (time-based metrics)
- Availability (time windows)

I'll use modern JavaScript practices, responsive design, and good UX patterns.
</details>

I'll create a comprehensive SLA tracking application for you. Here's a professional solution with multiple pages and features:

## File Structure
```
sla-tracker/
├── index.html (Dashboard)
├── create-sla.html
├── sla-list.html
├── sla-detail.html
├── css/
│   └── styles.css
└── js/
    ├── app.js
    ├── dashboard.js
    ├── create-sla.js
    ├── sla-list.js
    └── sla-detail.js
```

## 1. Dashboard (index.html)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SLA Tracker - Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="css/styles.css">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#3B82F6',
                        secondary: '#64748B',
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center">
                    <h1 class="text-xl font-semibold text-gray-900">SLA Tracker</h1>
                </div>
                <div class="flex space-x-4">
                    <a href="index.html" class="text-primary font-medium">Dashboard</a>
                    <a href="create-sla.html" class="text-gray-600 hover:text-gray-900">Create SLA</a>
                    <a href="sla-list.html" class="text-gray-600 hover:text-gray-900">All SLAs</a>
                </div>
            </div>
        </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white p-6 rounded-lg shadow-sm">
                <div class="flex items-center">
                    <div class="flex-1">
                        <p class="text-sm font-medium text-gray-600">Total SLAs</p>
                        <p class="text-3xl font-bold text-gray-900" id="totalSlas">0</p>
                    </div>
                    <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span class="text-blue-600">📊</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow-sm">
                <div class="flex items-center">
                    <div class="flex-1">
                        <p class="text-sm font-medium text-gray-600">Met SLAs</p>
                        <p class="text-3xl font-bold text-green-600" id="metSlas">0</p>
                    </div>
                    <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <span class="text-green-600">✅</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow-sm">
                <div class="flex items-center">
                    <div class="flex-1">
                        <p class="text-sm font-medium text-gray-600">At Risk</p>
                        <p class="text-3xl font-bold text-yellow-600" id="atRiskSlas">0</p>
                    </div>
                    <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <span class="text-yellow-600">⚠️</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow-sm">
                <div class="flex items-center">
                    <div class="flex-1">
                        <p class="text-sm font-medium text-gray-600">Missed SLAs</p>
                        <p class="text-3xl font-bold text-red-600" id="missedSlas">0</p>
                    </div>
                    <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <span class="text-red-600">❌</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Activity -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="bg-white rounded-lg shadow-sm p-6">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-semibold text-gray-900">Recent SLAs</h2>
                    <a href="sla-list.html" class="text-primary text-sm hover:underline">View all</a>
                </div>
                <div id="recentSlas" class="space-y-4">
                    <!-- Recent SLAs will be populated here -->
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">SLA Performance</h2>
                <div id="performanceChart" class="h-64 flex items-center justify-center text-gray-500">
                    Chart will be displayed here
                </div>
            </div>
        </div>
    </div>

    <script src="js/app.js"></script>
    <script src="js/dashboard.js"></script>
</body>
</html>
```

## 2. Create SLA Page (create-sla.html)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Create SLA - SLA Tracker</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body class="bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center">
                    <h1 class="text-xl font-semibold text-gray-900">SLA Tracker</h1>
                </div>
                <div class="flex space-x-4">
                    <a href="index.html" class="text-gray-600 hover:text-gray-900">Dashboard</a>
                    <a href="create-sla.html" class="text-primary font-medium">Create SLA</a>
                    <a href="sla-list.html" class="text-gray-600 hover:text-gray-900">All SLAs</a>
                </div>
            </div>
        </div>
    </nav>

    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="bg-white rounded-lg shadow-sm p-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Create New SLA</h2>
            
            <form id="createSlaForm" class="space-y-6">
                <!-- Basic Information -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label for="taskName" class="block text-sm font-medium text-gray-700 mb-2">Task Name</label>
                        <input type="text" id="taskName" name="taskName" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                    </div>
                    
                    <div>
                        <label for="priority" class="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                        <select id="priority" name="priority" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                            <option value="">Select Priority</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label for="description" class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea id="description" name="description" rows="3" required
                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                              placeholder="Describe the SLA requirements and objectives..."></textarea>
                </div>

                <!-- SLA Type Selection -->
                <div>
                    <label for="slaType" class="block text-sm font-medium text-gray-700 mb-2">SLA Type</label>
                    <select id="slaType" name="slaType" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                        <option value="">Select SLA Type</option>
                        <option value="performance">Performance Goal</option>
                        <option value="uptime">Uptime Monitoring</option>
                        <option value="checklist">Task Checklist</option>
                        <option value="response-time">Response Time</option>
                        <option value="availability">Availability Window</option>
                    </select>
                </div>

                <!-- Dynamic SLA Configuration -->
                <div id="slaConfig" class="hidden">
                    <!-- Performance Goal -->
                    <div id="performanceConfig" class="sla-config-section hidden">
                        <h3 class="text-lg font-medium text-gray-900 mb-4">Performance Goal Configuration</h3>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label for="targetValue" class="block text-sm font-medium text-gray-700 mb-2">Target Value</label>
                                <input type="number" id="targetValue" name="targetValue"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                            </div>
                            <div>
                                <label for="currentValue" class="block text-sm font-medium text-gray-700 mb-2">Current Value</label>
                                <input type="number" id="currentValue" name="currentValue" value="0"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                            </div>
                            <div>
                                <label for="unit" class="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                                <input type="text" id="unit" name="unit" placeholder="e.g., requests, items"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                            </div>
                        </div>
                    </div>

                    <!-- Uptime Configuration -->
                    <div id="uptimeConfig" class="sla-config-section hidden">
                        <h3 class="text-lg font-medium text-gray-900 mb-4">Uptime Monitoring Configuration</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="uptimeTarget" class="block text-sm font-medium text-gray-700 mb-2">Target Uptime (%)</label>
                                <input type="number" id="uptimeTarget" name="uptimeTarget" min="0" max="100" step="0.01"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                            </div>
                            <div>
                                <label for="monitoringUrl" class="block text-sm font-medium text-gray-700 mb-2">Service URL</label>
                                <input type="url" id="monitoringUrl" name="monitoringUrl"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                            </div>
                        </div>
                    </div>

                    <!-- Checklist Configuration -->
                    <div id="checklistConfig" class="sla-config-section hidden">
                        <h3 class="text-lg font-medium text-gray-900 mb-4">Task Checklist Configuration</h3>
                        <div id="checklistItems" class="space-y-3">
                            <div class="flex gap-3">
                                <input type="text" placeholder="Enter checklist item" 
                                       class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary checklist-item">
                                <button type="button" onclick="removeChecklistItem(this)" 
                                        class="px-3 py-2 text-red-600 hover:text-red-800">Remove</button>
                            </div>
                        </div>
                        <button type="button" id="addChecklistItem" 
                                class="mt-3 px-4 py-2 text-primary border border-primary rounded-md hover:bg-primary hover:text-white">
                            Add Item
                        </button>
                    </div>

                    <!-- Response Time Configuration -->
                    <div id="responseTimeConfig" class="sla-config-section hidden">
                        <h3 class="text-lg font-medium text-gray-900 mb-4">Response Time Configuration</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="maxResponseTime" class="block text-sm font-medium text-gray-700 mb-2">Maximum Response Time</label>
                                <input type="number" id="maxResponseTime" name="maxResponseTime"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                            </div>
                            <div>
                                <label for="responseTimeUnit" class="block text-sm font-medium text-gray-700 mb-2">Time Unit</label>
                                <select id="responseTimeUnit" name="responseTimeUnit"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                                    <option value="seconds">Seconds</option>
                                    <option value="minutes">Minutes</option>
                                    <option value="hours">Hours</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Availability Configuration -->
                    <div id="availabilityConfig" class="sla-config-section hidden">
                        <h3 class="text-lg font-medium text-gray-900 mb-4">Availability Window Configuration</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="startTime" class="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                                <input type="time" id="startTime" name="startTime"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                            </div>
                            <div>
                                <label for="endTime" class="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                                <input type="time" id="endTime" name="endTime"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                            </div>
                        </div>
                        <div class="mt-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Days of Week</label>
                            <div class="grid grid-cols-7 gap-2">
                                <label class="flex items-center"><input type="checkbox" name="days" value="monday" class="mr-1"> Mon</label>
                                <label class="flex items-center"><input type="checkbox" name="days" value="tuesday" class="mr-1"> Tue</label>
                                <label class="flex items-center"><input type="checkbox" name="days" value="wednesday" class="mr-1"> Wed</label>
                                <label class="flex items-center"><input type="checkbox" name="days" value="thursday" class="mr-1"> Thu</label>
                                <label class="flex items-center"><input type="checkbox" name="days" value="friday" class="mr-1"> Fri</label>
                                <label class="flex items-center"><input type="checkbox" name="days" value="saturday" class="mr-1"> Sat</label>
                                <label class="flex items-center"><input type="checkbox" name="days" value="sunday" class="mr-1"> Sun</label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Time Period -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label for="startDate" class="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                        <input type="date" id="startDate" name="startDate" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                    </div>
                    
                    <div>
                        <label for="endDate" class="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                        <input type="date" id="endDate" name="endDate"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                    </div>
                </div>

                <!-- Notification Settings -->
                <div>
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Notification Settings</h3>
                    <div class="space-y-3">
                        <label class="flex items-center">
                            <input type="checkbox" id="notifyOnRisk" name="notifyOnRisk" class="mr-2">
                            <span class="text-sm text-gray-700">Notify when SLA is at risk</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" id="notifyOnMiss" name="notifyOnMiss" class="mr-2">
                            <span class="text-sm text-gray-700">Notify when SLA is missed</span>
                        </label>
                        <div class="mt-3">
                            <label for="notificationEmail" class="block text-sm font-medium text-gray-700 mb-2">Notification Email</label>
                            <input type="email" id="notificationEmail" name="notificationEmail"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                        </div>
                    </div>
                </div>

                <!-- Submit Button -->
                <div class="flex justify-end space-x-4">
                    <a href="index.html" class="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</a>
                    <button type="submit" class="px-6 py-2 bg-primary text-white rounded-md hover:bg-blue-600">Create SLA</button>
                </div>
            </form>
        </div>
    </div>

    <script src="js/app.js"></script>
    <script src="js/create-sla.js"></script>
</body>
</html>
```

## 3. SLA List Page (sla-list.html)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>All SLAs - SLA Tracker</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body class="bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center">
                    <h1 class="text-xl font-semibold text-gray-900">SLA Tracker</h1>
                </div>
                <div class="flex space-x-4">
                    <a href="index.html" class="text-gray-600 hover:text-gray-900">Dashboard</a>
                    <a href="create-sla.html" class="text-gray-600 hover:text-gray-900">Create SLA</a>
                    <a href="sla-list.html" class="text-primary font-medium">All SLAs</a>
                </div>
            </div>
        </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Header and Filters -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 class="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">All SLAs</h2>
            <div class="flex flex-col sm:flex-row gap-4">
                <select id="statusFilter" class="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                    <option value="">All Statuses</option>
                    <option value="met">Met</option>
                    <option value="at-risk">At Risk</option>
                    <option value="missed">Missed</option>
                </select>
                <select id="priorityFilter" class="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                    <option value="">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                </select>
                <input type="text" id="searchInput" placeholder="Search SLAs..." 
                       class="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
            </div>
        </div>

        <!-- SLA Table -->
        <div class="bg-white rounded-lg shadow-sm overflow-hidden">
            <table class="w-full">
                <thead class="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Name</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody id="slaTableBody" class="bg-white divide-y divide-gray-200">
                    <!-- SLA rows will be populated here -->
                </tbody>
            </table>
            
            <div id="emptyState" class="hidden py-12 text-center">
                <p class="text-gray-500 text-lg mb-4">No SLAs found</p>
                <a href="create-sla.html" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600">Create Your First SLA</a>
            </div>
        </div>
    </div>

    <script src="js/app.js"></script>
    <script src="js/sla-list.js"></script>
</body>
</html>
```

## 4. SLA Detail Page (sla-detail.html)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SLA Details - SLA Tracker</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body class="bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center">
                    <h1 class="text-xl font-semibold text-gray-900">SLA Tracker</h1>
                </div>
                <div class="flex space-x-4">
                    <a href="index.html" class="text-gray-600 hover:text-gray-900">Dashboard</a>
                    <a href="create-sla.html" class="text-gray-600 hover:text-gray-900">Create SLA</a>
                    <a href="sla-list.html" class="text-gray-600 hover:text-gray-900">All SLAs</a>
                </div>
            </div>
        </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex items-center justify-between mb-6">
            <div class="flex items-center">
                <a href="sla-list.html" class="mr-4 text-gray-600 hover:text-gray-900">← Back to List</a>
                <h2 id="slaTitle" class="text-2xl font-bold text-gray-900">SLA Details</h2>
            </div>
            <div class="flex space-x-3">
                <button id="updateProgressBtn" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Update Progress</button>
                <button id="editBtn" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">Edit</button>
                <button id="deleteBtn" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Delete</button>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Main Content -->
            <div class="lg:col-span-2 space-y-6">
                <!-- SLA Overview -->
                <div class="bg-white rounded-lg shadow-sm p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Overview</h3>
                    <div id="slaOverview" class="space-y-4">
                        <!-- Overview content will be populated here -->
                    </div>
                </div>

                <!-- Progress Tracking -->
                <div class="bg-white rounded-lg shadow-sm p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Progress Tracking</h3>
                    <div id="progressTracking" class="space-y-4">
                        <!-- Progress content will be populated here -->
                    </div>
                </div>

                <!-- Activity Log -->
                <div class="bg-white rounded-lg shadow-sm p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Activity Log</h3>
                    <div id="activityLog" class="space-y-3">
                        <!-- Activity log will be populated here -->
                    </div>
                </div>
            </div>

            <!-- Sidebar -->
            <div class="space-y-6">
                <!-- Status Card -->
                <div class="bg-white rounded-lg shadow-sm p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Status</h3>
                    <div id="statusInfo" class="space-y-3">
                        <!-- Status info will be populated here -->
                    </div>
                </div>

                <!-- Quick Stats -->
                <div class="bg-white rounded-lg shadow-sm p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                    <div id="quickStats" class="space-y-3">
                        <!-- Quick stats will be populated here -->
                    </div>
                </div>

                <!-- Notifications -->
                <div class="bg-white rounded-lg shadow-sm p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
                    <div id="notificationSettings" class="space-y-3">
                        <!-- Notification settings will be populated here -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Update Progress Modal -->
    <div id="updateModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Update Progress</h3>
            <div id="updateForm">
                <!-- Update form will be populated based on SLA type -->
            </div>
            <div class="flex justify-end space-x-3 mt-6">
                <button id="cancelUpdate" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">Cancel</button>
                <button id="saveUpdate" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600">Save</button>
            </div>
        </div>
    </div>

    <script src="js/app.js"></script>
    <script src="js/sla-detail.js"></script>
</body>
</html>
```

Now I'll provide the JavaScript files to make this application fully functional:

## 5. Core JavaScript (js/app.js)

```javascript
// SLA Tracker App - Core functionality
class SLATracker {
    constructor() {
        this.slas = this.loadSLAs();
        this.initializeApp();
    }

    initializeApp() {
        // Set default start date to today
        const today = new Date().toISOString().split('T')[0];
        const startDateInput = document.getElementById('startDate');
        if (startDateInput) {
            startDateInput.value = today;
        }
    }

    loadSLAs() {
        const stored = localStorage.getItem('slaTracker_slas');
        return stored ? JSON.parse(stored) : [];
    }

    saveSLAs() {
        localStorage.setItem('slaTracker_slas', JSON.stringify(this.slas));
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    createSLA(slaData) {
        const newSLA = {
            id: this.generateId(),
            ...slaData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: this.calculateStatus(slaData),
            activityLog: [{
                timestamp: new Date().toISOString(),
                action: 'created',
                description: 'SLA created'
            }]
        };

        this.slas.push(newSLA);
        this.saveSLAs();
        return newSLA;
    }

    updateSLA(id, updates) {
        const slaIndex = this.slas.findIndex(sla => sla.id === id);
        if (slaIndex !== -1) {
            this.slas[slaIndex] = {
                ...this.slas[slaIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.slas[slaIndex].status = this.calculateStatus(this.slas[slaIndex]);
            
            // Add to activity log
            this.slas[slaIndex].activityLog.push({
                timestamp: new Date().toISOString(),
                action: 'updated',
                description: 'SLA progress updated'
            });
            
            this.saveSLAs();
            return this.slas[slaIndex];
        }
        return null;
    }

    deleteSLA(id) {
        const slaIndex = this.slas.findIndex(sla => sla.id === id);
        if (slaIndex !== -1) {
            this.slas.splice(slaIndex, 1);
            this.saveSLAs();
            return true;
        }
        return false;
    }

    getSLA(id) {
        return this.slas.find(sla => sla.id === id);
    }

    getAllSLAs() {
        return this.slas.map(sla => ({
            ...sla,
            status: this.calculateStatus(sla)
        }));
    }

    calculateStatus(sla) {
        const now = new Date();
        const endDate = sla.endDate ? new Date(sla.endDate) : null;
        
        // Check if SLA is expired
        if (endDate && now > endDate) {
            return this.calculateProgress(sla) >= 100 ? 'met' : 'missed';
        }

        const progress = this.calculateProgress(sla);
        
        // Calculate time-based risk
        if (endDate) {
            const totalTime = endDate.getTime() - new Date(sla.startDate).getTime();
            const timeElapsed = now.getTime() - new Date(sla.startDate).getTime();
            const timeProgress = (timeElapsed / totalTime) * 100;
            
            // At risk if progress is significantly behind time
            if (timeProgress > progress + 20 && progress < 100) {
                return 'at-risk';
            }
        }

        return progress >= 100 ? 'met' : progress >= 80 ? 'on-track' : 'at-risk';
    }

    calculateProgress(sla) {
        switch (sla.slaType) {
            case 'performance':
                const current = parseFloat(sla.currentValue) || 0;
                const target = parseFloat(sla.targetValue) || 1;
                return Math.min((current / target) * 100, 100);

            case 'uptime':
                return parseFloat(sla.currentUptime) || 0;

            case 'checklist':
                if (!sla.checklistItems || sla.checklistItems.length === 0) return 0;
                const completed = sla.checklistItems.filter(item => item.completed).length;
                return (completed / sla.checklistItems.length) * 100;

            case 'response-time':
                const avgResponse = parseFloat(sla.averageResponseTime) || 0;
                const maxResponse = parseFloat(sla.maxResponseTime) || 1;
                return avgResponse <= maxResponse ? 100 : 0;

            case 'availability':
                return parseFloat(sla.availabilityPercentage) || 0;

            default:
                return 0;
        }
    }

    getStats() {
        const slas = this.getAllSLAs();
        return {
            total: slas.length,
            met: slas.filter(sla => sla.status === 'met').length,
            atRisk: slas.filter(sla => sla.status === 'at-risk').length,
            missed: slas.filter(sla => sla.status === 'missed').length
        };
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    }

    formatDateTime(dateString) {
        return new Date(dateString).toLocaleString();
    }

    getStatusBadgeClass(status) {
        switch (status) {
            case 'met': return 'bg-green-100 text-green-800';
            case 'at-risk': return 'bg-yellow-100 text-yellow-800';
            case 'missed': return 'bg-red-100 text-red-800';
            case 'on-track': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    getPriorityBadgeClass(priority) {
        switch (priority) {
            case 'critical': return 'bg-red-100 text-red-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }
}

// Initialize global app instance
window.slaTracker = new SLATracker();

// Utility functions
function showNotification(message, type = 'success') {
    // Create a simple notification system
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-md z-50 ${
        type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function formatProgressBar(progress) {
    const percentage = Math.round(progress);
    const colorClass = percentage >= 80 ? 'bg-green-500' : 
                       percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500';
    
    return `
        <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="${colorClass} h-2 rounded-full" style="width: ${percentage}%"></div>
        </div>
        <span class="text-sm text-gray-600 ml-2">${percentage}%</span>
    `;
}
```

## 6. Dashboard JavaScript (js/dashboard.js)

```javascript
// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
});

function loadDashboardData() {
    const stats = window.slaTracker.getStats();
    const slas = window.slaTracker.getAllSLAs();

    // Update stats cards
    document.getElementById('totalSlas').textContent = stats.total;
    document.getElementById('metSlas').textContent = stats.met;
    document.getElementById('atRiskSlas').textContent = stats.atRisk;
    document.getElementById('missedSlas').textContent = stats.missed;

    // Load recent SLAs
    loadRecentSLAs(slas);
}

function loadRecentSLAs(slas) {
    const recentSLAsContainer = document.getElementById('recentSlas');
    const recentSLAs = slas
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    if (recentSLAs.length === 0) {
        recentSLAsContainer.innerHTML = `
            <div class="text-center py-8">
                <p class="text-gray-500 mb-4">No SLAs created yet</p>
                <a href="create-sla.html" class="text-primary hover:underline">Create your first SLA</a>
            </div>
        `;
        return;
    }

    recentSLAsContainer.innerHTML = recentSLAs.map(sla => {
        const progress = window.slaTracker.calculateProgress(sla);
        return `
            <div class="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div class="flex-1">
                    <h4 class="text-sm font-medium text-gray-900">
                        <a href="sla-detail.html?id=${sla.id}" class="hover:text-primary">
                            ${sla.taskName}
                        </a>
                    </h4>
                    <p class="text-xs text-gray-500">${sla.slaType.replace('-', ' ').toUpperCase()}</p>
                </div>
                <div class="flex items-center space-x-3">
                    <div class="flex items-center space-x-2">
                        ${formatProgressBar(progress)}
                    </div>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${window.slaTracker.getStatusBadgeClass(sla.status)}">
                        ${sla.status.replace('-', ' ')}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}
```

## 7. Create SLA JavaScript (js/create-sla.js)

```javascript
// Create SLA functionality
document.addEventListener('DOMContentLoaded', function() {
    const slaTypeSelect = document.getElementById('slaType');
    const createSlaForm = document.getElementById('createSlaForm');
    const slaConfigSection = document.getElementById('slaConfig');

    // Handle SLA type change
    slaTypeSelect.addEventListener('change', function() {
        const selectedType = this.value;
        showSLAConfig(selectedType);
    });

    // Handle form submission
    createSlaForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleCreateSLA();
    });

    // Add checklist item functionality
    document.getElementById('addChecklistItem')?.addEventListener('click', addChecklistItem);

    setupChecklistHandlers();
});

function showSLAConfig(type) {
    const slaConfigSection = document.getElementById('slaConfig');
    const allConfigs = document.querySelectorAll('.sla-config-section');
    
    // Hide all config sections
    allConfigs.forEach(config => config.classList.add('hidden'));
    
    if (type) {
        slaConfigSection.classList.remove('hidden');
        const targetConfig = document.getElementById(`${type.replace('-', '')}Config`);
        if (targetConfig) {
            targetConfig.classList.remove('hidden');
        }
    } else {
        slaConfigSection.classList.add('hidden');
    }
}

function addChecklistItem() {
    const checklistItems = document.getElementById('checklistItems');
    const newItem = document.createElement('div');
    newItem.className = 'flex gap-3';
    newItem.innerHTML = `
        <input type="text" placeholder="Enter checklist item" 
               class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary checklist-item">
        <button type="button" onclick="removeChecklistItem(this)" 
                class="px-3 py-2 text-red-600 hover:text-red-800">Remove</button>
    `;
    checklistItems.appendChild(newItem);
}

function removeChecklistItem(button) {
    button.parentElement.remove();
}

function setupChecklistHandlers() {
    // Make removeChecklistItem available globally
    window.removeChecklistItem = removeChecklistItem;
}

function handleCreateSLA() {
    const formData = new FormData(document.getElementById('createSlaForm'));
    const slaData = {};

    // Basic form data
    for (let [key, value] of formData.entries()) {
        if (key === 'days') {
            if (!slaData.days) slaData.days = [];
            slaData.days.push(value);
        } else {
            slaData[key] = value;
        }
    }

    // Handle checklist items
    if (slaData.slaType === 'checklist') {
        const checklistInputs = document.querySelectorAll('.checklist-item');
        slaData.checklistItems = Array.from(checklistInputs)
            .map(input => input.value.trim())
            .filter(item => item.length > 0)
            .map(item => ({ text: item, completed: false }));
    }

    // Validate required fields based on SLA type
    if (!validateSLAData(slaData)) {
        return;
    }

    // Create the SLA
    const newSLA = window.slaTracker.createSLA(slaData);
    
    if (newSLA) {
        showNotification('SLA created successfully!');
        setTimeout(() => {
            window.location.href = `sla-detail.html?id=${newSLA.id}`;
        }, 1000);
    } else {
        showNotification('Failed to create SLA', 'error');
    }
}

function validateSLAData(data) {
    // Basic validation
    if (!data.taskName || !data.slaType || !data.priority) {
        showNotification('Please fill in all required fields', 'error');
        return false;
    }

    // Type-specific validation
    switch (data.slaType) {
        case 'performance':
            if (!data.targetValue || parseFloat(data.targetValue) <= 0) {
                showNotification('Please enter a valid target value', 'error');
                return false;
            }
            break;
        case 'uptime':
            if (!data.uptimeTarget || parseFloat(data.uptimeTarget) <= 0 || parseFloat(data.uptimeTarget) > 100) {
                showNotification('Please enter a valid uptime target (0-100%)', 'error');
                return false;
            }
            break;
        case 'checklist':
            if (!data.checklistItems || data.checklistItems.length === 0) {
                showNotification('Please add at least one checklist item', 'error');
                return false;
            }
            break;
        case 'response-time':
            if (!data.maxResponseTime || parseFloat(data.maxResponseTime) <= 0) {
                showNotification('Please enter a valid maximum response time', 'error');
                return false;
            }
            break;
        case 'availability':
            if (!data.startTime || !data.endTime) {
                showNotification('Please specify availability window times', 'error');
                return false;
            }
            break;
    }

    return true;
}
```

Due to length constraints, I'll provide the remaining JavaScript files (sla-list.js, sla-detail.js) and CSS in the next part. Would you like me to continue with those files?


---
