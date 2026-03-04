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

export async function getSimletPermissions(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    let currentUser = req.user?.sql;
    logger.debug({simletId, userId: currentUser?.user_id} , "Getting permissions for simlet ID and user ID");
    const permissions = await simletPermissionsService.getSimletPermissions(simletId, currentUser!.user_id as number);
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
    logger.debug({simletId, userId: currentUser?.user_id, body} , "Creating permissions for simlet ID and user ID");
    const permissions = await simletPermissionsService.createSimletPermissions(simletId, currentUser!.user_id as number, body);
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
    logger.debug({simletId, userId: currentUser?.user_id} , "Getting permissions for simlet ID and user ID");
    const permissions = await simletPermissionsService.getSimletPermissionsForUser(simletId, userId, currentUser!.user_id as number);
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
    logger.debug({simletId, userId: currentUser?.user_id, body} , "Patching permissions for simlet ID and user ID");
    const permissions = await simletPermissionsService.patchSimletPermissionsForUser(simletId, userId, currentUser!.user_id as number, body);
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
    logger.debug({simletId, userId: currentUser?.user_id} , "Deleting permissions for simlet ID and user ID");
    await simletPermissionsService.deleteSimletPermissionsForUser(simletId, userId, currentUser!.user_id as number);
    logger.debug({simletId, userId: currentUser?.user_id} , "Permissions deleted for simlet ID and user ID");
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
