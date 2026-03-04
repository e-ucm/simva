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
import * as simletAllocatorService from "@/services/simlets/simlet.allocator.service";
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { logger } from "@/lib/logger";

export async function getAllocatorFromSimlet(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    logger.debug({simletId} , "Getting allocator for simlet ID");
    let currentUser = req.user?.sql;
    const allocator = await simletAllocatorService.getAllocatorFromSimlet(simletId, currentUser!.user_id as number);
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
    logger.debug({simletId} , "Getting allocator for simlet ID");
    let currentUser = req.user?.sql;
    let body = req.body;
    const allocator = await simletAllocatorService.updateSimletAllocator(simletId, currentUser!.user_id as number, body);
    res.json(allocator.toJSON());
  } catch (err) {
    next(err);
  }
}
