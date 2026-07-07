/**
 * @fileoverview Service for User entity operations.
 * Handles all user management operations including authentication and permissions.
 * 
 * @module services/users/user
 * @requires @/lib/mappers/Users/User
 * @requires @/lib/logger
 */

import { User } from "@/lib/mappers/Users/User";
import { logger } from "@/lib/logger";

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
 * const user = await getUserByUsername('john_doe');
 * logger.info(user.username, user.email);
 * ```
 */
export async function getUserByUsername(username: string): Promise<User> {
  const user = await User.getFromDbData(undefined, username);
  return user;
}

/**
 * Retrieve all users from the database with optional filtering and pagination.
 * 
 * @async
 * @function getAllUsers
 * @param {number} [limit] - Maximum number of users to return
 * @param {number} [offset] - Number of users to skip for pagination
 * @param {string} [searchString] - Optional search string to filter users by username
 * @returns {Promise<User[]>} Array of users
 * 
 * @example
 * ```typescript
 * // Get all users
 * const users = await getAllUsers();
 * 
 * // Get paginated users with search
 * const paginatedUsers = await getAllUsers(10, 20, 'john');
 * ```
 */
export async function getAllUsers(
  limit?: number,
  offset?: number,
  searchString?: string
): Promise<User[]> {
  return await User.getAllFromDbData(limit, offset, searchString);
}

/**
 * Updates existing user data in the database.
 * Modifies user properties based on the provided data.
 * 
 * @async
 * @function updateUser
 * @param {number} user_id - The unique identifier of the user to update
 * @param {any} body - Partial user object containing fields to update
 * @returns {Promise<User>} The updated user object
 * @throws {NotFoundError} If user with the specified ID doesn't exist
 * @throws {ValidationError} If update data is invalid
 * 
 * @example
 * ```typescript
 * const updatedUser = await updateUser(123, { role: 'teacher', email: 'newemail@example.com' });
 * ```
 */
export async function updateUser(user_id: number, body: any): Promise<User> {
  let user = await User.getFromDbData(user_id);
  return await user.update(body);
}

/**
 * Retrieves a single user by their unique identifier.
 * 
 * @async
 * @function getUserById
 * @param {number} userId - The unique identifier of the user
 * @returns {Promise<User>} The user object
 * @throws {NotFoundError} If user with the specified ID doesn't exist
 * 
 * @example
 * ```typescript
 * const user = await getUserById(123);
 * logger.info(user.username, user.email);
 * ```
 */
export async function getUserById(userId: number): Promise<User> {
  return await User.getFromDbData(userId);
}

