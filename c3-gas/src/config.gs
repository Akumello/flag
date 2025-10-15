/**
 * Configuration Module for Google Apps Script
 * Contains all application configuration data and constants
 */

/**
 * Gets the application configuration
 * @return {Object} Configuration object
 */
function getConfig() {
  return {
    app: {
      name: "Data Call Manager",
      version: "1.0.0"
    },
    tabs: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "bi-house-door",
        active: true
      },
      {
        id: "create",
        label: "Create Call",
        icon: "bi-plus-circle",
        active: false
      },
      {
        id: "manage",
        label: "Manage Calls",
        icon: "bi-list-ul",
        active: false
      },
      {
        id: "complete",
        label: "Complete Calls",
        icon: "bi-check-circle",
        active: false
      }
    ],
    dataTypes: [
      { value: 'text', label: 'Text' },
      { value: 'number', label: 'Number' },
      { value: 'currency', label: 'Currency' },
      { value: 'percentage', label: 'Percentage' },
      { value: 'date', label: 'Date' },
      { value: 'time', label: 'Time' },
      { value: 'datetime', label: 'Date Time' },
      { value: 'duration', label: 'Duration' },
      { value: 'boolean', label: 'Checkbox (True/False)' },
      { value: 'email', label: 'Email' },
      { value: 'url', label: 'URL' },
      { value: 'select', label: 'Selection (from list)' },
      { value: 'textarea', label: 'Long Text' },
      { value: 'formula', label: 'Formula' }
    ],
    dashboardStats: [
      {
        id: "activeCalls",
        label: "Active Calls",
        icon: "bi-clipboard-pulse",
        color: "primary",
        value: 0
      },
      {
        id: "pendingResponses",
        label: "Pending Responses",
        icon: "bi-clock-history",
        color: "warning",
        value: 0
      },
      {
        id: "completedCalls",
        label: "Completed",
        icon: "bi-check-circle",
        color: "success",
        value: 0
      },
      {
        id: "overdueCalls",
        label: "Overdue",
        icon: "bi-exclamation-triangle",
        color: "danger",
        value: 0
      }
    ],
    callTypes: [
      {
        value: "",
        label: "Select Type",
        disabled: true
      },
      {
        value: "enrichment",
        label: "Enrichment (Fill Columns for Existing Items)"
      },
      {
        value: "collection",
        label: "Collection (Provide List of Items)"
      }
    ],
    priorities: [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium", selected: true },
      { value: "high", label: "High" },
      { value: "urgent", label: "Urgent" }
    ],
    frequencies: [
      { value: "one-time", label: "One Time", selected: true },
      { value: "weekly", label: "Weekly" },
      { value: "monthly", label: "Monthly" },
      { value: "quarterly", label: "Quarterly" }
    ],
    statusFilters: [
      { value: "", label: "All Status" },
      { value: "active", label: "Active" },
      { value: "completed", label: "Completed" },
      { value: "overdue", label: "Overdue" }
    ],
    sampleData: {
      dataCalls: [
        {
          id: '1',
          title: 'GSA Internal Orders - Funding Office Update',
          type: 'enrichment',
          description: 'Complete columns E and F with the funding office and discount rate for all GSA internal orders.',
          priority: 'high',
          frequency: 'monthly',
          status: 'active',
          responses: 15,
          totalRequired: 20,
          columnsToComplete: 'Column E (Funding Office), Column F (Discount Rate)',
          baseDataFile: 'gsa_internal_orders.xlsx'
        },
        {
          id: '2',
          title: 'Oracle Product Usage Inventory',
          type: 'collection',
          description: 'Provide a comprehensive list of all orders that utilize Oracle products or services.',
          priority: 'medium',
          frequency: 'quarterly',
          status: 'active',
          responses: 8,
          totalRequired: 15,
          matchingCriteria: 'Orders that use Oracle products or services',
          requiredFields: 'Order Number, Product Name, License Type, Cost, Department'
        },
        {
          id: '3',
          title: 'Monthly Budget Reconciliation',
          type: 'enrichment',
          description: 'Reconcile budget variances and provide explanations for discrepancies over $10,000.',
          priority: 'urgent',
          frequency: 'monthly',
          status: 'completed',
          responses: 5,
          totalRequired: 5,
          columnsToComplete: 'Variance Amount, Explanation, Corrective Action'
        }
      ],
      notifications: [
        {
          id: '1',
          callId: '1',
          title: 'New Data Call: GSA Internal Orders - Funding Office Update',
          message: 'Complete columns E and F with the funding office and discount rate for all GSA internal orders.',
          type: 'new_call',
          priority: 'high',
          read: false
        },
        {
          id: '2',
          callId: '2',
          title: 'Data Call Due Soon: Oracle Product Usage Inventory',
          message: 'This data call is due in 2 days. Please complete your response.',
          type: 'reminder',
          priority: 'medium',
          read: false
        }
      ]
    }
  };
}

/**
 * Gets sample data for development and testing
 * @return {Object} Sample data object
 */
function getSampleData() {
  return getConfig().sampleData;
}