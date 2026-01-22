import { Request, Response, NextFunction } from "express";
import * as userService from "@/services/users/user.service";
import { NotFoundError } from "@/lib/errors/appErrors";

/**
 * Retrieves users from the database.
 * If a username query parameter is provided, returns a single user by username.
 * Otherwise, returns all users.
 * 
 * @async
 * @param {Request} req - Express request object with optional username query parameter
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
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if(req.query.username) {
      const user = await userService.getUserByUsername(String(req.query.username));
      if (!user) {
        throw new NotFoundError("User not found");
      }
      return res.json(user);
    } else {
      const users = await userService.getAllUsers();
      res.json(users);
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Creates a new user in the database.
 * 
 * @async
 * @param {Request} req - Express request object containing user data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes validation or database errors to next middleware
 * 
 * @example
 * // POST /users
 * // Body: { username: "john", email: "john@example.com", role: "student" }
 * // Returns: 201 Created with user object
 */
export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

/**
 * Deletes a user from the database by ID.
 * 
 * @async
 * @param {Request} req - Express request object containing user ID in URL params
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes errors to next middleware
 * 
 * @example
 * // DELETE /users/123
 * // Returns: 204 No Content
 */
export async function deleteUserById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await userService.deleteUserById(Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
