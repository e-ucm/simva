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

export async function getSessionPermissions(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    let currentUser = req.user?.sql;
    logger.debug({simletId, sessionId, userId: currentUser?.user_id} , "Getting permissions for session ID and user ID");
    const permissions = await sessionPermissionsService.getSessionPermissions(simletId, sessionId, currentUser!.user_id as number);
    logger.debug({permissions} , "Permissions retrieved for session ID and user ID");
    res.json(permissions.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function createSessionPermissions(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    let body = req.body
    let currentUser = req.user?.sql;
    logger.debug({simletId, sessionId, userId: currentUser?.user_id, body} , "Creating permissions for session ID and user ID");
    const permissions = await sessionPermissionsService.createSessionPermissions(simletId, sessionId, currentUser!.user_id as number, body);
    logger.debug({permissions} , "Permissions created for session ID and user ID");
    res.json(permissions.toJSON());
  } catch (err) {
    next(err);
  }
}

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
    logger.debug({simletId, sessionId, userId: currentUser?.user_id} , "Getting permissions for session ID and user ID");
    const permissions = await sessionPermissionsService.getSessionPermissionsForUser(simletId, sessionId, userId, currentUser!.user_id as number);
    logger.debug({permissions} , "Permissions retrieved for session ID and user ID");
    res.json(permissions.toJSON());
  } catch (err) {
    next(err);
  }
}

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
    logger.debug({simletId, sessionId, userId: currentUser?.user_id, body} , "Patching permissions for session ID and user ID");
    const permissions = await sessionPermissionsService.patchSessionPermissionsForUser(simletId, sessionId, userId, currentUser!.user_id as number, body);
    logger.debug({permissions} , "Permissions patched for session ID and user ID");
    res.json(permissions.toJSON());
  } catch (err) {
    next(err);
  }
}

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
    logger.debug({simletId, sessionId, userId: currentUser?.user_id} , "Deleting permissions for session ID and user ID");
    await sessionPermissionsService.deleteSessionPermissionsForUser(simletId, sessionId, userId, currentUser!.user_id as number);
    logger.debug({simletId, sessionId, userId: currentUser?.user_id} , "Permissions deleted for session ID and user ID");
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
