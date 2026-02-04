import { Request, Response, NextFunction } from "express";
import * as groupParticipantsService from "@/services/groups/groupParticipants.service";
import { NotFoundError, ValidationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";

/**
 * Retrieves all participants for a specific group.
 * 
 * @async
 * @param {Request} req - Express request object with group ID in params
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {ValidationError} If group ID is invalid
 * 
 * @example
 * // GET /group-participants/group/123
 * // Returns all participants in group 123
 */
export async function getGroupParticipants(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const groupId = parseInt(req.params.groupId as string);
    if (isNaN(groupId) || groupId <= 0) {
      throw new ValidationError("Invalid group ID");
    }

    const participants = await groupParticipantsService.getGroupParticipants(groupId);
    res.json(participants);
  } catch (err) {
    next(err);
  }
}

/**
 * Adds a participant to a group.
 * 
 * @async
 * @param {Request} req - Express request object with group ID and participant ID in params
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {ValidationError} If group ID or participant ID is invalid
 * 
 * @example
 * // POST /group-participants/group/123/participant/456
 * // Adds participant 456 to group 123
 */
export async function addParticipantToGroup(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const groupId = parseInt(req.params.groupId as string);
    const participantId = parseInt(req.params.participantId as string);

    if (isNaN(groupId) || groupId <= 0) {
      throw new ValidationError("Invalid group ID");
    }
    if (isNaN(participantId) || participantId <= 0) {
      throw new ValidationError("Invalid participant ID");
    }

    const groupParticipant = await groupParticipantsService.addParticipantToGroup(groupId, participantId);
    res.status(201).json(groupParticipant);
  } catch (err) {
    next(err);
  }
}

/**
 * Removes a participant from a group.
 * 
 * @async
 * @param {Request} req - Express request object with group ID and participant ID in params
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {ValidationError} If group ID or participant ID is invalid
 * @throws {NotFoundError} If the relationship doesn't exist
 * 
 * @example
 * // DELETE /group-participants/group/123/participant/456
 * // Removes participant 456 from group 123
 */
export async function removeParticipantFromGroup(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const groupId = parseInt(req.params.groupId as string);
    const participantId = parseInt(req.params.participantId as string);

    if (isNaN(groupId) || groupId <= 0) {
      throw new ValidationError("Invalid group ID");
    }
    if (isNaN(participantId) || participantId <= 0) {
      throw new ValidationError("Invalid participant ID");
    }

    await groupParticipantsService.removeParticipantFromGroup(groupId, participantId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves all groups for a specific participant.
 * 
 * @async
 * @param {Request} req - Express request object with participant ID in params
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {ValidationError} If participant ID is invalid
 * 
 * @example
 * // GET /group-participants/participant/456
 * // Returns all groups for participant 456
 */
export async function getParticipantGroups(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const participantId = parseInt(req.params.participantId as string);
    if (isNaN(participantId) || participantId <= 0) {
      throw new ValidationError("Invalid participant ID");
    }

    const groups = await groupParticipantsService.getParticipantGroups(participantId);
    res.json(groups);
  } catch (err) {
    next(err);
  }
}

/**
 * Checks if a participant is in a specific group.
 * 
 * @async
 * @param {Request} req - Express request object with group ID and participant ID in params
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {ValidationError} If group ID or participant ID is invalid
 * 
 * @example
 * // GET /group-participants/group/123/participant/456/exists
 * // Returns: { "exists": true }
 */
export async function isParticipantInGroup(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const groupId = parseInt(req.params.groupId as string);
    const participantId = parseInt(req.params.participantId as string);

    if (isNaN(groupId) || groupId <= 0) {
      throw new ValidationError("Invalid group ID");
    }
    if (isNaN(participantId) || participantId <= 0) {
      throw new ValidationError("Invalid participant ID");
    }

    const exists = await groupParticipantsService.isParticipantInGroup(groupId, participantId);
    res.json({ exists });
  } catch (err) {
    next(err);
  }
}

/**
 * Gets the count of participants in a specific group.
 * 
 * @async
 * @param {Request} req - Express request object with group ID in params
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {ValidationError} If group ID is invalid
 * 
 * @example
 * // GET /group-participants/group/123/count
 * // Returns: { "count": 5 }
 */
export async function getGroupParticipantsCount(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const groupId = parseInt(req.params.groupId as string);
    if (isNaN(groupId) || groupId <= 0) {
      throw new ValidationError("Invalid group ID");
    }

    const count = await groupParticipantsService.getGroupParticipantsCount(groupId);
    res.json({ count });
  } catch (err) {
    next(err);
  }
}