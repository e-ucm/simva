/**
 * @fileoverview Controller for simlet entity operations.
 * Handles HTTP requests and responses for SIMVA simlet management endpoints.
 * 
 * A Simlet (Simulation Learning Environment Template) is the top-level learning container
 * that contains sessions and activities for educational research studies.
 * 
 * @module controllers/simlets/simlet
 * @requires @/services/simlets/simlet.service
 * @requires @/lib/errors/appErrors
 * @requires @/middlewares/auth.middleware
 * @requires express
 */

import { Response, NextFunction } from "express";
import * as simletService from "@/services/simlets/simlet.service";
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { logger } from "@/lib/logger";
import { AuthentificationError } from "@/lib/errors/appErrors";
import { getAccess } from "@/controlers/users/user.helper";

/**
 * Retrieves simlets from the database.
 * Supports pagination via query parameters and optional filtering by coordinator.
 * 
 * @async
 * @function getAllSimlets
 * @param {AuthenticatedRequest} req - Express request object with optional query parameters (limit, offset, coordinator)
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes errors to next middleware
 * 
 * @example
 * // GET /simlets
 * // Returns all simlets
 */
export async function getAllSimlets(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const searchString = String(req.query.search || '');
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    let offset;
    if(limit !== undefined && req.query.offset === undefined) {
        offset = 0;
    } else {
        offset = parseInt(req.query.offset as string)|| undefined;
    }
    const currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    let simlets;
    if (access.is_admin) {
      simlets = await simletService.getAllSimlets(searchString, limit, offset);
      res.json(simlets.map(s => s.toJSON()));
    } else {
      simlets = await simletService.getSimletsByUserId(access.currentUserId, searchString, limit, offset);
      res.json(simlets.map(s => s.toJSON()));
    }
  } catch (err) {
    next(err);
  }
}

export async function getAllSchedulerSimlets(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const searchString = String(req.query.search || '');
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    let offset;
    if(limit !== undefined && req.query.offset === undefined) {
        offset = 0;
    } else {
        offset = parseInt(req.query.offset as string)|| undefined;
    }
    const currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    let simlets = await simletService.getSimletsForStudent(access.currentUserId, searchString, limit, offset);
    res.json(simlets.map(s => s.toJSON()));
  } catch (err) {
    next(err);
  }
}

export async function getSimletCount(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    const searchString = String(req.query.search || '');
    let count;
    if (access.is_admin) {
      count = await simletService.getSimletCountByUserId(searchString);
      res.json({ count });
    } else if (!access.allocated) {
      count = await simletService.getSimletCountByUserId(searchString, access.currentUserId);
      res.json({ count });
    } else {
      throw new AuthentificationError("Invalid user role");
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves a single simlet by ID.
 * 
 * @async
 * @function getSimletById
 * @param {AuthenticatedRequest} req - Express request object containing simlet ID in URL params
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {NotFoundError} If simlet with the specified ID doesn't exist
 * 
 * @example
 * // GET /simlets/123
 * // Returns simlet with ID 123
 */
export async function getSimletById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    const simlet_id = parseInt(req.params.simlet_id as string);
    let simlet;
    if (access.is_admin) {
      simlet = await simletService.getSimletBySimletIdAndUserId(simlet_id, true);
    } else if (!access.allocated) {
      simlet = await simletService.getSimletBySimletIdAndUserId(simlet_id, false, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({simlet} , "getSimletById results");
    res.json(simlet!.toJSON());
  } catch (err) {
    next(err);
  }
}

/**
 * Creates a new simlet in the database.
 * 
 * @async
 * @function createSimlet
 * @param {AuthenticatedRequest} req - Express request object containing simlet data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes validation or database errors to next middleware
 * 
 * @example
 * // POST /simlets
 * // Body: { 
 * //   name: "Mathematics Learning Environment",
 * //   description: "Interactive mathematics simulation",
 * //   allocator_id: 1,
 * //   simlet_coordinator_id: 123
 * // }
 * // Returns: 201 Created with simlet object
 */
export async function createSimlet(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let currentUser = req.user?.sql;
    const currentUserId = currentUser!.user_id!;
    const access = getAccess(currentUser);
    let simlet;
    if (access.is_admin) {
      simlet = await simletService.createSimlet(req.body, true, currentUserId);
    } else if (!access.allocated) {
      simlet = await simletService.createSimlet(req.body, false, currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    res.status(201).json(simlet.toJSON());
  } catch (err) {
    next(err);
  }
}

/**
 * Updates an existing simlet by ID.
 * 
 * @async
 * @function patchSimlet
 * @param {AuthenticatedRequest} req - Express request object containing simlet ID in params and update data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {NotFoundError} If simlet with the specified ID doesn't exist
 * 
 * @example
 * // PATCH /simlets/123
 * // Body: { name: "Updated Simlet Name", description: "Updated description" }
 * // Returns: 200 OK with updated simlet object
 */
export async function patchSimlet(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    let currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    let simlet;
    if (access.is_admin) {
      simlet = await simletService.patch(simletId, req.body, true);
    } else if (!access.allocated) {
      simlet = await simletService.patch(simletId, req.body, false, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    res.json(simlet.toJSON());
  } catch (err) {
    next(err);
  }
}

/**
 * Deletes a simlet from the database by ID.
 * 
 * @async
 * @function deleteSimlet
 * @param {AuthenticatedRequest} req - Express request object containing simlet ID in URL params
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {NotFoundError} If simlet with the specified ID doesn't exist
 * 
 * @example
 * // DELETE /simlets/123
 * // Returns: 204 No Content
 */
export async function deleteSimlet(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    let currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    if (access.is_admin) {
      await simletService.deleteSimlet(simletId, true);
    } else if (!access.allocated) {
      await simletService.deleteSimlet(simletId, false, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getSimletParticipants(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    let currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId} , "Getting participants for simlet ID");
    let participants;
    if (access.is_admin) {
      participants = await simletService.getSimletParticipants(simletId, true);
    } else if (!access.allocated) {
      participants = await simletService.getSimletParticipants(simletId, false, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({participants} , "Participants retrieved for simlet ID");
    res.json(participants.map(p => p.toJSON()));
  } catch (err) {
    next(err);
  }
}

export async function getSimletSchedule(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    let currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId, userId: currentUser?.user_id} , "Getting schedule for simlet ID and user ID");
    let schedule;
    if (access.is_admin) {
      schedule = await simletService.getSimletSchedule(simletId, true, access.currentUserId);
    } else if (!access.allocated) {
      schedule = await simletService.getSimletSchedule(simletId, false, access.currentUserId);
    } else {
      schedule = await simletService.getSimletSchedule(simletId, false, access.currentUserId);
    }
    logger.debug({schedule} , "Schedule retrieved for simlet ID and user ID");
    res.json(schedule.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function exportSimlet(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId, userId: currentUser?.user_id} , "Exporting simlet for simlet ID and user ID");
    let exportData;
    if (access.is_admin) {
      exportData = await simletService.exportSimlet(simletId, true);
    } else if (!access.allocated) {
      exportData = await simletService.exportSimlet(simletId, false, false, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({exportData} , "Simlet exported for simlet ID and user ID");
    res.json(exportData);
  } catch (err) {
    next(err);
  }
}

export function getTrackerConfig(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const userId = req.user?.sql.user_id!;
    logger.debug({simletId} , "Getting tracker config for simlet ID");
    const trackerConfig = simletService.getTrackerConfigForSimlet(simletId, userId);
    logger.debug({trackerConfig} , "Tracker config retrieved for simlet ID");
    res.json(trackerConfig);
  } catch (err) {
    next(err);
  }
}

