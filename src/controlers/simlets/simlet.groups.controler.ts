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
import { AuthentificationError } from "@/lib/errors/appErrors";
import { getAccess } from "@/controlers/users/user.helper";

export async function getSimletGroups(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId} , "Getting groups for simlet ID");
    let groups;
    if (access.is_admin) {
      groups = await simletGroupsService.getSimletGroups(simletId, true);
    } else if (!access.allocated) {
      groups = await simletGroupsService.getSimletGroups(simletId, false, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
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
    const currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    const body = req.body;
    logger.debug({simletId} , "Adding group for simlet ID");
    let simlet;
    if (access.is_admin) {
      simlet = await simletGroupsService.addSimletGroups(simletId, body, true);
    } else if (!access.allocated) {
      simlet = await simletGroupsService.addSimletGroups(simletId, body, false, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({simlet} , "Group added for simlet ID");
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
    const currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId, groupId} , "Deleting group for simlet ID");
    if (access.is_admin) {
      await simletGroupsService.deleteSimletGroup(simletId, groupId, true);
    } else if (!access.allocated) {
      await simletGroupsService.deleteSimletGroup(simletId, groupId, false, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
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
    const body = req.body;
    const currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId, groupId, body} , "Updating group for simlet ID and group ID");
    let simlet;
    if (access.is_admin) {
      simlet = await simletGroupsService.updateSimletGroup(simletId, groupId, body, true);
    } else if (!access.allocated) {
      simlet = await simletGroupsService.updateSimletGroup(simletId, groupId, body, false, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
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
    const body = req.body;
    const currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId, body} , "Creating group for simlet ID");
    let simlet;
    if (access.is_admin) {
      simlet = await simletGroupsService.createSimletGroup(simletId, body, true);
    } else if (!access.allocated) {
      simlet = await simletGroupsService.createSimletGroup(simletId, body, false, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
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
    const currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    const searchString = req.query.search as string | undefined;
    logger.debug({simletId} , "Getting group count for simlet ID");
    let count;
    if (access.is_admin) {
      count = await simletGroupsService.getSimletGroupCount(simletId, searchString, true);
    } else if (!access.allocated) {
      count = await simletGroupsService.getSimletGroupCount(simletId, searchString, false, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
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
    const currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId, groupId} , "Getting group for simlet ID and group ID");
    let group;
    if (access.is_admin) {
      group = await simletGroupsService.getSimletGroupById(simletId, groupId, true);
    } else if (!access.allocated) {
      group = await simletGroupsService.getSimletGroupById(simletId, groupId, false, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
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
    const body = req.body;
    const currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId, groupId, body} , "Creating participant for simlet ID and group ID");
    let participant;
    if (access.is_admin) {
      participant = await simletGroupsService.createSimletGroupParticipant(simletId, groupId, body, true);
    } else if (!access.allocated) {
      participant = await simletGroupsService.createSimletGroupParticipant(simletId, groupId, body, false, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
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
    const currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId, groupId, participantId} , "Adding participant for simlet ID, group ID and participant ID");
    let groupupdated;
    if (access.is_admin) {
      groupupdated = await simletGroupsService.addSimletGroupParticipant(simletId, groupId, participantId, true);
    } else if (!access.allocated) {
      groupupdated = await simletGroupsService.addSimletGroupParticipant(simletId, groupId, participantId, false, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
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
    const currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId, groupId} , "Getting participants for simlet ID and group ID");
    let participants;
    if (access.is_admin) {
      participants = await simletGroupsService.getSimletGroupParticipants(simletId, groupId, true);
    } else if (!access.allocated) {
      participants = await simletGroupsService.getSimletGroupParticipants(simletId, groupId, false, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
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
    const currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId, groupId, participantId} , "Deleting participant for simlet ID, group ID and participant ID");
    if (access.is_admin) {
      await simletGroupsService.deleteGroupParticipant(simletId, groupId, participantId, true);
    } else if (!access.allocated) {
      await simletGroupsService.deleteGroupParticipant(simletId, groupId, participantId, false, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({simletId, groupId, participantId} , "Participant deleted for simlet ID, group ID and participant ID");
    res.status(204).send();
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
    const currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    const participant_id_or_group_id = req.body.participant_id ? parseInt(req.body.participant_id) : groupId;
    logger.debug({simletId, groupId, sessionId} , "Allocating group to session for simlet ID, group ID and session ID");
    if (access.is_admin) {
      await simletGroupsService.allocateToSessionSimlet(simletId, groupId, sessionId, participant_id_or_group_id, true);
    } else if (!access.allocated) {
      await simletGroupsService.allocateToSessionSimlet(simletId, groupId, sessionId, participant_id_or_group_id, false, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({simletId, groupId, sessionId} , "Group allocated to session for simlet ID, group ID and session ID");
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}