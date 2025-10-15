/**
 * API and Data Management Module
 * 
 * Provides centralized API communication, data loading, and state management
 * for the Data Call Manager application.
 * 
 * Features:
 * - Google Apps Script API integration with local fallbacks
 * - List management (CRUD operations)
 * - Dashboard statistics loading
 * - Google Sheets backend communication
 * - Error handling and retry logic
 * - Sample data for local development
 */

// Environment detection
const isGoogleAppsScript = typeof google !== 'undefined' && google.script && google.script.run;

// Core API Manager
const APIManager = {
    /**
     * Main API call handler with Google Apps Script integration and local fallbacks
     * @param {string} functionName - The API function to call
     * @param {Object} params - Parameters to pass to the function
     * @returns {Promise} - Promise that resolves with API response
     */
    apiCall(functionName, params = {}) {
        return new Promise((resolve, reject) => {
            if (isGoogleAppsScript) {
                // Use Google Apps Script API
                google.script.run
                    .withSuccessHandler(resolve)
                    .withFailureHandler(reject)
                    [functionName](params);
            } else {
                // Use local sample data for development
                setTimeout(() => {
                    switch(functionName) {
                        case 'getAllLists':
                            resolve([
                                { listId: '1', name: 'Funding Offices', description: 'List of available funding offices', itemCount: 25, dataType: 'text' },
                                { listId: '2', name: 'Oracle Products', description: 'All Oracle products and services', itemCount: 150, dataType: 'text' },
                                { listId: '3', name: 'Departments', description: 'Organizational departments', itemCount: 42, dataType: 'text' },
                                { listId: '4', name: 'Budget Amounts', description: 'Standard budget amounts', itemCount: 15, dataType: 'currency' },
                                { listId: '5', name: 'Priority Levels', description: 'Project priority levels', itemCount: 5, dataType: 'number' }
                            ]);
                            break;
                        case 'createList':
                            resolve({ id: Date.now().toString(), success: true });
                            break;
                        case 'getListItems':
                            resolve([
                                { id: '1', value: 'Sample Item 1' },
                                { id: '2', value: 'Sample Item 2' },
                                { id: '3', value: 'Sample Item 3' }
                            ]);
                            break;
                        case 'deleteList':
                            resolve({ success: true });
                            break;
                        case 'createDataCall':
                            resolve({ id: Date.now().toString(), success: true });
                            break;
                        default:
                            resolve({ success: true });
                    }
                }, 100); // Simulate API delay
            }
        });
    },

    /**
     * Google Apps Script backend communication for external integrations
     * @param {string} functionName - The backend function to call
     * @param {Object} data - Data to pass to the backend function
     * @returns {Promise} - Promise that resolves with backend response
     */
    callGoogleAppsScriptBackend(functionName, data) {
        return new Promise((resolve, reject) => {
            // In a real implementation, this would be the URL of your deployed Google Apps Script web app
            // For now, we'll simulate the backend call
            
            // Example backend URL format:
            // const backendUrl = 'https://script.google.com/macros/s/{SCRIPT_ID}/exec';
            
            // Simulate the backend call with realistic timing
            setTimeout(() => {
                // Simulate different response scenarios for testing
                const simulationMode = 'success'; // Can be: 'success', 'error', 'permission_error', 'invalid_url'
                
                switch (simulationMode) {
                    case 'success':
                        // Simulate successful response from backend
                        resolve({
                            success: true,
                            data: {
                                headers: ['Name', 'Email', 'Department', 'Start Date'],
                                rows: [
                                    ['John Doe', 'john@example.com', 'Engineering', '2023-01-15'],
                                    ['Jane Smith', 'jane@example.com', 'Marketing', '2023-02-01'],
                                    ['Bob Wilson', 'bob@example.com', 'Sales', '2023-01-20']
                                ]
                            },
                            metadata: {
                                sheetName: 'Sheet1',
                                importedAt: new Date().toISOString(),
                                requestId: data.requestId
                            }
                        });
                        break;
                        
                    case 'permission_error':
                        reject(new Error('Access denied: The Google Sheet is not publicly accessible or not shared with the service account.'));
                        break;
                        
                    case 'invalid_url':
                        reject(new Error('Invalid Google Sheets URL format or sheet not found.'));
                        break;
                        
                    case 'error':
                    default:
                        reject(new Error('Backend service temporarily unavailable. Please try again later.'));
                        break;
                }
            }, 1500); // Simulate network delay
            
            /* 
            Real implementation would look like this:
            
            fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    function: functionName,
                    parameters: data
                })
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    resolve(result);
                } else {
                    reject(new Error(result.error || 'Unknown backend error'));
                }
            })
            .catch(error => {
                reject(new Error(`Network error: ${error.message}`));
            });
            */
        });
    }
};

