/**
 * @fileoverview Controller for simlet groups operations.
 * Handles HTTP requests and responses for group management within simlets.
 * 
 * @module controllers/simlets/simlet.groups
 * @requires @/services/simlets/simlet.service
 * @requires @/middlewares/auth.middleware
 * @requires express
 */

import { Response, NextFunction } from "express";
import * as simletGroupsService from "@/services/simlets/simlet.groups.service";
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { logger } from "@/lib/logger";

export async function getSimletGroups(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    let currentUser = req.user?.sql;
    logger.debug({simletId} , "Getting groups for simlet ID");
    const groups = await simletGroupsService.getSimletGroups(simletId, currentUser!.user_id as number);
    logger.debug({groups} , "Groups retrieved for simlet ID");
    res.json(groups.map(g => g.toJSON()));
  } catch (err) {
    next(err);
  }
}

export async function addSimletGroup(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const groupId = parseInt(req.params.group_id as string);
    let currentUser = req.user?.sql;
    logger.debug({simletId} , "Getting groups for simlet ID");
    const simlet = await simletGroupsService.addSimletGroups(simletId, groupId, currentUser!.user_id as number);
    logger.debug({simlet} , "Groups retrieved for simlet ID");
    res.json(simlet.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function deleteSimletGroup(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const groupId = parseInt(req.params.group_id as string);
    let currentUser = req.user?.sql;
    logger.debug({simletId} , "Getting groups for simlet ID");
    const simlet = await simletGroupsService.deleteSimletGroup(simletId, groupId, currentUser!.user_id as number);
    logger.debug({simlet} , "Groups retrieved for simlet ID");
    res.json(simlet.toJSON());
  } catch (err) {
    next(err);
  }
}
