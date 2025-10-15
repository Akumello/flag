#!/usr/bin/env node

/**
 * Quick start script for local GAS development
 * This script checks dependencies and starts the development environment
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Google Apps Script Local Development Environment...\n');

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  
  const npmInstall = spawn('npm', ['install'], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  npmInstall.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Dependencies installed successfully!\n');
      startServer();
    } else {
      console.error('❌ Failed to install dependencies');
      process.exit(1);
    }
  });
} else {
  startServer();
}

function startServer() {
  console.log('🌟 Starting local development server...\n');
  
  const server = spawn('node', ['local/server.js'], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  server.on('close', (code) => {
    console.log(`\n🛑 Server stopped with code ${code}`);
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development server...');
    server.kill('SIGINT');
  });
}