// Data Loading Functions
const DataLoader = {
    /**
     * Load and update dashboard statistics
     */
    loadDashboardStats() {
        try {
            const dataCalls = AppState.getDataCalls();
            const now = new Date();
            
            // Calculate stats
            const activeCalls = dataCalls.filter(call => call.status === 'active').length;
            const overdueCalls = dataCalls.filter(call => {
                if (call.status !== 'active') return false;
                if (!call.dueDate) return false;
                return new Date(call.dueDate) < now;
            }).length;
            const completedCalls = dataCalls.filter(call => call.status === 'completed').length;
            const pendingResponses = dataCalls.reduce((total, call) => {
                const required = call.totalRequired || 0;
                const responses = call.responses || 0;
                return total + Math.max(0, required - responses);
            }, 0);

            // Update DOM elements
            const activeCallsElement = document.getElementById('activeCalls');
            const overdueCallsElement = document.getElementById('overdueCalls');
            const completedCallsElement = document.getElementById('completedCalls');
            const pendingResponsesElement = document.getElementById('pendingResponses');

            if (activeCallsElement) activeCallsElement.textContent = activeCalls;
            if (overdueCallsElement) overdueCallsElement.textContent = overdueCalls;
            if (completedCallsElement) completedCallsElement.textContent = completedCalls;
            if (pendingResponsesElement) pendingResponsesElement.textContent = pendingResponses;
            
            // Force a refresh of the display
            const dashboardStatsContainer = document.getElementById('dashboardStats');
            if (dashboardStatsContainer) {
                // Trigger a re-render to ensure the stats are visible
                dashboardStatsContainer.style.display = 'none';
                dashboardStatsContainer.offsetHeight; // Force reflow
                dashboardStatsContainer.style.display = '';
            }
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            showErrorMessage('Failed to load dashboard statistics');
        }
    },

    /**
     * Load all validation lists and update the application state
     */
    loadAllLists() {
        APIManager.apiCall('getAllLists')
            .then((lists) => {
                AppState.setAvailableLists(lists);
                this.displayExistingLists(lists);
                this.populateListSelectors();
            })
            .catch((error) => {
                showErrorMessage('Error loading lists: ' + error.message);
            });
    },

    /**
     * Display existing lists in the UI
     * @param {Array} lists - Array of list objects
     */
    displayExistingLists(lists) {
        const container = document.getElementById('existingLists');
        
        if (lists.length === 0) {
            container.innerHTML =
                '<p class="text-tertiary text-center py-4">No lists created yet</p>';
            return;
        }

        container.innerHTML = lists
            .map(
                (list) => `
                    <div class="p-3 surface-secondary rounded-lg hover:surface-tertiary transition">
                        <div class="flex justify-between items-start">
                            <div class="flex-grow">
                                <h5 class="font-medium text-primary">${list.name}</h5>
                                <div class="flex items-center space-x-2 mt-1">
                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium datatype-badge">
                                        ${list.dataType || 'text'}
                                    </span>
                                    <span class="text-xs text-tertiary">${list.itemCount || 0} items</span>
                                </div>
                                <p class="text-xs text-secondary mt-1">
                                    ${list.description || 'No description'}
                                </p>
                                <p class="text-xs text-tertiary mt-1">
                                    Created: ${new Date(list.createdDate || Date.now()).toLocaleDateString()}
                                </p>
                            </div>
                            <div class="flex space-x-2">
                                <button
                                    onclick="DataManager.viewListItems('${list.listId}')"
                                    class="p-1 text-tertiary hover:text-primary"
                                    title="View items"
                                    aria-label="View ${list.name} items"
                                >
                                    <i class="bi bi-eye" aria-hidden="true"></i>
                                </button>
                                <button
                                    onclick="DataManager.deleteList('${list.listId}')"
                                    class="p-1 text-tertiary hover:text-danger"
                                    title="Delete list"
                                    aria-label="Delete ${list.name} list"
                                >
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `
            )
            .join('');
    },

    /**
     * Populate list selectors throughout the application
     */
    populateListSelectors() {
        // Populate validation list selector in column modal (old single column modal)
        const validationListSelect = document.getElementById('columnValidationList');
        
        if (validationListSelect) {
            const availableLists = AppState.getAvailableLists();
            validationListSelect.innerHTML = '<option value="">Select a validation list</option>' +
                availableLists.map((list) => `<option value="${list.listId}">${list.name} (${list.dataType})</option>`).join('');
            
            // Add validation event listener for single column modal
            validationListSelect.removeEventListener('change', validateSingleColumnListSelection);
            validationListSelect.addEventListener('change', validateSingleColumnListSelection);
        }
        
        // Populate validation list selectors in multi-column modal
        this.populateModalValidationLists();
    },

    /**
     * Populate validation lists in the multi-column modal
     */
    populateModalValidationLists() {
        // Update all validation list selectors in the modal columns
        const availableLists = AppState.getAvailableLists();
        if (typeof modalColumns !== 'undefined') {
            modalColumns.forEach((column, index) => {
                const select = document.querySelector(`#validationListSection_${index} select`);
                if (select) {
                    const currentValue = select.value;
                    const currentDataType = column.dataType;
                    
                    // Group lists by compatibility
                    const compatibleLists = availableLists.filter(list => list.dataType === currentDataType);
                    const incompatibleLists = availableLists.filter(list => list.dataType !== currentDataType);
                    
                    let optionsHTML = '<option value="">Select a validation list</option>';
                    
                    if (compatibleLists.length > 0) {
                        optionsHTML += '<optgroup label="Compatible Lists">';
                        optionsHTML += compatibleLists
                            .map((list) => `<option value="${list.listId}" ${currentValue === list.listId ? 'selected' : ''}>${list.name} (${list.dataType})</option>`)
                            .join('');
                        optionsHTML += '</optgroup>';
                    }
                    
                    if (incompatibleLists.length > 0) {
                        optionsHTML += '<optgroup label="Incompatible Lists (Different Data Type)" disabled>';
                        optionsHTML += incompatibleLists
                            .map((list) => `<option value="${list.listId}" disabled>${list.name} (${list.dataType}) - Incompatible</option>`)
                            .join('');
                        optionsHTML += '</optgroup>';
                    }
                    
                    select.innerHTML = optionsHTML;
                    
                    // Add validation event listener
                    select.removeEventListener('change', validateListSelection);
                    select.addEventListener('change', validateListSelection);
                }
            });
        }
    }
};

