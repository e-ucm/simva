/**
 * @fileoverview Type declarations for keycloak-public-key module.
 * Provides TypeScript type definitions for Keycloak public key fetching functionality.
 * 
 * @module @types/keycloak-public-key
 */

/**
 * Interface for Keycloak certificate management.
 * Provides methods to fetch public keys for JWT verification.
 */
declare module 'keycloak-public-key' {
  /**
   * KeyCloak certificate manager for fetching public keys.
   * 
   * @interface KeyCloakCerts
   */
  interface KeyCloakCerts {
    /**
     * Fetch a public key certificate by key ID.
     * 
     * @method fetch
     * @param {string} kid - Key ID to fetch
     * @returns {Promise<string>} Promise resolving to the public key certificate
     */
    fetch(kid: string): Promise<string>;
  }
  
  /**
   * Constructor interface for KeyCloakCerts.
   * 
   * @interface KeyCloakCertsConstructor
   */
  interface KeyCloakCertsConstructor {
    /**
     * Create a new KeyCloakCerts instance.
     * 
     * @constructor
     * @param {string} url - Keycloak server URL
     * @param {string} realm - Keycloak realm name
     * @returns {KeyCloakCerts} New KeyCloakCerts instance
     */
    new (url: string, realm: string): KeyCloakCerts;
  }
  
  /**
   * KeyCloakCerts constructor for creating certificate managers.
   * 
   * @const {KeyCloakCertsConstructor}
   */
  const KeyCloakCerts: KeyCloakCertsConstructor;
  export = KeyCloakCerts;
}