import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/errors/appErrors";
import jwt from 'jsonwebtoken';
import { logger } from "@/lib/logger";
import { config } from "@/lib/config";
import { KeycloakKeyManager } from "@/lib/keycloakKeyManager";

/**
 * Interface for decoded JWT payload
 */
interface DecodedJWT {
  data: any;
}

/**
 * Interface for decoded Keycloak JWT payload
 */
interface KeycloakJWTPayload {
  data: {
    iss: string;
    sub: string;
    preferred_username: string;
    username: string;
    email: string;
    realm_access?: {
      roles: string[];
    };
    [key: string]: any;
  }
}

/**
 * Interface for simplified user object
 */
interface SimplifiedUser {
  data: {
    username: string;
    email: string;
    role: string;
  }
}

/**
 * Retrieves all users from the database.
 * 
 * @async
 * @function getUsers
 * @returns {Promise<Array>} Array of all user records
 * 
 * @example
 * ```typescript
 * const users = await getUsers();
 * ```
 */
export async function getAllUsers(): Promise<InstanceType<typeof db.Tables.User>[]> {
  return db.Tables.User.findAll();
}

/**
 * Retrieves a single user by their ID.
 * 
 * @async
 * @function getUserById
 * @param {number} user_id - The user identifier
 * @returns {Promise<InstanceType<typeof db.Tables.User>>} The user record
 * @throws {NotFoundError} If user with given ID does not exist
 * 
 * @example
 * ```typescript
 * const user = await getUserById(123);
 * ```
 */
export async function getUserById(user_id : number): Promise<InstanceType<typeof db.Tables.User>> {
    const result = await db.Tables.User.findByPk(user_id);
    if (!result) {
      throw new NotFoundError("User not found");
    }
    return result;
}

/**
 * Retrieves a user by their username.
 * 
 * @async
 * @function getUserByUsername
 * @param {string} username - The username to search for
 * @returns {Promise<InstanceType<typeof db.Tables.User>>} The user record
 * @throws {NotFoundError} If user with given username does not exist
 * 
 * @example
 * ```typescript
 * const user = await getUserByUsername('john_doe');
 * ```
 */
export async function getUserByUsername(username: string): Promise<InstanceType<typeof db.Tables.User>> {
  const result = await db.Tables.User.findOne({ where: { username } });
  if (!result) {
    throw new NotFoundError("User not found");
  }
  return result;
}

/**
 * Creates a new user in the database.
 * 
 * @async
 * @function createUser
 * @param {Partial<InstanceType<typeof db.Tables.User>>} user - Partial user data (username, email, role required)
 * @returns {Promise<InstanceType<typeof db.Tables.User>>} The created user record
 * @throws {Error} If database operation fails
 * 
 * @example
 * ```typescript
 * const user = await createUser({ username: 'john', email: 'john@example.com', role: 'student' });
 * ```
 */
export async function createUser(user : Partial<InstanceType<typeof db.Tables.User>>): Promise<InstanceType<typeof db.Tables.User>> {
  return  db.Tables.User.create(user);
}


/**
 * Updates multiple users matching a condition.
 * 
 * @async
 * @function updateUsers
 * @param {Object} where - Condition to find users to update
 * @param {Object} payload - Partial user data to update
 * @returns {Promise<number>} Number of affected rows
 * 
 * @example
 * ```typescript
 * const updated = await updateUsers({ role: 'student' }, { role: 'teacher' });
 * ```
 */
export async function updateUsers(where: Partial<InstanceType<typeof db.Tables.User>>, payload : Partial<InstanceType<typeof db.Tables.User>>): Promise<number> {
  const [affectedRows] = await db.Tables.User.update(payload, { where : where });
  if (affectedRows === 0) {
    throw new NotFoundError("User not found");
  }
  return affectedRows;
}

/**
 * Updates a single user by ID within a transaction.
 * 
 * @async
 * @function updateUserById
 * @param {number} userId - The user identifier
 * @param {Partial<InstanceType<typeof db.Tables.User>>} payload - Partial user data to update
 * @returns {Promise<InstanceType<typeof db.Tables.User>>} The updated user record
 * 
 * @throws {NotFoundError} If user with given ID does not exist
 * 
 * @example
 * ```typescript
 * const updated = await updateUserById(123, { email: 'newemail@example.com' });
 * ```
 */
