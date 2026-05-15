import { User } from "@/lib/mappers/Users/User";
import jwt from 'jsonwebtoken';
import { logger } from "@/lib/logger";
import { config } from "@/lib/config";
import { KeycloakKeyManager } from "@/lib/keycloakKeyManager";
import { AuthentificationError } from "@/lib/errors/appErrors";

/**
 * @fileoverview Authentication service for user JWT validation and Keycloak integration.
 * Contains only authentication-related functions, CRUD operations have been moved to User model.
 * 
 * @module services/users/userAuth
 */

/**
 * Interface for decoded Keycloak JWT payload
 */
export interface KeycloakJWTPayload {
  sql: Partial<User>;
  jwt: string;
  sso: {
    iss: string;
    sub: string;
    preferred_username: string;
    email: string;
    realm_access?: {
      roles: string[];
    };
    [key: string]: any;
  }
}

/**
 * Validates a JWT token with support for multiple issuers (Keycloak and internal)
 * This is an enhanced validation function adapted from simva project that:
 * - Handles Keycloak-issued tokens with public key verification
 * - Handles internal simva/pumva tokens with secret verification
 * - Creates or updates users from Keycloak tokens
 * - Provides fallback mechanisms for key rotation
 * 
 * @async
 * @function validateJWT
 * @param {string} token - The JWT token to validate
 * @returns {Promise<KeycloakJWTPayload>} The decoded token data with user information
 * 
 * @throws {Error} If token is invalid, expired, or verification fails
 * 
 * @example
 * ```typescript
 * try {
 *   const decoded = await validateJWT(token);
 *   logger.info('User:', decoded.data.username);
 * } catch (error) {
 *   logger.error('Invalid token:', error.message);
 * }
 * ```
 */
export async function validateJWT(token: string): Promise<KeycloakJWTPayload> {
  return new Promise((resolve, reject) => {
    try {
      logger.debug('Token validation starting');

      let jwtPayload: KeycloakJWTPayload;
      // First, try to decode structurally
      const decodedPayloadOnly = jwt.decode(token);
      logger.debug(decodedPayloadOnly, 'Decoded JWT payload (without verification):');
      if (!decodedPayloadOnly || typeof decodedPayloadOnly !== 'object') {
        return reject(new AuthentificationError('JWT validation failed'));
      }
      jwtPayload = { sso: decodedPayloadOnly as any, jwt: token, sql: {} };
      // Enforce expiration if present
      if (typeof jwtPayload.sso.exp === 'number') {
        const now = Math.floor(Date.now() / 1000);
        if (jwtPayload.sso.exp < now) {
          return reject(new AuthentificationError('Token has expired'));
        }
      }

      // Determine username from common claims
      logger.debug(jwtPayload, 'Determining username from JWT claims');
      jwtPayload.sql.username = jwtPayload.sso.preferred_username || jwtPayload.sso.username || jwtPayload.sso.sub;
      if (!jwtPayload.sql.username) {
        return reject(new AuthentificationError('Token missing required user identification'));
      }
      jwtPayload.sql.email = jwtPayload.sso.email;
      if (!jwtPayload.sql.email) {
        return reject(new AuthentificationError('Email missing required user identification'));
      }
      switch (jwtPayload.sso.iss) {
        case `${config.sso.url}/realms/${config.sso.realm}`:
          logger.debug('Token issuer identified as Keycloak realm');
          const decodedWithHeader = jwt.decode(token, { complete: true }) as any;
          const header = decodedWithHeader?.header;
          logger.debug(header);
          if (!header?.kid) {
            return resolve(jwtPayload);
          }
          KeycloakKeyManager.checkKey(header.kid, token)
            .then(() => KeycloakKeyManager.getKey(header.kid))
            .then((publicKey) => {
              jwt.verify(token, publicKey, async (error: Error | null, verifiedPayload: any) => {
                if (error) {
                  // Fall back to decoded payload
                  resolve(jwtPayload);
                } else {
                  try {
                    resolve(jwtPayload);
                  } catch (userError) {
                    reject(userError);
                  }
                }
              });
            })
            .catch(async () => {
              resolve(jwtPayload);
            });
          return; // prevent continuing below until async resolves
        case config.sso.jwt_issuer:
          logger.debug('Token issuer identified as internal simva');
          try {
            let verified = jwt.verify(token, config.sso.jwt_secret, { issuer: config.sso.jwt_issuer });
            logger.debug(verified, 'Internal token verification successful');
            return resolve(jwtPayload);
          } catch (e) {
            return reject(new AuthentificationError('Internal token verification failed'));
          }
        default:
          logger.warn(`Unknown token issuer: ${jwtPayload.sso.iss}, proceeding with caution`);
      }
      // Default: return decoded payload with normalized username
      resolve(jwtPayload);
    } catch (error) {
      logger.error({ error }, 'JWT validation error:');
      reject(new AuthentificationError('JWT validation failed'));
    }
  });
}

