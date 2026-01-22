import { logger } from '@/lib/logger';
import jwt from 'jsonwebtoken';
import { config } from '@/lib/config';

// Import the keycloak-public-key library
// Note: This library is CommonJS
import KeyCloakCerts from 'keycloak-public-key';

/**
 * KeycloakKeyManager handles Keycloak public key management and JWT verification
 * Adapted from simva project for pumva TypeScript implementation
 */
export class KeycloakKeyManager {
  private static keyCloakCerts: InstanceType<typeof KeyCloakCerts> | null = null;
  private static loadedKeys: { [kid: string]: string } = {};

  /**
   * Initialize the Keycloak certificates client
   */
  static initialize(): void {
    if (!this.keyCloakCerts && config.auth.keycloak_url && config.auth.keycloak_realm) {
      this.keyCloakCerts = new KeyCloakCerts(config.auth.keycloak_url, config.auth.keycloak_realm);
      this.log('KeycloakKeyManager initialized');
    }
  }

  /**
   * Get a public key by key ID (kid)
   * 
   * @param kid - Key ID from JWT header
   * @returns Promise resolving to the public key
   */
  static async getKey(kid: string): Promise<string> {
    try {
      this.initialize();
      
      if (!this.loadedKeys.hasOwnProperty(kid)) {
        this.loadedKeys[kid] = await this.reloadKey(kid);
        this.log(`KeycloakKeyManager.getKey -> got key: ${this.loadedKeys[kid]}`);
      }
    } catch (error) {
      this.log(`KeycloakKeyManager.getKey -> catch: ${JSON.stringify(error)}`);
      this.log(error);
      throw error;
    }

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
    return new Promise((resolve, reject) => {
      this.log(`######### RELOADING KEYCLOAK KEY ${kid} #########`);
      
      try {
        this.initialize();
        
        if (!this.keyCloakCerts) {
          reject(new Error('Keycloak certificates client not initialized'));
          return;
        }

        this.log('KeycloakKeyManager.reloadKey -> pre-fetch');
        
        this.keyCloakCerts.fetch(kid)
          .then((publicKey: string) => {
            this.log(`KeycloakKeyManager.reloadKey -> got public key: ${publicKey}`);
            resolve(publicKey);
          })
          .catch((error: any) => {
            this.log(`KeycloakKeyManager.reloadKey -> Error: ${JSON.stringify(error)}`);
            reject(error);
          });
      } catch (error) {
        this.log(`KeycloakKeyManager.reloadKey -> catch: ${JSON.stringify(error)}`);
        this.log(error);
        reject(error);
      }
    });
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
    return !!(config.auth.keycloak_url && config.auth.keycloak_realm);
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