/**
 * Local Development Server for Google Apps Script
 * 
 * This server provides a local development environment that mocks
 * Google Apps Script APIs and provides hot reloading for rapid development.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const WebSocket = require('ws');
const chokidar = require('chokidar');

// Import mock GAS services
const MockPropertiesService = require('./mocks/PropertiesService');
const MockUtilities = require('./mocks/Utilities');
const MockSession = require('./mocks/Session');
const MockHtmlService = require('./mocks/HtmlService');

class LocalGASServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.wsPort = process.env.WS_PORT || 3001;
    this.mockServices = {
      PropertiesService: new MockPropertiesService(),
      Utilities: new MockUtilities(),
      Session: new MockSession(),
      HtmlService: new MockHtmlService()
    };
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupFileWatcher();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Serve static files
    this.app.use('/static', express.static(path.join(__dirname, '../src/html')));
  }

  setupRoutes() {
    // Main webapp route
    this.app.get('/', (req, res) => {
      this.serveMainPage(res);
    });

    // API routes that mock google.script.run calls
    this.app.post('/api/:functionName', (req, res) => {
      this.handleGASFunction(req, res);
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Hot reload endpoint
    this.app.get('/hot-reload', (req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      const heartbeat = setInterval(() => {
        res.write('data: heartbeat\n\n');
      }, 30000);

      req.on('close', () => {
        clearInterval(heartbeat);
      });
    });
  }

  async serveMainPage(res) {
    try {
      // Read and compile the main HTML file
      const htmlPath = path.join(__dirname, '../src/html/index.html');
      let html = await fs.readFile(htmlPath, 'utf8');

      // Include styles
      const stylesPath = path.join(__dirname, '../src/html/styles.html');
      const styles = await fs.readFile(stylesPath, 'utf8');
      html = html.replace('<?!= include(\'styles\'); ?>', styles);

      // Include modals
      const modalsPath = path.join(__dirname, '../src/html/modals.html');
      const modals = await fs.readFile(modalsPath, 'utf8');
      html = html.replace('<?!= include(\'modals\'); ?>', modals);

      // Include scripts with local development modifications
      const scriptsPath = path.join(__dirname, '../src/html/scripts.html');
      let scripts = await fs.readFile(scriptsPath, 'utf8');
      
      // Replace google.script.run calls with local API calls
      scripts = this.modifyScriptsForLocal(scripts);
      html = html.replace('<?!= include(\'scripts\'); ?>', scripts);

      // Add hot reload script
      html = html.replace('</body>', this.getHotReloadScript() + '</body>');

      res.send(html);
    } catch (error) {
      console.error('Error serving main page:', error);
      res.status(500).send('Internal Server Error');
    }
  }

  modifyScriptsForLocal(scripts) {
    // Replace google.script.run with local API calls
    const localApiScript = `
      <script>
        // Mock google.script.run for local development
        window.google = {
          script: {
            run: new Proxy({}, {
              get(target, prop) {
                if (prop === 'withSuccessHandler') {
                  return function(successHandler) {
                    return new Proxy({}, {
                      get(target, prop) {
                        if (prop === 'withFailureHandler') {
                          return function(failureHandler) {
                            return new Proxy({}, {
                              get(target, functionName) {
                                return function(...args) {
                                  return fetch('/api/' + functionName, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ args: args })
                                  })
                                  .then(response => response.json())
                                  .then(result => {
                                    if (result.success) {
                                      successHandler(result.data);
                                    } else {
                                      failureHandler(new Error(result.error));
                                    }
                                  })
                                  .catch(failureHandler);
                                };
                              }
                            });
                          };
                        }
                        // Direct function call without failure handler
                        return function(...args) {
                          return fetch('/api/' + prop, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ args: args })
                          })
                          .then(response => response.json())
                          .then(result => {
                            if (result.success) {
                              successHandler(result.data);
                            } else {
                              console.error('API Error:', result.error);
                            }
                          })
                          .catch(console.error);
                        };
                      }
                    });
                  };
                }
                // Direct function call without handlers
                return function(...args) {
                  return fetch('/api/' + prop, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ args: args })
                  })
                  .then(response => response.json())
                  .then(result => {
                    if (result.success) {
                      return result.data;
                    } else {
                      throw new Error(result.error);
                    }
                  });
                };
              }
            })
          }
        };
        
        // Console info
        console.log('🚀 Local GAS Development Mode Active');
        console.log('📡 WebSocket connected for hot reloading');
      </script>
    `;

    return localApiScript + scripts;
  }

  getHotReloadScript() {
    return `
      <script>
        // Hot reload functionality
        const ws = new WebSocket('ws://localhost:${this.wsPort}');
        ws.onmessage = function(event) {
          if (event.data === 'reload') {
            console.log('🔄 Hot reloading...');
            window.location.reload();
          }
        };
        ws.onopen = function() {
          console.log('🔌 Hot reload connected');
        };
        ws.onclose = function() {
          console.log('❌ Hot reload disconnected');
          // Try to reconnect after 2 seconds
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        };
      </script>
    `;
  }

  async handleGASFunction(req, res) {
    const { functionName } = req.params;
    const { args } = req.body;

    try {
      console.log(`📞 API Call: ${functionName}`, args);

      // Load and execute the GAS function
      const result = await this.executeGASFunction(functionName, args);
      
      res.json({ success: true, data: result });
    } catch (error) {
      console.error(`❌ Error in ${functionName}:`, error);
      res.json({ success: false, error: error.message });
    }
  }

  async executeGASFunction(functionName, args) {
    // Load the GAS files and create execution context
    const gasContext = await this.createGASContext();
    
    // Execute the function
    if (typeof gasContext[functionName] === 'function') {
      return gasContext[functionName](...(args || []));
    } else {
      throw new Error(`Function ${functionName} not found`);
    }
  }

  async createGASContext() {
    // Read all GAS files
    const gasFiles = [
      '../src/config.gs',
      '../src/validation.gs', 
      '../src/api.gs',
      '../src/main.gs'
    ];

    let gasCode = '';
    for (const file of gasFiles) {
      const filePath = path.join(__dirname, file);
      if (await fs.pathExists(filePath)) {
        const content = await fs.readFile(filePath, 'utf8');
        gasCode += content + '\n';
      }
    }

    // Create execution context with mock services
    const context = {
      ...this.mockServices,
      console: console,
      JSON: JSON,
      Date: Date,
      Math: Math,
      parseInt: parseInt,
      parseFloat: parseFloat,
      isNaN: isNaN,
      eval: eval // Careful with this in production!
    };

    // Execute the GAS code in the context
    const vm = require('vm');
    vm.createContext(context);
    vm.runInContext(gasCode, context);

    return context;
  }

  setupWebSocket() {
    this.wss = new WebSocket.Server({ port: this.wsPort });
    
    this.wss.on('connection', (ws) => {
      console.log('🔌 WebSocket client connected');
      
      ws.on('close', () => {
        console.log('❌ WebSocket client disconnected');
      });
    });
  }

  setupFileWatcher() {
    // Watch for file changes
    const watcher = chokidar.watch([
      path.join(__dirname, '../src/**/*'),
      path.join(__dirname, '../local/**/*')
    ], {
      ignored: /node_modules/,
      persistent: true
    });

    watcher.on('change', (filePath) => {
      console.log(`📝 File changed: ${path.relative(__dirname, filePath)}`);
      
      // Clear require cache for the changed file
      delete require.cache[require.resolve(filePath)];
      
      // Notify all connected clients to reload
      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send('reload');
        }
      });
    });
  }

  start() {
    return new Promise((resolve, reject) => {
      // Start Express server
      this.server = this.app.listen(this.port, (err) => {
        if (err) {
          console.error('❌ Failed to start Express server:', err);
          reject(err);
          return;
        }
        
        console.log('\n🚀 Local GAS Development Server Started!');
        console.log(`📱 Web App: http://localhost:${this.port}`);
        console.log(`🔌 WebSocket: ws://localhost:${this.wsPort}`);
        console.log(`🎯 Hot Reload: Active`);
        console.log('\n📋 Available Commands:');
        console.log('  npm run dev    - Start development server');
        console.log('  npm run push   - Push to Google Apps Script');
        console.log('  npm run deploy - Deploy to Google Apps Script');
        console.log('  npm test       - Run tests');
        console.log('\n✅ Server is ready to accept connections');
        
        resolve(this);
      });

      // Handle server errors
      this.server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`❌ Port ${this.port} is already in use. Please stop any other servers or use a different port.`);
        } else {
          console.error('❌ Server error:', err);
        }
        reject(err);
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('🛑 Express server stopped');
          resolve();
        });
      } else {
        resolve();
      }
      
      if (this.wss) {
        this.wss.close(() => {
          console.log('🛑 WebSocket server stopped');
        });
      }
    });
  }
}

// Start the server
if (require.main === module) {
  const server = new LocalGASServer();
  
  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });
  
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });
  
  // Start the server with error handling
  server.start().catch((err) => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = LocalGASServer;