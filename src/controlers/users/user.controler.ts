import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { Response, NextFunction } from "express";
import { AuthentificationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";
import * as userService from "@/services/users/user.service";

/**
 * Retrieves users from the database.
 * If a username query parameter is provided, returns a single user by username.
 * Otherwise, returns all users.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Express request object with optional username query parameter
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes errors to next middleware
 * 
 * @example
 * // GET /users
 * // Returns all users
 * 
 * @example
* // GET /users?username=john
 * // Returns user with username 'john'
 */
export async function getUsers(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let currentUser = req.user?.sql;
    const searchString = req.query.searchString as string | undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit)) : undefined;
    let offset;
    if(limit !== undefined && req.query.skip === undefined) {
        offset = 0;
    } else {
        offset = req.query.skip ? parseInt(String(req.query.skip)) : undefined;
    }
    let username = req.query.username as string | undefined;
    //logger.debug({currentUser, searchString, limit, offset, username}, "Getting users with query parameters");
    if(username) {
      const user = await userService.getUserByUsername(username);
      return res.json(user);
    } else {
      if(currentUser?.role !== 'admin') {
        throw new AuthentificationError("Only admins can access the list of users");
      }
      const users = await userService.getAllUsers(limit, offset, searchString);
      return res.json(users);
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Updates/modifies current user.
 * Used for updating user properties like role, etc.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Express request object that contains update data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes validation or database errors to next middleware
 * 
 * @example
 * // PATCH /users/me
 * // Body: { role: "teacher" }
 * // Returns: updated user object
 */
export async function patchUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const currentUser = req.user?.sql;
    if (!currentUser?.user_id) {
      throw new AuthentificationError("Current user ID not found");
    }
    const updatedUser = await userService.updateUser(currentUser.user_id, req.body);
    res.json(updatedUser);
  } catch (err) {
    next(err);
  }
}

/**
 * Gets the current authenticated user's information.
 * Based on the authentication token provided in headers.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Express request object with authentication headers
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes authentication or database errors to next middleware
 * 
 * @example
 * // GET /users/me
 * // Headers: { Authorization: "Bearer <token>" }
 * // Returns: current user object
 */
export async function getMe(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Extract user information from authenticated request
    // Assuming authentication middleware sets req.user.sql
    ///logger.debug(req.user, 'getMe: Fetching current user info');
    const userId = req.user?.sql?.user_id;
    
    if (!userId) {
      throw new AuthentificationError("User not authenticated");
    }
    
    const user = await userService.getUserById(userId);
    //logger.debug(`getMe: Retrieved user with ID ${userId}`);
    
    res.json(user);
  } catch (err) {
    next(err);
  }
}
