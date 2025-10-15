/**
 * Test for Local GAS Development Environment
 */

const request = require('supertest');
const LocalGASServer = require('../local/server');

describe('Local GAS Development Server', () => {
  let server;
  let app;

  beforeAll(() => {
    server = new LocalGASServer();
    app = server.app;
  });

  describe('Health Check', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Main Page', () => {
    test('should serve the main application page', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.text).toContain('Data Call Manager');
      expect(response.text).toContain('<!DOCTYPE html>');
    });
  });

  describe('API Endpoints', () => {
    test('should handle getConfig API call', async () => {
      const response = await request(app)
        .post('/api/getConfig')
        .send({ args: [] })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('app');
      expect(response.body.data).toHaveProperty('tabs');
    });

    test('should handle createDataCall API call', async () => {
      const callData = {
        title: 'Test Data Call',
        type: 'enrichment',
        description: 'Test description',
        priority: 'medium',
        frequency: 'one-time'
      };

      const response = await request(app)
        .post('/api/createDataCall')
        .send({ args: [callData] })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
    });

    test('should handle getDashboardStatistics API call', async () => {
      const response = await request(app)
        .post('/api/getDashboardStatistics')
        .send({ args: [] })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('activeCalls');
      expect(response.body.data).toHaveProperty('completedCalls');
    });

    test('should handle unknown API function gracefully', async () => {
      const response = await request(app)
        .post('/api/unknownFunction')
        .send({ args: [] })
        .expect(200);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });
});

describe('Mock Services', () => {
  const MockPropertiesService = require('../local/mocks/PropertiesService');
  const MockUtilities = require('../local/mocks/Utilities');
  const MockSession = require('../local/mocks/Session');

  describe('MockPropertiesService', () => {
    let mockProps;

    beforeEach(() => {
      mockProps = new MockPropertiesService();
    });

    test('should store and retrieve properties', () => {
      const props = mockProps.getScriptProperties();
      
      props.setProperty('testKey', 'testValue');
      expect(props.getProperty('testKey')).toBe('testValue');
      
      props.deleteProperty('testKey');
      expect(props.getProperty('testKey')).toBeNull();
    });

    test('should handle multiple properties', () => {
      const props = mockProps.getScriptProperties();
      
      props.setProperties({
        key1: 'value1',
        key2: 'value2'
      });
      
      const allProps = props.getProperties();
      expect(allProps.key1).toBe('value1');
      expect(allProps.key2).toBe('value2');
    });
  });

  describe('MockUtilities', () => {
    let mockUtils;

    beforeEach(() => {
      mockUtils = new MockUtilities();
    });

    test('should generate UUID', () => {
      const uuid = mockUtils.getUuid();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    test('should encode and decode base64', () => {
      const original = 'Hello, World!';
      const encoded = mockUtils.base64Encode(original);
      const decoded = mockUtils.base64Decode(encoded);
      
      expect(typeof encoded).toBe('string');
      expect(Buffer.from(decoded).toString()).toBe(original);
    });

    test('should format dates', () => {
      const date = new Date('2023-10-09T12:00:00Z');
      const formatted = mockUtils.formatDate(date, 'UTC', 'yyyy-MM-dd');
      expect(formatted).toBe('2023-10-09');
    });
  });

  describe('MockSession', () => {
    let mockSession;

    beforeEach(() => {
      mockSession = new MockSession();
    });

    test('should return active user', () => {
      const user = mockSession.getActiveUser();
      expect(user.getEmail()).toBe('developer@localhost.local');
      expect(user.getName()).toBe('Local Developer');
    });

    test('should return timezone', () => {
      const timezone = mockSession.getScriptTimeZone();
      expect(typeof timezone).toBe('string');
    });

    test('should return locale', () => {
      const locale = mockSession.getLocale();
      expect(typeof locale).toBe('string');
    });
  });
});