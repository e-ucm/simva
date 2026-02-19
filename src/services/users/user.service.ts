import { User } from "@/lib/mappers/Users/User";

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
  export async function getUserByUsername(username: string): Promise<User> {
    const user = await User.getFromDbData(undefined, username);
    return user;
  }

   /**
   * Retrieve all users from the database.
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
   * const users = await User.getAllUsers();
   * const paginatedUsers = await User.getAllUsers(10, 20, 'john');
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
 * @param {Partial<User>} body - Partial user object containing fields to update
 * @returns {Promise<User>} The updated user object
 * @throws {NotFoundError} If user with the specified ID doesn't exist
 * @throws {ValidationError} If update data is invalid
 * 
 * @example
 * ```typescript
 * const updatedUser = await updateUser(123, { role: 'teacher' });
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
 * console.log(user.username, user.email);
 * ```
 */
export async function getUserById(userId: number): Promise<User> {
  return await User.getFromDbData(userId);
}

