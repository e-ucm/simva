import { jest, beforeAll, describe, beforeEach, afterEach, expect, it } from '@jest/globals';
import jwt from 'jsonwebtoken';

// Mock the logger
jest.unstable_mockModule('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn()
  }
}));

// Mock the config
jest.unstable_mockModule('@/lib/config', () => ({
  config: {
    debug: false,
    sso: {
      url: 'http://localhost:8080',
      realm: 'test-realm'
    }
  }
}));

// Mock the JWK to PEM converter
jest.unstable_mockModule('jwk-to-pem', () => ({
  default: jest.fn()
}));

let KeycloakKeyManager: typeof import('@/lib/keycloakKeyManager')['KeycloakKeyManager'];
let config: typeof import('@/lib/config')['config'];
let mockedLogger: jest.Mocked<typeof import('@/lib/logger')['logger']>;
let jwkToPem: jest.Mock;

beforeAll(async () => {
  KeycloakKeyManager = (await import('@/lib/keycloakKeyManager')).KeycloakKeyManager;
  config = (await import('@/lib/config')).config;
  mockedLogger = (await import('@/lib/logger')).logger as jest.Mocked<typeof import('@/lib/logger')['logger']>;
  jwkToPem = (await import('jwk-to-pem')).default as jest.Mock;
});

describe('KeycloakKeyManager', () => {
  const testKid = 'test-key-id';
  const testPublicKey = '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----';

  let mockFetch: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    KeycloakKeyManager.clearCache();
    jwkToPem.mockReturnValue(testPublicKey);
    mockFetch = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn().mockResolvedValue({
        keys: [{ kid: testKid, kty: 'RSA', use: 'sig', alg: 'RS256', n: 'test-n', e: 'AQAB' }]
      })
    } as any);
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  describe('initialization', () => {
    it('should initialize with proper configuration', () => {
      expect(KeycloakKeyManager.isEnabled()).toBe(true);
    });

    it('should detect when Keycloak is not configured', () => {
      // Temporarily modify config
      const originalConfig = config.sso;
      config.sso = { ...originalConfig, url: '' };

      expect(KeycloakKeyManager.isEnabled()).toBe(false);

      // Restore config
      config.sso = originalConfig;
    });
  });

  describe('getKey', () => {
    it('should fetch and cache a key successfully', async () => {
      const key = await KeycloakKeyManager.getKey(testKid);

      expect(key).toBe(testPublicKey);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/realms/test-realm/protocol/openid-connect/certs');

      // Verify key is cached
      const cachedKeys = KeycloakKeyManager.getCachedKeys();
      expect(cachedKeys[testKid]).toBe(testPublicKey);
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch key'));

      const key = await KeycloakKeyManager.getKey(testKid);

      expect(key).toBe('');
    });
  });

  describe('reloadKey', () => {
    it('should force reload a key from Keycloak', async () => {
      const key = await KeycloakKeyManager.reloadKey(testKid);

      expect(key).toBe(testPublicKey);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/realms/test-realm/protocol/openid-connect/certs');
    });

    it('should handle reload errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const key = await KeycloakKeyManager.reloadKey(testKid);

      expect(key).toBe('');
    });
  });

  describe('checkKey', () => {
    const testSecret = 'test-secret';
    const testPayload = { sub: 'testuser', iss: 'test-issuer' };

    it('should verify token with valid key', async () => {
      jwkToPem.mockReturnValue(testSecret);
      const token = jwt.sign(testPayload, testSecret);

      const decoded = await KeycloakKeyManager.checkKey(testKid, token);

      expect(decoded.sub).toBe('testuser');
      expect(decoded.iss).toBe('test-issuer');
    });

    it('should reject token with invalid signature', async () => {
      jwkToPem.mockReturnValue(testSecret);
      const token = jwt.sign(testPayload, 'wrong-secret');

      await expect(KeycloakKeyManager.checkKey(testKid, token)).rejects.toBeDefined();
    });

    it('should handle malformed tokens', async () => {
      const invalidToken = 'not.a.valid.jwt.token';

      await expect(KeycloakKeyManager.checkKey(testKid, invalidToken)).rejects.toBeDefined();
    });
  });

  describe('cache management', () => {
    it('should cache the fetched key', async () => {
      await KeycloakKeyManager.getKey(testKid);
      expect(Object.keys(KeycloakKeyManager.getCachedKeys())).toEqual([testKid]);

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

  describe('logging', () => {
    it('should log debug messages when debug is enabled', async () => {
      const originalDebug = config.debug;
      config.debug = true;

      await KeycloakKeyManager.getKey(testKid);

      expect(mockedLogger.info).toHaveBeenCalled();

      config.debug = originalDebug;
    });

    it('should use environment variable for logging control', async () => {
      const originalEnv = process.env.KEYCLOAK_LOGGER_ACTIVE;
      process.env.KEYCLOAK_LOGGER_ACTIVE = 'true';

      await KeycloakKeyManager.getKey(testKid);

      expect(mockedLogger.info).toHaveBeenCalled();

      process.env.KEYCLOAK_LOGGER_ACTIVE = originalEnv;
    });
  });
});