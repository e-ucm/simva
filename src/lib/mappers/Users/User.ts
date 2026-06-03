import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/errors/appErrors";
import { Op } from "sequelize";
import { config } from "@/lib/config";
import { logger } from "@/lib/logger";
import { keycloakClient } from "@/lib/utils/keycloakclient";
import jwt from 'jsonwebtoken';

/**
 * User mapper class representing a system user.
 * Handles user data management and Keycloak integration.
 * 
 * @class User
 * @description Manages user accounts, roles, authentication tokens, and Keycloak synchronization.
 * Provides methods for user CRUD operations and role management.
 */
export class User {
  declare user_id: number;
  declare username: string;
  declare email: string;
  declare isToken: boolean;
  declare token: string | null;
  declare role: string;
  declare createdAt: Date;
  declare updatedAt: Date;

  /**
   * Creates a new User instance from raw data.
   * 
   * @constructor
   * @param {any} data - Raw user data object containing user properties
   * 
   * @example
   * ```typescript
   * const user = new User({
   *   user_id: 123,
   *   username: 'john_doe',
   *   email: 'john@example.com',
   *   role: 'student'
   * });
   * ```
   */
  constructor(data: any) {
    this.user_id = data.user_id;
    this.username = data.username;
    this.email = data.email;
    this.isToken = data.isToken;
    this.token = data.token;
    this.role = data.role;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Retrieves users that match the provided partial criteria.
   * Allows filtering users by any combination of user properties.
   * 
   * @static
   * @async
   * @method getFromPartialDBData
   * @param {Partial<User>} sql - Partial user object for filtering criteria
   * @returns {Promise<User[]>} Promise resolving to array of matching users
   * @throws {Error} When database query fails
   * 
   * @example
   * ```typescript
   * const users = await User.getFromPartialDBData({ role: 'teacher' });
   * ```
   */
  static async getFromPartialDBData(sql: Partial<User>): Promise<User[]> {
    let users = await db.Tables.User.findAll({ where: sql });
    return users.map((user: any) => new User(user));
  }

  /**
   * Retrieves all users from the database with optional pagination and search.
   * Supports filtering by username and pagination for large datasets.
   * 
   * @static
   * @async
   * @method getAllFromDbData
   * @param {number | undefined} limit - Maximum number of users to return
   * @param {number | undefined} offset - Number of users to skip for pagination
   * @param {string | undefined} searchString - Optional search string to filter by username
   * @returns {Promise<User[]>} Promise resolving to array of users
   * @throws {Error} When database query fails
   * 
   * @example
   * ```typescript
   * const users = await User.getAllFromDbData(10, 0, 'john');
   * ```
   */
  static async getAllFromDbData(limit?: number, offset?: number, searchString?: string): Promise<User[]> {
    let users = await db.Tables.User.findAll({
      order: [['user_id', 'ASC']],
      where: searchString ? {
        username: {
          [Op.like]: `%${searchString}%`
        }
      } : undefined,
      limit : limit !== undefined ? limit : undefined,
      offset : offset !== undefined ? offset : undefined
    });
    return users.map((user: any) => new User(user));
  }

  static async getFromListDbData(participants_id: number[]): Promise<User[]> {
    let users = await db.Tables.User.findAll({
      order: [['user_id', 'ASC']],
      where: {
        user_id: {
          [Op.in]: participants_id
        }
      }
    });
    return users.map((user: any) => new User(user));
  }


  /**
   * Retrieves a single user by ID or username.
   * Provides flexible user lookup supporting both primary key and unique username.
   * 
   * @static
   * @async
   * @method getFromDbData
   * @param {number} [user_id] - Optional user ID for lookup
   * @param {string} [username] - Optional username for lookup
   * @returns {Promise<User>} Promise resolving to the user instance
   * @throws {NotFoundError} When neither parameter is provided, both are provided, or user is not found
   * 
   * @example
   * ```typescript
   * const userById = await User.getFromDbData(123);
   * const userByName = await User.getFromDbData(undefined, 'john_doe');
   * ```
   */
  static async getFromDbData(user_id?: number, username?: string): Promise<User> {
    let model: InstanceType<typeof db.Tables.User> | null;
    if (!user_id && !username) {
        throw new NotFoundError("User ID or username must be provided");
    } else if (user_id && username) {
        throw new NotFoundError("Provide either user ID or username, not both");
    } else if (user_id) {
        model = await db.Tables.User.findOne({ where: { user_id: user_id } });
        if (!model) {
          throw new NotFoundError(`User with ID ${user_id} not found`);
        };
    } else {
        model = await db.Tables.User.findOne({ where: { username: username } });
        if (!model) {
          throw new NotFoundError(`User with username ${username} not found`);
        }
    }
    return new User({
      user_id: model.user_id,
      username: model.username,
      email: model.email,
      isToken: model.isToken,
      token: model.token,
      role: model.role,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  /**
   * Creates a new user in the database.
   * Handles user creation with proper validation and default values.
   * 
   * @static
   * @async
   * @method createDB
   * @param {Object} userData - User data for creation
   * @param {any} userData.username - Username for the new user
   * @param {string | undefined} userData.email - Email address for the new user
   * @param {string} userData.role - Role assignment for the new user
   * @param {boolean} userData.isToken - Whether this user uses token authentication
   * @returns {Promise<User>} Promise resolving to the created user instance
   * @throws {ValidationError} When user data is invalid
   * @throws {Error} When database creation fails
   * 
   * @example
   * ```typescript
   * const newUser = await User.createDB({
   *   username: 'jane_doe',
   *   email: 'jane@example.com',
   *   role: 'student',
   *   isToken: false
   * });
   * ```
   */
  static async createDB(userData: { username: any; email?: string; role: string; isToken: boolean; }): Promise<User> {
    let user = await db.Tables.User.create(userData);
    return new User(user);
  }

  /**
   * Updates user properties in the database and Keycloak.
   * Synchronizes role changes with Keycloak authentication system.
   * 
   * @async
   * @method update
   * @param {Partial<User>} partial - Partial user object containing fields to update
   * @returns {Promise<User>} Promise resolving to the updated user instance
   * @throws {NotFoundError} When user is not found in database
   * @throws {Error} When Keycloak role assignment fails
   * 
   * @example
   * ```typescript
   * const updatedUser = await user.update({ role: 'teacher' });
   * ```
   */
  async update(partial: Partial<User>, updateInKeycloak: boolean = true): Promise<User> {
    let user = await db.Tables.User.findOne({ where: { user_id: this.user_id } });
    if (!user) {
      throw new NotFoundError(`User with ID ${this.user_id} not found`);
    }
    if (updateInKeycloak) {
      await this.giveRoleToUserInKeycloak(partial.role as string);
    }
    if(partial.email && partial.email !== this.email) {
      await user.update({ email: partial.email }, { fields: ['email'] });
      this.email = partial.email;
    }
    await user.update({ role : partial.role });
    this.role = partial.role as string;
    return this;
  }

  /**
   * Assigns a role to the user in Keycloak.
   * Synchronizes role assignment with Keycloak authentication system.
   * 
   * @async
   * @method giveRoleToUserInKeycloak
   * @param {string} [role] - Role to assign to the user
   * @returns {Promise<Boolean>} Promise resolving to true if role assignment succeeds
   * @throws {Error} When Keycloak operations fail or role is not found
   * 
   * @example
   * ```typescript
   * await user.giveRoleToUserInKeycloak('teacher');
   * ```
   */
  async giveRoleToUserInKeycloak(role?: string) : Promise<Boolean> {
      if(!config.sso.enabled){
          return true;
      }

      logger.info('KeyCloak -> Auth');

      await keycloakClient.initialize();

      var userid = await keycloakClient.findUserIdByUsername(this.username);

      logger.info('KeyCloak -> getting Role Mappings');
      let roleMappings = await keycloakClient.getClient().users.listAvailableRealmRoleMappings({id: userid});

      let selectedRole;
      for (var i = roleMappings.length - 1; i >= 0; i--) {
          if(roleMappings[i].name === role){
              selectedRole = roleMappings[i];
              break;
          }
      }

      if (!selectedRole || !selectedRole.name || !selectedRole.id) {
          throw new NotFoundError(`Role ${role} not found in Keycloak`);
      }

      logger.info('KeyCloak -> Adding Role to User');
      await keycloakClient.getClient().users.addRealmRoleMappings({id: userid, roles: [{id: selectedRole.id as string, name: selectedRole.name as string}]});

      logger.info('KeyCloak -> Role Added to User in Keycloak!');
      return true;
  }

  /**
   * Converts the user instance to a plain JSON object.
   * Returns serializable representation for API responses.
   * 
   * @method toJSON
   * @returns {Object} Plain object containing user properties
   * 
   * @example
   * ```typescript
   * const userData = user.toJSON();
   * logger.info('Username:', userData.username);
   * ```
   */
  toJSON(): object {
    return {
      user_id: this.user_id,
      username: this.username,
      email: this.email,
      role: this.role,
      isToken: this.isToken,
      token: this.token,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  async generateJWT() {
    return jwt.sign(
      {
        id: this.user_id,
        username: this.username,
        email: this.email,
        role: this.role, 
        realm_access: {
          roles: [
            this.role
          ]
        }
      },
      config.sso.jwt_secret,
      {
        expiresIn: config.sso.jwt_expiresIn,
        issuer: config.sso.jwt_issuer
      }
    )
  }

  /**
   * Validates if the user has a valid authentication token.
   * Checks token existence and basic format validation.
   * 
   * @method hasValidToken
   * @returns {boolean} True if user has a valid token, false otherwise
   * 
   * @example
   * ```typescript
   * if (user.hasValidToken()) {
   *   // User can authenticate with token
   * }
   * ```
   */
  hasValidToken(): boolean {
        if (!this.isToken) {
            return false;
        }
        if (!this.token || this.token.trim() === "") {
            return false;
        }
        // Additional token validation logic can be added here (e.g., regex pattern, length check)
        return true;
    }

    /**
     * Validates if the user has a valid email address.
     * Performs basic email format validation using regex pattern.
     * 
     * @method hasValidEmail
     * @returns {boolean} True if user has a valid email format, false otherwise
     * 
     * @example
     * ```typescript
     * if (user.hasValidEmail()) {
     *   // Email address is properly formatted
     * }
     * ```
     */
    hasValidEmail(): boolean {
        if (!this.email || this.email.trim() === "") {
            return false;
        }
        // Simple email regex pattern for basic validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(this.email)) {
            return false;
        }
        return true;
    }

    static async getAllCurrentParticipantsUsername(user_id: number[]): Promise<Map<number, string>> {
        const usernames: Map<number, string> = new Map<number, string>();
        let users = await User.getFromListDbData(user_id);
        for (const user of users) {
          usernames.set(user.user_id, user.username);
        }
        return usernames;
      }
}