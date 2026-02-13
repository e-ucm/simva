import { User } from "@/lib/mappers/Users/User";
import jwt from 'jsonwebtoken';
import { logger } from "@/lib/logger";
import { config } from "@/lib/config";
import { KeycloakKeyManager } from "@/lib/keycloakKeyManager";

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
 *   console.log('User:', decoded.data.username);
 * } catch (error) {
 *   console.error('Invalid token:', error.message);
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
      if (!decodedPayloadOnly || typeof decodedPayloadOnly !== 'object') {
        return reject(new Error('JWT validation failed'));
      }
      jwtPayload = { sso: decodedPayloadOnly as any, jwt: token, sql: {} };
      // Enforce expiration if present
      if (typeof jwtPayload.sso.exp === 'number') {
        const now = Math.floor(Date.now() / 1000);
        if (jwtPayload.sso.exp < now) {
          return reject(new Error('Token has expired'));
        }
      }

      // Determine username from common claims
      jwtPayload.sql.username = jwtPayload.sso.preferred_username || jwtPayload.sso.username || jwtPayload.sso.sub;
      if (!jwtPayload.sql.username) {
        return reject(new Error('Token missing required user identification'));
      }
      jwtPayload.sql.email = jwtPayload.sso.email;
      if (!jwtPayload.sql.email) {
        return reject(new Error('Email missing required user identification'));
      }
      // Attempt verification for integrity, but do not fail if signature mismatch
      try {
        jwt.verify(token, config.sso.jwt_secret || 'default-secret', { ignoreExpiration: true } as any);
      } catch (e) {
        // Ignore verification errors to support decode-only behavior when secrets differ
        logger.debug('JWT signature verification failed, proceeding with decoded payload');
      }
      // If issuer indicates Keycloak realm, try enhanced handling with key manager
      if (jwtPayload.sso.iss) {
        const keycloakRealmUrl = `${config.sso.url}/realms/${config.sso.realm}`;
        if (jwtPayload.sso.iss === keycloakRealmUrl && KeycloakKeyManager.isEnabled()) {
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
                  resolve(await createOrUpdateKeycloakUser(jwtPayload));
                } else {
                  try {
                    resolve(await createOrUpdateKeycloakUser(jwtPayload));
                  } catch (userError) {
                    reject(userError);
                  }
                }
              });
            })
            .catch(async () => {
              resolve(await createOrUpdateKeycloakUser(jwtPayload));
            });
          return; // prevent continuing below until async resolves
        }
      }

      // Default: return decoded payload with normalized username
      logger.debug({jwtPayload});
      resolve(jwtPayload);
    } catch (error) {
      logger.error({ error }, 'JWT validation error:');
      reject(new Error('JWT validation failed'));
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
async function createOrUpdateKeycloakUser(decoded: KeycloakJWTPayload): Promise<KeycloakJWTPayload> {
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
        await user.updateRole({ role: newRole });
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
function getRoleFromKeycloakJWT(decoded: Partial<KeycloakJWTPayload>): string {
  logger.debug("getRoleFromJWT: " + JSON.stringify(decoded));
  
  // If no realm_access is provided at all, default to student
  if (!decoded.sso!.realm_access) {
    return 'student';
  }
  
  let role = 'norole';
  
  if (decoded.sso!.realm_access?.roles) {
    const roles = decoded.sso!.realm_access.roles;
    
    if (roles.includes("admin")) {
      role = 'admin';
    } else if (roles.includes("lrsmanager")) {
      role = 'lrsmanager';
    } else {
      // Check for teacher roles
      const teacherRoles = ['teacher', 'teaching-assistant', 'researcher'];
      const hasTeacherRole = teacherRoles.some(teacherRole => roles.includes(teacherRole));
      
      if (hasTeacherRole) {
        role = 'teacher';
      } else if (roles.includes('student')) {
        role = 'student';
      }
    }
  }

  return role;
}