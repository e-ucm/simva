import { Request, Response, NextFunction } from "express";
import { NotFoundError, ValidationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import * as groupService from "@/services/groups/group.service";
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
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
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let version = req.query.use_new_generation? (req.query.use_new_generation === 'true') : undefined;
    const searchString = req.query.searchString as string | undefined;
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const groups = await groupService.getGroups(req.user!.sql.user_id as number, version, searchString, limit, offset);
    res.json(groups);
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves a single group by its ID.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Express request object with group ID in params
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
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const groupId = parseInt(req.params.id as string);
    if (isNaN(groupId) || groupId <= 0) {
      throw new ValidationError("Invalid group ID");
    }

    const group = await groupService.getGroup(groupId, req.user!.sql.user_id as number);
    res.json(group);
  } catch (err) {
    next(err);
  }
}

/**
 * Creates a new group in the database.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Express request object with group data in body
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
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const group = await db.Tables.Group.createGroup(req.body);
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
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const groupId = parseInt(req.params.id as string);
    if (isNaN(groupId) || groupId <= 0) {
      throw new ValidationError("Invalid group ID");
    }

    const group = await db.Tables.Group.updateGroup(groupId, req.body);
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
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const groupId = parseInt(req.params.id as string);
    if (isNaN(groupId) || groupId <= 0) {
      throw new ValidationError("Invalid group ID");
    }

    await db.Tables.Group.deleteGroup(groupId);
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
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const count = await db.Tables.Group.countGroups();
    res.json({ count });
  } catch (err) {
    next(err);
  }
}

export async function getGroupParticipants(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const groupId = parseInt(req.params.id as string);
    if (isNaN(groupId) || groupId <= 0) {
      throw new ValidationError("Invalid group ID");
    }
    let currentUser = req.user?.sql;
    const participants = await groupService.getGroupParticipants(groupId, currentUser!.user_id as number);
    res.json(participants);
  } catch (err) {
    next(err);
  } 
}