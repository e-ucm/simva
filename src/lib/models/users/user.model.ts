import { Sequelize, Model, Op } from "sequelize";
import { NotFoundError } from "@/lib/errors/appErrors";

/**
 * User model representing the main user entity in SIMVA.
 * Stores user authentication and profile information.
 * 
 * @class User
 * @extends Model
 * 
 * @property {number} user_id - Primary key identifier for the user
 * @property {string} username - Unique username for the user
 * @property {string} email - Email address of the user
 * @property {boolean} isToken - Whether the user is authenticated via token
 * @property {string|null} token - Authentication token (if applicable)
 * @property {string} role - User role (admin, teacher, student, etc.)
 * @property {Date} createdAt - Timestamp when the user was created
 * @property {Date} updatedAt - Timestamp when the user was last updated
 */
export class User extends Model {
  declare user_id: number;
  declare username: string;
  declare email: string;
  declare isToken: boolean;
  declare token: string | null;
  declare role: string;
  declare createdAt: Date;
  declare updatedAt: Date;

  /**
   * Retrieve all users from the database.
   * 
   * @async
   * @function getAllUsers
   * @param {number} [limit] - Maximum number of users to return
   * @param {number} [offset] - Number of users to skip for pagination
   * @returns {Promise<User[]>} Array of users
   * 
   * @example
   * ```typescript
   * const users = await User.getAllUsers();
   * const paginatedUsers = await User.getAllUsers(10, 20);
   * ```
   */
  static async getAllUsers(
    limit?: number,
    offset?: number
  ): Promise<User[]> {
    return await User.findAll({
      order: [['user_id', 'ASC']],
      limit,
      offset
    });
  }

  /**
   * Retrieve a user by their ID.
   * 
   * @async
   * @function getUserById
   * @param {number} user_id - The user's ID
   * @returns {Promise<User>} The user object
   * @throws {NotFoundError} If user with the specified ID doesn't exist
   * 
   * @example
   * ```typescript
   * const user = await User.getUserById(123);
   * ```
   */
  static async getUserById(user_id: number): Promise<User> {
    const user = await User.findByPk(user_id);
    
    if (!user) {
      throw new NotFoundError(`User with ID ${user_id} not found`);
    }
    
    return user;
  }

  /**
   * Retrieve a user by their username.
   * 
   * @async
   * @function getUserByUsername
   * @param {string} username - The user's username
   * @returns {Promise<User>} The user object
   * @throws {NotFoundError} If user with the specified username doesn't exist
   * 
   * @example
   * ```typescript
   * const user = await User.getUserByUsername('john_doe');
   * ```
   */
  static async getUserByUsername(username: string): Promise<User> {
    const user = await User.findOne({ where: { username } });
    
    if (!user) {
      throw new NotFoundError(`User with username ${username} not found`);
    }
    
    return user;
  }

  /**
   * Search users by username pattern.
   * 
   * @async
   * @function searchUsersByUsername
   * @param {string} username - The username pattern to search for
   * @returns {Promise<User[]>} Array of users matching the username pattern
   * 
   * @example
   * ```typescript
   * const users = await User.searchUsersByUsername('john');
   * ```
   */
  static async searchUsersByUsername(username: string): Promise<User[]> {
    return await User.findAll({
      where: {
        username: {
          [Op.like]: `%${username}%`
        }
      },
      order: [['username', 'ASC']]
    });
  }

  /**
   * Get users by role.
   * 
   * @async
   * @function getUsersByRole
   * @param {string} role - The user role
   * @returns {Promise<User[]>} Array of users with the specified role
   * 
   * @example
   * ```typescript
   * const teachers = await User.getUsersByRole('teacher');
   * ```
   */
  static async getUsersByRole(role: string): Promise<User[]> {
    return await User.findAll({
      where: { role },
      order: [['username', 'ASC']]
    });
  }

  /**
   * Create a new user.
   * 
   * @async
   * @function createUser
   * @param {Partial<User>} userData - The user data for creation
   * @returns {Promise<User>} The created user
   * 
   * @example
   * ```typescript
   * const newUser = await User.createUser({
   *   username: 'john_doe',
   *   email: 'john@example.com',
   *   role: 'student',
   *   isToken: false
   * });
   * ```
   */
  static async createUser(userData: Partial<User>): Promise<User> {
    if (!userData.token) {
      userData.isToken = false;
    } else {
      userData.isToken = true;
    }
    return await User.create(userData);
  }

