import { KeycloakKeyManager } from '@/lib/keycloakKeyManager';
import jwt from 'jsonwebtoken';
import { config } from '@/lib/config';
import KeyCloakCerts from 'keycloak-public-key';

// Mock the keycloak-public-key library
jest.mock('keycloak-public-key');

const mockKeyCloakCerts = {
  fetch: jest.fn()
};

// Cast the mocked constructor
const MockedKeyCloakCerts = KeyCloakCerts as jest.MockedClass<typeof KeyCloakCerts>;

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn()
  }
}));

// Mock the config
jest.mock('@/lib/config', () => ({
  config: {
    debug: false,
    auth: {
      keycloak_url: 'http://localhost:8080',
      keycloak_realm: 'test-realm'
    }
  }
}));

describe('KeycloakKeyManager', () => {
  const testKid = 'test-key-id';
  const testPublicKey = '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----';
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear cached keys
    KeycloakKeyManager.clearCache();
    // Setup the mock to return our mockKeyCloakCerts instance
    MockedKeyCloakCerts.mockImplementation(() => mockKeyCloakCerts);  });

  describe('initialization', () => {
    it('should initialize with proper configuration', () => {
      expect(KeycloakKeyManager.isEnabled()).toBe(true);
    });

    it('should detect when Keycloak is not configured', () => {
      // Temporarily modify config
      const originalConfig = config.auth;
      config.auth = { ...originalConfig, keycloak_url: '' };
      
      expect(KeycloakKeyManager.isEnabled()).toBe(false);
      
      // Restore config
      config.auth = originalConfig;
    });
  });

  describe('getKey', () => {
    it('should fetch and cache a key successfully', async () => {
      mockKeyCloakCerts.fetch.mockResolvedValueOnce(testPublicKey);

      const key = await KeycloakKeyManager.getKey(testKid);

      expect(key).toBe(testPublicKey);
      expect(mockKeyCloakCerts.fetch).toHaveBeenCalledWith(testKid);
      
      // Verify key is cached
      const cachedKeys = KeycloakKeyManager.getCachedKeys();
      expect(cachedKeys[testKid]).toBe(testPublicKey);
    });

    it('should return cached key on subsequent calls', async () => {
      mockKeyCloakCerts.fetch.mockResolvedValueOnce(testPublicKey);

      // First call - should fetch
      const key1 = await KeycloakKeyManager.getKey(testKid);
      
      // Second call - should use cache
      const key2 = await KeycloakKeyManager.getKey(testKid);

      expect(key1).toBe(testPublicKey);
      expect(key2).toBe(testPublicKey);
      expect(mockKeyCloakCerts.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch errors', async () => {
      const error = new Error('Failed to fetch key');
      mockKeyCloakCerts.fetch.mockRejectedValueOnce(error);

      await expect(KeycloakKeyManager.getKey(testKid)).rejects.toThrow('Failed to fetch key');
    });
  });

  describe('reloadKey', () => {
    it('should force reload a key from Keycloak', async () => {
      mockKeyCloakCerts.fetch.mockResolvedValueOnce(testPublicKey);

      const key = await KeycloakKeyManager.reloadKey(testKid);

      expect(key).toBe(testPublicKey);
      expect(mockKeyCloakCerts.fetch).toHaveBeenCalledWith(testKid);
    });

    it('should handle reload errors', async () => {
      const error = new Error('Network error');
      mockKeyCloakCerts.fetch.mockRejectedValueOnce(error);

      await expect(KeycloakKeyManager.reloadKey(testKid)).rejects.toThrow('Network error');
    });
  });

  describe('checkKey', () => {
    const testSecret = 'test-secret';
    const testPayload = { sub: 'testuser', iss: 'test-issuer' };

    it('should verify token with valid key', async () => {
      const token = jwt.sign(testPayload, testSecret);
      mockKeyCloakCerts.fetch.mockResolvedValueOnce(testSecret);

      const decoded = await KeycloakKeyManager.checkKey(testKid, token);

      expect(decoded.sub).toBe('testuser');
      expect(decoded.iss).toBe('test-issuer');
    });

    it('should reject token with invalid signature', async () => {
      const token = jwt.sign(testPayload, 'wrong-secret');
      mockKeyCloakCerts.fetch.mockResolvedValueOnce(testSecret);

      await expect(KeycloakKeyManager.checkKey(testKid, token)).rejects.toBeDefined();
    });

    it('should handle malformed tokens', async () => {
      const invalidToken = 'not.a.valid.jwt.token';
      mockKeyCloakCerts.fetch.mockResolvedValueOnce(testSecret);

      await expect(KeycloakKeyManager.checkKey(testKid, invalidToken)).rejects.toBeDefined();
    });
  });

  describe('cache management', () => {
    it('should clear cache correctly', async () => {
      mockKeyCloakCerts.fetch.mockResolvedValueOnce(testPublicKey);

      // Add key to cache
      await KeycloakKeyManager.getKey(testKid);
      expect(Object.keys(KeycloakKeyManager.getCachedKeys())).toHaveLength(1);

      // Clear cache
      KeycloakKeyManager.clearCache();
      expect(Object.keys(KeycloakKeyManager.getCachedKeys())).toHaveLength(0);
    });

    it('should return copy of cached keys', () => {
      const cachedKeys1 = KeycloakKeyManager.getCachedKeys();
      const cachedKeys2 = KeycloakKeyManager.getCachedKeys();

      expect(cachedKeys1).not.toBe(cachedKeys2); // Different object references
      expect(cachedKeys1).toEqual(cachedKeys2);   // Same content
    });
  });

  describe('error handling', () => {
    it('should handle Keycloak service unavailable', async () => {
      mockKeyCloakCerts.fetch.mockRejectedValueOnce(new Error('Service unavailable'));

      await expect(KeycloakKeyManager.getKey(testKid)).rejects.toThrow('Service unavailable');
    });

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockKeyCloakCerts.fetch.mockRejectedValueOnce(timeoutError);

      await expect(KeycloakKeyManager.reloadKey(testKid)).rejects.toThrow('Request timeout');
    });
  });

  describe('logging', () => {
    it('should log debug messages when debug is enabled', async () => {
      const originalDebug = config.debug;
      config.debug = true;

      mockKeyCloakCerts.fetch.mockResolvedValueOnce(testPublicKey);
      await KeycloakKeyManager.getKey(testKid);

      const mockLogger = require('@/lib/logger').logger;
      expect(mockLogger.info).toHaveBeenCalled();

      config.debug = originalDebug;
    });

    it('should use environment variable for logging control', async () => {
      const originalEnv = process.env.KEYCLOAK_LOGGER_ACTIVE;
      process.env.KEYCLOAK_LOGGER_ACTIVE = 'true';

      mockKeyCloakCerts.fetch.mockResolvedValueOnce(testPublicKey);
      await KeycloakKeyManager.getKey(testKid);

      const mockLogger = require('@/lib/logger').logger;
      expect(mockLogger.info).toHaveBeenCalled();

      process.env.KEYCLOAK_LOGGER_ACTIVE = originalEnv;
    });
  });
});