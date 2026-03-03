import { Response, NextFunction } from "express";
import { BadRequestError, ValidationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";
import * as groupService from "@/services/groups/group.service";
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
/**
 * Retrieves all groups from the database.
 * Supports optional pagination through limit and offset query parameters.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Express request object with optional limit and offset query parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes errors to next middleware
 * 
 * @example
 * // GET /groups
 * // Returns all groups
 * 
 * @example
 * // GET /groups?limit=10&offset=20
 * // Returns 10 groups starting from offset 20
 */
export async function getGroups(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let version = req.query.use_new_generation? Boolean(req.query.use_new_generation) : undefined;
    const searchString = req.query.searchstring as string | undefined;
    const limit = parseInt(req.query.limit as string) || undefined;
    let offset;
    if(limit !== undefined && req.query.offset === undefined) {
        offset = 0;
    } else {
        offset = parseInt(req.query.offset as string)|| undefined;
    }
    logger.debug({version, searchString, limit, offset}, "Getting groups with query parameters");
    const groups = await groupService.getGroups(req.user!.sql.user_id as number, version, searchString, limit, offset);
    res.json(groups.map(g => g.toJSON()));
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves a single group by its ID.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Express request object with group ID in params
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {NotFoundError} If group with the specified ID doesn't exist
 * @throws {BadRequestError} If group ID is invalid
 * 
 * @example
 * // GET /groups/123
 * // Returns group with ID 123
 */
export async function getGroupById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const groupId = parseInt(req.params.id as string);
    if (isNaN(groupId) || groupId <= 0) {
      throw new BadRequestError("Invalid group ID");
    }

    const group = await groupService.getGroup(groupId, req.user!.sql.user_id as number);
    res.json(group.toJSON());
  } catch (err) {
    next(err);
  }
}

/**
 * Creates a new group in the database.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Express request object with group data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {ValidationError} If required fields are missing or invalid
 * 
 * @example
 * // POST /groups
 * // Body: { "name": "Study Group A", "use_new_generation": true, "group_owner_id": 1 }
 * // Creates a new group
 */
export async function createGroup(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const currentUser = req.user?.sql;
    const useNewGeneration = Boolean(req.query.use_new_generation) || true;
    const group = await groupService.createGroup(req.body, useNewGeneration, currentUser?.user_id!);
    res.status(201).json(group.toJSON());
  } catch (err) {
    next(err);
  }
}

/**
 * Updates an existing group by its ID.
 * 
 * @async
 * @param {Request} req - Express request object with group ID in params and update data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {NotFoundError} If group with the specified ID doesn't exist
 * @throws {BadRequestError} If group ID is invalid
 * 
 * @example
 * // PUT /groups/123
 * // Body: { "name": "Updated Group Name" }
 * // Updates group with ID 123
 */
export async function updateGroup(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const currentUser = req.user?.sql;
    const groupId = parseInt(req.params.id as string);
    if (isNaN(groupId) || groupId <= 0) {
      throw new BadRequestError("Invalid group ID");
    }
    const group = await groupService.updateGroup(groupId, currentUser!.user_id as number, req.body);
    res.json(group.toJSON());
  } catch (err) {
    next(err);
  }
}

/**
 * Deletes a group by its ID.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Express request object with group ID in params
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {NotFoundError} If group with the specified ID doesn't exist
 * @throws {BadRequestError} If group ID is invalid
 * 
 * @example
 * // DELETE /groups/123
 * // Deletes group with ID 123
 */
export async function deleteGroup(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const groupId = parseInt(req.params.id as string);
    if (isNaN(groupId) || groupId <= 0) {
      throw new BadRequestError("Invalid group ID");
    }
    const currentUser = req.user?.sql;
    await groupService.deleteGroup(groupId, currentUser!.user_id as number);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getGroupParticipants(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const groupId = parseInt(req.params.id as string);
    if (isNaN(groupId) || groupId <= 0) {
      throw new BadRequestError("Invalid group ID");
    }
    let currentUser = req.user?.sql;
    const participants = await groupService.getGroupParticipants(groupId, currentUser!.user_id as number);
    res.json(participants.map(p => p.toJSON()));
  } catch (err) {
    next(err);
  } 
}