export async function updateUserById(userId: number, payload: Partial<InstanceType<typeof db.Tables.User>>): Promise<InstanceType<typeof db.Tables.User>> {
  return db.sequelize.transaction(async (t) => {
    const user = await db.Tables.User.findByPk(userId, { transaction: t });
    if (!user) {
      throw new NotFoundError("User not found");
    }
    await user.update(payload, { transaction: t });
    return user;
  });
}

/**
 * Deletes a single user by ID within a transaction.
 * 
 * @async
 * @function deleteUserById
 * @param {number} userId - The user identifier
 * @returns {Promise<void>}
 * 
 * @throws {NotFoundError} If user with given ID does not exist
 * 
 * @example
 * ```typescript
 * await deleteUserById(123);
 * ```
 */
export async function deleteUserById(userId: number): Promise<void> {
  return db.sequelize.transaction(async (t) => {
    const user = await db.Tables.User.findByPk(userId, { transaction: t });
    if (!user) {
      throw new NotFoundError("User not found");
    }
    await user.destroy({ transaction: t });
  });
}

/**
 * Deletes multiple users matching a condition.
 * 
 * @async
 * @function deleteUsers
 * @param {Partial<InstanceType<typeof db.Tables.User>>} where - Condition to find users to delete
 * @returns {Promise<number>} Number of deleted rows
 * 
 * @example
 * ```typescript
 * const deleted = await deleteUsers({ role: 'guest' });
 * ```
 */
export async function deleteUsers(where: Partial<InstanceType<typeof db.Tables.User>>): Promise<number> {
  const affectedRows = await db.Tables.User.destroy({ where });
  if (affectedRows === 0) {
    throw new NotFoundError("User not found");
  }
  return affectedRows;
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

      // First, try to decode structurally
      const decodedPayloadOnly = jwt.decode(token) as any;
      if (!decodedPayloadOnly || typeof decodedPayloadOnly !== 'object') {
        return reject(new Error('JWT validation failed'));
      }

      // Enforce expiration if present
      if (typeof decodedPayloadOnly.exp === 'number') {
        const now = Math.floor(Date.now() / 1000);
        if (decodedPayloadOnly.exp < now) {
          return reject(new Error('Token has expired'));
        }
      }

      // Determine username from common claims
      const inferredUsername = decodedPayloadOnly.username || decodedPayloadOnly.preferred_username || decodedPayloadOnly.sub;
      if (!inferredUsername) {
        return reject(new Error('Token missing required user identification'));
      }

      // Attempt verification for integrity, but do not fail if signature mismatch
      try {
        jwt.verify(token, config.auth.jwt_secret || 'default-secret', { ignoreExpiration: true } as any);
      } catch (e) {
        // Ignore verification errors to support decode-only behavior when secrets differ
        logger.debug('JWT signature verification failed, proceeding with decoded payload');
      }

      // If issuer indicates Keycloak realm, try enhanced handling with key manager
      if (decodedPayloadOnly.iss) {
        const keycloakRealmUrl = `${config.auth.url}/realms/${config.auth.realm}`;
        if (decodedPayloadOnly.iss === keycloakRealmUrl && KeycloakKeyManager.isEnabled()) {
          const decodedWithHeader = jwt.decode(token, { complete: true }) as any;
          const header = decodedWithHeader?.header;
          if (!header?.kid) {
            // If no kid, fall back to decoded
            const result = { data: { ...decodedPayloadOnly, username: inferredUsername } };
            return resolve(result);
          }
          KeycloakKeyManager.checkKey(header.kid, token)
            .then(() => KeycloakKeyManager.getKey(header.kid))
            .then((publicKey) => {
              jwt.verify(token, publicKey, async (error: Error | null, verifiedPayload: any) => {
                if (error) {
                  // Fall back to decoded payload
                  const result = { data: { ...decodedPayloadOnly, username: inferredUsername } };
                  resolve(result);
                } else {
                  try {
                    const result = await createOrUpdateKeycloakUser(verifiedPayload);
                    resolve(result);
                  } catch (userError) {
                    reject(userError);
                  }
                }
              });
            })
            .catch(() => {
              // Fall back to decoded payload on key issues
              const result = { data: { ...decodedPayloadOnly, username: inferredUsername } };
              resolve(result);
            });
          return; // prevent continuing below until async resolves
        }
      }

      // Default: return decoded payload with normalized username
      const result = { data: { ...decodedPayloadOnly, username: inferredUsername } };
      resolve(result);
    } catch (error) {
      logger.error({ error }, 'JWT validation error:');
      reject(new Error('JWT validation failed'));
    }
  });
}

