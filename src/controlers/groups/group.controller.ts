import { Request, Response, NextFunction } from "express";
import * as groupService from "@/services/groups/group.service";
import { NotFoundError, ValidationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";

/**
 * Retrieves all groups from the database.
 * Supports optional pagination through limit and offset query parameters.
 * 
 * @async
 * @param {Request} req - Express request object with optional limit and offset query parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes errors to next middleware
 * 
 * @example
 * // GET /groups
 * // Returns all groups
 * 
 * @example
 * // GET /groups?limit=10&offset=20
 * // Returns 10 groups starting from offset 20
 */
export async function getGroups(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;

    if (limit !== undefined && (isNaN(limit) || limit < 0)) {
      throw new ValidationError("Invalid limit parameter");
    }
    if (offset !== undefined && (isNaN(offset) || offset < 0)) {
      throw new ValidationError("Invalid offset parameter");
    }

    const groups = await groupService.getAllGroups(limit, offset);
    res.json(groups);
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves a single group by its ID.
 * 
 * @async
 * @param {Request} req - Express request object with group ID in params
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {NotFoundError} If group with the specified ID doesn't exist
 * @throws {ValidationError} If group ID is invalid
 * 
 * @example
 * // GET /groups/123
 * // Returns group with ID 123
 */
export async function getGroupById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const groupId = parseInt(req.params.id as string);
    if (isNaN(groupId) || groupId <= 0) {
      throw new ValidationError("Invalid group ID");
    }

    const group = await groupService.getGroupById(groupId);
    res.json(group);
  } catch (err) {
    next(err);
  }
}

/**
 * Creates a new group in the database.
 * 
 * @async
 * @param {Request} req - Express request object with group data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {ValidationError} If required fields are missing or invalid
 * 
 * @example
 * // POST /groups
 * // Body: { "name": "Study Group A", "use_new_generation": true, "group_owner_id": 1 }
 * // Creates a new group
 */
export async function createGroup(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const group = await groupService.createGroup(req.body);
    res.status(201).json(group);
  } catch (err) {
    next(err);
  }
}

/**
 * Updates an existing group by its ID.
 * 
 * @async
 * @param {Request} req - Express request object with group ID in params and update data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {NotFoundError} If group with the specified ID doesn't exist
 * @throws {ValidationError} If group ID is invalid
 * 
 * @example
 * // PUT /groups/123
 * // Body: { "name": "Updated Group Name" }
 * // Updates group with ID 123
 */
export async function updateGroup(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const groupId = parseInt(req.params.id as string);
    if (isNaN(groupId) || groupId <= 0) {
      throw new ValidationError("Invalid group ID");
    }

    const group = await groupService.updateGroup(groupId, req.body);
    res.json(group);
  } catch (err) {
    next(err);
  }
}

/**
 * Deletes a group by its ID.
 * 
 * @async
 * @param {Request} req - Express request object with group ID in params
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {NotFoundError} If group with the specified ID doesn't exist
 * @throws {ValidationError} If group ID is invalid
 * 
 * @example
 * // DELETE /groups/123
 * // Deletes group with ID 123
 */
export async function deleteGroup(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const groupId = parseInt(req.params.id as string);
    if (isNaN(groupId) || groupId <= 0) {
      throw new ValidationError("Invalid group ID");
    }

    await groupService.deleteGroup(groupId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * Gets the total count of groups in the database.
 * 
 * @async
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes errors to next middleware
 * 
 * @example
 * // GET /groups/count
 * // Returns: { "count": 42 }
 */
export async function getGroupCount(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const count = await groupService.getGroupCount();
    res.json({ count });
  } catch (err) {
    next(err);
  }
}