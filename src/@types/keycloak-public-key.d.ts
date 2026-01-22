declare module 'keycloak-public-key' {
  interface KeyCloakCerts {
    fetch(kid: string): Promise<string>;
  }
  
  interface KeyCloakCertsConstructor {
    new (url: string, realm: string): KeyCloakCerts;
  }
  
  const KeyCloakCerts: KeyCloakCertsConstructor;
  export = KeyCloakCerts;
}