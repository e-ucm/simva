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

/**
 * Retrieves all groups associated with a specific simlet.
 * Supports filtering by search string and sandbox status with pagination.
 * 
 * @async
 * @function getSimletGroups
 * @param {AuthenticatedRequest} req - Express request object with simlet_id in URL parameters and optional query filters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // GET /simlets/:simlet_id/groups
 * // Returns array of group objects
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function getSimletGroups(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const searchString = req.query.searchString as string | undefined;
    const sandbox = req.query.sandbox !== undefined ? Boolean(req.query.sandbox) : undefined;
    logger.debug(req.query , "Query parameters for getting simlet groups");
    const limit = req.query.limit ? (Number.isNaN(Number(req.query.limit)) ? undefined : parseInt(req.query.limit as string)) : undefined;
    let offset;
    if(limit !== undefined && req.query.skip === undefined && Number.isNaN(Number(req.query.skip))) {
        offset = 0;
    } else {
        offset = parseInt(req.query.skip as string);
    }
    const orderBy = req.query.orderBy ? String(req.query.orderBy) : undefined;
    const order = req.query.order ? String(req.query.order) : undefined;
    const currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId} , "Getting groups for simlet ID");
    let groups;
    if (access.is_admin) {
      groups = await simletGroupsService.getSimletGroups(simletId, true, searchString, sandbox, limit, offset, orderBy, order);
    } else if (!access.allocated) {
      groups = await simletGroupsService.getSimletGroups(simletId, false, searchString, sandbox, limit, offset, orderBy, order, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({groups} , "Groups retrieved for simlet ID");
    res.json(groups.map(g => g.toJSON()));
  } catch (err) {
    next(err);
  }
}

/**
 * Adds an existing group to a simlet.
 * 
 * @async
 * @function addSimletGroup
 * @param {AuthenticatedRequest} req - Express request object with simlet_id in URL parameters and group data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // POST /simlets/:simlet_id/groups
 * // Body: { group_id: 456 }
 * // Returns: created simlet-group relationship object
 */
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

/**
 * Deletes a group association from a simlet.
 * 
 * @async
 * @function deleteSimletGroup
 * @param {AuthenticatedRequest} req - Express request object with simlet_id and group_id in URL parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // DELETE /simlets/:simlet_id/groups/:group_id
 * // Returns: 204 No Content
 */
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

/**
 * Updates group association details for a simlet.
 * 
 * @async
 * @function updateSimletGroup
 * @param {AuthenticatedRequest} req - Express request object with simlet_id and group_id in URL parameters and update data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // PUT /simlets/:simlet_id/groups/:group_id
 * // Body: { name: "Updated Group Name" }
 * // Returns: updated simlet-group relationship object
 */
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

/**
 * Creates a new group and associates it with a simlet.
 * 
 * @async
 * @function createSimletGroup
 * @param {AuthenticatedRequest} req - Express request object with simlet_id in URL parameters and group data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // POST /simlets/:simlet_id/groups/create
 * // Body: { name: "New Group", description: "Group description" }
 * // Returns: created group object
 */
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

/**
 * Gets the count of groups associated with a specific simlet.
 * Supports filtering by search string and sandbox status.
 * 
 * @async
 * @function getSimletGroupCount
 * @param {AuthenticatedRequest} req - Express request object with simlet_id in URL parameters and optional query filters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // GET /simlets/:simlet_id/groups/count
 * // Returns: { count: 5 }
 */
