# CPARS Performance Tracking Application

## Overview

The Contractor Performance Assessment Reporting System (CPARS) Performance Tracking Application is a Google Apps Script-based web application designed to display and manage contractor performance data with advanced filtering, export capabilities, and real-time data visualization.

## Features

### Core Functionality
- **Dual Table Display**: Separate tables for Complete and Incomplete performance records
- **Real-time Filtering**: Multi-select filters for Business Unit and Contract Status
- **Search Capability**: Live search by Contract Number and Order Number
- **Export Options**: Copy to clipboard, CSV export, and Google Sheets export
- **GSA Branding**: Professional styling using GSA brand colors and standards

### Data Management
- **Config-Driven Design**: Sample data for local development, Google Sheets integration for production
- **Dynamic Status Classification**: Automatic categorization based on completion status
- **Professional UI/UX**: Responsive design with collapsible filter sections

## Project Structure

```
cpars-gas/
├── .clasp.json                 # Google Apps Script deployment config
├── src/
│   ├── appsscript.json         # Apps Script manifest
│   ├── main.gs                 # Main server-side entry point
│   ├── data-service.gs         # Data retrieval and processing
│   ├── config.gs              # Application configuration and sample data
│   └── html/
│       ├── index.html          # Main application interface
│       ├── styles.html         # GSA-themed CSS styles
│       └── scripts.html        # Client-side JavaScript functionality
```

## Development Setup

### Prerequisites
- Google Apps Script CLI (clasp)
- Google Account with Apps Script enabled
- Access to Google Sheets (for production data)

### Local Development
1. Clone or download the project
2. Install clasp: `npm install -g @google/clasp`
3. Login to Google: `clasp login`
4. Create new project: `clasp create --type webapp`
5. Update `.clasp.json` with your script ID
6. Deploy: `clasp push`

### Deployment
1. Push code: `clasp push`
2. Deploy web app: `clasp deploy`
3. Open web app: `clasp open --webapp`

## Configuration

### Sample Data Structure
Each record contains:
- Contract Number
- Order Number  
- Business Unit
- Sector
- Division
- CO Name (Contracting Officer)
- Period of Performance
- Evaluation Status
- Completion Status
- Estimated Evaluation Date
- Days Until Due

### Completion Status Classification
- **Complete**: `Complete: Timely` or `Complete: Untimely`
- **Incomplete**: `Incomplete: Due`, `Incomplete: Almost Due`, `Incomplete: In Progress`, or `Incomplete: Overdue`

## Usage

### Filtering
- **Business Unit Filter**: Multi-select checkboxes for all available business units
- **Contract Status Filter**: Multi-select checkboxes for completion status categories
- **Search Filters**: Type-ahead search for Contract Number and Order Number
- **Clear Filters**: Reset all filters to default state

### Export Options
- **Copy to Clipboard**: Copy table data in tab-delimited format
- **Export to CSV**: Download data as CSV file
- **Export to Google Sheets**: Create new Google Sheet with data

### Data Actions
- **Copy Contract/Order Numbers**: Individual copy buttons for quick reference
- **Real-time Updates**: Tables update automatically as filters change

## Technical Implementation

### Backend (Google Apps Script)
- **main.gs**: Serves HTML and handles web app requests
- **data-service.gs**: Manages data retrieval from Google Sheets
- **config.gs**: Contains sample data and configuration settings

### Frontend (HTML/CSS/JavaScript)
- **Vanilla JavaScript**: No external frameworks, optimized for performance
- **Tailwind CSS**: Utility-first CSS with GSA theme customization
- **D3.js**: Data visualization capabilities for enhanced user experience
- **Responsive Design**: Mobile-friendly interface

## API Endpoints

### Data Service
- `getCPARSData()`: Retrieves all performance records
- `getFilterOptions()`: Returns available filter values
- `exportToSheets(data)`: Creates new Google Sheet with provided data

## Security & Privacy
- Data is processed server-side in Google Apps Script environment
- No external API dependencies
- Follows GSA security guidelines and best practices

## Support & Maintenance
For technical support or feature requests, contact the development team or submit an issue through the appropriate channels.

## Version History
- v1.0.0: Initial release with core functionality
- Future releases will include enhanced filtering and additional export options