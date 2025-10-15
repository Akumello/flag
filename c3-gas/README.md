# Data Call Manager - Google Apps Script

A comprehensive data call management system built for Google Apps Script with professional local development capabilities.

## Quick Start (Local Development)

### Option 1: One-Command Start
```bash
cd c3-gas
node local/start.js
```

### Option 2: Manual Setup
```bash
cd c3-gas
npm install
npm run dev
```

Then open your browser to `http://localhost:3000`

## Features

✨ **Complete Data Call Management**
- Create enrichment and collection data calls
- File upload and parsing (CSV support)
- Advanced column configuration
- Calculated data with conditional logic
- Validation lists and data type checking

🎯 **Calculated Data System**
- Conditional logic with multiple rules
- Mathematical formulas with variable substitution  
- Lookup tables with CSV parsing
- Static values

🚀 **Professional Development Environment**
- Local development server with hot reloading
- Mock Google Apps Script APIs
- Comprehensive testing suite
- TypeScript support ready
- ESLint configuration

## Development Workflow

### Local Development
```bash
npm run dev          # Start development server
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Lint code
```

### Google Apps Script Deployment
```bash
npm run build        # Build for deployment
npm run push         # Push to Google Apps Script
npm run deploy       # Deploy to Google Apps Script
```

## Project Structure

```
c3-gas/
├── src/                 # Google Apps Script source files
│   ├── *.gs            # Server-side Google Apps Script files
│   ├── html/           # HTML templates
│   └── appsscript.json # GAS manifest
├── local/              # Local development environment
│   ├── server.js       # Development server
│   ├── mocks/          # Mock GAS services
│   └── build.js        # Build script
├── tests/              # Test suite
├── .clasp.json         # Clasp configuration
└── package.json        # Dependencies and scripts
```

## How Local Development Works

The local development environment provides a complete simulation of Google Apps Script:

1. **Express Server**: Serves your HTML files with template processing
2. **Mock APIs**: Simulates PropertiesService, Utilities, Session, etc.
3. **Hot Reloading**: Automatically refreshes browser on file changes
4. **Real Testing**: Execute your .gs functions in Node.js environment

When you call `google.script.run.myFunction()`:
- Local environment intercepts the call
- Routes it to your actual .gs function
- Returns results just like real GAS

## Prerequisites

- Node.js 16+ 
- npm or yarn
- Google Apps Script API enabled (for deployment)
- clasp CLI installed globally: `npm install -g @google/clasp`

## Initial Setup for GAS Deployment

1. **Login to clasp**
   ```bash
   clasp login
   ```

2. **Create or clone GAS project**
   ```bash
   # Create new project
   clasp create --title "Data Call Manager" --type webapp
   
   # Or clone existing project
   clasp clone <your-script-id>
   ```

3. **Configure .clasp.json**
   Update the scriptId in `.clasp.json` with your project ID

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local development server |
| `npm run build` | Build project for deployment |
| `npm run push` | Push code to Google Apps Script |
| `npm run deploy` | Deploy to Google Apps Script |
| `npm test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint code |

## Key Features Implemented

### Data Call Creation
- **Enrichment Calls**: Upload base files, define columns to complete
- **Collection Calls**: Define matching criteria and required fields
- **Priority & Frequency**: Configurable urgency and schedule settings

### Advanced Column Configuration
- **Data Types**: Text, number, currency, date, email, URL, etc.
- **Validation**: Required fields, data type validation
- **Calculated Columns**: Four types of calculation logic

### Calculated Data Types

1. **Conditional Logic**
   ```
   If [Source Column] [Operator] [Value] Then [Result]
   ```

2. **Mathematical Formulas**
   ```
   {Column1} + {Column2} * 0.1
   ```

3. **Lookup Tables**
   ```csv
   Key,Value
   A,Alpha
   B,Beta
   ```

4. **Static Values**
   ```
   Default Value
   ```

### File Processing
- CSV file upload and parsing
- Column detection and data type analysis
- Sample value extraction
- JSON field name generation

## Architecture

### Client-Side (HTML/JavaScript)
- Responsive UI with dark/light themes
- Real-time form validation
- File upload and processing
- Modal-based column configuration

### Server-Side (Google Apps Script)
- RESTful API design
- Data persistence with PropertiesService
- Business logic separation
- Error handling and logging

### Local Development
- Express.js server
- WebSocket hot reloading
- Mock service layer
- Automated testing

## Testing

The project includes comprehensive testing:

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- local-development.test.js
```

Test coverage includes:
- API endpoint testing
- Mock service validation
- Business logic verification
- Integration testing

## Deployment

### Development to Production Flow

1. **Develop Locally**
   ```bash
   npm run dev
   ```

2. **Test Thoroughly**
   ```bash
   npm test
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

4. **Deploy to GAS**
   ```bash
   npm run push
   npm run deploy
   ```

### Environment Differences

| Feature | Local Dev | Google Apps Script |
|---------|-----------|-------------------|
| Data Storage | JSON files | PropertiesService |
| User Auth | Mock user | Google SSO |
| File Processing | Node.js | Limited to text |
| External APIs | Full access | GAS restrictions |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and test: `npm test`
4. Commit changes: `git commit -am 'Add feature'`
5. Push to branch: `git push origin feature-name`
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Professional Development Benefits

This setup provides a modern development experience for Google Apps Script:

- **Fast Iteration**: No deployment needed for testing
- **Debugging**: Use standard Node.js debugging tools
- **Version Control**: All code in Git with proper history
- **Testing**: Automated testing before deployment
- **Code Quality**: ESLint and consistent formatting
- **Team Collaboration**: Standard development practices

Perfect for teams building serious applications on Google Apps Script! 🎉