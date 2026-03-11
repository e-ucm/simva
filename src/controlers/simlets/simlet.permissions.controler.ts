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
    logger.debug({simletId, userId: currentUser?.user_id} , "Deleting permissions for simlet ID and user ID");
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
