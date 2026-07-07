/**
 * @fileoverview Controller for session permissions operations.
 * Handles HTTP requests and responses for session permission management endpoints.
 * 
 * @module controllers/simlets/session.permissions
 * @requires @/services/simlets/simlet.service
 * @requires @/middlewares/auth.middleware
 * @requires express
 */

import { Response, NextFunction } from "express";
import * as sessionPermissionsService from "@/services/simlets/session.permissions.service";
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { logger } from "@/lib/logger";
import { AuthentificationError } from "@/lib/errors/appErrors";
import { getAccess } from "@/controlers/users/user.helper";

/**
 * Retrieves all permissions for a specific session in a simlet.
 * 
 * @async
 * @function getSessionPermissions
 * @param {AuthenticatedRequest} req - Express request object with simlet_id and session_id in URL parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // GET /simlets/:simlet_id/sessions/:session_id/permissions
 * // Returns session permissions object
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function getSessionPermissions(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    let currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId, sessionId, userId: currentUser?.user_id} , "Getting permissions for session ID and user ID");
    let permissions;
    if (access.is_admin) {
      permissions = await sessionPermissionsService.getSessionPermissions(simletId, sessionId, true);
    } else if (!access.allocated) {
      permissions = await sessionPermissionsService.getSessionPermissions(simletId, sessionId, false, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({permissions} , "Permissions retrieved for session ID and user ID");
    res.json(permissions.toJSON());
  } catch (err) {
    next(err);
  }
}

/**
 * Creates permissions for a session.
 * 
 * @async
 * @function createSessionPermissions
 * @param {AuthenticatedRequest} req - Express request object with simlet_id and session_id in URL parameters and permission data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // POST /simlets/:simlet_id/sessions/:session_id/permissions
 * // Body: { user_id: 123, permission: "READ" }
 * // Returns: created permissions object
 */
export async function createSessionPermissions(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    let body = req.body;
    let currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId, sessionId, userId: currentUser?.user_id, body} , "Creating permissions for session ID and user ID");
    let permissions;
    if (access.is_admin) {
      permissions = await sessionPermissionsService.createSessionPermissions(simletId, sessionId, true, body);
    } else if (!access.allocated) {
      permissions = await sessionPermissionsService.createSessionPermissions(simletId, sessionId, false, body, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({permissions} , "Permissions created for session ID and user ID");
    res.json(permissions.toJSON());
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves permissions for a specific user on a specific session.
 * 
 * @async
 * @function getSessionPermissionsForUser
 * @param {AuthenticatedRequest} req - Express request object with simlet_id, session_id and user_id in URL parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // GET /simlets/:simlet_id/sessions/:session_id/permissions/:user_id
 * // Returns: user's permissions object
 */
export async function getSessionPermissionsForUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    const userId = parseInt(req.params.user_id as string);
    let currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId, sessionId, userId: currentUser?.user_id} , "Getting permissions for session ID and user ID");
    let permissions;
    if (access.is_admin) {
      permissions = await sessionPermissionsService.getSessionPermissionsForUser(simletId, sessionId, userId, true);
    } else if (!access.allocated) {
      permissions = await sessionPermissionsService.getSessionPermissionsForUser(simletId, sessionId, userId, false, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({permissions} , "Permissions retrieved for session ID and user ID");
    res.json(permissions.toJSON());
  } catch (err) {
    next(err);
  }
}

/**
 * Updates permissions for a specific user on a specific session.
 * 
 * @async
 * @function patchSessionPermissionsForUser
 * @param {AuthenticatedRequest} req - Express request object with simlet_id, session_id and user_id in URL parameters and updated permission data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // PATCH /simlets/:simlet_id/sessions/:session_id/permissions/:user_id
 * // Body: { permission: "WRITE" }
 * // Returns: updated permissions object
 */
export async function patchSessionPermissionsForUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    const userId = parseInt(req.params.user_id as string);
    let body = req.body
    let currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId, sessionId, userId: currentUser?.user_id, body} , "Patching permissions for session ID and user ID");
    let permissions;
    if (access.is_admin) {
      permissions = await sessionPermissionsService.patchSessionPermissionsForUser(simletId, sessionId, userId, true, body);
    } else if (!access.allocated) {
      permissions = await sessionPermissionsService.patchSessionPermissionsForUser(simletId, sessionId, userId, false, body, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({permissions} , "Permissions patched for session ID and user ID");
    res.json(permissions.toJSON());
  } catch (err) {
    next(err);
  }
}

/**
 * Deletes permissions for a specific user on a specific session.
 * 
 * @async
 * @function deleteSessionPermissionsForUser
 * @param {AuthenticatedRequest} req - Express request object with simlet_id, session_id and user_id in URL parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // DELETE /simlets/:simlet_id/sessions/:session_id/permissions/:user_id
 * // Returns: 204 No Content
 */
export async function deleteSessionPermissionsForUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    const userId = parseInt(req.params.user_id as string);
    let currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId, sessionId, userId: currentUser?.user_id} , "Deleting permissions for session ID and user ID");
    if (access.is_admin) {
      await sessionPermissionsService.deleteSessionPermissionsForUser(simletId, sessionId, userId, true);
    } else if (!access.allocated) {
      await sessionPermissionsService.deleteSessionPermissionsForUser(simletId, sessionId, userId, false, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({simletId, sessionId, userId: currentUser?.user_id} , "Permissions deleted for session ID and user ID");
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
