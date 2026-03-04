/**
 * @fileoverview Controller for simlet allocator operations.
 * Handles HTTP requests and responses for allocator management within simlets.
 * 
 * @module controllers/simlets/simlet.allocator
 * @requires @/services/simlets/simlet.service
 * @requires @/middlewares/auth.middleware
 * @requires express
 */

import { Response, NextFunction } from "express";
import * as simletAllocatorService from "@/services/simlets/group.allocator.service";
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { logger } from "@/lib/logger";

export async function getAllocatorFromSimlet(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const groupId = parseInt(req.params.group_id as string);
    logger.debug({simletId} , "Getting allocator for simlet ID");
    let currentUser = req.user?.sql;
    const allocator = await simletAllocatorService.getAllocatorFromSimlet(simletId, groupId, currentUser!.user_id as number);
    res.json(allocator.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function updateSimletAllocator(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const groupId = parseInt(req.params.group_id as string);
    logger.debug({simletId} , "Getting allocator for simlet ID");
    let currentUser = req.user?.sql;
    let body = req.body;
    const allocator = await simletAllocatorService.updateSimletAllocator(simletId, groupId, currentUser!.user_id as number, body);
    res.json(allocator.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function allocateToSessionSimlet(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const groupId = parseInt(req.params.group_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    const userId = parseInt(req.query.user_id as string);
    let body = req.body;
    let currentUser = req.user?.sql;
    logger.debug({simletId, userId: currentUser?.user_id, body});
    const allocator = await simletAllocatorService.allocateToSessionSimlet(simletId, groupId, sessionId, userId, currentUser!.user_id as number);
    logger.debug("Session allocated for simlet ID and user ID");
    res.json(allocator.toJSON());
  } catch (err) {
    next(err);
  }
}

