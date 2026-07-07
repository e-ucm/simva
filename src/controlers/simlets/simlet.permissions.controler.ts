/**
 * @fileoverview Controller for simlet permissions operations.
 * Handles HTTP requests and responses for simlet permission management endpoints.
 * 
 * @module controllers/simlets/simlet.permissions
 * @requires @/services/simlets/simlet.service
 * @requires @/middlewares/auth.middleware
 * @requires express
 */

import { Response, NextFunction } from "express";
import * as simletPermissionsService from "@/services/simlets/simlet.permissions.service";
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { logger } from "@/lib/logger";
import { AuthentificationError } from "@/lib/errors/appErrors";
import { getAccess } from "@/controlers/users/user.helper";

/**
 * Retrieves all permissions for a specific simlet.
 * 
 * @async
 * @function getSimletPermissions
 * @param {AuthenticatedRequest} req - Express request object with simlet_id in URL parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // GET /simlets/:simlet_id/permissions
 * // Returns simlet permissions object
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function getSimletPermissions(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    let currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId, userId: currentUser?.user_id} , "Getting permissions for simlet ID and user ID");
    let permissions;
    if (access.is_admin) {
      permissions = await simletPermissionsService.getSimletPermissions(simletId, true);
    } else if (!access.allocated) {
      permissions = await simletPermissionsService.getSimletPermissions(simletId, false, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({permissions} , "Permissions retrieved for simlet ID and user ID");
    res.json(permissions.toJSON());
  } catch (err) {
    next(err);
  }
}

/**
 * Creates permissions for a simlet.
 * 
 * @async
 * @function createSimletPermissions
 * @param {AuthenticatedRequest} req - Express request object with simlet_id in URL parameters and permission data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // POST /simlets/:simlet_id/permissions
 * // Body: { user_id: 123, permission: "READ" }
 * // Returns: created permissions object
 */
export async function createSimletPermissions(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    let body = req.body;
    let currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId, userId: currentUser?.user_id, body} , "Creating permissions for simlet ID and user ID");
    let permissions;
    if (access.is_admin) {
      permissions = await simletPermissionsService.createSimletPermissions(simletId, true, body);
    } else if (!access.allocated) {
      permissions = await simletPermissionsService.createSimletPermissions(simletId, false, body, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({permissions} , "Permissions created for simlet ID and user ID");
    res.json(permissions.toJSON());
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves permissions for a specific user on a specific simlet.
 * 
 * @async
 * @function getSimletPermissionsForUser
 * @param {AuthenticatedRequest} req - Express request object with simlet_id and user_id in URL parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // GET /simlets/:simlet_id/permissions/:user_id
 * // Returns: user's permissions object
 */
export async function getSimletPermissionsForUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const userId = parseInt(req.params.user_id as string);
    let currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId, userId: currentUser?.user_id} , "Getting permissions for simlet ID and user ID");
    let permissions;
    if (access.is_admin) {
      permissions = await simletPermissionsService.getSimletPermissionsForUser(simletId, userId, true);
    } else if (!access.allocated) {
      permissions = await simletPermissionsService.getSimletPermissionsForUser(simletId, userId, false, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({permissions} , "Permissions retrieved for simlet ID and user ID");
    res.json(permissions.toJSON());
  } catch (err) {
    next(err);
  }
}

/**
 * Updates permissions for a specific user on a specific simlet.
 * 
 * @async
 * @function patchSimletPermissionsForUser
 * @param {AuthenticatedRequest} req - Express request object with simlet_id and user_id in URL parameters and updated permission data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // PATCH /simlets/:simlet_id/permissions/:user_id
 * // Body: { permission: "WRITE" }
 * // Returns: updated permissions object
 */
export async function patchSimletPermissionsForUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const userId = parseInt(req.params.user_id as string);
    let body = req.body;
    let currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId, userId: currentUser?.user_id, body} , "Patching permissions for simlet ID and user ID");
    let permissions;
    if (access.is_admin) {
      permissions = await simletPermissionsService.patchSimletPermissionsForUser(simletId, userId, true, body);
    } else if (!access.allocated) {
      permissions = await simletPermissionsService.patchSimletPermissionsForUser(simletId, userId, false, body, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({permissions} , "Permissions patched for simlet ID and user ID");
    res.json(permissions.toJSON());
  } catch (err) {
    next(err);
  }
}

/**
 * Deletes permissions for a specific user on a specific simlet.
 * 
 * @async
 * @function deleteSimletPermissionsForUser
 * @param {AuthenticatedRequest} req - Express request object with simlet_id and user_id in URL parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // DELETE /simlets/:simlet_id/permissions/:user_id
 * // Returns: 204 No Content
 */
export async function deleteSimletPermissionsForUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const userId = parseInt(req.params.user_id as string);
    let currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId, userId: userId} , "Deleting permissions for simlet ID and user ID");
    if (access.is_admin) {
      await simletPermissionsService.deleteSimletPermissionsForUser(simletId, userId, true);
    } else if (!access.allocated) {
      await simletPermissionsService.deleteSimletPermissionsForUser(simletId, userId, false, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({simletId, userId: currentUser?.user_id} , "Permissions deleted for simlet ID and user ID");
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
