/**
 * Mock HtmlService for local development
 * Simulates Google Apps Script's HtmlService
 */

const fs = require('fs-extra');
const path = require('path');

class MockHtmlService {
  /**
   * Create HTML output from file (simulates HtmlService.createHtmlOutputFromFile())
   */
  createHtmlOutputFromFile(filename) {
    return {
      getContent: () => {
        const filePath = path.join(__dirname, '../../src/html', filename + '.html');
        if (fs.existsSync(filePath)) {
          return fs.readFileSync(filePath, 'utf8');
        }
        return `<!-- File not found: ${filename}.html -->`;
      }
    };
  }

  /**
   * Create HTML output (simulates HtmlService.createHtmlOutput())
   */
  createHtmlOutput(html = '') {
    return {
      content: html,
      title: 'Local GAS App',
      xFrameOptionsMode: 'ALLOWALL',
      
      getContent: function() {
        return this.content;
      },
      
      setContent: function(content) {
        this.content = content;
        return this;
      },
      
      setTitle: function(title) {
        this.title = title;
        return this;
      },
      
      setXFrameOptionsMode: function(mode) {
        this.xFrameOptionsMode = mode;
        return this;
      },
      
      append: function(content) {
        this.content += content;
        return this;
      },
      
      appendUntrusted: function(content) {
        // In local development, treat the same as append
        return this.append(content);
      }
    };
  }

  /**
   * Create template from file (simulates HtmlService.createTemplateFromFile())
   */
  createTemplateFromFile(filename) {
    const self = this;
    
    return {
      filename: filename,
      
      evaluate: function() {
        const filePath = path.join(__dirname, '../../src/html', filename + '.html');
        let content = '';
        
        if (fs.existsSync(filePath)) {
          content = fs.readFileSync(filePath, 'utf8');
        } else {
          content = `<!-- Template file not found: ${filename}.html -->`;
        }
        
        return self.createHtmlOutput(content);
      },
      
      getRawContent: function() {
        const filePath = path.join(__dirname, '../../src/html', filename + '.html');
        if (fs.existsSync(filePath)) {
          return fs.readFileSync(filePath, 'utf8');
        }
        return '';
      }
    };
  }

  /**
   * Create template (simulates HtmlService.createTemplate())
   */
  createTemplate(html) {
    const self = this;
    
    return {
      content: html,
      
      evaluate: function() {
        return self.createHtmlOutput(this.content);
      },
      
      getRawContent: function() {
        return this.content;
      }
    };
  }

  /**
   * Get sandbox mode constants
   */
  get SandboxMode() {
    return {
      IFRAME: 'IFRAME',
      NATIVE: 'NATIVE'
    };
  }

  /**
   * Get X-Frame-Options mode constants
   */
  get XFrameOptionsMode() {
    return {
      ALLOWALL: 'ALLOWALL',
      DEFAULT: 'DEFAULT',
      DENY: 'DENY'
    };
  }
}

module.exports = MockHtmlService;