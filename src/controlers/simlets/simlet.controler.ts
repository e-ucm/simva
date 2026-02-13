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

import { Request, Response, NextFunction } from "express";
import * as simletService from "@/services/simlets/simlet.service";
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { logger } from "@/lib/logger";

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
    let simlets;
    switch(currentUser?.role) {
      case "admin":
      case "teacher":
        simlets = await simletService.getSimletsByUserId(currentUser!.user_id as number, searchString, limit, offset);
        res.json(simlets);
        break;
    }
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
    const searchString = String(req.query.search || '');
    let count;
    switch(currentUser?.role) {
      case "admin":
      case "teacher":
        count = await simletService.getSimletCountByUserId(currentUser!.user_id as number, searchString);
        res.json({ count });
        break;
    }
  } catch (err) {
    next(err);
  }
}


export async function getSimletSessionCount(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const currentUser = req.user?.sql;
    const searchString = String(req.query.search || '');
    const simlet_id = parseInt(req.params.simlet_id as string);
    let count;
    switch(currentUser?.role) {
      case "admin":
      case "teacher":
        count = await simletService.getSimletSessionCountByUserId(simlet_id, currentUser!.user_id as number, searchString);
        res.json({ count });
        break;
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
    const simlet_id = parseInt(req.params.simlet_id as string);
    let simlet;
    switch(currentUser?.role) {
      case "admin":
      case "teacher":
        // For teachers, we could add additional permission checking here if needed
        simlet = await simletService.getSimletBySimletIdAndUserId(simlet_id, currentUser!.user_id as number);
        logger.debug({simlet} , "getSimletById results");
        res.json(simlet);
        break;
    }
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
    req.body.simlet_coordinator_id = req.user?.sql.user_id;
    const simlet = await simletService.createSimlet(req.body);
    res.status(201).json(simlet);
  } catch (err) {
    next(err);
  }
}

/**
 * Updates an existing simlet by ID.
 * 
 * @async
 * @function patch
 * @param {AuthenticatedRequest} req - Express request object containing simlet ID in params and update data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {NotFoundError} If simlet with the specified ID doesn't exist
 * 
 * @example
 * // PUT /simlets/123
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
    const simlet = await simletService.patch(simletId, currentUser!.user_id as number, req.body);
    res.json(simlet);
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
    await simletService.deleteSimlet(simletId, currentUser!.user_id as number);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getAllocatorFromSimlet(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    logger.debug({simletId} , "Getting allocator for simlet ID");
    let currentUser = req.user?.sql;
    const allocator = await simletService.getAllocatorFromSimlet(simletId, currentUser!.user_id as number);
    res.json(allocator);
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
    logger.debug({simletId} , "Getting participants for simlet ID");
    const participants = await simletService.getSimletParticipants(simletId, currentUser!.user_id as number);
    logger.debug({participants} , "Participants retrieved for simlet ID");
    res.json(participants);
  } catch (err) {
    next(err);
  }
}

export async function getSimletGroups(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    let currentUser = req.user?.sql;
    logger.debug({simletId} , "Getting groups for simlet ID");
    const groups = await simletService.getSimletGroups(simletId, currentUser!.user_id as number);
    logger.debug({groups} , "Groups retrieved for simlet ID");
    res.json(groups);
  } catch (err) {
    next(err);
  }
}

export async function getSimletSessions(
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
    const simletId = parseInt(req.params.simlet_id as string);
    let currentUser = req.user?.sql;
    logger.debug({simletId, userId: currentUser?.user_id} , "Getting sessions for simlet ID and user ID");
    const sessions = await simletService.getSimletSessions(simletId, currentUser!.user_id as number, searchString, limit, offset);
    logger.debug({sessions} , "Sessions retrieved for simlet ID and user ID");
    res.json(sessions);
  } catch (err) {
    next(err);
  }
}

export async function getSimletSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    const userId = req.user?.sql.user_id;
    logger.debug({simletId, sessionId, userId} , "Getting session for simlet ID, session ID and user ID");
    const session = await simletService.getSimletSession(simletId, sessionId, userId!);
    logger.debug({session} , "Session retrieved for simlet ID, session ID and user ID");
    res.json(session);
  } catch (err) {
    next(err);
  }
}

export async function getSessionActivities(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    let currentUser = req.user?.sql;
    logger.debug({sessionId, userId: currentUser?.user_id} , "Getting activities for session ID and user ID");
    const activities = await simletService.getSessionActivities(simletId, sessionId, currentUser!.user_id as number);
    logger.debug({activities} , "Activities retrieved for session ID and user ID");
    res.json(activities);
  } catch (err) {
    next(err);
  }
}