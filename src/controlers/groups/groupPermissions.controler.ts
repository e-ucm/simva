import { Request, Response, NextFunction } from "express";
import * as groupPermissionsService from "@/services/groups/groupPermissions.service";
import { NotFoundError, ValidationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";

/**
 * Retrieves all permissions for a specific group.
 * 
 * @async
 * @param {Request} req - Express request object with group ID in params
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {ValidationError} If group ID is invalid
 * 
 * @example
 * // GET /group-permissions/group/123
 * // Returns all permissions in group 123
 */
export async function getGroupPermissions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const groupId = parseInt(req.params.groupId as string);
    if (isNaN(groupId) || groupId <= 0) {
      throw new ValidationError("Invalid group ID");
    }

    const permissions = await groupPermissionsService.getGroupPermissions(groupId);
    res.json(permissions);
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves all group permissions for a specific user.
 * 
 * @async
 * @param {Request} req - Express request object with user ID in params
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {ValidationError} If user ID is invalid
 * 
 * @example
 * // GET /group-permissions/user/456
 * // Returns all group permissions for user 456
 */
export async function getUserGroupPermissions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = parseInt(req.params.userId as string);
    if (isNaN(userId) || userId <= 0) {
      throw new ValidationError("Invalid user ID");
    }

    const permissions = await groupPermissionsService.getUserGroupPermissions(userId);
    res.json(permissions);
  } catch (err) {
    next(err);
  }
}

/**
 * Adds a permission for a user in a specific group.
 * 
 * @async
 * @param {Request} req - Express request object with group ID, user ID and permission in params
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {ValidationError} If group ID or user ID is invalid
 * 
 * @example
 * // POST /group-permissions/group/123/user/456/permission/edit
 * // Grants edit permission to user 456 in group 123
 */
export async function addGroupPermission(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const groupId = parseInt(req.params.groupId as string);
    const userId = parseInt(req.params.userId as string);
    const permission = req.params.permission as string;

    if (isNaN(groupId) || groupId <= 0) {
      throw new ValidationError("Invalid group ID");
    }
    if (isNaN(userId) || userId <= 0) {
      throw new ValidationError("Invalid user ID");
    }
    if (!permission || permission.trim() === '') {
      throw new ValidationError("Permission cannot be empty");
    }

    const groupPermission = await groupPermissionsService.addGroupPermission(groupId, userId, permission);
    res.status(201).json(groupPermission);
  } catch (err) {
    next(err);
  }
}

/**
 * Removes a permission from a user in a specific group.
 * 
 * @async
 * @param {Request} req - Express request object with group ID, user ID and permission in params
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {ValidationError} If group ID or user ID is invalid
 * @throws {NotFoundError} If the permission doesn't exist
 * 
 * @example
 * // DELETE /group-permissions/group/123/user/456/permission/edit
 * // Revokes edit permission from user 456 in group 123
 */
export async function removeGroupPermission(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const groupId = parseInt(req.params.groupId as string);
    const userId = parseInt(req.params.userId as string);
    const permission = req.params.permission as string;

    if (isNaN(groupId) || groupId <= 0) {
      throw new ValidationError("Invalid group ID");
    }
    if (isNaN(userId) || userId <= 0) {
      throw new ValidationError("Invalid user ID");
    }
    if (!permission || permission.trim() === '') {
      throw new ValidationError("Permission cannot be empty");
    }

    await groupPermissionsService.removeGroupPermission(groupId, userId, permission);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * Checks if a user has a specific permission in a group.
 * 
 * @async
 * @param {Request} req - Express request object with group ID, user ID and permission in params
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {ValidationError} If group ID or user ID is invalid
 * 
 * @example
 * // GET /group-permissions/group/123/user/456/permission/edit/exists
 * // Returns: { "hasPermission": true }
 */
export async function hasGroupPermission(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const groupId = parseInt(req.params.groupId as string);
    const userId = parseInt(req.params.userId as string);
    const permission = req.params.permission as string;

    if (isNaN(groupId) || groupId <= 0) {
      throw new ValidationError("Invalid group ID");
    }
    if (isNaN(userId) || userId <= 0) {
      throw new ValidationError("Invalid user ID");
    }
    if (!permission || permission.trim() === '') {
      throw new ValidationError("Permission cannot be empty");
    }

    const hasPermission = await groupPermissionsService.hasGroupPermission(groupId, userId, permission);
    res.json({ hasPermission });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves users with a specific permission in a group.
 * 
 * @async
 * @param {Request} req - Express request object with group ID and permission in params
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {ValidationError} If group ID is invalid
 * 
 * @example
 * // GET /group-permissions/group/123/permission/edit
 * // Returns all users with edit permission in group 123
 */
export async function getGroupPermissionsByType(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const groupId = parseInt(req.params.groupId as string);
    const permission = req.params.permission as string;

    if (isNaN(groupId) || groupId <= 0) {
      throw new ValidationError("Invalid group ID");
    }
    if (!permission || permission.trim() === '') {
      throw new ValidationError("Permission cannot be empty");
    }

    const permissions = await groupPermissionsService.getUsersWithPermission(groupId, permission);
    res.json(permissions);
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves all groups where a user has any permissions.
 * 
 * @async
 * @param {Request} req - Express request object with user ID in params
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {ValidationError} If user ID is invalid
 * 
 * @example
 * // GET /group-permissions/user/456/groups
 * // Returns all groups where user 456 has permissions
 */
export async function getUserGroups(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = parseInt(req.params.userId as string);
    if (isNaN(userId) || userId <= 0) {
      throw new ValidationError("Invalid user ID");
    }

    const groups = await groupPermissionsService.getUserGroups(userId);
    res.json(groups);
  } catch (err) {
    next(err);
  }
}