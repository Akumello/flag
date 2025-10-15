# Local Google Apps Script Development Environment

This directory contains a complete local development environment for Google Apps Script projects, following professional development practices.

## Features

🚀 **Local Development Server**
- Express.js server that mocks Google Apps Script APIs
- Hot reloading with WebSocket connections
- Real-time file watching and automatic browser refresh

🎯 **Mock Services** 
- `PropertiesService` - File-based storage simulation
- `Utilities` - UUID generation, base64 encoding, etc.
- `Session` - Mock user sessions
- `HtmlService` - Template processing

🔧 **Build System**
- Automated build process for GAS deployment
- Source file processing and optimization
- Configuration file management

🧪 **Testing Framework**
- Jest-based testing for all components
- API endpoint testing with supertest
- Mock service validation

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   This starts the local server at `http://localhost:3000` with hot reloading enabled.

3. **Open Your Browser**
   Navigate to `http://localhost:3000` to see your application running locally.

## Development Workflow

### Local Development
```bash
# Start the development server with hot reloading
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint
```

### Deployment to Google Apps Script
```bash
# Build the project for deployment
npm run build

# Push to Google Apps Script
npm run push

# Deploy to Google Apps Script
npm run deploy
```

## How It Works

### 1. Local Server (`local/server.js`)
- Serves your HTML files with proper template processing
- Mocks `google.script.run` calls by routing them to local API endpoints
- Provides hot reloading via WebSocket connections
- Executes your `.gs` files in a Node.js environment

### 2. Mock Services (`local/mocks/`)
- **PropertiesService**: Uses JSON files for data persistence
- **Utilities**: Provides UUID generation, encoding/decoding, date formatting
- **Session**: Mock user authentication and session data
- **HtmlService**: Template processing and HTML output generation

### 3. API Routing
When you call `google.script.run.myFunction()` in the browser:
1. The mock intercepts the call
2. Routes it to `/api/myFunction`
3. Loads and executes your `.gs` files
4. Returns the result back to the browser

### 4. Hot Reloading
- File watcher monitors changes to `.gs` and `.html` files
- WebSocket connection notifies the browser of changes
- Browser automatically reloads to show updates

## Project Structure

```
local/
├── server.js              # Main development server
├── build.js               # Build script for deployment
├── mocks/                 # Mock GAS services
│   ├── PropertiesService.js
│   ├── Utilities.js
│   ├── Session.js
│   └── HtmlService.js
└── data/                  # Local data storage
    └── properties.json    # Mock PropertiesService data
```

## Configuration

### Environment Variables
- `PORT` - Development server port (default: 3000)
- `WS_PORT` - WebSocket port for hot reloading (default: 3001)

### Package.json Scripts
- `dev` - Start development server
- `build` - Build for deployment
- `push` - Push to Google Apps Script
- `deploy` - Deploy to Google Apps Script
- `test` - Run tests
- `test:watch` - Run tests in watch mode
- `lint` - Lint code

## Professional Development Tips

### 1. Version Control
Keep your `.gs` files in version control alongside your local development files. The build process will prepare them for deployment.

### 2. Testing
Write tests for your GAS functions using the mock services. This allows you to test business logic without deploying.

### 3. Debugging
Use standard Node.js debugging tools:
```bash
# Debug the development server
node --inspect local/server.js

# Debug specific functions
node --inspect -e "require('./local/server.js')"
```

### 4. Continuous Integration
The testing framework integrates well with CI/CD pipelines:
```yaml
# GitHub Actions example
- run: npm test
- run: npm run build
- run: npm run deploy  # With proper clasp authentication
```

## Limitations

- **Excel File Parsing**: Not available in local environment (CSV only)
- **Google Services Integration**: Sheets, Drive, etc. need additional mocking
- **Triggers**: Time-based and event triggers not simulated locally
- **Permissions**: OAuth and authorization flows not replicated

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Mock Data Reset
```bash
# Clear all mock data
rm -rf local/data/
```

### Hot Reload Not Working
- Check browser console for WebSocket connection errors
- Ensure firewall isn't blocking WebSocket connections
- Try refreshing the page manually

This local development environment provides a professional workflow for Google Apps Script development while maintaining compatibility with the GAS deployment model.