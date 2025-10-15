/**
 * Mock Session for local development
 * Simulates Google Apps Script's Session service
 */

class MockSession {
  constructor() {
    // Mock user data for local development
    this.mockUser = {
      email: 'developer@localhost.local',
      name: 'Local Developer'
    };
  }

  /**
   * Get active user (simulates Session.getActiveUser())
   */
  getActiveUser() {
    return {
      getEmail: () => this.mockUser.email,
      getName: () => this.mockUser.name,
      getUsername: () => this.mockUser.email.split('@')[0]
    };
  }

  /**
   * Get effective user (simulates Session.getEffectiveUser())
   */
  getEffectiveUser() {
    return this.getActiveUser();
  }

  /**
   * Get script timezone (simulates Session.getScriptTimeZone())
   */
  getScriptTimeZone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  }

  /**
   * Get temporary access token (simulates Session.getTemporaryActiveUserKey())
   */
  getTemporaryActiveUserKey() {
    return 'mock-temp-key-' + Date.now();
  }

  /**
   * Get locale (simulates Session.getLocale())
   */
  getLocale() {
    return Intl.DateTimeFormat().resolvedOptions().locale || 'en-US';
  }
}

module.exports = MockSession;