export async function getSimletGroupCount(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    const searchString = req.query.searchString as string | undefined;
    const sandbox = req.query.sandbox !== undefined ? Boolean(req.query.sandbox) : undefined;
    logger.debug(req.query , "Query parameters for getting simlet group count");
    logger.debug({simletId, searchString, sandbox} , "Getting group count for simlet ID");
    let count;
    if (access.is_admin) {
      count = await simletGroupsService.getSimletGroupCount(simletId, true, searchString, sandbox);
    } else if (!access.allocated) {
      count = await simletGroupsService.getSimletGroupCount(simletId, false, searchString, sandbox, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({count} , "Group count retrieved for simlet ID");
    res.json({count});
  } catch (err) {
    next(err);
  }
}

/**
 * Gets the count of participants across all groups in a simlet or within a specific group.
 * 
 * @async
 * @function getSimletGroupParticipantsCount
 * @param {AuthenticatedRequest} req - Express request object with simlet_id and optionally group_id in URL parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // GET /simlets/:simlet_id/groups/participants/count
 * // Returns: { count: 25 }
 * // GET /simlets/:simlet_id/groups/:group_id/participants/count
 * // Returns: { count: 10 }
 */
export async function getSimletGroupParticipantsCount(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const groupId = parseInt(req.params.group_id as string);
    const currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId, groupId} , "Getting participant count for simlet ID and group ID");
    let count;
    if(groupId === undefined || isNaN(groupId)) {
      if (access.is_admin) {
        count = await simletGroupsService.getTotalSimletGroupParticipantsCount(simletId, true);
      } else if (!access.allocated) {
        count = await simletGroupsService.getTotalSimletGroupParticipantsCount(simletId, false, access.currentUserId);
      } else {
        throw new AuthentificationError("Invalid user role");
      }
      logger.debug({count} , "Total participant count retrieved for simlet ID");
      res.json(count);
    } else {
      if (access.is_admin) {
        count = await simletGroupsService.getSimletGroupParticipantsCount(simletId, groupId, true);
      } else if (!access.allocated) {
        count = await simletGroupsService.getSimletGroupParticipantsCount(simletId, groupId, false, access.currentUserId);
      } else {
        throw new AuthentificationError("Invalid user role");
      }
      logger.debug({count} , "Participant count retrieved for simlet ID and group ID");
      res.json({count});
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves a specific group associated with a simlet by group ID.
 * 
 * @async
 * @function getSimletGroupById
 * @param {AuthenticatedRequest} req - Express request object with simlet_id and group_id in URL parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // GET /simlets/:simlet_id/groups/:group_id
 * // Returns: group object
 */
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

/**
 * Creates a new participant and assigns them to a specific group within a simlet.
 * 
 * @async
 * @function createSimletGroupParticipant
 * @param {AuthenticatedRequest} req - Express request object with simlet_id and group_id in URL parameters and participant data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // POST /simlets/:simlet_id/groups/:group_id/participants
 * // Body: { user_id: 789 }
 * // Returns: created participant object
 */
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

/**
 * Adds an existing participant to a specific group within a simlet.
 * 
 * @async
 * @function addSimletGroupParticipant
 * @param {AuthenticatedRequest} req - Express request object with simlet_id, group_id, and participant_id in URL parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // POST /simlets/:simlet_id/groups/:group_id/participants/:participant_id
 * // Returns: updated group object
 */
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

/**
 * Retrieves all participants assigned to a specific group within a simlet.
 * 
 * @async
 * @function getSimletGroupParticipants
 * @param {AuthenticatedRequest} req - Express request object with simlet_id and group_id in URL parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // GET /simlets/:simlet_id/groups/:group_id/participants
 * // Returns: array of participant objects
 */
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

/**
 * Deletes a participant from a specific group within a simlet.
 * 
 * @async
 * @function deleteGroupParticipant
 * @param {AuthenticatedRequest} req - Express request object with simlet_id, group_id, and participant_id in URL parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // DELETE /simlets/:simlet_id/groups/:group_id/participants/:participant_id
 * // Returns: 204 No Content
 */
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

/**
 * Allocates a group or participant to a session within a simlet.
 * 
 * @async
 * @function allocateToSessionSimlet
 * @param {AuthenticatedRequest} req - Express request object with simlet_id, group_id, and session_id in URL parameters and optional participant_id in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // POST /simlets/:simlet_id/groups/:group_id/sessions/:session_id/allocate
 * // Body: { participant_id: 789 }
 * // Returns: 204 No Content
 */
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