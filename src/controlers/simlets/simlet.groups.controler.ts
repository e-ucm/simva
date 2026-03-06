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
    let currentUserId = currentUser?.user_id as number;
    logger.debug({simletId} , "Getting groups for simlet ID");
    const groups = await simletGroupsService.getSimletGroups(simletId, currentUserId);
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
    let currentUser = req.user?.sql;
    let currentUserId = currentUser?.user_id as number;
    let body = req.body;
    logger.debug({simletId} , "Getting groups for simlet ID");
    const simlet = await simletGroupsService.addSimletGroups(simletId, body, currentUserId);
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
    let currentUserId = currentUser?.user_id as number;
    logger.debug({simletId} , "Getting groups for simlet ID");
    await simletGroupsService.deleteSimletGroup(simletId, groupId, currentUserId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function updateSimletGroup(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const groupId = parseInt(req.params.group_id as string);
    let body = req.body;
    let currentUser = req.user?.sql;
    let currentUserId = currentUser?.user_id as number;
    logger.debug({simletId, groupId, body} , "Updating group for simlet ID and group ID");
    const simlet = await simletGroupsService.updateSimletGroup(simletId, groupId, currentUserId, body);
    logger.debug({simlet} , "Group updated for simlet ID and group ID");
    res.json(simlet.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function createSimletGroup(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    let body = req.body;
    let currentUser = req.user?.sql;
    let currentUserId = currentUser?.user_id as number;
    logger.debug({simletId, body} , "Creating group for simlet ID");
    const simlet = await simletGroupsService.createSimletGroup(simletId, currentUserId, body);
    logger.debug({simlet} , "Group created for simlet ID");
    res.json(simlet.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function getSimletGroupCount(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    let currentUser = req.user?.sql;
    let currentUserId = currentUser?.user_id as number;
    logger.debug({simletId} , "Getting group count for simlet ID");
    const count = await simletGroupsService.getSimletGroupCount(simletId, currentUserId);
    logger.debug({count} , "Group count retrieved for simlet ID");
    res.json({count});
  } catch (err) {
    next(err);
  }
}

export async function getSimletGroupById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const groupId = parseInt(req.params.group_id as string);
    let currentUser = req.user?.sql;
    let currentUserId = currentUser?.user_id as number;
    logger.debug({simletId, groupId} , "Getting group for simlet ID and group ID");
    const group = await simletGroupsService.getSimletGroupById(simletId, groupId, currentUserId);
    logger.debug({group} , "Group retrieved for simlet ID and group ID");
    res.json(group.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function createSimletGroupParticipant(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const groupId = parseInt(req.params.group_id as string);
    let body = req.body;
    let currentUser = req.user?.sql;
    let currentUserId = currentUser?.user_id as number;
    logger.debug({simletId, groupId, body} , "Creating participant for simlet ID and group ID");
    const participant = await simletGroupsService.createSimletGroupParticipant(simletId, groupId, currentUserId, body);
    logger.debug({participant} , "Participant created for simlet ID and group ID");
    res.json(participant.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function addSimletGroupParticipant(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const groupId = parseInt(req.params.group_id as string);
    const participantId = parseInt(req.params.participant_id as string);
    let currentUser = req.user?.sql;
    let currentUserId = currentUser?.user_id as number;
    logger.debug({simletId, groupId, participantId} , "Adding participant for simlet ID, group ID and participant ID");
    let groupupdated = await simletGroupsService.addSimletGroupParticipant(simletId, groupId, participantId, currentUserId);
    logger.debug({simletId, groupId, participantId} , "Participant added for simlet ID, group ID and participant ID");
    res.json(groupupdated.toJSON());
  } catch (err) {
    next(err);
  }
} 

export async function getSimletGroupParticipants(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const groupId = parseInt(req.params.group_id as string);
    let currentUser = req.user?.sql;
    let currentUserId = currentUser?.user_id as number;
    logger.debug({simletId, groupId} , "Getting participants for simlet ID and group ID");
    const participants = await simletGroupsService.getSimletGroupParticipants(simletId, groupId, currentUserId);
    logger.debug({participants} , "Participants retrieved for simlet ID and group ID");
    res.json(participants.map(p => p.toJSON()));
  } catch (err) {
    next(err);
  }
}

export async function deleteGroupParticipant(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const groupId = parseInt(req.params.group_id as string);
    const participantId = parseInt(req.params.participant_id as string);
    let currentUser = req.user?.sql;
    let currentUserId = currentUser?.user_id as number;
    logger.debug({simletId, groupId, participantId} , "Deleting participant for simlet ID, group ID and participant ID");
    await simletGroupsService.deleteGroupParticipant(simletId, groupId, participantId, currentUserId);
    logger.debug({simletId, groupId, participantId} , "Participant deleted for simlet ID, group ID and participant ID");
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}