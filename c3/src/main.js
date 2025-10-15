        // Environment Detection and HTML Sanitization moved to api.js module
        
        // HTML Sanitization helper to prevent XSS
        function sanitizeHTML(str) {
            const temp = document.createElement('div');
            temp.textContent = str;
            return temp.innerHTML;
        }

        // UI Injection Functions
        function injectTabs() {
            const tabNavigation = document.getElementById('tabNavigation');
            tabNavigation.innerHTML = CONFIG.tabs.map(tab => `
                <button class="tab-btn py-4 px-1 border-b-2 ${tab.active ? 'tab-active' : 'border-transparent text-secondary hover:text-primary'} transition" data-tab="${tab.id}">
                    <i class="bi ${tab.icon} mr-2"></i>${tab.label}
                </button>
            `).join('');
            
            // Set up tab switching event listeners after tabs are created
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', () => switchTab(btn.dataset.tab));
            });
        }

        function injectDashboardStats() {
            const dashboardStats = document.getElementById('dashboardStats');
            dashboardStats.innerHTML = CONFIG.dashboardStats.map(stat => `
                <div class="card p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-secondary">${stat.label}</p>
                            <p id="${stat.id}" class="text-3xl font-bold" style="color: var(--${stat.color})">${stat.value}</p>
                        </div>
                        <i class="bi ${stat.icon} text-3xl" style="color: var(--${stat.color})"></i>
                    </div>
                </div>
            `).join('');
            
            // Immediately load dashboard stats after creating the elements
            setTimeout(loadDashboardStats, 0);
        }

        function injectSelectOptions(selectId, options) {
          const select = document.getElementById(selectId);
          if (!select) {
            console.warn(`Select element with id "${selectId}" not found`);
            return false;
          }
  
            select.innerHTML = options.map(option => `
              <option value="${option.value}" 
                      ${option.selected ? 'selected' : ''} 
                      ${option.disabled ? 'disabled' : ''}>
                ${option.label}
              </option>
            `).join('');
            
            return true;
          }

        function generateSampleData() {
            const sampleCalls = CONFIG.sampleData.dataCalls.map(call => ({
                ...call,
                id: call.id,
                createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                dueDate: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
            }));

            const sampleNotifications = CONFIG.sampleData.notifications.map(notification => ({
                ...notification,
                id: notification.id,
                createdAt: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString()
            }));

            // Immediately update dashboard after generating data
            setTimeout(() => {
                if (typeof loadDashboardStats === 'function') loadDashboardStats();
                if (typeof loadRecentActivity === 'function') loadRecentActivity();
            }, 0);

            return { sampleCalls, sampleNotifications };
        }

        function initializeUI() {
          // Inject all UI components
          injectTabs();
          injectDashboardStats();
          
          // Inject select options for elements that exist
          injectSelectOptions('callType', CONFIG.callTypes);
          injectSelectOptions('priority', CONFIG.priorities);
          injectSelectOptions('frequency', CONFIG.frequencies);
          injectSelectOptions('statusFilter', CONFIG.statusFilters);
          
          // Populate data type options in column modal if it exists
          const dataTypeSelect = document.getElementById('columnDataType');
          if (dataTypeSelect && CONFIG.dataTypes) {
            dataTypeSelect.innerHTML = CONFIG.dataTypes
              .map((type) => `<option value="${type.value}">${type.label}</option>`)
              .join('');
          }
        }

        function getPriorityColor(priority) {
            const colors = {
                urgent: 'var(--danger)',
                high: 'var(--warning)',
                medium: 'var(--primary)',
                low: 'var(--text-secondary)'
            };
            return colors[priority] || colors.medium;
        }

        function getStatusClass(status, isOverdue = false) {
            if (isOverdue) return 'status-overdue';
            
            const statusClasses = {
                active: 'status-active',
                completed: 'status-completed',
                draft: 'priority-low'
            };
            return statusClasses[status] || 'status-active';
        }

        function getCallTypeLabel(type) {
            const typeLabels = {
                enrichment: 'Enrichment',
                collection: 'Collection'
            };
            return typeLabels[type] || type;
        }

        function getCallTypeClass(type) {
            const typeClasses = {
                enrichment: 'priority-medium',
                collection: 'status-completed'
            };
            return typeClasses[type] || 'priority-medium';
        }

        // Theme Management
        const themeToggle = document.getElementById('themeToggle');
        const themeIcon = document.getElementById('themeIcon');
        const html = document.documentElement;

        // Initialize theme
        let currentTheme = localStorage.getItem('theme') || 'light';
        applyTheme(currentTheme);

        themeToggle.addEventListener('click', () => {
            currentTheme = currentTheme === 'light' ? 'dark' : 'light';
            applyTheme(currentTheme);
            localStorage.setItem('theme', currentTheme);
        });

        function applyTheme(theme) {
            html.setAttribute('data-theme', theme);
            themeIcon.className = theme === 'light' ? 'bi bi-moon text-xl' : 'bi bi-sun text-xl';
        }

        // Application State Management (using module pattern for better scoping)
        const AppState = (function() {
            let dataCalls = [];
            let responses = [];
            let notifications = [];
            let availableLists = [];
            
            // Initialize data from localStorage with error handling
            function initializeData() {
                try {
                    dataCalls = JSON.parse(localStorage.getItem('dataCalls')) || [];
                    responses = JSON.parse(localStorage.getItem('responses')) || [];
                    notifications = JSON.parse(localStorage.getItem('notifications')) || [];
                } catch (error) {
                    console.error('Error loading data from localStorage:', error);
                    // Reset to defaults if data is corrupted
                    dataCalls = [];
                    responses = [];
                    notifications = [];
                }
            }
            
            // Public API
            return {
                initializeData,
                getDataCalls: () => dataCalls,
                setDataCalls: (newDataCalls) => { dataCalls = newDataCalls; },
                getResponses: () => responses,
                setResponses: (newResponses) => { responses = newResponses; },
                getNotifications: () => notifications,
                setNotifications: (newNotifications) => { notifications = newNotifications; },
                getAvailableLists: () => availableLists,
                setAvailableLists: (newLists) => { availableLists = newLists; }
            };
        })();
        
        // Initialize application state
        AppState.initializeData();
        
        // Global variables for column management
        let columnDefinitions = [];
        let selectedColumnIndex = 0; // Currently selected column for editing
        
        // Load dashboard content immediately after app state initialization
        setTimeout(() => {
            if (typeof loadDashboardStats === 'function') loadDashboardStats();
            if (typeof loadRecentActivity === 'function') loadRecentActivity();
        }, 1);

        function initializeApp() {
            // Form handling
            document.getElementById('createCallForm').addEventListener('submit', handleCreateCall);
            // Note: callType change event is now handled in selectCallType() function
            
            // Button event listeners (replacing inline onclick handlers)
            const resetFormBtn = document.getElementById('resetFormBtn');
            if (resetFormBtn) {
                resetFormBtn.addEventListener('click', resetCreateForm);
            }
            
            const cancelColumnBtn = document.getElementById('cancelColumnBtn');
            if (cancelColumnBtn) {
                cancelColumnBtn.addEventListener('click', closeColumnModal);
            }
            
            const saveAllColumnsBtn = document.getElementById('saveAllColumnsBtn');
            if (saveAllColumnsBtn) {
                saveAllColumnsBtn.addEventListener('click', saveAllColumns);
            }
            
            const addAnotherColumnBtn = document.getElementById('addAnotherColumnBtn');
            if (addAnotherColumnBtn) {
                addAnotherColumnBtn.addEventListener('click', addModalColumn);
            }
            
            // List management modal handling
            const manageListsBtn = document.getElementById('manageListsBtn');
            if (manageListsBtn) {
                manageListsBtn.addEventListener('click', showListManagementModal);
            }
            document.getElementById('closeListManagementBtn').addEventListener('click', hideListManagementModal);
            
            // Modal handling
            document.getElementById('notificationBtn').addEventListener('click', showNotifications);
            document.getElementById('closeNotifications').addEventListener('click', hideNotifications);
            document.getElementById('cancelResponse').addEventListener('click', hideResponseModal);
            document.getElementById('saveResponse').addEventListener('click', saveDataCallResponse);

            // Search and filter
            document.getElementById('searchCalls').addEventListener('input', filterCalls);
            document.getElementById('statusFilter').addEventListener('change', filterCalls);

            // Column modal data type handling
            const columnDataType = document.getElementById('columnDataType');
            if (columnDataType) {
                columnDataType.addEventListener('change', function () {
                    const validationContainer = document.getElementById('validationListContainer');
                    const strictValidationContainer = document.getElementById('strictValidationContainer');
                    if (this.value === 'select') {
                        validationContainer.classList.remove('hidden');
                    } else {
                        validationContainer.classList.add('hidden');
                        strictValidationContainer.classList.add('hidden');
                    }
                    
                    // Refresh validation list options based on new data type
                    populateListSelectors();
                    
                    // Clear any existing data type errors
                    const container = document.getElementById('validationListContainer');
                    if (container) {
                        clearDataTypeError(container);
                    }
                });
            }

            // Column modal validation list handling
            const columnValidationList = document.getElementById('columnValidationList');
            if (columnValidationList) {
                columnValidationList.addEventListener('change', function () {
                    const strictValidationContainer = document.getElementById('strictValidationContainer');
                    if (this.value && this.value !== '') {
                        strictValidationContainer.classList.remove('hidden');
                    } else {
                        strictValidationContainer.classList.add('hidden');
                    }
                });
            }

            // Initialize enhanced date/time inputs
            initializeDateTimeInputs();

            // Initialize sample data if needed
            if (AppState.getDataCalls().length === 0) {
                const { sampleCalls, sampleNotifications } = generateSampleData();
                AppState.setDataCalls(sampleCalls);
                AppState.setNotifications(sampleNotifications);
                localStorage.setItem('dataCalls', JSON.stringify(sampleCalls));
                localStorage.setItem('notifications', JSON.stringify(sampleNotifications));
            }

            // Initialize column definitions display
            displayColumnDefinitions();

            // Load initial data
            loadManagedCalls();
            loadAssignedCalls();
            
            // Load dashboard data (since dashboard is the default active tab)
            // Use setTimeout to ensure DOM elements are fully rendered and data is loaded
            setTimeout(() => {
                loadDashboardStats();
                loadRecentActivity();
            }, 10);
            
            // Update notification badge
            updateNotificationBadge();
            
            // Additional backup loads with longer delays
            setTimeout(() => {
                loadDashboardStats();
                loadRecentActivity();
            }, 100);
            
            setTimeout(() => {
                loadDashboardStats();
                loadRecentActivity();
            }, 250);
        }

        function switchTab(tabName) {
            // Update tab buttons
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('tab-active');
                btn.classList.add('text-secondary');
            });
            const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
            activeTab.classList.add('tab-active');
            activeTab.classList.remove('text-secondary');

            // Show/hide content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
            });
            document.getElementById(tabName).classList.remove('hidden');

            // Refresh data based on tab
            if (tabName === 'dashboard') {
                loadDashboardStats();
                loadRecentActivity();
            } else if (tabName === 'manage') {
                loadManagedCalls();
            } else if (tabName === 'complete') {
                loadAssignedCalls();
            }
        }

        function handleCreateCall(e) {
            e.preventDefault();
            
            // Ensure the combined datetime is updated before form submission
            updateCombinedDateTime();
            
            // Validate that a due date is selected
            const dueDateValue = document.getElementById('dueDate').value;
            const dueDateOnlyValue = document.getElementById('dueDateOnly').value;
            
            if (!dueDateOnlyValue) {
                showErrorMessage('Please select a due date.');
                document.getElementById('dueDateOnly').focus();
                return;
            }
            
            const newCall = {
                id: Date.now().toString(),
                title: document.getElementById('callTitle').value,
                type: document.getElementById('callType').value,
                description: document.getElementById('callDescription').value,
                dueDate: dueDateValue,
                priority: document.getElementById('priority').value,
                frequency: document.getElementById('frequency').value,
                status: 'active',
                createdAt: new Date().toISOString(),
                responses: 0,
                totalRequired: 10 // Mock calculation
            };

            // Add type-specific data
            if (newCall.type === 'enrichment') {
                newCall.columnDefinitions = columnDefinitions || [];
            } else if (newCall.type === 'collection') {
                newCall.matchingCriteria = document.getElementById('matchingCriteria').value;
            }

            // Prepare comprehensive JSON package for backend
            const backendPayload = prepareBackendPayload(newCall);
            
            // Log the JSON package for now (replace with actual backend call later)
            console.log('JSON Package for Backend:', JSON.stringify(backendPayload, null, 2));
            
            // TODO: Replace this with actual backend API call
            // Example: await sendToBackend('/api/datacalls', backendPayload);

            const currentDataCalls = AppState.getDataCalls();
            currentDataCalls.push(newCall);
            AppState.setDataCalls(currentDataCalls);
            localStorage.setItem('dataCalls', JSON.stringify(currentDataCalls));

            // Create notifications for the call
            createNotificationsForCall(newCall);

            // Reset form and switch to manage tab
            document.getElementById('createCallForm').reset();
            columnDefinitions = []; // Clear column definitions
            displayColumnDefinitions(); // Reset the upload area
            switchTab('manage');

            showSuccessMessage('Data call created successfully!');
        }

        function createNotificationsForCall(call) {
            const notification = {
                id: Date.now().toString(),
                callId: call.id,
                title: `New Data Call: ${call.title}`,
                message: call.description,
                type: 'new_call',
                priority: call.priority,
                createdAt: new Date().toISOString(),
                read: false
            };

            const currentNotifications = AppState.getNotifications();
            currentNotifications.push(notification);
            AppState.setNotifications(currentNotifications);
            localStorage.setItem('notifications', JSON.stringify(currentNotifications));
            updateNotificationBadge();
        }

        // ==================== BACKEND PAYLOAD PREPARATION ====================
        
        function prepareBackendPayload(dataCall) {
            // Get additional form data that might not be in the basic dataCall object
            const isDateOnly = document.getElementById('isDateOnly')?.checked || false;
            const dueDateOnly = document.getElementById('dueDateOnly')?.value;
            const dueTimeOnly = document.getElementById('dueTimeOnly')?.value;
            
            // Base payload structure
            const payload = {
                // Core data call information
                dataCall: {
                    id: dataCall.id,
                    title: dataCall.title,
                    description: dataCall.description,
                    type: dataCall.type,
                    status: dataCall.status,
                    priority: dataCall.priority,
                    frequency: dataCall.frequency,
                    createdAt: dataCall.createdAt,
                    responses: dataCall.responses,
                    totalRequired: dataCall.totalRequired
                },
                
                // Enhanced due date information
                dueDate: {
                    combined: dataCall.dueDate,
                    dateOnly: dueDateOnly,
                    timeOnly: dueTimeOnly,
                    isDateOnly: isDateOnly,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    utcTimestamp: new Date(dataCall.dueDate).toISOString()
                },
                
                // User and session information
                metadata: {
                    createdBy: 'current-user', // Replace with actual user ID when auth is implemented
                    userAgent: navigator.userAgent,
                    browserInfo: {
                        language: navigator.language,
                        platform: navigator.platform,
                        cookieEnabled: navigator.cookieEnabled
                    },
                    sessionId: generateSessionId(),
                    clientTimestamp: new Date().toISOString(),
                    formVersion: '1.0' // Version of the form structure
                },
                
                // Type-specific data
                typeSpecificData: {}
            };
            
            // Add enrichment-specific data
            if (dataCall.type === 'enrichment') {
                payload.typeSpecificData = {
                    columnDefinitions: processColumnDefinitions(dataCall.columnDefinitions || []),
                    uploadedFileInfo: getUploadedFileInfo(),
                    totalColumns: (dataCall.columnDefinitions || []).length,
                    hasCalculatedColumns: (dataCall.columnDefinitions || []).some(col => col.isCalculated),
                    hasValidationLists: (dataCall.columnDefinitions || []).some(col => col.validationList),
                    hasConditionalLogic: (dataCall.columnDefinitions || []).some(col => 
                        col.calculationType === 'conditional' && col.conditionalRules?.length > 0
                    )
                };
            }
            
            // Add collection-specific data
            if (dataCall.type === 'collection') {
                payload.typeSpecificData = {
                    matchingCriteria: dataCall.matchingCriteria,
                    criteriaWordCount: dataCall.matchingCriteria ? dataCall.matchingCriteria.split(/\s+/).length : 0,
                    hasCriteria: !!(dataCall.matchingCriteria && dataCall.matchingCriteria.trim())
                };
            }
            
            return payload;
        }
        
        function processColumnDefinitions(columns) {
            return columns.map((column, index) => ({
                // Basic column info
                index: index,
                name: column.name,
                description: column.description,
                dataType: column.dataType,
                required: column.required,
                jsonFieldName: column.jsonFieldName,
                
                // Validation info
                validation: {
                    hasValidation: !!(column.validationList),
                    validationListId: column.validationList || null,
                    strictValidation: column.strictValidation || false
                },
                
                // Calculated column info
                calculation: {
                    isCalculated: column.isCalculated || false,
                    calculationType: column.calculationType || null,
                    formula: column.formula || null,
                    staticValue: column.staticValue || null,
                    lookupTable: column.lookupTable || null,
                    conditionalRules: processConditionalRules(column.conditionalRules || [])
                },
                
                // Source info (if uploaded from file)
                sourceInfo: {
                    fromUploadedFile: column.fromUploadedFile || false,
                    originalColumnName: column.originalColumnName || null,
                    originalDataType: column.originalDataType || null
                }
            }));
        }
        
        function processConditionalRules(rules) {
            return rules.map((rule, index) => ({
                index: index,
                condition: {
                    column: rule.column,
                    operator: rule.operator,
                    value: rule.value
                },
                action: {
                    type: rule.actionType,
                    value: rule.actionValue
                },
                isValid: !!(rule.column && rule.operator && rule.value && rule.actionType && rule.actionValue)
            }));
        }
        
        function getUploadedFileInfo() {
            if (!uploadedFileData) {
                return {
                    hasFile: false,
                    fileName: null,
                    fileSize: null,
                    fileType: null,
                    columnCount: 0,
                    rowCount: 0
                };
            }
            
            return {
                hasFile: true,
                fileName: uploadedFileData.fileName || 'unknown',
                fileSize: uploadedFileData.fileSize || 0,
                fileType: uploadedFileData.fileType || 'unknown',
                columnCount: uploadedFileData.columns ? uploadedFileData.columns.length : 0,
                rowCount: uploadedFileData.data ? uploadedFileData.data.length : 0,
                columns: uploadedFileData.columns || [],
                sampleData: uploadedFileData.data ? uploadedFileData.data.slice(0, 3) : [] // First 3 rows for backend validation
            };
        }
        
        function generateSessionId() {
            return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        // Dashboard stats loading moved to api.js module

        function loadRecentActivity() {
            try {
                const dataCalls = AppState.getDataCalls();
                const responses = AppState.getResponses();
                const recentActivity = document.getElementById('recentActivity');
                
                if (!recentActivity) {
                    console.warn('Recent activity element not found');
                    return;
                }
                
                // Add debug info temporarily
                const debugInfo = `Debug: ${dataCalls.length} calls, ${responses.length} responses at ${new Date().toLocaleTimeString()}`;
                
                const activities = [
                    ...dataCalls.slice(-5).map(call => ({
                        type: 'call_created',
                        title: `Data call "${sanitizeHTML(call.title)}" created`,
                        time: new Date(call.createdAt).toLocaleString(),
                        priority: call.priority
                    })),
                    ...responses.slice(-5).map(response => ({
                        type: 'response_submitted',
                        title: `Response submitted for "${sanitizeHTML(response.callTitle)}"`,
                        time: new Date(response.submittedAt).toLocaleString(),
                        priority: 'medium'
                    }))
                ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

                if (activities.length === 0) {
                    recentActivity.innerHTML = `<p class="text-tertiary text-center py-8">No recent activity</p><p class="text-xs text-center text-tertiary">${debugInfo}</p>`;
                    return;
                }

                recentActivity.innerHTML = activities.map(activity => `
                    <div class="flex items-center space-x-3 py-3 border-b border-secondary last:border-b-0">
                        <div class="flex-shrink-0">
                            <i class="bi ${activity.type === 'call_created' ? 'bi-plus-circle' : 'bi-check-circle'} text-lg" style="color: ${getPriorityColor(activity.priority)}"></i>
                        </div>
                        <div class="flex-grow">
                            <p class="text-sm font-medium text-primary">${activity.title}</p>
                            <p class="text-xs text-tertiary">${activity.time}</p>
                        </div>
                    </div>
                `).join('') + `<p class="text-xs text-center text-tertiary mt-2">${debugInfo}</p>`;
            } catch (error) {
                console.error('Error loading recent activity:', error);
                const recentActivity = document.getElementById('recentActivity');
                if (recentActivity) {
                    recentActivity.innerHTML = `<p class="text-tertiary text-center py-8">Error loading recent activity</p><p class="text-xs text-center text-tertiary">Error: ${error.message}</p>`;
                }
            }
        }

        function loadManagedCalls() {
            const callsList = document.getElementById('callsList');
            const dataCalls = AppState.getDataCalls();
            
            if (dataCalls.length === 0) {
                callsList.innerHTML = '<div class="p-8 text-center text-tertiary">No data calls created yet</div>';
                return;
            }

            callsList.innerHTML = dataCalls.map(call => {
                const isOverdue = new Date(call.dueDate) < new Date() && call.status === 'active';
                const completionRate = Math.round((call.responses / call.totalRequired) * 100) || 0;
                
                return `
                    <div class="p-6 hover:bg-gray-50 transition">
                        <div class="flex items-center justify-between">
                            <div class="flex-grow">
                                <div class="flex items-center space-x-3 mb-2">
                                    <h4 class="text-lg font-medium text-primary">${call.title}</h4>
                                    <span class="px-2 py-1 text-xs rounded-full ${getCallTypeClass(call.type)}">
                                        ${getCallTypeLabel(call.type)}
                                    </span>
                                    <span class="px-2 py-1 text-xs rounded-full ${getStatusClass(call.status, isOverdue)}">
                                        ${isOverdue ? 'Overdue' : call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                                    </span>
                                    <span class="px-2 py-1 text-xs rounded-full priority-${call.priority}">
                                        ${call.priority.charAt(0).toUpperCase() + call.priority.slice(1)} Priority
                                    </span>
                                </div>
                                <p class="text-sm text-secondary mb-2">${call.description}</p>
                                <div class="flex items-center space-x-4 text-xs text-tertiary">
                                    <span><i class="bi bi-calendar mr-1"></i>Due: ${new Date(call.dueDate).toLocaleDateString()}</span>
                                    <span><i class="bi bi-arrow-repeat mr-1"></i>${call.frequency}</span>
                                </div>
                                <div class="mt-3">
                                    <div class="flex items-center justify-between text-xs text-secondary mb-1">
                                        <span>Response Progress</span>
                                        <span>${call.responses}/${call.totalRequired} (${completionRate}%)</span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${completionRate}%"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center space-x-2 ml-6">
                                <button onclick="viewCallDetails('${call.id}')" class="p-2 text-tertiary hover:text-primary transition">
                                    <i class="bi bi-eye"></i>
                                </button>
                                <button onclick="editCall('${call.id}')" class="p-2 text-tertiary hover:text-warning transition">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button onclick="duplicateCall('${call.id}')" class="p-2 text-tertiary hover:text-success transition">
                                    <i class="bi bi-copy"></i>
                                </button>
                                <button onclick="deleteCall('${call.id}')" class="p-2 text-tertiary hover:text-danger transition">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function loadAssignedCalls() {
            const assignedCalls = document.getElementById('assignedCalls');
            const dataCalls = AppState.getDataCalls();
            
            // Mock assigned calls (in real app, these would be filtered based on user role)
            const userAssignedCalls = dataCalls.filter(call => 
                call.status === 'active'
            );

            if (userAssignedCalls.length === 0) {
                assignedCalls.innerHTML = '<div class="p-8 text-center text-tertiary">No data calls assigned to you</div>';
                return;
            }

            assignedCalls.innerHTML = userAssignedCalls.map(call => {
                const isOverdue = new Date(call.dueDate) < new Date();
                const responses = AppState.getResponses();
                const hasResponse = responses.some(r => r.callId === call.id);
                
                return `
                    <div class="p-6 hover:bg-gray-50 transition">
                        <div class="flex items-center justify-between">
                            <div class="flex-grow">
                                <div class="flex items-center space-x-3 mb-2">
                                    <h4 class="text-lg font-medium text-primary">${call.title}</h4>
                                    <span class="px-2 py-1 text-xs rounded-full ${getStatusClass('active', isOverdue)}">
                                        ${isOverdue ? 'Overdue' : 'Due ' + new Date(call.dueDate).toLocaleDateString()}
                                    </span>
                                    <span class="px-2 py-1 text-xs rounded-full priority-${call.priority}">
                                        ${call.priority.charAt(0).toUpperCase() + call.priority.slice(1)}
                                    </span>
                                    ${hasResponse ? '<span class="px-2 py-1 text-xs rounded-full status-completed">Completed</span>' : ''}
                                </div>
                                <p class="text-sm text-secondary mb-2">${call.description}</p>
                                <div class="text-xs text-tertiary">
                                    <i class="bi bi-clock mr-1"></i>Due: ${new Date(call.dueDate).toLocaleString()}
                                </div>
                            </div>
                            <div class="flex items-center space-x-2 ml-6">
                                <button onclick="openResponseModal('${call.id}')" class="px-4 py-2 ${hasResponse ? 'btn-secondary' : 'btn-primary'} rounded text-sm transition">
                                    ${hasResponse ? 'Edit Response' : 'Complete'}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function filterCalls() {
            const searchTerm = document.getElementById('searchCalls').value.toLowerCase();
            const statusFilter = document.getElementById('statusFilter').value;
            
            // Re-render calls with filters applied
            loadManagedCalls();
        }

        function openResponseModal(callId) {
            const dataCalls = AppState.getDataCalls();
            const call = dataCalls.find(c => c.id === callId);
            if (!call) return;

            const modal = document.getElementById('responseModal');
            const title = document.getElementById('responseModalTitle');
            const content = document.getElementById('responseModalContent');

            title.textContent = `Complete: ${call.title}`;

            if (call.type === 'enrichment') {
                content.innerHTML = `
                    <div class="space-y-4">
                        <div class="priority-medium p-4 rounded-lg">
                            <h4 class="font-medium text-primary">Instructions</h4>
                            <p class="text-sm text-secondary mt-1">${call.description}</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-primary mb-2">Upload Completed Data</label>
                            <input type="file" id="responseFile" accept=".csv,.xlsx,.xls" class="w-full px-3 py-2 input-field rounded-lg">
                            <p class="text-xs text-tertiary mt-1">Upload your completed data file with the required columns filled</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-primary mb-2">Comments (Optional)</label>
                            <textarea id="responseComments" rows="3" class="w-full px-3 py-2 input-field rounded-lg" placeholder="Any additional comments or clarifications..."></textarea>
                        </div>
                    </div>
                `;
            } else {
                content.innerHTML = `
                    <div class="space-y-4">
                        <div class="status-completed p-4 rounded-lg">
                            <h4 class="font-medium text-primary">Criteria</h4>
                            <p class="text-sm text-secondary mt-1">${call.matchingCriteria}</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-primary mb-2">Matching Items</label>
                            <textarea id="matchingItems" rows="6" class="w-full px-3 py-2 input-field rounded-lg" placeholder="List all items that match the criteria (one per line or comma-separated)..."></textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-primary mb-2">Upload Supporting Data (Optional)</label>
                            <input type="file" id="responseFile" accept=".csv,.xlsx,.xls" class="w-full px-3 py-2 input-field rounded-lg">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-primary mb-2">Comments</label>
                            <textarea id="responseComments" rows="3" class="w-full px-3 py-2 input-field rounded-lg" placeholder="Any additional comments..."></textarea>
                        </div>
                    </div>
                `;
            }

            // Load existing response if any
            const responses = AppState.getResponses();
            const existingResponse = responses.find(r => r.callId === callId);
            if (existingResponse) {
                if (document.getElementById('matchingItems')) {
                    document.getElementById('matchingItems').value = existingResponse.matchingItems || '';
                }
                document.getElementById('responseComments').value = existingResponse.comments || '';
            }

            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }

        function hideResponseModal() {
            const modal = document.getElementById('responseModal');
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }

        function saveDataCallResponse() {
            const modal = document.getElementById('responseModal');
            const callTitle = document.getElementById('responseModalTitle').textContent.replace('Complete: ', '');
            const dataCalls = AppState.getDataCalls();
            const call = dataCalls.find(c => c.title === callTitle);
            
            if (!call) return;

            const response = {
                id: Date.now().toString(),
                callId: call.id,
                callTitle: call.title,
                submittedAt: new Date().toISOString(),
                comments: document.getElementById('responseComments').value,
                fileName: document.getElementById('responseFile')?.files[0]?.name || ''
            };

            if (call.type === 'collection') {
                response.matchingItems = document.getElementById('matchingItems').value;
            }

            // Remove existing response if editing
            const currentResponses = AppState.getResponses();
            const filteredResponses = currentResponses.filter(r => r.callId !== call.id);
            filteredResponses.push(response);
            AppState.setResponses(filteredResponses);
            localStorage.setItem('responses', JSON.stringify(filteredResponses));

            // Update call response count
            call.responses = Math.min(call.responses + 1, call.totalRequired);
            const updatedDataCalls = AppState.getDataCalls();
            AppState.setDataCalls(updatedDataCalls);
            localStorage.setItem('dataCalls', JSON.stringify(updatedDataCalls));

            hideResponseModal();
            loadAssignedCalls();
            loadDashboardStats();
            
            showSuccessMessage('Response submitted successfully!');
        }

        function showNotifications() {
            const modal = document.getElementById('notificationModal');
            const list = document.getElementById('notificationList');
            const notifications = AppState.getNotifications();

            if (notifications.length === 0) {
                list.innerHTML = '<div class="p-6 text-center text-tertiary">No notifications</div>';
            } else {
                list.innerHTML = notifications.map(notification => `
                    <div class="p-4 border-b border-secondary hover:bg-gray-50 ${notification.read ? '' : 'priority-light'} transition">
                        <div class="flex items-start space-x-3">
                            <div class="flex-shrink-0 mt-1">
                                <i class="bi ${notification.type === 'new_call' ? 'bi-clipboard-plus' : 'bi-bell'} text-lg" style="color: ${getPriorityColor(notification.priority)}"></i>
                            </div>
                            <div class="flex-grow">
                                <p class="text-sm font-medium text-primary">${notification.title}</p>
                                <p class="text-xs text-secondary mt-1">${notification.message}</p>
                                <p class="text-xs text-tertiary mt-2">${new Date(notification.createdAt).toLocaleString()}</p>
                            </div>
                            ${!notification.read ? '<div class="flex-shrink-0"><div class="w-2 h-2 rounded-full" style="background-color: var(--primary)"></div></div>' : ''}
                        </div>
                    </div>
                `).join('');
            }

            // Mark all as read
            const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
            AppState.setNotifications(updatedNotifications);
            localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
            updateNotificationBadge();

            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }

        function hideNotifications() {
            const modal = document.getElementById('notificationModal');
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }

        function showListManagementModal() {
            const modal = document.getElementById('listManagementModal');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            // Refresh the lists when modal opens
            loadAllLists();
        }

        function hideListManagementModal() {
            const modal = document.getElementById('listManagementModal');
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            // Refresh the validation list dropdown when modal closes
            populateListSelectors();
        }

        function updateNotificationBadge() {
            const notifications = AppState.getNotifications();
            const unreadCount = notifications.filter(n => !n.read).length;
            const badge = document.getElementById('notificationDot');
            
            if (unreadCount > 0) {
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }

        function viewCallDetails(callId) {
            const dataCalls = AppState.getDataCalls();
            const call = dataCalls.find(c => c.id === callId);
            if (!call) return;
            
            alert(`Call Details:\n\nTitle: ${call.title}\nType: ${getCallTypeLabel(call.type)}\nStatus: ${call.status}\nDue: ${new Date(call.dueDate).toLocaleString()}\nResponses: ${call.responses}/${call.totalRequired}`);
        }

        function editCall(callId) {
            alert('Edit functionality would be implemented here');
        }

        function duplicateCall(callId) {
            const dataCalls = AppState.getDataCalls();
            const call = dataCalls.find(c => c.id === callId);
            if (!call) return;
            
            const duplicate = {
                ...call,
                id: Date.now().toString(),
                title: call.title + ' (Copy)',
                createdAt: new Date().toISOString(),
                responses: 0
            };
            
            const updatedDataCalls = [...dataCalls, duplicate];
            AppState.setDataCalls(updatedDataCalls);
            localStorage.setItem('dataCalls', JSON.stringify(updatedDataCalls));
            loadManagedCalls();
            showSuccessMessage('Data call duplicated successfully!');
        }

        function deleteCall(callId) {
            if (confirm('Are you sure you want to delete this data call?')) {
                const updatedDataCalls = AppState.getDataCalls().filter(c => c.id !== callId);
                AppState.setDataCalls(updatedDataCalls);
                localStorage.setItem('dataCalls', JSON.stringify(updatedDataCalls));
                loadManagedCalls();
                loadDashboardStats();
                showSuccessMessage('Data call deleted successfully!');
            }
        }

        // ==================== GLOBAL STATE ====================
        // All global state is now managed through AppState module

        // ==================== LIST MANAGEMENT ====================

        function loadAllLists() {
          apiCall('getAllLists')
            .then(function (lists) {
              AppState.setAvailableLists(lists);
              displayExistingLists(lists);
              populateListSelectors();
            })
            .catch(function (error) {
              showErrorMessage('Error loading lists: ' + error.message);
            });
        }

        function displayExistingLists(lists) {
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
                                onclick="viewListItems('${list.listId}')"
                                class="p-1 text-tertiary hover:text-primary"
                                title="View items"
                                aria-label="View ${list.name} items"
                            >
                                <i class="bi bi-eye" aria-hidden="true"></i>
                            </button>
                            <button
                                onclick="deleteList('${list.listId}')"
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
        }

        function populateListSelectors() {
          // Populate validation list selector in column modal (old single column modal)
          const validationListSelect = document.getElementById('columnValidationList');
          if (validationListSelect) {
            const availableLists = AppState.getAvailableLists();
            
            // Get current column data type from the form
            const columnDataTypeSelect = document.getElementById('columnDataType');
            const currentDataType = columnDataTypeSelect ? columnDataTypeSelect.value : '';
            
            if (currentDataType) {
              // Group lists by compatibility
              const compatibleLists = availableLists.filter(list => list.dataType === currentDataType);
              const incompatibleLists = availableLists.filter(list => list.dataType !== currentDataType);
              
              let optionsHTML = '<option value="">No validation</option>';
              
              if (compatibleLists.length > 0) {
                optionsHTML += '<optgroup label="Compatible Lists">';
                optionsHTML += compatibleLists
                  .map((list) => `<option value="${list.listId}">${list.name} (${list.dataType})</option>`)
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
              
              validationListSelect.innerHTML = optionsHTML;
            } else {
              // No data type selected, show all lists with warning
              validationListSelect.innerHTML =
                '<option value="">No validation</option>' +
                availableLists
                  .map((list) => `<option value="${list.listId}">${list.name} (${list.dataType})</option>`)
                  .join('');
            }
            
            // Add validation event listener for single column modal
            validationListSelect.removeEventListener('change', validateSingleColumnListSelection);
            validationListSelect.addEventListener('change', validateSingleColumnListSelection);
          }
          
          // Populate validation list selectors in multi-column modal
          populateModalValidationLists();
        }
        
        function populateModalValidationLists() {
          // Update all validation list selectors in the modal columns
          const availableLists = AppState.getAvailableLists();
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
        
        // CSV Data Type Validation Functions moved to validation.js module
        
        document.getElementById('createListForm')?.addEventListener('submit', function (e) {
          e.preventDefault();
          
          // Show loading state
          const submitBtn = document.getElementById('createListBtn');
          const btnText = document.getElementById('createListBtnText');
          const btnSpinner = document.getElementById('createListBtnSpinner');
          
          function setLoadingState(loading) {
            if (loading) {
              submitBtn.disabled = true;
              btnText.classList.add('hidden');
              btnSpinner.classList.remove('hidden');
            } else {
              submitBtn.disabled = false;
              btnText.classList.remove('hidden');
              btnSpinner.classList.add('hidden');
            }
          }

          const listData = {
            name: document.getElementById('listName').value,
            description: document.getElementById('listDescription').value,
            dataType: document.getElementById('listDataType').value
          };

          if (!listData.dataType) {
            showErrorMessage('Please select a data type for the list.');
            return;
          }

          const fileInput = document.getElementById('listDataFile');
          const file = fileInput.files[0];

          // If a file is selected, validate it first
          if (file) {
            setLoadingState(true);
            
            validateCSVFile(file, listData.dataType)
              .then(function(validation) {
                showSuccessMessage(`CSV validation successful! Found ${validation.totalItems} valid items.`);
                
                // Proceed with API call
                return apiCall('createList', { listData, file, validatedData: validation.validatedData });
              })
              .then(function (result) {
                showSuccessMessage('List created successfully!');
                document.getElementById('createListForm').reset();
                loadAllLists();
              })
              .catch(function (error) {
                showErrorMessage(error.message);
              })
              .finally(function() {
                setLoadingState(false);
              });
          } else {
            // No file selected, proceed normally
            setLoadingState(true);
            
            apiCall('createList', { listData, file })
              .then(function (result) {
                showSuccessMessage('List created successfully!');
                document.getElementById('createListForm').reset();
                loadAllLists();
              })
              .catch(function (error) {
                showErrorMessage('Error creating list: ' + error.message);
              })
              .finally(function() {
                setLoadingState(false);
              });
          }
        });

        // Enhanced Due Date Handling
        function setQuickTime(time) {
          document.getElementById('dueTimeOnly').value = time;
          updateCombinedDateTime();
        }
        
        function updateCombinedDateTime() {
          const dateInput = document.getElementById('dueDateOnly');
          const timeInput = document.getElementById('dueTimeOnly');
          const dateOnlyCheckbox = document.getElementById('isDateOnly');
          const hiddenInput = document.getElementById('dueDate');
          const preview = document.getElementById('dueDatePreview');
          
          const dateValue = dateInput.value;
          const timeValue = timeInput.value;
          const isDateOnly = dateOnlyCheckbox.checked;
          
          if (dateValue) {
            if (isDateOnly) {
              // For date-only, set to end of day to avoid timezone issues
              hiddenInput.value = dateValue + 'T23:59';
              // Update preview
              const date = new Date(dateValue + 'T23:59');
              preview.textContent = `Due: ${date.toLocaleDateString()} (any time)`;
            } else if (timeValue) {
              hiddenInput.value = dateValue + 'T' + timeValue;
              // Update preview
              const date = new Date(dateValue + 'T' + timeValue);
              preview.textContent = `Due: ${date.toLocaleString()}`;
            } else {
              // Default to 5 PM if no time specified
              hiddenInput.value = dateValue + 'T17:00';
              const date = new Date(dateValue + 'T17:00');
              preview.textContent = `Due: ${date.toLocaleString()} (default time)`;
            }
          } else {
            hiddenInput.value = '';
            preview.textContent = '';
          }
        }
        
        // Initialize enhanced date/time inputs
        function initializeDateTimeInputs() {
          const dueDateOnly = document.getElementById('dueDateOnly');
          const dueTimeOnly = document.getElementById('dueTimeOnly');
          const isDateOnly = document.getElementById('isDateOnly');
          
          if (dueDateOnly && dueTimeOnly && isDateOnly) {
            // Set minimum date to today
            const today = new Date();
            today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
            dueDateOnly.min = today.toISOString().slice(0, 10);
            
            // Add event listeners
            dueDateOnly.addEventListener('change', updateCombinedDateTime);
            dueTimeOnly.addEventListener('change', updateCombinedDateTime);
            isDateOnly.addEventListener('change', function() {
              const timeContainer = dueTimeOnly.parentElement;
              if (this.checked) {
                timeContainer.style.opacity = '0.5';
                dueTimeOnly.disabled = true;
              } else {
                timeContainer.style.opacity = '1';
                dueTimeOnly.disabled = false;
              }
              updateCombinedDateTime();
            });
            
            // Initialize with current values
            updateCombinedDateTime();
          }
        }

        // Format guide toggle functionality
        document.getElementById('toggleFormatGuide')?.addEventListener('click', function() {
          const guide = document.getElementById('formatGuide');
          const button = document.getElementById('toggleFormatGuide');
          const isHidden = guide.classList.contains('hidden');
          
          if (isHidden) {
            guide.classList.remove('hidden');
            button.textContent = 'Hide expected data formats';
            button.setAttribute('aria-expanded', 'true');
          } else {
            guide.classList.add('hidden');
            button.textContent = 'Show expected data formats';
            button.setAttribute('aria-expanded', 'false');
          }
        });

        // ==================== DRAG AND DROP FILE HANDLING ====================
        
        function handleDragOver(event) {
          event.preventDefault();
          event.stopPropagation();
          event.dataTransfer.dropEffect = 'copy';
        }
        
        function handleDragEnter(event) {
          event.preventDefault();
          event.stopPropagation();
          event.dataTransfer.dropEffect = 'copy';
          event.currentTarget.classList.add('drag-over');
        }
        
        function handleDragLeave(event) {
          event.preventDefault();
          event.stopPropagation();
          // Only remove the class if we're leaving the drop zone, not a child element
          if (!event.currentTarget.contains(event.relatedTarget)) {
            event.currentTarget.classList.remove('drag-over');
          }
        }
        
        function handleDrop(event, type) {
          event.preventDefault();
          event.stopPropagation();
          event.currentTarget.classList.remove('drag-over');
          
          const files = event.dataTransfer.files;
          if (files.length > 0) {
            const file = files[0];
            
            // Validate file type
            const validExtensions = ['.csv', '.xlsx', '.xls'];
            const fileName = file.name.toLowerCase();
            const isValidFile = validExtensions.some(ext => fileName.endsWith(ext));
            
            if (!isValidFile) {
              showErrorMessage('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
              return;
            }
            
            if (type === 'column') {
              // Pass the file directly to the processing function
              const fileInput = document.getElementById('columnFileUpload');
              if (fileInput) {
                // Create a mock event object with the file
                const mockInput = {
                  files: [file],
                  value: file.name
                };
                handleFileUpload(mockInput);
              }
            } else if (type === 'list') {
              // Pass the file directly to the list processing function
              const fileInput = document.getElementById('listDataFile');
              if (fileInput) {
                // Create a mock event object with the file
                const mockInput = {
                  files: [file],
                  value: file.name
                };
                handleListFileUpload(mockInput);
              }
            }
          }
        }
        
        // ==================== LIST FILE UPLOAD HANDLING ====================
        
        function handleListFileUpload(input) {
          const file = input.files[0];
          if (!file) return;
          
          // Show file name feedback
          showSuccessMessage(`File "${file.name}" selected for validation.`);
        }
        
        // Enhanced file upload handler that supports both CSV and Excel files
        window.handleFileUpload = function(input) {
          const file = input.files[0];
          if (!file) return;

          const fileName = file.name.toLowerCase();
          
          // Use unified FileParser for all supported file types
          if (fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            // Show loading state (only if elements exist)
            const statusDiv = document.getElementById('uploadStatus');
            const fileNameSpan = document.getElementById('uploadedFileName');
            
            if (statusDiv && fileNameSpan) {
              statusDiv.classList.remove('hidden');
              fileNameSpan.innerHTML = `<i class="bi bi-hourglass-split"></i> Analyzing ${file.name}...`;
            }
            
            showSuccessMessage(`Processing ${fileName.endsWith('.csv') ? 'CSV' : 'Excel'} file...`);
            
            // Use FileParser directly for all supported file types
            FileParser.parse(file)
              .then(function(parseResult) {
                // Store the data for later use
                uploadedFileData = parseResult;
                
                // Validate that we got some columns
                if (!parseResult.columns || parseResult.columns.length === 0) {
                  throw new Error('No columns detected in file. Please check that your file has a header row.');
                }
                
                // Update UI (only if elements exist)
                if (fileNameSpan) {
                  fileNameSpan.innerHTML = `<i class="bi bi-file-check"></i> ${file.name}`;
                }
                
                // Pre-fill columns and open modal
                modalColumns = parseResult.columns;
                displayModalColumns();
                openColumnModal();
                
                showSuccessMessage(`File processed successfully! Found ${parseResult.columns.length} columns.`);
              })
              .catch(function(error) {
                console.error('File parsing error:', error);
                showErrorMessage(error.message);
                
                // Hide status on error (only if element exists)
                if (statusDiv) {
                  statusDiv.classList.add('hidden');
                }
                input.value = ''; // Clear the input
              });
          } else {
            showErrorMessage('Unsupported file type. Please upload a CSV or Excel file.');
            input.value = ''; // Clear the input
          }
        };

        function viewListItems(listId) {
          apiCall('getListItems', { listId })
            .then(function (items) {
              const list = availableLists.find((l) => l.id === listId);
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
            .catch(function (error) {
              showErrorMessage('Error loading list items: ' + error.message);
            });
        }

        function deleteList(listId) {
          if (confirm('Are you sure you want to delete this list? This cannot be undone.')) {
            apiCall('deleteList', { listId })
              .then(function (result) {
                showSuccessMessage('List deleted successfully!');
                loadAllLists();
              })
              .catch(function (error) {
                showErrorMessage('Error deleting list: ' + error.message);
              });
          }
        }

        // ==================== COLUMN MANAGEMENT ====================

        let modalColumns = []; // Temporary storage for columns being edited in modal

        // Check if a JSON field name is unique within the current modal columns
        function isJsonFieldNameUnique(jsonName, excludeIndex = -1) {
          return !modalColumns.some((column, index) => {
            if (index === excludeIndex) return false; // Exclude the current column being edited
            const columnJsonName = column.jsonFieldName || generateJsonFieldName(column.name);
            return columnJsonName.toLowerCase() === jsonName.toLowerCase();
          });
        }

        // Update the JSON field name and validate uniqueness
        function updateJsonFieldName(index, displayName) {
          const jsonName = generateJsonFieldName(displayName);
          modalColumns[index].jsonFieldName = jsonName;
          
          // Update the display
          const jsonDisplay = document.getElementById(`jsonName_${index}`);
          const warningElement = document.getElementById(`uniqueWarning_${index}`);
          
          if (jsonDisplay) {
            jsonDisplay.textContent = jsonName || 'columnName';
            
            // Check uniqueness
            if (jsonName && !isJsonFieldNameUnique(jsonName, index)) {
              jsonDisplay.classList.add('text-danger');
              jsonDisplay.classList.remove('text-secondary');
              if (warningElement) {
                warningElement.classList.remove('hidden');
              }
            } else {
              jsonDisplay.classList.remove('text-danger');
              jsonDisplay.classList.add('text-secondary');
              if (warningElement) {
                warningElement.classList.add('hidden');
              }
            }
          }
          
          return jsonName;
        }

        // ==================== CUSTOM CALL TYPE DROPDOWN ====================

        let callTypeDropdownOpen = false;

        function toggleCallTypeDropdown() {
          const optionsDiv = document.getElementById('callTypeOptions');
          const chevron = document.getElementById('callTypeChevron');
          const button = document.getElementById('callTypeButton');
          
          callTypeDropdownOpen = !callTypeDropdownOpen;
          
          if (callTypeDropdownOpen) {
            optionsDiv.classList.remove('hidden');
            chevron.classList.add('rotate-180');
            button.setAttribute('aria-expanded', 'true');
            currentFocusedOption = -1; // Reset focus
            // Initialize all options as not selected
            const options = document.querySelectorAll('.calltype-option');
            options.forEach(option => option.setAttribute('aria-selected', 'false'));
          } else {
            optionsDiv.classList.add('hidden');
            chevron.classList.remove('rotate-180');
            button.setAttribute('aria-expanded', 'false');
            button.removeAttribute('aria-activedescendant');
            currentFocusedOption = -1;
          }
        }

        function selectCallType(value) {
          const selectedDiv = document.getElementById('callTypeSelected');
          const hiddenInput = document.getElementById('callType');
          const optionsDiv = document.getElementById('callTypeOptions');
          const chevron = document.getElementById('callTypeChevron');
          const button = document.getElementById('callTypeButton');
          
          // Update the selected display
          if (value === 'enrichment') {
            selectedDiv.innerHTML = `
              <div class="font-medium text-gray-900">Data Enrichment</div>
              <div class="text-sm text-gray-600">Fill columns for existing items</div>
            `;
          } else if (value === 'collection') {
            selectedDiv.innerHTML = `
              <div class="font-medium text-gray-900">Data Collection</div>
              <div class="text-sm text-gray-600">Gather a list of items matching criteria</div>
            `;
          }
          
          // Update the hidden input
          hiddenInput.value = value;
          
          // Close the dropdown
          optionsDiv.classList.add('hidden');
          chevron.classList.remove('rotate-180');
          button.setAttribute('aria-expanded', 'false');
          callTypeDropdownOpen = false;
          
          // Clear existing column definitions when switching types
          columnDefinitions = [];
          displayColumnDefinitions();
          
          // Show the column analysis section now that a call type is selected
          const columnAnalysisSection = document.getElementById('columnAnalysisSection');
          if (columnAnalysisSection) {
            columnAnalysisSection.classList.remove('hidden');
            
            // Ensure the file upload tab is active by default
            switchUploadTab('fileUpload');
          }
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
          const dropdown = document.getElementById('callTypeDropdown');
          if (dropdown && !dropdown.contains(event.target) && callTypeDropdownOpen) {
            toggleCallTypeDropdown();
          }
        });

        // Keyboard navigation for accessibility
        let currentFocusedOption = -1;
        const callTypeOptions = ['enrichment', 'collection'];
        
        document.addEventListener('keydown', function(event) {
          if (callTypeDropdownOpen) {
            if (event.key === 'Escape') {
              toggleCallTypeDropdown();
              document.getElementById('callTypeButton').focus();
            } else if (event.key === 'ArrowDown') {
              event.preventDefault();
              currentFocusedOption = Math.min(currentFocusedOption + 1, callTypeOptions.length - 1);
              updateFocusedOption();
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              currentFocusedOption = Math.max(currentFocusedOption - 1, 0);
              updateFocusedOption();
            } else if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              if (currentFocusedOption >= 0) {
                selectCallType(callTypeOptions[currentFocusedOption]);
              }
            } else if (event.key === 'Tab') {
              toggleCallTypeDropdown();
            }
          }
        });
        
        function updateFocusedOption() {
          const options = document.querySelectorAll('.calltype-option');
          options.forEach((option, index) => {
            if (index === currentFocusedOption) {
              option.classList.add('bg-blue-50');
              option.setAttribute('aria-selected', 'true');
              document.getElementById('callTypeButton').setAttribute('aria-activedescendant', option.id);
            } else {
              option.classList.remove('bg-blue-50');
              option.setAttribute('aria-selected', 'false');
            }
          });
        }

        // ==================== FILE UPLOAD & ANALYSIS ====================

        // File upload handling
        let uploadedFileData = null;

        function handleFileUpload(input) {
          const file = input.files[0];
          if (!file) return;
          
          // Validate file size (10MB limit)
          const maxSize = 10 * 1024 * 1024; // 10MB in bytes
          if (file.size > maxSize) {
            showErrorMessage('File size too large. Please choose a file smaller than 10MB.');
            input.value = '';
            return;
          }
          
          // Show loading state (only if elements exist)
          const statusDiv = document.getElementById('uploadStatus');
          const fileNameSpan = document.getElementById('uploadedFileName');
          
          if (statusDiv && fileNameSpan) {
            statusDiv.classList.remove('hidden');
            fileNameSpan.innerHTML = `<i class="bi bi-hourglass-split"></i> Analyzing ${file.name}...`;
          }
          
          // Parse the file
          FileParser.parse(file)
            .then(result => {
              uploadedFileData = result;
              
              // Validate that we got some columns
              if (!result.columns || result.columns.length === 0) {
                throw new Error('No columns detected in file. Please check that your file has a header row.');
              }
              
              // Update UI (only if elements exist)
              if (fileNameSpan) {
                fileNameSpan.innerHTML = `<i class="bi bi-file-check"></i> ${file.name}`;
              }
              
              // Pre-fill columns and open modal
              modalColumns = result.columns;
              displayModalColumns();
              openColumnModal();
              
              showSuccessMessage(`Successfully analyzed ${result.columns.length} columns from ${file.name}`);
            })
            .catch(error => {
              console.error('File parsing error:', error);
              let errorMessage = 'Failed to analyze file';
              
              // Provide more specific error messages
              if (error.message.includes('Unsupported file type')) {
                errorMessage = 'Unsupported file type. Please upload a CSV file.';
              } else if (error.message.includes('No columns detected')) {
                errorMessage = error.message;
              } else if (error.message.includes('Failed to read file')) {
                errorMessage = 'Failed to read file. The file may be corrupted.';
              } else {
                errorMessage = `Failed to analyze file: ${error.message}`;
              }
              
              showErrorMessage(errorMessage);
              
              // Hide status on error (only if element exists)
              if (statusDiv) {
                statusDiv.classList.add('hidden');
              }
              input.value = ''; // Clear the input
              uploadedFileData = null;
            });
        }

        function clearUploadedFile() {
          uploadedFileData = null;
          const statusDiv = document.getElementById('uploadStatus');
          const fileInput = document.getElementById('columnFileUpload');
          
          if (statusDiv) {
            statusDiv.classList.add('hidden');
          }
          if (fileInput) {
            fileInput.value = '';
          }
          
          // Clear other input methods too
          const pasteInput = document.getElementById('pasteDataInput');
          const urlInput = document.getElementById('sheetsUrlInput');
          const previewDiv = document.getElementById('pasteDataPreview');
          
          if (pasteInput) pasteInput.value = '';
          if (urlInput) urlInput.value = '';
          if (previewDiv) previewDiv.classList.add('hidden');
          
          // Reset buttons
          updatePasteDataButton();
          updateSheetsUrlButton();
        }

        // Upload method tab switching functionality
        function switchUploadTab(tabName) {
          // Hide all tab contents
          const contents = ['fileUploadContent', 'pasteDataContent', 'sheetsUrlContent'];
          contents.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.classList.add('hidden');
          });
          
          // Remove active class from all tabs
          const tabs = ['fileUploadTab', 'pasteDataTab', 'sheetsUrlTab'];
          tabs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
              element.classList.remove('active');
              element.classList.add('border-transparent', 'text-secondary');
              element.classList.remove('border-primary', 'text-primary');
            }
          });
          
          // Show selected content and activate tab
          const selectedContent = document.getElementById(tabName + 'Content');
          const selectedTab = document.getElementById(tabName + 'Tab');
          
          if (selectedContent) selectedContent.classList.remove('hidden');
          if (selectedTab) {
            selectedTab.classList.add('active');
            selectedTab.classList.remove('border-transparent', 'text-secondary');
            selectedTab.classList.add('border-primary', 'text-primary');
          }
        }

        // Paste data validation and processing
        function validatePastedData() {
          const input = document.getElementById('pasteDataInput');
          const button = document.getElementById('processPasteBtn');
          const preview = document.getElementById('pasteDataPreview');
          
          if (!input || !button) return;
          
          const text = input.value.trim();
          if (text.length === 0) {
            button.disabled = true;
            preview.classList.add('hidden');
            return;
          }
          
          // Try to parse the data to see if it's valid
          const result = parseTabularData(text);
          if (result && result.data.length > 0) {
            button.disabled = false;
            showDataPreview(result);
          } else {
            button.disabled = true;
            preview.classList.add('hidden');
          }
        }

        function parseTabularData(text) {
          if (!text || text.trim().length === 0) return null;
          
          const lines = text.trim().split('\n');
          if (lines.length === 0) return null;
          
          // Try to detect delimiter (tab or comma)
          const firstLine = lines[0];
          const tabCount = (firstLine.match(/\t/g) || []).length;
          const commaCount = (firstLine.match(/,/g) || []).length;
          
          const delimiter = tabCount > commaCount ? '\t' : ',';
          
          // Parse all lines
          const data = lines.map(line => {
            if (delimiter === '\t') {
              return line.split('\t');
            } else {
              // Simple CSV parsing (handles quoted values)
              return line.match(/("([^"]|"")*"|[^,]*)/g)
                .map(field => field.replace(/^"(.*)"$/, '$1').replace(/""/g, '"'));
            }
          });
          
          // Validate that all rows have the same number of columns
          const columnCount = data[0].length;
          const validData = data.filter(row => row.length === columnCount);
          
          if (validData.length === 0) return null;
          
          return {
            data: validData,
            headers: validData[0],
            rows: validData.slice(1)
          };
        }

        function showDataPreview(result) {
          const preview = document.getElementById('pasteDataPreview');
          const tableContainer = document.getElementById('pasteDataTable');
          
          if (!preview || !tableContainer) return;
          
          // Create preview table
          let tableHTML = '<table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr>';
          
          // Headers
          result.headers.forEach(header => {
            tableHTML += `<th class="px-2 py-1 text-left font-medium text-gray-900">${escapeHtml(header)}</th>`;
          });
          tableHTML += '</tr></thead><tbody class="bg-white divide-y divide-gray-200">';
          
          // Show first 3 data rows for preview
          const previewRows = result.rows.slice(0, 3);
          previewRows.forEach(row => {
            tableHTML += '<tr>';
            row.forEach(cell => {
              tableHTML += `<td class="px-2 py-1 text-gray-700">${escapeHtml(cell)}</td>`;
            });
            tableHTML += '</tr>';
          });
          
          if (result.rows.length > 3) {
            tableHTML += `<tr><td colspan="${result.headers.length}" class="px-2 py-1 text-center text-gray-500 italic">... and ${result.rows.length - 3} more rows</td></tr>`;
          }
          
          tableHTML += '</tbody></table>';
          tableContainer.innerHTML = tableHTML;
          preview.classList.remove('hidden');
        }

        function processPastedData() {
          const input = document.getElementById('pasteDataInput');
          if (!input) return;
          
          const text = input.value.trim();
          const result = parseTabularData(text);
          
          if (!result) {
            showErrorMessage('Failed to parse pasted data. Please check the format.');
            return;
          }
          
          // Convert to the same format as file uploads
          const columns = result.headers.map(header => ({
            name: header,
            jsonFieldName: '',
            dataType: '', // Will be empty by default
            purpose: 'collect', // Default to collect data
            required: false,
            strictDataType: true,
            validationListId: '',
            strictValidation: true,
            helpText: '',
            saved: false
          }));
          
          // Update status
          const statusDiv = document.getElementById('uploadStatus');
          const fileNameSpan = document.getElementById('uploadedFileName');
          const statusMessage = document.getElementById('uploadStatusMessage');
          
          if (statusDiv && fileNameSpan && statusMessage) {
            statusDiv.classList.remove('hidden');
            fileNameSpan.innerHTML = `<i class="bi bi-clipboard-check"></i> Pasted Data (${result.rows.length} rows)`;
            statusMessage.textContent = `Data processed successfully. ${columns.length} columns detected.`;
          }
          
          // Set up the data for the modal
          uploadedFileData = {
            type: 'paste',
            fileName: 'Pasted Data',
            data: result.data,
            columns: columns
          };
          
          // Pre-fill columns and open modal
          modalColumns = columns;
          displayModalColumns();
          openColumnModal();
          
          showSuccessMessage(`Successfully processed ${columns.length} columns from pasted data`);
        }

        function updatePasteDataButton() {
          validatePastedData();
        }

        // Google Sheets URL functionality moved to validation.js module
        
        function importFromSheetsUrl() {
          const input = document.getElementById('sheetsUrlInput');
          if (!input) return;
          
          const url = input.value.trim();
          if (!url) return;
          
          // Show loading state
          const button = document.getElementById('importSheetsBtn');
          if (button) {
            button.innerHTML = '<i class="bi bi-hourglass-split mr-2"></i>Importing...';
            button.disabled = true;
          }
          
          // Prepare the request payload for the backend
          const requestData = {
            sheetsUrl: url,
            timestamp: new Date().toISOString(),
            requestId: Math.random().toString(36).substring(2, 15)
          };
          
          // Call the Google Apps Script backend function
          callGoogleAppsScriptBackend('importGoogleSheetsData', requestData)
            .then(response => {
              if (!response.success) {
                throw new Error(response.error || 'Unknown error from backend');
              }
              
              const sheetsData = response.data;
              
              // Validate that we got valid data
              if (!sheetsData || !sheetsData.headers || sheetsData.headers.length === 0) {
                throw new Error('No valid data found in the Google Sheet');
              }
              
              // Convert backend response to our column format
              const columns = sheetsData.headers.map(header => ({
                name: header,
                jsonFieldName: '',
                dataType: '',
                purpose: 'collect',
                required: false,
                strictDataType: true,
                validationListId: '',
                strictValidation: true,
                helpText: '',
                saved: false
              }));
              
              // Update status
              const statusDiv = document.getElementById('uploadStatus');
              const fileNameSpan = document.getElementById('uploadedFileName');
              const statusMessage = document.getElementById('uploadStatusMessage');
              
              if (statusDiv && fileNameSpan && statusMessage) {
                statusDiv.classList.remove('hidden');
                fileNameSpan.innerHTML = `<i class="bi bi-link-45deg"></i> Google Sheets Import (${sheetsData.rows ? sheetsData.rows.length : 0} rows)`;
                statusMessage.textContent = `Sheets imported successfully via backend. ${columns.length} columns detected.`;
              }
              
              // Set up the data for the modal
              uploadedFileData = {
                type: 'sheets-backend',
                fileName: 'Google Sheets Import',
                data: [sheetsData.headers, ...(sheetsData.rows || [])],
                columns: columns,
                metadata: {
                  originalUrl: url,
                  importedAt: new Date().toISOString(),
                  rowCount: sheetsData.rows ? sheetsData.rows.length : 0,
                  source: 'google-apps-script-backend'
                }
              };
              
              // Pre-fill columns and open modal
              modalColumns = columns;
              displayModalColumns();
              openColumnModal();
              
              showSuccessMessage(`Successfully imported ${columns.length} columns from Google Sheets via backend service`);
            })
            .catch(error => {
              console.error('Google Sheets backend import error:', error);
              
              // Provide specific error messages based on error type
              let errorMessage = '';
              
              if (error.message.includes('timeout') || error.message.includes('network')) {
                errorMessage = 'Request timeout or network error. Please check your connection and try again.';
              } else if (error.message.includes('permission') || error.message.includes('access')) {
                errorMessage = 'Access denied. Please ensure the Google Sheet is shared with appropriate permissions.';
              } else if (error.message.includes('not found') || error.message.includes('invalid')) {
                errorMessage = 'Invalid Google Sheets URL or sheet not found. Please check the URL format.';
              } else if (error.message.includes('backend') || error.message.includes('service')) {
                errorMessage = 'Backend service error. Please try again later or use the "Paste Data" method.';
              } else {
                errorMessage = `Import failed: ${error.message}`;
              }
              
              showErrorMessage(errorMessage);
            })
            .finally(() => {
              // Reset button state
              const button = document.getElementById('importSheetsBtn');
              if (button) {
                button.innerHTML = '<i class="bi bi-download mr-2"></i>Import from URL';
                button.disabled = false;
                validateSheetsUrl(); // Re-validate to set correct state
              }
            });
        }

        // Google Apps Script Backend Communication Function
        function callGoogleAppsScriptBackend(functionName, data) {
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
            .then(data => {
              if (data.success) {
                resolve(data);
              } else {
                reject(new Error(data.error || 'Unknown backend error'));
              }
            })
            .catch(error => {
              reject(new Error(`Backend request failed: ${error.message}`));
            });
            */
          });
        }

        // Helper function to escape HTML
        function escapeHtml(text) {
          const div = document.createElement('div');
          div.textContent = text;
          return div.innerHTML;
        }

        function openColumnModal() {
          // If no uploaded data, create a single empty column
          if (!uploadedFileData && modalColumns.length === 0) {
            modalColumns = [createEmptyColumn()];
          }
          
          // Initialize or reset selected column index
          selectedColumnIndex = 0;
          
          // Update modal subtitle based on context
          const subtitle = document.getElementById('modalSubtitle');
          if (uploadedFileData) {
            subtitle.textContent = `Pre-filled from ${uploadedFileData.fileName} (${uploadedFileData.columns.length} columns detected)`;
            subtitle.classList.add('text-blue-600');
          } else {
            subtitle.textContent = 'Configure data columns for your call';
            subtitle.classList.remove('text-blue-600');
          }
          
          displayModalColumns();
          
          const modal = document.getElementById('columnModal');
          if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
          }
        }

        function closeColumnModal() {
          modalColumns = [];
          uploadedFileData = null; // Clear uploaded data when closing
          
          const statusDiv = document.getElementById('uploadStatus');
          const fileInput = document.getElementById('columnFileUpload');
          
          if (statusDiv) {
            statusDiv.classList.add('hidden');
          }
          if (fileInput) {
            fileInput.value = '';
          }
          
          const modal = document.getElementById('columnModal');
          modal.classList.add('hidden');
          modal.classList.remove('flex');
          
          // Reset subtitle
          const subtitle = document.getElementById('modalSubtitle');
          subtitle.textContent = 'Configure data columns for your call';
        }

        // ==================== CALCULATED DATA FUNCTIONS ====================

        function toggleCalculatedDataControls(index) {
          const section = document.getElementById(`calculatedDataSection_${index}`);
          const column = modalColumns[index];
          
          if (column.purpose === 'calculated') {
            section.classList.remove('hidden');
          } else {
            section.classList.add('hidden');
            // Clear calculated data configuration when switching away
            modalColumns[index].calculationType = '';
            modalColumns[index].conditionalRules = [];
            modalColumns[index].formula = '';
            modalColumns[index].lookupSource = '';
            modalColumns[index].lookupTable = '';
            modalColumns[index].staticValue = '';
          }
        }

        function toggleCalculationConfig(index) {
          const column = modalColumns[index];
          const calculationType = column.calculationType;
          
          // Hide all config sections first
          ['conditional', 'formula', 'lookup', 'static'].forEach(type => {
            const element = document.getElementById(`${type}Config_${index}`);
            if (element) element.classList.add('hidden');
          });
          
          // Show the selected config section
          if (calculationType) {
            const element = document.getElementById(`${calculationType}Config_${index}`);
            if (element) element.classList.remove('hidden');
          }
        }

        function renderConditionalRules(rules, columnIndex) {
          if (!rules || rules.length === 0) {
            return `
              <div class="text-xs text-gray-500 italic p-2 border border-dashed border-gray-300 rounded">
                No rules defined yet. Click "Add Rule" to create conditional logic.
              </div>
            `;
          }
          
          return rules.map((rule, ruleIndex) => `
            <div class="border border-gray-200 rounded-lg p-3 bg-white">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-medium text-gray-600">Rule ${ruleIndex + 1}</span>
                <button type="button" onclick="removeConditionalRule(${columnIndex}, ${ruleIndex})" 
                        class="text-red-500 hover:text-red-700 text-xs">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
              
              <div class="grid grid-cols-12 gap-2 items-center text-sm">
                <!-- Source Column -->
                <div class="col-span-3">
                  <select onchange="updateConditionalRule(${columnIndex}, ${ruleIndex}, 'sourceColumn', this.value)" 
                          class="w-full px-2 py-1 border border-gray-300 rounded text-xs">
                    <option value="">Column...</option>
                    ${getOtherColumnsOptions(columnIndex, rule.sourceColumn)}
                  </select>
                </div>
                
                <!-- Operator -->
                <div class="col-span-2">
                  <select onchange="updateConditionalRule(${columnIndex}, ${ruleIndex}, 'operator', this.value)" 
                          class="w-full px-2 py-1 border border-gray-300 rounded text-xs">
                    <option value="">Op...</option>
                    <option value=">" ${rule.operator === '>' ? 'selected' : ''}>&gt;</option>
                    <option value="<" ${rule.operator === '<' ? 'selected' : ''}>&lt;</option>
                    <option value="=" ${rule.operator === '=' ? 'selected' : ''}>=</option>
                    <option value="!=" ${rule.operator === '!=' ? 'selected' : ''}>≠</option>
                    <option value=">=" ${rule.operator === '>=' ? 'selected' : ''}>≥</option>
                    <option value="<=" ${rule.operator === '<=' ? 'selected' : ''}>≤</option>
                    <option value="contains" ${rule.operator === 'contains' ? 'selected' : ''}>contains</option>
                    <option value="starts" ${rule.operator === 'starts' ? 'selected' : ''}>starts with</option>
                  </select>
                </div>
                
                <!-- Comparison Value -->
                <div class="col-span-3">
                  <input type="text" onchange="updateConditionalRule(${columnIndex}, ${ruleIndex}, 'value', this.value)" 
                         value="${rule.value || ''}" placeholder="Value..." 
                         class="w-full px-2 py-1 border border-gray-300 rounded text-xs" />
                </div>
                
                <!-- Then -->
                <div class="col-span-1 text-center text-xs text-gray-500">then</div>
                
                <!-- Result Value -->
                <div class="col-span-3">
                  <input type="text" onchange="updateConditionalRule(${columnIndex}, ${ruleIndex}, 'result', this.value)" 
                         value="${rule.result || ''}" placeholder="Result..." 
                         class="w-full px-2 py-1 border border-gray-300 rounded text-xs" />
                </div>
              </div>
            </div>
          `).join('');
        }

        function getOtherColumnsOptions(excludeIndex, selectedValue = '') {
          return modalColumns
            .map((col, index) => {
              if (index === excludeIndex || !col.name) return '';
              return `<option value="${col.name}" ${selectedValue === col.name ? 'selected' : ''}>${col.name}</option>`;
            })
            .filter(option => option !== '')
            .join('');
        }

        function addConditionalRule(columnIndex) {
          if (!modalColumns[columnIndex].conditionalRules) {
            modalColumns[columnIndex].conditionalRules = [];
          }
          
          modalColumns[columnIndex].conditionalRules.push({
            sourceColumn: '',
            operator: '',
            value: '',
            result: ''
          });
          
          // Re-render the conditional rules section
          const rulesContainer = document.getElementById(`conditionalRules_${columnIndex}`);
          if (rulesContainer) {
            rulesContainer.innerHTML = renderConditionalRules(modalColumns[columnIndex].conditionalRules, columnIndex);
          }
        }

        function removeConditionalRule(columnIndex, ruleIndex) {
          modalColumns[columnIndex].conditionalRules.splice(ruleIndex, 1);
          
          // Re-render the conditional rules section
          const rulesContainer = document.getElementById(`conditionalRules_${columnIndex}`);
          if (rulesContainer) {
            rulesContainer.innerHTML = renderConditionalRules(modalColumns[columnIndex].conditionalRules, columnIndex);
          }
        }

        function updateConditionalRule(columnIndex, ruleIndex, property, value) {
          if (!modalColumns[columnIndex].conditionalRules[ruleIndex]) {
            modalColumns[columnIndex].conditionalRules[ruleIndex] = {};
          }
          modalColumns[columnIndex].conditionalRules[ruleIndex][property] = value;
        }

        function createEmptyColumn() {
          return {
            name: '',
            jsonFieldName: '',
            dataType: '', // Default to empty instead of 'text'
            purpose: 'collect', // Default to collect data
            required: false,
            strictDataType: true,
            validationListId: '',
            strictValidation: true,
            helpText: '',
            saved: false // Track whether this column has been individually saved
          };
        }

        function createColumnRadioButton(column, index) {
          const isSelected = index === selectedColumnIndex;
          const isComplete = isColumnComplete(column, index);
          
          // Determine styling based on completion status
          let buttonClass, iconClass, textClass;
          if (isComplete) {
            buttonClass = isSelected 
              ? 'bg-green-600 border-green-600 text-white' 
              : 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200';
            iconClass = 'bi-check-circle-fill';
            textClass = isSelected ? 'text-white' : 'text-green-800';
          } else {
            buttonClass = isSelected 
              ? 'bg-red-600 border-red-600 text-white' 
              : 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200';
            iconClass = 'bi-exclamation-circle-fill';
            textClass = isSelected ? 'text-white' : 'text-red-800';
          }
          
          return `
            <button type="button" 
                    onclick="selectColumnForEditing(${index})"
                    class="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 text-sm font-medium ${buttonClass}">
              <i class="bi ${iconClass}"></i>
              <div class="text-left">
                <span class="${textClass}">${column.name || `Column ${index + 1}`}</span>
                ${column.purpose ? `<div class="text-xs opacity-75">${column.purpose === 'collect' ? 'Collect Data' : 'Calculated Data'}</div>` : ''}
              </div>
              ${isSelected ? '<i class="bi bi-chevron-down ml-auto"></i>' : ''}
            </button>
          `;
        }

        function createColumnEditForm(column, index) {
          // Filter out 'select' from data types since we're separating validation
          const dataTypeOptions = (CONFIG.dataTypes || [])
            .filter(type => type.value !== 'select')
            .map(type => 
              `<option value="${type.value}" ${column.dataType === type.value ? 'selected' : ''}>${type.label}</option>`
            ).join('');

          const hasValidation = column.validationListId && column.validationListId !== '';

          return `
            <div class="space-y-6">
              <!-- Basic Information Section -->
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-primary mb-2">Column Name *</label>
                  <input type="text" value="${column.name}" 
                         oninput="updateModalColumn(${index}, 'name', this.value); updateJsonFieldName(${index}, this.value); refreshRadioButtons();" 
                         class="w-full px-3 py-2 input-field rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                         placeholder="e.g., Award PIID" />
                  
                  <!-- JSON Field Name Display -->
                  <div class="mt-3 p-3 bg-gray-50 rounded-lg border">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-2">
                        <span class="text-xs font-medium text-gray-600">Backend Field Name:</span>
                        <code id="jsonName_${index}" class="text-xs font-mono px-2 py-1 bg-white rounded border text-secondary">
                          ${column.jsonFieldName || 'columnName'}
                        </code>
                        <div class="group relative">
                          <i class="bi bi-info-circle text-gray-400 hover:text-gray-600 cursor-help"></i>
                          <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-64 z-10">
                            This is how your column name will appear in the Google Sheet and backend systems. It follows camelCase naming conventions for API compatibility.
                          </div>
                        </div>
                      </div>
                    </div>
                    <div id="uniqueWarning_${index}" class="hidden mt-2 text-xs text-danger flex items-center">
                      <i class="bi bi-exclamation-triangle mr-1"></i>
                      This field name is already used by another column. Please choose a different name.
                    </div>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-primary mb-2">Data Type *</label>
                  <select onchange="updateModalColumn(${index}, 'dataType', this.value); refreshRadioButtons();" 
                          class="w-full px-3 py-2 input-field rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <option value="">Select data type...</option>
                    ${dataTypeOptions}
                  </select>
                </div>
              </div>

              <!-- Column Purpose Section -->
              <div class="bg-yellow-50 rounded-lg p-4">
                <h5 class="text-sm font-medium text-primary mb-3">Column Purpose</h5>
                <div class="space-y-3">
                  <div class="flex items-start space-x-3">
                    <input type="radio" 
                           name="columnPurpose_${index}" 
                           value="collect" 
                           ${(column.purpose === 'collect' || !column.purpose) ? 'checked' : ''} 
                           onchange="updateModalColumn(${index}, 'purpose', this.value); refreshRadioButtons();" 
                           class="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                           id="collectData_${index}" />
                    <div class="flex-1">
                      <label for="collectData_${index}" class="text-sm font-medium text-primary">Collect Data</label>
                      <p class="text-xs text-gray-600 mt-1">Users will be asked to fill in this column during the data call. This is for gathering new information from participants.</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start space-x-3">
                    <input type="radio" 
                           name="columnPurpose_${index}" 
                           value="calculated" 
                           ${column.purpose === 'calculated' ? 'checked' : ''} 
                           onchange="updateModalColumn(${index}, 'purpose', this.value); toggleCalculatedDataControls(${index}); refreshRadioButtons();" 
                           class="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                           id="calculatedData_${index}" />
                    <div class="flex-1">
                      <label for="calculatedData_${index}" class="text-sm font-medium text-primary">Calculated Data</label>
                      <p class="text-xs text-gray-600 mt-1">This column contains predefined data (existing data for enrichment calls) or will be calculated based on other columns or criteria.</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Calculated Data Configuration Section -->
              <div id="calculatedDataSection_${index}" class="${column.purpose === 'calculated' ? '' : 'hidden'} bg-purple-50 rounded-lg p-4">
                <h5 class="text-sm font-medium text-primary mb-3">
                  <i class="bi bi-calculator mr-2"></i>Calculated Data Configuration
                </h5>
                
                <div class="space-y-4">
                  <!-- Calculation Type -->
                  <div>
                    <label class="block text-sm font-medium text-primary mb-2">Calculation Type</label>
                    <select onchange="updateModalColumn(${index}, 'calculationType', this.value); toggleCalculationConfig(${index});" 
                            class="w-full px-3 py-2 input-field rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      <option value="">Select calculation type...</option>
                      <option value="conditional" ${column.calculationType === 'conditional' ? 'selected' : ''}>Conditional (if/then logic)</option>
                      <option value="formula" ${column.calculationType === 'formula' ? 'selected' : ''}>Mathematical formula</option>
                      <option value="lookup" ${column.calculationType === 'lookup' ? 'selected' : ''}>Lookup from other columns</option>
                      <option value="static" ${column.calculationType === 'static' ? 'selected' : ''}>Static/predefined value</option>
                    </select>
                  </div>

                  <!-- Conditional Logic Configuration -->
                  <div id="conditionalConfig_${index}" class="${column.calculationType === 'conditional' ? '' : 'hidden'}">
                    <h6 class="text-sm font-medium text-primary mb-2">Conditional Rules</h6>
                    <div class="space-y-3" id="conditionalRules_${index}">
                      ${renderConditionalRules(column.conditionalRules || [], index)}
                    </div>
                    <button type="button" onclick="addConditionalRule(${index})" 
                            class="mt-2 px-3 py-1 btn-secondary rounded text-sm">
                      <i class="bi bi-plus-circle mr-1"></i>Add Rule
                    </button>
                  </div>

                  <!-- Formula Configuration -->
                  <div id="formulaConfig_${index}" class="${column.calculationType === 'formula' ? '' : 'hidden'}">
                    <h6 class="text-sm font-medium text-primary mb-2">Mathematical Formula</h6>
                    <div class="space-y-2">
                      <textarea onchange="updateModalColumn(${index}, 'formula', this.value)" 
                                placeholder="e.g., {totalObligated} + {totalCommitted}" 
                                class="w-full px-3 py-2 input-field rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                                rows="2">${column.formula || ''}</textarea>
                      <p class="text-xs text-gray-600">Use {columnName} to reference other columns. Supports +, -, *, /, (, )</p>
                    </div>
                  </div>

                  <!-- Lookup Configuration -->
                  <div id="lookupConfig_${index}" class="${column.calculationType === 'lookup' ? '' : 'hidden'}">
                    <h6 class="text-sm font-medium text-primary mb-2">Lookup Configuration</h6>
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-primary mb-1">Source Column</label>
                        <select onchange="updateModalColumn(${index}, 'lookupSource', this.value)" 
                                class="w-full px-2 py-1 input-field rounded border border-gray-300 text-sm">
                          <option value="">Select column...</option>
                          ${getOtherColumnsOptions(index, column.lookupSource)}
                        </select>
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-primary mb-1">Lookup Table</label>
                        <select onchange="updateModalColumn(${index}, 'lookupTable', this.value)" 
                                class="w-full px-2 py-1 input-field rounded border border-gray-300 text-sm">
                          <option value="">Select validation list...</option>
                          <!-- Validation lists populated here -->
                        </select>
                      </div>
                    </div>
                  </div>

                  <!-- Static Value Configuration -->
                  <div id="staticConfig_${index}" class="${column.calculationType === 'static' ? '' : 'hidden'}">
                    <h6 class="text-sm font-medium text-primary mb-2">Static Value</h6>
                    <input type="text" onchange="updateModalColumn(${index}, 'staticValue', this.value)" 
                           value="${column.staticValue || ''}"
                           placeholder="Enter the fixed value for this column" 
                           class="w-full px-3 py-2 input-field rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-primary mb-2">Help Text</label>
                <input type="text" value="${column.helpText}" onchange="updateModalColumn(${index}, 'helpText', this.value)" 
                       class="w-full px-3 py-2 input-field rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                       placeholder="Hint or instructions for this field" />
              </div>

              <!-- Field Requirements Section -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h5 class="text-sm font-medium text-primary mb-3">Field Requirements</h5>
                <div class="space-y-3">
                  <div class="flex items-center">
                    <input type="checkbox" ${column.required ? 'checked' : ''} 
                           onchange="updateModalColumn(${index}, 'required', this.checked); refreshRadioButtons();" 
                           class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" id="required_${index}" />
                    <label for="required_${index}" class="ml-3 text-sm text-primary">Required field</label>
                  </div>
                  
                  <div class="flex items-center">
                    <input type="checkbox" ${column.strictDataType ? 'checked' : ''} 
                           onchange="updateModalColumn(${index}, 'strictDataType', this.checked)" 
                           class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" id="strict_${index}" />
                    <label for="strict_${index}" class="ml-3 text-sm text-primary">Strict data type enforcement</label>
                  </div>
                </div>
              </div>

              <!-- Validation Lists Section -->
              <div class="bg-blue-50 rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <h5 class="text-sm font-medium text-primary">Validation Lists</h5>
                </div>
                
                <div class="space-y-3">
                  <div class="flex items-center">
                    <input type="checkbox" ${hasValidation ? 'checked' : ''} 
                           onchange="toggleValidationList(${index}, this.checked)" 
                           class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" id="useValidation_${index}" />
                    <label for="useValidation_${index}" class="ml-3 text-sm text-primary">Use validation list</label>
                  </div>
                  
                  <div id="validationListSection_${index}" class="${hasValidation ? '' : 'hidden'}">
                    <div class="flex gap-2">
                      <select onchange="updateModalColumn(${index}, 'validationListId', this.value); updateStrictValidationVisibility(${index}); refreshRadioButtons();" 
                              class="flex-1 px-3 py-2 input-field rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                        <option value="">Select a validation list</option>
                        <!-- Validation lists would be populated here -->
                      </select>
                      <button type="button" onclick="openValidationListModal()" 
                              class="px-3 py-2 btn-secondary rounded-lg text-sm whitespace-nowrap">
                        <i class="bi bi-gear mr-1"></i>Manage Lists
                      </button>
                    </div>
                    
                    <div id="strictValidationContainer_${index}" class="${column.validationListId ? '' : 'hidden'} mt-3">
                      <div class="flex items-center">
                        <input type="checkbox" ${column.strictValidation ? 'checked' : ''} 
                               onchange="updateModalColumn(${index}, 'strictValidation', this.checked)" 
                               class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" id="strictVal_${index}" />
                        <label for="strictVal_${index}" class="ml-3 text-sm text-primary">
                          Strict enforcement (only allow values from list)
                        </label>
                      </div>
                      <p class="text-xs text-secondary mt-2 ml-6">
                        When unchecked, list provides suggestions but allows custom values
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
        }

        function selectColumnForEditing(index) {
          selectedColumnIndex = index;
          displayModalColumns();
        }

        function refreshRadioButtons() {
          // Update just the radio buttons without rebuilding the entire form
          const radioContainer = document.querySelector('#modalColumnsList .flex.flex-wrap.gap-2');
          if (radioContainer) {
            radioContainer.innerHTML = modalColumns.map((column, index) => createColumnRadioButton(column, index)).join('') + `
              <button type="button" 
                      onclick="addModalColumn()"
                      class="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-400 text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-all duration-200 text-sm font-medium">
                <i class="bi bi-plus-circle"></i>
                <span>Add Column</span>
              </button>
            `;
          }
          
          // Update the editing header
          const editingHeader = document.querySelector('#modalColumnsList h4');
          if (editingHeader) {
            editingHeader.textContent = `Editing: ${modalColumns[selectedColumnIndex].name || `Column ${selectedColumnIndex + 1}`}`;
          }
        }

        function isColumnComplete(column, currentIndex = -1) {
          // Check basic requirements: name and data type
          if (!column.name || !column.name.trim() || !column.dataType) {
            return false;
          }
          
          // Check for duplicate names
          const duplicateIndex = modalColumns.findIndex((col, index) => 
            index !== currentIndex && 
            col.name && 
            col.name.trim().toLowerCase() === column.name.trim().toLowerCase()
          );
          if (duplicateIndex !== -1) {
            return false;
          }
          
          // Check for validation list requirement
          const useValidationCheckbox = document.getElementById(`useValidation_${currentIndex}`);
          if (useValidationCheckbox && useValidationCheckbox.checked) {
            // If validation is enabled but no list is selected, column is incomplete
            if (!column.validationListId) {
              return false;
            }
          }
          
          return true;
        }

        function displayModalColumns() {
          const container = document.getElementById('modalColumnsList');
          
          // Ensure all columns have JSON field names
          modalColumns.forEach((column, index) => {
            if (!column.jsonFieldName && column.name) {
              column.jsonFieldName = generateJsonFieldName(column.name);
            }
          });
          
          // If no columns, show empty state
          if (modalColumns.length === 0) {
            container.innerHTML = `
              <div class="text-center py-8 text-secondary">
                <i class="bi bi-table text-4xl mb-3"></i>
                <p>No columns defined yet</p>
                <p class="text-sm mt-2">Click "Add Column" to get started</p>
              </div>
            `;
            return;
          }
          
          // Ensure selectedColumnIndex is valid
          if (selectedColumnIndex >= modalColumns.length) {
            selectedColumnIndex = modalColumns.length - 1;
          }
          if (selectedColumnIndex < 0) {
            selectedColumnIndex = 0;
          }
          
          // Generate radio button row for column selection
          const radioButtonsHtml = `
            <div class="mb-6">
              <h5 class="text-sm font-medium text-primary mb-3">Select Column to Edit:</h5>
              <div class="flex flex-wrap gap-2">
                ${modalColumns.map((column, index) => createColumnRadioButton(column, index)).join('')}
                <button type="button" 
                        onclick="addModalColumn()"
                        class="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-400 text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-all duration-200 text-sm font-medium">
                  <i class="bi bi-plus-circle"></i>
                  <span>Add Column</span>
                </button>
              </div>
            </div>
          `;
          
          // Generate edit container for selected column
          const editContainerHtml = `
            <div class="border border-secondary rounded-lg p-6 surface-secondary">
              <div class="flex justify-between items-center mb-4">
                <h4 class="font-medium text-primary">Editing: ${modalColumns[selectedColumnIndex].name || `Column ${selectedColumnIndex + 1}`}</h4>
                <div class="flex gap-2">
                  <button type="button" onclick="duplicateModalColumn(${selectedColumnIndex})" class="px-3 py-1 btn-secondary rounded text-sm">
                    <i class="bi bi-copy mr-1"></i>Duplicate
                  </button>
                  <button type="button" onclick="removeModalColumn(${selectedColumnIndex})" class="px-3 py-1 text-danger hover:bg-red-50 rounded text-sm">
                    <i class="bi bi-trash mr-1"></i>Remove
                  </button>
                </div>
              </div>
              ${createColumnEditForm(modalColumns[selectedColumnIndex], selectedColumnIndex)}
            </div>
          `;
          
          container.innerHTML = radioButtonsHtml + editContainerHtml;
          
          // Populate validation lists after rendering
          populateModalValidationLists();
          
          // Update JSON field name display
          const column = modalColumns[selectedColumnIndex];
          if (column.name) {
            updateJsonFieldName(selectedColumnIndex, column.name);
          }
        }

        function addModalColumn() {
          modalColumns.push(createEmptyColumn());
          selectedColumnIndex = modalColumns.length - 1; // Auto-select the new column
          displayModalColumns();
        }

        function duplicateModalColumn(index) {
          const columnToDuplicate = { ...modalColumns[index] };
          columnToDuplicate.name = columnToDuplicate.name + ' (Copy)';
          columnToDuplicate.jsonFieldName = generateJsonFieldName(columnToDuplicate.name);
          columnToDuplicate.saved = false; // New duplicate should be unsaved
          modalColumns.splice(index + 1, 0, columnToDuplicate);
          selectedColumnIndex = index + 1; // Auto-select the duplicated column
          displayModalColumns();
        }

        function removeModalColumn(index) {
          if (modalColumns.length > 1) {
            modalColumns.splice(index, 1);
            
            // Adjust selectedColumnIndex if necessary
            if (selectedColumnIndex >= modalColumns.length) {
              selectedColumnIndex = modalColumns.length - 1;
            } else if (selectedColumnIndex > index) {
              selectedColumnIndex--;
            }
            
            displayModalColumns();
          } else {
            showErrorMessage('At least one column is required');
          }
        }

        function updateModalColumn(index, property, value) {
          modalColumns[index][property] = value;
          
          // If purpose changed to/from calculated, toggle calculated data controls
          if (property === 'purpose') {
            toggleCalculatedDataControls(index);
          }
          
          // If calculation type changed, toggle appropriate config sections
          if (property === 'calculationType') {
            toggleCalculationConfig(index);
          }
          
          // If data type changed, refresh validation lists and clear errors
          if (property === 'dataType') {
            populateModalValidationLists();
            
            // Clear any data type errors for this column
            const container = document.getElementById(`validationListSection_${index}`);
            if (container) {
              clearDataTypeError(container);
            }
            
            // Clear any selected validation list that's no longer compatible
            const currentList = modalColumns[index].validationListId;
            if (currentList) {
              const availableLists = AppState.getAvailableLists();
              const selectedList = availableLists.find(list => list.listId === currentList);
              if (selectedList && selectedList.dataType !== value) {
                modalColumns[index].validationListId = '';
                const select = document.querySelector(`#validationListSection_${index} select`);
                if (select) {
                  select.value = '';
                }
              }
            }
          }
        }

        function toggleValidationList(index, enabled) {
          const section = document.getElementById(`validationListSection_${index}`);
          if (enabled) {
            section.classList.remove('hidden');
            // Immediately populate the dropdown when enabled using the new validation logic
            setTimeout(() => {
              populateModalValidationLists();
            }, 0);
          } else {
            section.classList.add('hidden');
            modalColumns[index].validationListId = '';
            modalColumns[index].strictValidation = true;
            // Hide strict validation container too
            const strictContainer = document.getElementById(`strictValidationContainer_${index}`);
            if (strictContainer) {
              strictContainer.classList.add('hidden');
            }
            // Clear any data type errors
            clearDataTypeError(section);
          }
          
          // Refresh radio buttons to update completion status
          refreshRadioButtons();
        }

        function updateStrictValidationVisibility(index) {
          const container = document.getElementById(`strictValidationContainer_${index}`);
          const hasValidationList = modalColumns[index].validationListId;
          if (hasValidationList) {
            container.classList.remove('hidden');
          } else {
            container.classList.add('hidden');
            modalColumns[index].strictValidation = true;
          }
        }

        function openValidationListModal() {
          showListManagementModal();
        }


        function editColumn(index) {
          // Select the column for editing in the new interface
          selectColumnForEditing(index);
        }

        function saveAllColumns() {
          // Validate all columns
          const jsonFieldNames = new Set();
          const incompleteColumns = [];
          
          for (let i = 0; i < modalColumns.length; i++) {
            const column = modalColumns[i];
            
            // Check required fields
            if (!column.name || !column.dataType) {
              incompleteColumns.push(i + 1);
              continue;
            }
            
            // Generate and check JSON field name
            const jsonFieldName = column.jsonFieldName || generateJsonFieldName(column.name);
            
            if (!jsonFieldName) {
              showErrorMessage(`Column ${i + 1}: Column name "${column.name}" cannot be converted to a valid field name. Please use alphanumeric characters.`);
              return;
            }
            
            // Check for duplicate JSON field names
            if (jsonFieldNames.has(jsonFieldName.toLowerCase())) {
              showErrorMessage(`Column ${i + 1}: The field name "${jsonFieldName}" conflicts with another column. Please choose a different name.`);
              return;
            }
            
            jsonFieldNames.add(jsonFieldName.toLowerCase());
            
            // Ensure the JSON field name is saved
            modalColumns[i].jsonFieldName = jsonFieldName;
          }

          // Show error for incomplete columns
          if (incompleteColumns.length > 0) {
            const columnList = incompleteColumns.join(', ');
            showErrorMessage(`Column${incompleteColumns.length > 1 ? 's' : ''} ${columnList} ${incompleteColumns.length > 1 ? 'are' : 'is'} missing required information (name and data type). Please complete before saving.`);
            return;
          }

          // Ensure columnDefinitions is always an array
          if (!Array.isArray(columnDefinitions)) {
            columnDefinitions = [];
          }

          // Handle editing vs adding new columns
          modalColumns.forEach(column => {
            const cleanColumn = { ...column };
            delete cleanColumn.saved; // Remove the saved property before adding to main definitions
            
            if (typeof cleanColumn.editingIndex === 'number') {
              // This is an edit operation - replace the existing column
              columnDefinitions[cleanColumn.editingIndex] = cleanColumn;
              delete cleanColumn.editingIndex; // Clean up the editing index
            } else {
              // This is a new column - add to the array
              columnDefinitions.push(cleanColumn);
            }
          });

          displayColumnDefinitions();
          closeColumnModal();
        }



        function displayColumnDefinitions() {
          // Ensure columnDefinitions is always an array
          if (!Array.isArray(columnDefinitions)) {
            columnDefinitions = [];
          }
          
          // Target the drag-and-drop container instead of old containers
          const container = document.getElementById('columnUploadDropZone');
          
          if (!container) return;
          
          if (columnDefinitions.length === 0) {
            // Show the original upload interface when no columns are defined
            container.innerHTML = `
              <div class="text-center">
                  <div class="mb-4">
                      <i class="bi bi-upload text-4xl text-gray-400 mb-2"></i>
                      <h4 class="text-lg font-medium text-primary mb-2">Upload File to Auto-Generate Columns</h4>
                      <p class="text-sm text-secondary">Upload a CSV or Excel file to automatically detect and create column definitions</p>
                      <p class="text-xs text-tertiary mt-1">Drag and drop files here or click to browse</p>
                  </div>
                  
                  <div class="flex flex-col sm:flex-row gap-3 items-center justify-center">
                      <input 
                          type="file" 
                          id="columnFileUpload" 
                          accept=".csv,.xlsx,.xls" 
                          class="hidden"
                          onchange="handleFileUpload(this)"
                      />
                      <label 
                          for="columnFileUpload" 
                          class="px-4 py-2 btn-secondary rounded cursor-pointer inline-flex items-center"
                          aria-label="Choose file for column auto-generation"
                      >
                          <i class="bi bi-file-earmark-arrow-up mr-2" aria-hidden="true"></i>Choose File
                      </label>
                      <span class="text-sm text-secondary">or</span>
                      <button 
                          type="button" 
                          onclick="openColumnModal()" 
                          class="px-4 py-2 btn-primary rounded inline-flex items-center"
                          aria-label="Define columns manually"
                      >
                          <i class="bi bi-plus-circle mr-2" aria-hidden="true"></i>Define Manually
                      </button>
                  </div>
              </div>
            `;
            return;
          }

          // Show the column definitions with management options
          const columnsHtml = columnDefinitions
            .map(
              (col, index) => {
                const enforcementBadges = [];
                
                // Data type enforcement badge
                if (col.strictDataType) {
                  enforcementBadges.push('<span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded" title="Data type is strictly enforced">🔒 Strict Type</span>');
                } else {
                  enforcementBadges.push('<span class="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded" title="Data type validation is lenient">🔓 Flexible Type</span>');
                }
                
                // Validation list enforcement badges
                if (col.validationListId) {
                  if (col.strictValidation) {
                    enforcementBadges.push('<span class="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded" title="Only values from the list are allowed">🔒 Strict List</span>');
                  } else {
                    enforcementBadges.push('<span class="text-xs px-2 py-1 bg-green-100 text-green-800 rounded" title="List provides suggestions, custom values allowed">💡 Suggested List</span>');
                  }
                }
                
                // Build validation list info
                const validationInfo = col.validationListId ? 
                  `<div class="text-xs text-secondary mt-1">
                     <i class="bi bi-list-check"></i> Validation List: <span class="font-medium">${col.validationListId}</span>
                   </div>` : '';
                
                return `
                <div class="flex items-start justify-between p-3 bg-white rounded border border-gray-200 shadow-sm">
                    <div class="flex-grow">
                        <div class="flex items-center space-x-2 mb-2">
                            <span class="font-semibold text-primary text-base">${col.name}</span>
                            <span class="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded font-medium">
                                ${col.dataType}
                            </span>
                            ${
                              col.required
                                ? '<span class="text-xs px-2 py-1 bg-red-100 text-red-800 rounded font-medium">⚠️ Required</span>'
                                : '<span class="text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded">Optional</span>'
                            }
                        </div>
                        
                        ${
                          col.jsonFieldName
                            ? `<div class="text-xs text-secondary mb-2">
                                 <i class="bi bi-code"></i> Backend Field: <code class="font-mono bg-gray-100 px-1 rounded">${col.jsonFieldName}</code>
                               </div>`
                            : ''
                        }
                        
                        <div class="flex flex-wrap items-center gap-1 mb-2">
                            ${enforcementBadges.join('')}
                        </div>
                        
                        ${validationInfo}
                        
                        ${
                          col.helpText
                            ? `<div class="text-sm text-secondary mt-2 p-2 bg-blue-50 rounded border-l-2 border-blue-200">
                                 <i class="bi bi-info-circle text-blue-600"></i> ${col.helpText}
                               </div>`
                            : ''
                        }
                    </div>
                    <div class="flex flex-col space-y-1 ml-4">
                        <button
                            onclick="editColumnDefinition(${index})"
                            class="p-2 text-tertiary hover:text-warning hover:bg-yellow-50 rounded transition-colors"
                            title="Edit column"
                        >
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button
                            onclick="removeColumnDefinition(${index})"
                            class="p-2 text-tertiary hover:text-danger hover:bg-red-50 rounded transition-colors"
                            title="Remove column"
                        >
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
                `;
              }
            )
            .join('');

          container.innerHTML = `
            <div class="space-y-3">
              <div class="flex justify-between items-center mb-3">
                <div>
                  <h4 class="text-lg font-medium text-primary">Column Definitions (${columnDefinitions.length})</h4>
                  <p class="text-sm text-secondary">Configure your data columns below</p>
                </div>
                <div class="flex gap-2">
                  <button
                      type="button"
                      onclick="openColumnModal()"
                      class="px-3 py-1 btn-secondary rounded text-sm"
                      title="Add more columns"
                  >
                      <i class="bi bi-plus mr-1"></i>Add More
                  </button>
                  <button
                      type="button"
                      onclick="clearAllColumns()"
                      class="px-3 py-1 btn-danger rounded text-sm"
                      title="Clear all columns"
                  >
                      <i class="bi bi-trash mr-1"></i>Clear All
                  </button>
                </div>
              </div>
              ${columnsHtml}
            </div>
          `;
        }

        function clearAllColumns() {
          if (confirm('Are you sure you want to clear all column definitions?')) {
            columnDefinitions = [];
            displayColumnDefinitions();
          }
        }

        function removeColumnDefinition(index) {
          // Ensure columnDefinitions is always an array
          if (!Array.isArray(columnDefinitions)) {
            columnDefinitions = [];
            return;
          }
          
          if (index < 0 || index >= columnDefinitions.length) {
            showErrorMessage('Invalid column index');
            return;
          }
          
          if (confirm('Remove this column definition?')) {
            columnDefinitions.splice(index, 1);
            displayColumnDefinitions();
          }
        }

        function editColumnDefinition(index) {
          if (index < 0 || index >= columnDefinitions.length) {
            showErrorMessage('Invalid column index');
            return;
          }

          // Copy the column definition to modalColumns for editing
          const columnToEdit = JSON.parse(JSON.stringify(columnDefinitions[index])); // Deep copy
          columnToEdit.saved = false; // Mark as unsaved to show expanded view
          columnToEdit.editingIndex = index; // Store the original index for saving back

          // Set up modal with just this column
          modalColumns = [columnToEdit];
          
          // Open the modal
          displayModalColumns();
          openColumnModal();
        }

        // ==================== DATA CALL CREATION ====================

        // Update the existing createCallForm handler
        document.getElementById('createCallForm')?.addEventListener('submit', function (e) {
          e.preventDefault();

          const callType = document.getElementById('callType').value;
          
          const callData = {
            name: document.getElementById('callTitle').value,
            type: callType,
            description: document.getElementById('callDescription').value,
            instructions: document.getElementById('callInstructions').value,
            dueDate: document.getElementById('dueDate').value,
            priority: document.getElementById('priority').value
          };

          if (callType === 'enrichment') {
            callData.targetListId = document.getElementById('targetList').value;
            callData.columns = columnDefinitions;
            
            if (!callData.targetListId) {
              showErrorMessage('Please select a target list');
              return;
            }
            
            if (columnDefinitions.length === 0) {
              showErrorMessage('Please define at least one column');
              return;
            }
          } else if (callType === 'collection') {
            callData.matchingCriteria = document.getElementById('matchingCriteria').value;
          }

          apiCall('createDataCall', callData)
            .then(function (result) {
              showSuccessMessage('Data call created successfully!');
              resetCreateForm();
              switchTab('manage');
              loadManagedCalls(); // Refresh the managed calls list
            })
            .catch(function (error) {
              showErrorMessage('Error creating data call: ' + error.message);
            });
        });

        function resetCreateForm() {
          document.getElementById('createCallForm').reset();
          columnDefinitions = [];
          displayColumnDefinitions();
        }

        // ==================== LOAD DATA CALLS ====================

        function displayManagedCalls(calls) {
          const callsList = document.getElementById('callsList');
          
          if (calls.length === 0) {
            callsList.innerHTML =
              '<div class="p-8 text-center text-tertiary">No data calls created yet</div>';
            return;
          }

          callsList.innerHTML = calls
            .map((call) => {
              const isOverdue =
                new Date(call.dueDate) < new Date() && call.status === 'active';
              
              return `
                    <div class="p-6 hover:bg-gray-50 transition">
                        <div class="flex items-center justify-between">
                            <div class="flex-grow">
                                <div class="flex items-center space-x-3 mb-2">
                                    <h4 class="text-lg font-medium text-primary">${call.name}</h4>
                                    <span class="px-2 py-1 text-xs rounded-full ${
                                      call.type === 'enrichment'
                                        ? 'priority-medium'
                                        : 'status-completed'
                                    }">
                                        ${
                                          call.type === 'enrichment'
                                            ? 'Enrichment'
                                            : 'Collection'
                                        }
                                    </span>
                                    <span class="px-2 py-1 text-xs rounded-full ${getStatusClass(
                                      call.status,
                                      isOverdue
                                    )}">
                                        ${
                                          isOverdue
                                            ? 'Overdue'
                                            : call.status.charAt(0).toUpperCase() +
                                              call.status.slice(1)
                                        }
                                    </span>
                                </div>
                                <p class="text-sm text-secondary mb-2">${call.description}</p>
                                <div class="flex items-center space-x-4 text-xs text-tertiary">
                                    <span>
                                        <i class="bi bi-calendar mr-1"></i>Due: ${new Date(
                                          call.dueDate
                                        ).toLocaleDateString()}
                                    </span>
                                    <span>
                                        <i class="bi bi-person mr-1"></i>${call.createdBy}
                                    </span>
                                </div>
                            </div>
                            <div class="flex items-center space-x-2 ml-6">
                                <button
                                    onclick="viewDataCallDetails('${call.callId}')"
                                    class="p-2 text-tertiary hover:text-primary transition"
                                >
                                    <i class="bi bi-eye"></i>
                                </button>
                                <button
                                    onclick="viewResponses('${call.callId}')"
                                    class="p-2 text-tertiary hover:text-success transition"
                                >
                                    <i class="bi bi-file-earmark-text"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            })
            .join('');
        }

        function viewDataCallDetails(callId) {
          google.script.run
            .withSuccessHandler(function (result) {
              if (result.success) {
                const call = result.call;
                let details = `Call: ${call.name}\nType: ${call.type}\nStatus: ${call.status}\n\n`;
                details += `Description: ${call.description}\n\n`;
                details += `Instructions: ${call.instructions}\n\n`;
                
                if (call.type === 'enrichment' && call.columns) {
                  details += 'Columns to collect:\n';
                  call.columns.forEach((col) => {
                    details += `- ${col.name} (${col.dataType})${
                      col.required ? ' *Required' : ''
                    }\n`;
                  });
                }
                
                alert(details); // Replace with proper modal
              }
            })
            .getDataCallConfig(callId);
        }

        function viewResponses(callId) {
          google.script.run
            .withSuccessHandler(function (result) {
              if (result.success) {
                if (result.responses.length === 0) {
                  showSuccessMessage('No responses yet');
                } else {
                  alert(`${result.responses.length} responses received`);
                  // Implement proper response viewer
                }
              }
            })
            .getDataCallResponses(callId);
        }

        // ==================== COMPLETE DATA CALLS ====================

        function displayAssignedCalls(calls) {
          const assignedCalls = document.getElementById('assignedCalls');
          
          if (calls.length === 0) {
            assignedCalls.innerHTML =
              '<div class="p-8 text-center text-tertiary">No active data calls</div>';
            return;
          }

          assignedCalls.innerHTML = calls
            .map(
              (call) => `
                <div class="p-6 hover:bg-gray-50 transition">
                    <div class="flex items-center justify-between">
                        <div class="flex-grow">
                            <h4 class="text-lg font-medium text-primary">${call.name}</h4>
                            <p class="text-sm text-secondary mt-1">${call.description}</p>
                            <p class="text-xs text-tertiary mt-2">
                                Due: ${new Date(call.dueDate).toLocaleString()}
                            </p>
                        </div>
                        <button
                            onclick="openDynamicResponseModal('${call.callId}')"
                            class="px-4 py-2 btn-primary rounded text-sm"
                        >
                            Complete
                        </button>
                    </div>
                </div>
            `
            )
            .join('');
        }

        function openDynamicResponseModal(callId) {
          google.script.run
            .withSuccessHandler(function (result) {
              if (result.success) {
                const call = result.call;
                renderDynamicResponseForm(call);
              }
            })
            .getDataCallWithItems(callId);
        }

        function renderDynamicResponseForm(call) {
          const modal = document.getElementById('responseModal');
          const title = document.getElementById('responseModalTitle');
          const content = document.getElementById('responseModalContent');

          title.textContent = `Complete: ${call.name}`;

          if (call.type === 'enrichment') {
            let html = `
                    <div class="space-y-4">
                        <div class="priority-medium p-4 rounded-lg">
                            <h4 class="font-medium text-primary">Instructions</h4>
                            <p class="text-sm text-secondary mt-1">${call.instructions}</p>
                        </div>
                        
                        <div class="max-h-96 overflow-y-auto space-y-4" id="enrichmentItems">
            `;

            if (call.items && call.items.length > 0) {
              call.items.forEach((item, itemIndex) => {
                html += `
                            <div class="border border-secondary rounded-lg p-4" data-item-id="${item.itemId}">
                                <h5 class="font-medium text-primary mb-3">${item.value}</h5>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                `;

                call.columns.forEach((column, colIndex) => {
                  html += renderColumnInput(column, itemIndex, colIndex);
                });

                html += `
                                </div>
                            </div>
                `;
              });
            }

            html += `
                        </div>
                    </div>
            `;

            content.innerHTML = html;

            // Load validation lists if needed
            call.columns.forEach((column) => {
              if (column.validationListId) {
                loadValidationOptions(column.validationListId, column.columnId);
              }
            });
          } else {
            // Collection type
            content.innerHTML = `
                    <div class="space-y-4">
                        <div class="status-completed p-4 rounded-lg">
                            <h4 class="font-medium text-primary">Instructions</h4>
                            <p class="text-sm text-secondary mt-1">${call.instructions}</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-primary mb-2">
                                Collected Items (one per line)
                            </label>
                            <textarea
                                id="collectedItems"
                                rows="10"
                                class="w-full px-3 py-2 input-field rounded-lg"
                                placeholder="Enter items that match the criteria..."
                            ></textarea>
                        </div>
                    </div>
            `;
          }

          // Store call data for submission
          modal.dataset.callId = call.callId;
          modal.dataset.callType = call.type;

          modal.classList.remove('hidden');
          modal.classList.add('flex');
        }

        function renderColumnInput(column, itemIndex, colIndex) {
          const inputId = `input_${itemIndex}_${colIndex}`;
          const required = column.required ? 'required' : '';
          
          let inputHtml = '';
          
          switch (column.dataType) {
            case 'text':
              inputHtml = `
                        <input
                            type="text"
                            id="${inputId}"
                            ${required}
                            class="w-full px-3 py-2 input-field rounded-lg text-sm"
                            placeholder="${column.helpText || ''}"
                            data-column="${column.name}"
                        />
              `;
              break;
              
            case 'number':
              inputHtml = `
                        <input
                            type="number"
                            id="${inputId}"
                            ${required}
                            class="w-full px-3 py-2 input-field rounded-lg text-sm"
                            placeholder="${column.helpText || ''}"
                            data-column="${column.name}"
                        />
              `;
              break;
              
            case 'date':
              inputHtml = `
                        <input
                            type="date"
                            id="${inputId}"
                            ${required}
                            class="w-full px-3 py-2 input-field rounded-lg text-sm"
                            data-column="${column.name}"
                        />
              `;
              break;
              
            case 'email':
              inputHtml = `
                        <input
                            type="email"
                            id="${inputId}"
                            ${required}
                            class="w-full px-3 py-2 input-field rounded-lg text-sm"
                            placeholder="${column.helpText || ''}"
                            data-column="${column.name}"
                        />
              `;
              break;
              
            case 'select':
              inputHtml = `
                        <select
                            id="${inputId}"
                            ${required}
                            class="w-full px-3 py-2 input-field rounded-lg text-sm"
                            data-column="${column.name}"
                            data-validation-list="${column.validationListId}"
                        >
                            <option value="">Select...</option>
                        </select>
              `;
              break;
              
            case 'textarea':
              inputHtml = `
                        <textarea
                            id="${inputId}"
                            ${required}
                            rows="2"
                            class="w-full px-3 py-2 input-field rounded-lg text-sm"
                            placeholder="${column.helpText || ''}"
                            data-column="${column.name}"
                        ></textarea>
              `;
              break;
          }
          
          return `
                <div>
                    <label class="block text-xs font-medium text-primary mb-1">
                        ${column.name}${column.required ? ' *' : ''}
                    </label>
                    ${inputHtml}
                    ${
                      column.helpText
                        ? `<p class="text-xs text-tertiary mt-1">${column.helpText}</p>`
                        : ''
                    }
                </div>
          `;
        }

        function loadValidationOptions(listId, columnId) {
          google.script.run
            .withSuccessHandler(function (result) {
              if (result.success) {
                // Find all select elements for this column
                const selects = document.querySelectorAll(
                  `[data-validation-list="${listId}"]`
                );
                selects.forEach((select) => {
                  const options = result.items
                    .map((item) => `<option value="${item.value}">${item.value}</option>`)
                    .join('');
                  select.innerHTML = '<option value="">Select...</option>' + options;
                });
              }
            })
            .getListItems(listId);
        }

        // ==================== INITIALIZATION ====================

        function debugMissingElements() {
        const requiredIds = [
          'callType',
        ];
        
        console.group('Element Check');
        requiredIds.forEach(id => {
          const element = document.getElementById(id);
          if (!element) {
            console.warn(`❌ Missing: #${id}`);
          } else {
            console.log(`✓ Found: #${id}`);
          }
        });
        console.groupEnd();
      }

        // Update the initialization function
        document.addEventListener('DOMContentLoaded', function () {
          // Initialize UI first (sets up basic structure)
          initializeUI();
          
          // Then initialize app functionality
          initializeApp();
          
          // Load data (this will populate dropdowns)
          loadAllLists();
          
          // Load dashboard data
          //loadDashboardStats();
          //loadRecentActivity();
          updateNotificationBadge();
          
          // Populate data type options in column modal if it exists
          const dataTypeSelect = document.getElementById('columnDataType');
          if (dataTypeSelect && CONFIG.dataTypes) {
            dataTypeSelect.innerHTML = CONFIG.dataTypes
              .map((type) => `<option value="${type.value}">${type.label}</option>`)
              .join('');
          }
          
          // Load draft if available
          setTimeout(loadDraft, 500);
        });

        // ==================== DRAFT FUNCTIONALITY ====================

        function loadDraft() {
          const draft = localStorage.getItem('datacall_draft');
          if (draft) {
            try {
              const data = JSON.parse(draft);
              if (data.name && confirm('Load saved draft?')) {
                if (data.name) document.getElementById('callTitle').value = data.name;
                if (data.type) document.getElementById('callType').value = data.type;
                if (data.description) document.getElementById('callDescription').value = data.description;
                if (data.instructions) document.getElementById('callInstructions').value = data.instructions;
                
                // Clear the draft after loading
                localStorage.removeItem('datacall_draft');
              }
            } catch (e) {
              console.warn('Failed to load draft:', e);
            }
          }
        }

        // ==================== ERROR HANDLING ====================

        function showErrorMessage(message) {
          const notification = document.createElement('div');
          notification.className =
            'fixed top-4 right-4 text-white px-6 py-3 rounded-lg shadow-lg z-50 btn-danger';
          notification.innerHTML = `
            <div class="flex items-center space-x-2">
              <i class="bi bi-exclamation-circle"></i>
              <span>${message}</span>
            </div>
          `;
          document.body.appendChild(notification);

          setTimeout(() => {
            notification.remove();
          }, 5000);
        }

        // Update existing showSuccessMessage to match style
        function showSuccessMessage(message) {
          const notification = document.createElement('div');
          notification.className =
            'fixed top-4 right-4 text-white px-6 py-3 rounded-lg shadow-lg z-50 btn-success';
          notification.innerHTML = `
            <div class="flex items-center space-x-2">
              <i class="bi bi-check-circle"></i>
              <span>${message}</span>
            </div>
          `;
          document.body.appendChild(notification);

          setTimeout(() => {
            notification.remove();
          }, 3000);
        }