export async function getGroupCount(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let currentUser = req.user?.sql;
    const searchString = String(req.query.search || '');
    const count = await groupService.getGroupCount(currentUser!.user_id as number, searchString);
    res.json({ count });
  } catch (err) {
    next(err);
  }
}

export async function createGroupParticipant(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const groupId = parseInt(req.params.id as string);
    if (isNaN(groupId) || groupId <= 0) {
      throw new BadRequestError("Invalid group ID");
    }
    let currentUser = req.user?.sql;
    let currentUserId = currentUser!.user_id as unknown as string;
    logger.info(req.body, "Creating group participant with request body for group ID " + groupId + " and current user ID " + currentUserId);
    const participant = await groupService.createGroupParticipant(groupId, parseInt(currentUserId), req.body);
    res.status(201).json(participant.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function deleteGroupParticipant(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const groupId = parseInt(req.params.id as string);
    if (isNaN(groupId) || groupId <= 0) {
      throw new BadRequestError("Invalid group ID");
    }
    let currentUser = req.user?.sql;
    let participantId = parseInt(req.params.participant_id as string);
    if (isNaN(participantId) || participantId <= 0) {
      throw new BadRequestError("Invalid participant ID");
    }
    const keycloakDelete = req.query.keycloakDelete || false;
    await groupService.deleteGroupParticipant(groupId, participantId, currentUser!.user_id as number, keycloakDelete as boolean);
    res.status(201).json({ message: "Participant deleted successfully" });
  } catch (err) {
    next(err);
  }
}


export async function getGroupPermissions (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const groupId = parseInt(req.params.group_id as string);
    let currentUser = req.user?.sql;
    logger.debug({groupId, userId: currentUser?.user_id} , "Getting permissions for group ID and user ID");
    const permissions = await groupService.getGroupPermissions(groupId, currentUser!.user_id as number);
    logger.debug({permissions} , "Permissions retrieved for group ID and user ID");
    res.json(permissions.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function createGroupPermissions (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const groupId = parseInt(req.params.group_id as string);
    let body = req.body
    let currentUser = req.user?.sql;
    logger.debug({groupId, userId: currentUser?.user_id, body} , "Creating permissions for group ID and user ID");
    const permissions = await groupService.createGroupPermissions(groupId, currentUser!.user_id as number, body);
    logger.debug({permissions} , "Permissions created for group ID and user ID");
    res.json(permissions.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function getGroupPermissionsForUser (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const groupId = parseInt(req.params.group_id as string);
    const userId = parseInt(req.params.user_id as string);
    let currentUser = req.user?.sql;
    logger.debug({groupId, userId: currentUser?.user_id} , "Getting permissions for group ID and user ID");
    const permissions = await groupService.getGroupPermissionsForUser(groupId, userId, currentUser!.user_id as number);
    logger.debug({permissions} , "Permissions retrieved for group ID and user ID");
    res.json(permissions.toJSON());
  }
    catch (err) {
    next(err);
  }
}

export async function patchGroupPermissionsForUser (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const groupId = parseInt(req.params.group_id as string);
    const userId = parseInt(req.params.user_id as string);
    let body = req.body
    let currentUser = req.user?.sql;
    logger.debug({groupId, userId: currentUser?.user_id, body} , "Patching permissions for group ID and user ID");
    const permissions = await groupService.patchGroupPermissionsForUser(groupId, userId, currentUser!.user_id as number, body);
    logger.debug({permissions} , "Permissions patched for group ID and user ID");
    res.json(permissions.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function deleteGroupPermissionsForUser (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const groupId = parseInt(req.params.group_id as string);
    const userId = parseInt(req.params.user_id as string);
    let currentUser = req.user?.sql;
    logger.debug({groupId, userId: currentUser?.user_id} , "Deleting permissions for group ID and user ID");
    await groupService.deleteGroupPermissionsForUser(groupId, userId, currentUser!.user_id as number);
    logger.debug({groupId, userId: currentUser?.user_id} , "Permissions deleted for group ID and user ID");
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}