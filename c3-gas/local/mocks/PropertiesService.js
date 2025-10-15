/**
 * Mock PropertiesService for local development
 * Simulates Google Apps Script's PropertiesService using local file storage
 */

const fs = require('fs-extra');
const path = require('path');

class MockPropertiesService {
  constructor() {
    this.dataFile = path.join(__dirname, '../local/data/properties.json');
    this.ensureDataFile();
  }

  async ensureDataFile() {
    await fs.ensureDir(path.dirname(this.dataFile));
    if (!await fs.pathExists(this.dataFile)) {
      await fs.writeJson(this.dataFile, {});
    }
  }

  getScriptProperties() {
    return {
      getProperty: (key) => {
        const data = fs.readJsonSync(this.dataFile, { throws: false }) || {};
        return data[key] || null;
      },

      setProperty: (key, value) => {
        const data = fs.readJsonSync(this.dataFile, { throws: false }) || {};
        data[key] = value;
        fs.writeJsonSync(this.dataFile, data, { spaces: 2 });
      },

      getProperties: () => {
        return fs.readJsonSync(this.dataFile, { throws: false }) || {};
      },

      setProperties: (properties) => {
        const data = fs.readJsonSync(this.dataFile, { throws: false }) || {};
        Object.assign(data, properties);
        fs.writeJsonSync(this.dataFile, data, { spaces: 2 });
      },

      deleteProperty: (key) => {
        const data = fs.readJsonSync(this.dataFile, { throws: false }) || {};
        delete data[key];
        fs.writeJsonSync(this.dataFile, data, { spaces: 2 });
      },

      deleteAllProperties: () => {
        fs.writeJsonSync(this.dataFile, {}, { spaces: 2 });
      }
    };
  }

  getUserProperties() {
    // For simplicity, use the same storage as script properties
    return this.getScriptProperties();
  }

  getDocumentProperties() {
    // For simplicity, use the same storage as script properties
    return this.getScriptProperties();
  }
}

module.exports = MockPropertiesService;