// Data Management Functions
const DataManager = {
    /**
     * View items in a specific list
     * @param {string} listId - The ID of the list to view
     */
    viewListItems(listId) {
        APIManager.apiCall('getListItems', { listId })
            .then((items) => {
                const availableLists = AppState.getAvailableLists();
                const list = availableLists.find((l) => l.listId === listId);
                const listName = list ? list.name : 'List';
                
                let content = `${listName} Items\n\n`;
                
                if (items.length === 0) {
                    content += 'No items in this list';
                } else {
                    items.forEach(item => {
                        content += `• ${item.value || item}\n`;
                    });
                }
                
                alert(content);
            })
            .catch((error) => {
                showErrorMessage('Error loading list items: ' + error.message);
            });
    },

    /**
     * Delete a validation list
     * @param {string} listId - The ID of the list to delete
     */
    deleteList(listId) {
        if (confirm('Are you sure you want to delete this list? This cannot be undone.')) {
            APIManager.apiCall('deleteList', { listId })
                .then((result) => {
                    showSuccessMessage('List deleted successfully!');
                    DataLoader.loadAllLists();
                })
                .catch((error) => {
                    showErrorMessage('Error deleting list: ' + error.message);
                });
        }
    }
};

// Backward compatibility functions
function apiCall(functionName, params = {}) {
    return APIManager.apiCall(functionName, params);
}

function callGoogleAppsScriptBackend(functionName, data) {
    return APIManager.callGoogleAppsScriptBackend(functionName, data);
}

function loadDashboardStats() {
    return DataLoader.loadDashboardStats();
}

function loadAllLists() {
    return DataLoader.loadAllLists();
}

function viewListItems(listId) {
    return DataManager.viewListItems(listId);
}

function deleteList(listId) {
    return DataManager.deleteList(listId);
}

function populateListSelectors() {
    return DataLoader.populateListSelectors();
}

function populateModalValidationLists() {
    return DataLoader.populateModalValidationLists();
}

function displayExistingLists(lists) {
    return DataLoader.displayExistingLists(lists);
}

// Export for ES6 modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        APIManager,
        DataLoader,
        DataManager,
        apiCall,
        callGoogleAppsScriptBackend,
        loadDashboardStats,
        loadAllLists,
        viewListItems,
        deleteList,
        populateListSelectors,
        populateModalValidationLists,
        displayExistingLists
    };
}

// Make available globally for script tag usage
if (typeof window !== 'undefined') {
    window.APIManager = APIManager;
    window.DataLoader = DataLoader;
    window.DataManager = DataManager;
    window.apiCall = apiCall;
    window.callGoogleAppsScriptBackend = callGoogleAppsScriptBackend;
    window.loadDashboardStats = loadDashboardStats;
    window.loadAllLists = loadAllLists;
    window.viewListItems = viewListItems;
    window.deleteList = deleteList;
    window.populateListSelectors = populateListSelectors;
    window.populateModalValidationLists = populateModalValidationLists;
    window.displayExistingLists = displayExistingLists;
}