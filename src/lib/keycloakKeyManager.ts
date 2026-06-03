import { logger } from '@/lib/logger';
import jwt from 'jsonwebtoken';
import { config } from '@/lib/config';

// Import the keycloak-public-key library
// Note: This library is CommonJS
import jwkToPem from 'jwk-to-pem';

/**
 * KeycloakKeyManager handles Keycloak public key management and JWT verification
 * Adapted from simva project for pumva TypeScript implementation
 */
export class KeycloakKeyManager {
  private static loadedKeys: { [kid: string]: string } = {};

  /**
   * Initialize the Keycloak certificates client
   */
  // No-op, kept for compatibility
  static initialize(): void {
    return;
  }

  /**
   * Get a public key by key ID (kid)
   * 
   * @param kid - Key ID from JWT header
   * @returns Promise resolving to the public key
   */
  static async getKey(kid: string): Promise<string> {
    try {
      // Force clear cache before every getKey (for debugging)
      this.log('KeycloakKeyManager.getKey -> Forcing cache clear before key fetch');
      this.clearCache();
      this.initialize();
      if (!this.loadedKeys.hasOwnProperty(kid)) {
        this.log(`KeycloakKeyManager.getKey -> Key not in cache, calling reloadKey(${kid})`);
        this.loadedKeys[kid] = await this.reloadKey(kid);
        this.log(`KeycloakKeyManager.getKey -> got key: ${this.loadedKeys[kid]}`);
      } else {
        this.log(`KeycloakKeyManager.getKey -> Key found in cache: ${this.loadedKeys[kid]}`);
      }
    } catch (error) {
      this.log(`KeycloakKeyManager.getKey -> catch: ${JSON.stringify(error)}`);
      this.log(error);
      throw error;
    }
    this.log(`KeycloakKeyManager.getKey -> returning key for kid ${kid}: ${this.loadedKeys[kid]}`);
    return this.loadedKeys[kid];
  }

  /**
   * Check and verify a JWT token using the appropriate public key
   * 
   * @param kid - Key ID from JWT header
   * @param token - JWT token to verify
   * @returns Promise resolving to decoded token payload
   */
  static async checkKey(kid: string, token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.log(`KeycloakKeyManager.checkKey -> pre-getKey(${kid})`);
        this.getKey(kid)
          .then((privateKey) => {
            if (!privateKey || privateKey.trim() === '') {
              const errMsg = `KeycloakKeyManager.checkKey -> ERROR: No public key found for kid: ${kid}`;
              this.log(errMsg);
              reject(new Error('No public key available for JWT verification'));
              return;
            }
            this.log(`KeycloakKeyManager.checkKey -> pre-jwtverify(${token}, ${privateKey})`);
            jwt.verify(token, privateKey, (error, decoded) => {
              if (error && error.message === 'invalid algorithm') {
                this.log('KeycloakKeyManager.checkKey -> ERROR: Not valid signature');
                reject('Not valid signature');
              } else if (error) {
                this.log(`KeycloakKeyManager.checkKey -> ERROR: ${error.message}`);
                reject(error);
              } else {
                this.log(`KeycloakKeyManager.checkKey -> SUCCESS! (${JSON.stringify(decoded)})`);
                resolve(decoded);
              }
            });
          })
          .catch((error) => {
            this.log(`KeycloakKeyManager.checkKey -> error catch: ${JSON.stringify(error)}`);
            reject(error);
          });
      } catch (error) {
        this.log(error);
        reject(error);
      }
    });
  }

  /**
   * Reload a public key from Keycloak
   * 
   * @param kid - Key ID to reload
   * @returns Promise resolving to the public key
   */
  static async reloadKey(kid: string): Promise<string> {
    this.log(`######### RELOADING KEYCLOAK KEY ${kid} #########`);
    try {
      if (!config.sso.url || !config.sso.realm) {
        throw new Error('Keycloak SSO url or realm not configured');
      }
      const jwksUrl = `${config.sso.url}/realms/${config.sso.realm}/protocol/openid-connect/certs`;
      this.log(`KeycloakKeyManager.reloadKey -> Fetching JWKS from: ${jwksUrl}`);
      const res = await fetch(jwksUrl);
      if (!res.ok) {
        throw new Error(`Failed to fetch JWKS: ${res.status} ${res.statusText}`);
      }
      const jwks = await res.json();
      if (!jwks.keys || !Array.isArray(jwks.keys)) {
        throw new Error('Invalid JWKS format');
      }
      const jwk = jwks.keys.find((k: any) => k.kid === kid);
      if (!jwk) {
        this.log(`KeycloakKeyManager.reloadKey -> JWKS does not contain kid: ${kid}`);
        return '';
      }
      const pem = jwkToPem(jwk);
      this.log(`KeycloakKeyManager.reloadKey -> got PEM for kid ${kid}: ${pem}`);
      return pem;
    } catch (error) {
      this.log(`KeycloakKeyManager.reloadKey -> catch: ${JSON.stringify(error)}`);
      this.log(error);
      return '';
    }
  }

  /**
   * Clear cached keys (useful for testing or key rotation)
   */
  static clearCache(): void {
    this.loadedKeys = {};
    this.log('KeycloakKeyManager cache cleared');
  }

  /**
   * Get all cached keys
   * 
   * @returns Object containing all cached keys
   */
  static getCachedKeys(): { [kid: string]: string } {
    return { ...this.loadedKeys };
  }

  /**
   * Check if Keycloak integration is enabled
   * 
   * @returns True if Keycloak is configured and enabled
   */
  static isEnabled(): boolean {
    return !!(config.sso.url && config.sso.realm);
  }

  /**
   * Log messages (with configuration-based logging)
   * 
   * @param message - Message to log
   */
  private static log(message: any): void {
    // Always log in debug mode or when explicitly enabled
    if (config.debug || process.env.KEYCLOAK_LOGGER_ACTIVE === 'true') {
      logger.info(message);
    } else {
      logger.debug(message);
    }
  }
}

// Export individual functions for backward compatibility
export const getKey = KeycloakKeyManager.getKey.bind(KeycloakKeyManager);
export const checkKey = KeycloakKeyManager.checkKey.bind(KeycloakKeyManager);
export const reloadKey = KeycloakKeyManager.reloadKey.bind(KeycloakKeyManager);