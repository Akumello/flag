/**
 * Build script for preparing Google Apps Script deployment
 * This script processes the source files and prepares them for clasp push
 */

const fs = require('fs-extra');
const path = require('path');

class GASBuilder {
  constructor() {
    this.srcDir = path.join(__dirname, '../src');
    this.buildDir = path.join(__dirname, '../build');
  }

  async build() {
    console.log('🏗️  Building Google Apps Script project...');

    try {
      // Clean build directory
      await fs.emptyDir(this.buildDir);

      // Copy GAS files
      await this.copyGASFiles();

      // Process HTML files
      await this.processHTMLFiles();

      // Copy configuration files
      await this.copyConfigFiles();

      console.log('✅ Build completed successfully!');
      console.log(`📁 Built files are in: ${this.buildDir}`);
      
    } catch (error) {
      console.error('❌ Build failed:', error);
      process.exit(1);
    }
  }

  async copyGASFiles() {
    console.log('📄 Copying GAS files...');
    
    const gasFiles = [
      'config.gs',
      'validation.gs',
      'api.gs',
      'main.gs',
      'appsscript.json'
    ];

    for (const file of gasFiles) {
      const srcPath = path.join(this.srcDir, file);
      const destPath = path.join(this.buildDir, file);
      
      if (await fs.pathExists(srcPath)) {
        await fs.copy(srcPath, destPath);
        console.log(`  ✓ ${file}`);
      }
    }
  }

  async processHTMLFiles() {
    console.log('🌐 Processing HTML files...');
    
    const htmlDir = path.join(this.srcDir, 'html');
    const files = await fs.readdir(htmlDir);
    
    for (const file of files) {
      if (file.endsWith('.html')) {
        const srcPath = path.join(htmlDir, file);
        const destPath = path.join(this.buildDir, file);
        
        let content = await fs.readFile(srcPath, 'utf8');
        
        // Process the content for GAS deployment
        content = this.processHTMLContent(content, file);
        
        await fs.writeFile(destPath, content);
        console.log(`  ✓ ${file}`);
      }
    }
  }

  processHTMLContent(content, filename) {
    // Remove local development specific code
    if (filename === 'scripts.html') {
      // Remove hot reload and local API mock code
      content = content.replace(/\/\/ Mock google\.script\.run for local development[\s\S]*?console\.log\('📡 WebSocket connected for hot reloading'\);/m, '');
      
      // Remove WebSocket hot reload script
      content = content.replace(/<script>[\s\S]*?Hot reload functionality[\s\S]*?<\/script>/m, '');
    }

    // Minify if needed (optional)
    // content = this.minifyHTML(content);

    return content;
  }

  async copyConfigFiles() {
    console.log('⚙️  Copying configuration files...');
    
    const configFiles = [
      '.clasp.json',
      '.claspignore'
    ];

    for (const file of configFiles) {
      const srcPath = path.join(__dirname, '..', file);
      const destPath = path.join(this.buildDir, file);
      
      if (await fs.pathExists(srcPath)) {
        await fs.copy(srcPath, destPath);
        console.log(`  ✓ ${file}`);
      }
    }
  }

  minifyHTML(html) {
    // Simple minification - remove extra whitespace and comments
    return html
      .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/>\s+</g, '><') // Remove whitespace between tags
      .trim();
  }
}

// Run the build if this script is executed directly
if (require.main === module) {
  const builder = new GASBuilder();
  builder.build();
}

module.exports = GASBuilder;