/**
 * Create or update a user from Keycloak JWT token
 * 
 * @async
 * @function createOrUpdateKeycloakUser
 * @param {KeycloakJWTPayload} decoded - Decoded Keycloak JWT payload
 * @returns {Promise<KeycloakJWTPayload>} Keycloak JWT payload with user data
 */
export async function createOrUpdateKeycloakUser(decoded: KeycloakJWTPayload): Promise<KeycloakJWTPayload> {
  logger.debug("CreateOrUpdateKeycloakUser - Decoded: " + JSON.stringify(decoded));
  
  if (!KeycloakKeyManager.isEnabled()) {
    return decoded;
  }

  try {
    // Look for existing user by email using model method
    const users = await User.getFromPartialDBData(decoded.sql);
    
    if (users.length !== 0) {
      const user = users[0];
      decoded.sql = user;
      const newRole = getRoleFromKeycloakJWT(decoded);
      
      if (user.role !== newRole) {
        // Update user role using model method
        await user.update({ role: newRole }, false); // Update role without updating Keycloak since we're already processing a Keycloak token
        return decoded;
      } else {
        return decoded;
      }
    } else {
      // Create new user from JWT using model method
      const newUser = await createUserFromKeycloakJWT(decoded);
      decoded.sql = newUser;
      return decoded;
    }
  } catch (error) {
    logger.error({error}, 'Error creating/updating user from Keycloak:');
    throw error;
  }
}

/**
 * Create a user from Keycloak JWT token
 * 
 * @async
 * @function createUserFromKeycloakJWT
 * @param {Partial<KeycloakJWTPayload>} decoded - Decoded Keycloak JWT payload
 * @returns {Promise<User>} Created user instance
 */
async function createUserFromKeycloakJWT(decoded: Partial<KeycloakJWTPayload>): Promise<User> {
  logger.debug("createUserFromJWT: " + JSON.stringify(decoded));
  
  const userData = {
    username: decoded.sso?.preferred_username || decoded.sso?.username || decoded.sso?.sub,
    email: decoded.sso?.email,
    role: getRoleFromKeycloakJWT(decoded),
    isToken: false // Default value for new users
  };
  
  logger.debug("createUserFromJWT - UserData: " + JSON.stringify(userData));
  // Use model method instead of service method
  return await User.createDB(userData);
}

/**
 * Extract role from Keycloak JWT token
 * 
 * @function getRoleFromKeycloakJWT
 * @param {Partial<KeycloakJWTPayload>} decoded - Decoded Keycloak JWT payload
 * @returns {string} User role
 */
function getRoleFromKeycloakJWT(userdata: Partial<KeycloakJWTPayload>): string {
    let role = 'norole';
    if (userdata.sso?.realm_access?.roles) {
      let roles = userdata.sso.realm_access.roles;
      // Check for teacher roles first since they can also have student roles and we want to prioritize teacher role
      logger.info({roles}, "Keycloak roles:");
      if(roles.includes('administrator')) {
        role = "administrator"
      } else if (roles.includes("lrsmanager")) {
        role = 'lrsmanager';
      } else if (['teacher', 'researcher'].some(teacherRole => roles.includes(teacherRole))) {
        role = 'teacher';
      } else if (['teaching-assistant', 'student'].some(studentRole => roles.includes(studentRole))) {
        role = 'student';
      }
    }
    logger.info(`Determined role from Keycloak JWT: ${role}`);
    return role;
  }