  /**
   * Update an existing user by ID.
   * 
   * @async
   * @function updateUser
   * @param {number} user_id - The user's ID
   * @param {Partial<User>} updateData - The data to update
   * @returns {Promise<User>} The updated user
   * @throws {NotFoundError} If user with the specified ID doesn't exist
   * 
   * @example
   * ```typescript
   * const updatedUser = await User.updateUser(123, {
   *   email: 'newemail@example.com',
   *   role: 'teacher'
   * });
   * ```
   */
  static async updateUser(user_id: number, updateData: Partial<User>): Promise<User> {
    const user = await this.getUserById(user_id);
    
    await user.update(updateData);
    await user.reload();
    
    return user;
  }

  /**
   * Delete a user by ID.
   * 
   * @async
   * @function deleteUser
   * @param {number} user_id - The user's ID
   * @returns {Promise<void>}
   * @throws {NotFoundError} If user with the specified ID doesn't exist
   * 
   * @example
   * ```typescript
   * await User.deleteUser(123);
   * ```
   */
  static async deleteUser(user_id: number): Promise<void> {
    const user = await this.getUserById(user_id);
    await user.destroy();
  }

  /**
   * Count total number of users.
   * 
   * @async
   * @function countUsers
   * @returns {Promise<number>} Total count of users
   * 
   * @example
   * ```typescript
   * const count = await User.countUsers();
   * ```
   */
  static async countUsers(): Promise<number> {
    return await User.count();
  }

  /**
   * Count users by role.
   * 
   * @async
   * @function countUsersByRole
   * @param {string} role - The user role
   * @returns {Promise<number>} Count of users with the specified role
   * 
   * @example
   * ```typescript
   * const teacherCount = await User.countUsersByRole('teacher');
   * ```
   */
  static async countUsersByRole(role: string): Promise<number> {
    return await User.count({ where: { role } });
  }

  /**
   * Check if a user exists by ID.
   * 
   * @async
   * @function userExists
   * @param {number} user_id - The user's ID
   * @returns {Promise<boolean>} True if user exists, false otherwise
   * 
   * @example
   * ```typescript
   * const exists = await User.userExists(123);
   * ```
   */
  static async userExists(user_id: number): Promise<boolean> {
    const count = await User.count({ where: { user_id } });
    return count > 0;
  }

  /**
   * Check if a username is available (not taken).
   * 
   * @async
   * @function isUsernameAvailable
   * @param {string} username - The username to check
   * @returns {Promise<boolean>} True if username is available, false if taken
   * 
   * @example
   * ```typescript
   * const available = await User.isUsernameAvailable('new_user');
   * ```
   */
  static async isUsernameAvailable(username: string): Promise<boolean> {
    const count = await User.count({ where: { username } });
    return count === 0;
  }

  /**
   * Get users with tokens.
   * 
   * @async
   * @function getUsersWithTokens
   * @returns {Promise<User[]>} Array of users that have tokens
   * 
   * @example
   * ```typescript
   * const tokenUsers = await User.getUsersWithTokens();
   * ```
   */
  static async getUsersWithTokens(): Promise<User[]> {
    return await User.findAll({
      where: {
        isToken: true,
        token: {
          [Op.not]: null
        }
      },
      order: [['username', 'ASC']]
    });
  }

  /**
   * Get users with filter conditions.
   * 
   * @async
   * @function getUsersWithFilter
   * @param {object} filter - Filter conditions
   * @param {string} [filter.username] - Username pattern to search
   * @param {string} [filter.role] - Role to filter by
   * @param {string} [filter.email] - Email pattern to search
   * @returns {Promise<User[]>} Array of users matching the filter
   * 
   * @example
   * ```typescript
   * const users = await User.getUsersWithFilter({ role: 'teacher', username: 'john' });
   * ```
   */
  static async getUsersWithFilter(filter: {
    username?: string;
    role?: string;
    email?: string;
  } = {}): Promise<User[]> {
    const where: any = {};
    
    if (filter.username) {
      where.username = { [Op.like]: `%${filter.username}%` };
    }
    
    if (filter.role) {
      where.role = filter.role;
    }
    
    if (filter.email) {
      where.email = { [Op.like]: `%${filter.email}%` };
    }
    
    return await User.findAll({
      where,
      order: [['username', 'ASC']]
    });
  }
}

/**
 * Factory function to initialize the User model with Sequelize.
 * Defines the database schema and constraints for the User table.
 * 
 * @function UserFactory
 * @param {Sequelize} sequelize - The Sequelize instance
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {typeof User} The initialized User model
 * 
 * @example
 * ```typescript
 * const User = UserFactory(sequelize, DataTypes);
 * const user = await User.create({ username: 'john', email: 'john@example.com', role: 'student' });
 * ```
 */
export function UserFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  User.init({
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isToken: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt:{
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt:{
      type: DataTypes.DATE,
      allowNull: false,
    }
  },
  {
    sequelize,
    tableName: "Users",
    timestamps: true,
    freezeTableName: true,
  });

  return User;
};