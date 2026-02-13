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

export function updateUser(user_id: number, body: any) {
  let user = User.getFromDbData(user_id);
  
}

export function getUserById(userId: number) {
  return User.getFromDbData(userId);
}

