/**
 * Mock Utilities for local development
 * Simulates Google Apps Script's Utilities service
 */

const crypto = require('crypto');

class MockUtilities {
  /**
   * Generate a UUID (simulates Utilities.getUuid())
   */
  getUuid() {
    return crypto.randomUUID();
  }

  /**
   * Base64 encode (simulates Utilities.base64Encode())
   */
  base64Encode(data, charset = 'UTF-8') {
    if (typeof data === 'string') {
      return Buffer.from(data, charset.toLowerCase()).toString('base64');
    }
    return Buffer.from(data).toString('base64');
  }

  /**
   * Base64 decode (simulates Utilities.base64Decode())
   */
  base64Decode(encoded, charset = 'UTF-8') {
    const decoded = Buffer.from(encoded, 'base64');
    if (charset.toLowerCase() === 'utf-8') {
      return decoded.toString('utf8');
    }
    return decoded;
  }

  /**
   * Format date (simulates Utilities.formatDate())
   */
  formatDate(date, timeZone, format) {
    // Simple implementation - in real GAS this is more sophisticated
    if (format === 'yyyy-MM-dd') {
      return date.toISOString().split('T')[0];
    }
    if (format === 'yyyy-MM-dd HH:mm:ss') {
      return date.toISOString().replace('T', ' ').split('.')[0];
    }
    return date.toISOString();
  }

  /**
   * Parse date (simulates Utilities.parseDate())
   */
  parseDate(dateString) {
    return new Date(dateString);
  }

  /**
   * Sleep (simulates Utilities.sleep())
   */
  async sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  /**
   * JSON stringify with pretty printing
   */
  jsonStringify(obj, replacer = null, space = 2) {
    return JSON.stringify(obj, replacer, space);
  }

  /**
   * JSON parse
   */
  jsonParse(jsonString) {
    return JSON.parse(jsonString);
  }

  /**
   * Compute digest (simulates Utilities.computeDigest())
   */
  computeDigest(algorithm, value, charset = 'UTF-8') {
    const algorithms = {
      MD5: 'md5',
      SHA_1: 'sha1',
      SHA_256: 'sha256',
      SHA_512: 'sha512'
    };

    const hash = crypto.createHash(algorithms[algorithm] || 'sha256');
    hash.update(value, charset.toLowerCase());
    return hash.digest();
  }

  /**
   * Get random number
   */
  getRandomNumber() {
    return Math.random();
  }

  /**
   * Zip/Unzip functionality (basic implementation)
   */
  zip(files, name = 'archive.zip') {
    // This would require additional libraries like JSZip in a real implementation
    console.warn('Zip functionality not implemented in local mock');
    return null;
  }

  unzip(blob) {
    // This would require additional libraries like JSZip in a real implementation
    console.warn('Unzip functionality not implemented in local mock');
    return [];
  }
}

module.exports = MockUtilities;