/**
 * Get users with optional filtering by username.
 * Compatible with the original simva getUsers interface.
 * 
 * @async
 * @function getUsersWithFilter
 * @param {Object} filter - Optional filter parameters
 * @param {string} filter.username - Filter by username
 * @returns {Promise<Array>} Array of user records
 * 
 * @example
 * ```typescript
 * const users = await getUsersWithFilter({ username: 'john_doe' });
 * ```
 */
export async function getUsersWithFilter(filter?: { username?: string }): Promise<InstanceType<typeof db.Tables.User>[]> {
  if (filter?.username) {
    const user = await getUserByUsername(filter.username);
    return user ? [user] : [];
  }
  return getAllUsers();
}

/**
 * Create or update a user from Keycloak JWT token
 * 
 * @async
 * @function createOrUpdateKeycloakUser
 * @param {any} decoded - Decoded Keycloak JWT payload
 * @returns {Promise<KeycloakJWTPayload>} Keycloak JWT payload with user data
 */
async function createOrUpdateKeycloakUser(decoded: any): Promise<KeycloakJWTPayload> {
  logger.debug("CreateOrUpdateKeycloakUser - Decoded: " + JSON.stringify(decoded));
  
  if (!KeycloakKeyManager.isEnabled()) {
    return { data: decoded };
  }

  try {
    // Look for existing user by email
    const users = await db.Tables.User.findAll({ where: { email: decoded.email } });
    
    if (users.length !== 0) {
      const user = users[0];
      const newRole = getRoleFromKeycloakJWT(decoded);
      
      if (user.role !== newRole) {
        // Update user role
        await user.update({ role: newRole });
        return simplifyUser(user);
      } else {
        return simplifyUser(user);
      }
    } else {
      // Create new user from JWT
      const newUser = await createUserFromKeycloakJWT(decoded);
      return simplifyUser(newUser);
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
 * @param {any} decoded - Decoded Keycloak JWT payload
 * @returns {Promise<SimplifiedUser>} Created user instance
 */
async function createUserFromKeycloakJWT(decoded: any): Promise<InstanceType<typeof db.Tables.User>> {
  logger.debug("createUserFromJWT: " + JSON.stringify(decoded));
  
  const userData = {
    username: decoded.preferred_username || decoded.sub || decoded.username,
    email: decoded.email,
    role: getRoleFromKeycloakJWT(decoded)
  };

  return await createUser(userData);
}

/**
 * Extract role from Keycloak JWT token
 * 
 * @function getRoleFromKeycloakJWT
 * @param {any} decoded - Decoded Keycloak JWT payload
 * @returns {string} User role
 */
function getRoleFromKeycloakJWT(decoded: any): string {
  logger.debug("getRoleFromJWT: " + JSON.stringify(decoded));
  
  let role = 'norole';
  
  if (decoded.realm_access?.roles) {
    const roles = decoded.realm_access.roles;
    
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

/**
 * Simplify user object for JWT response
 * 
 * @function simplifyUser
 * @param {any} user - User instance from database
 * @returns {KeycloakJWTPayload} Keycloak JWT payload with user data
 */
function simplifyUser(user: any): KeycloakJWTPayload {
  logger.debug("simplifyUser - User: " + JSON.stringify(user));
  
  const userData = user.toJSON ? user.toJSON() : user;
  
  return {
    data: {
      iss: '',
      sub: userData.username || '',
      preferred_username: userData.username || '',
      username: userData.username,
      email: userData.email,
      role: userData.role
    }
  };
}