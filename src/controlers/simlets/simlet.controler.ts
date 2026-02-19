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
        res.json(simlets.map(s => s.toJSON()));
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
        res.json(simlet.toJSON());
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
    res.status(201).json(simlet.toJSON());
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
    const allocator = await simletService.updateSimletAllocator(simletId, currentUser!.user_id as number, body);
    res.json(allocator.toJSON());
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
    res.json(participants.map(p => p.toJSON()));
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
    res.json(groups.map(g => g.toJSON()));
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
    res.json(sessions.map(s => s.toJSON()));
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
    res.json(session.toJSON());
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
    res.json(activities.map(a => a.toJSON()));
  } catch (err) {
    next(err);
  }
}

export async function createSimletSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    let body = req.body;
    let currentUser = req.user?.sql;
    logger.debug({simletId, userId: currentUser?.user_id, body} , "Creating session for simlet ID and user ID");
    const session = await simletService.createSimletSession(simletId, currentUser!.user_id as number, body);
    logger.debug({session} , "Session created for simlet ID and user ID");
    res.json(session.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function createSessionActivity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    let body = req.body;
    let currentUser = req.user?.sql;
    logger.debug({sessionId, userId: currentUser?.user_id, body} , "Adding activities for session ID and user ID");
    const activity = await simletService.addSessionActivities(simletId, sessionId, currentUser!.user_id as number, body);
    logger.debug({activity} , "Activity added for session ID and user ID");
    res.json(activity.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function patchSimletSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    let body = req.body;
    let currentUser = req.user?.sql;
    logger.debug({sessionId, userId: currentUser?.user_id, body} , "Patching session for simlet ID and user ID");
    const session = await simletService.patchSimletSession(simletId, sessionId, currentUser!.user_id as number, body);
    logger.debug({session} , "Session patched for simlet ID and user ID");
    res.json(session.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function deleteSimletSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    let currentUser = req.user?.sql;
    logger.debug({sessionId, userId: currentUser?.user_id} , "Deleting session for simlet ID and user ID");
    await simletService.deleteSimletSession(simletId, sessionId, currentUser!.user_id as number);
    logger.debug({sessionId, userId: currentUser?.user_id} , "Session deleted for simlet ID and user ID");
    res.status(204).send();
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
    logger.debug({simletId, userId: currentUser?.user_id} , "Getting schedule for simlet ID and user ID");
    const schedule = await simletService.getSimletSchedule(simletId, currentUser!.user_id as number);
    logger.debug({schedule} , "Schedule retrieved for simlet ID and user ID");
    res.json(schedule.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function getSimletPermissions (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    let currentUser = req.user?.sql;
    logger.debug({simletId, userId: currentUser?.user_id} , "Getting permissions for simlet ID and user ID");
    const permissions = await simletService.getSimletPermissions(simletId, currentUser!.user_id as number);
    logger.debug({permissions} , "Permissions retrieved for simlet ID and user ID");
    res.json(permissions.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function createSimletPermissions (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    let body = req.body
    let currentUser = req.user?.sql;
    logger.debug({simletId, userId: currentUser?.user_id, body} , "Creating permissions for simlet ID and user ID");
    const permissions = await simletService.createSimletPermissions(simletId, currentUser!.user_id as number, body);
    logger.debug({permissions} , "Permissions created for simlet ID and user ID");
    res.json(permissions.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function getSimletPermissionsForUser (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const userId = parseInt(req.params.user_id as string);
    let currentUser = req.user?.sql;
    logger.debug({simletId, userId: currentUser?.user_id} , "Getting permissions for simlet ID and user ID");
    const permissions = await simletService.getSimletPermissionsForUser(simletId, userId, currentUser!.user_id as number);
    logger.debug({permissions} , "Permissions retrieved for simlet ID and user ID");
    res.json(permissions.toJSON());
  }
    catch (err) {
    next(err);
  }
}

export async function patchSimletPermissionsForUser (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const userId = parseInt(req.params.user_id as string);
    let body = req.body
    let currentUser = req.user?.sql;
    logger.debug({simletId, userId: currentUser?.user_id, body} , "Patching permissions for simlet ID and user ID");
    const permissions = await simletService.patchSimletPermissionsForUser(simletId, userId, currentUser!.user_id as number, body);
    logger.debug({permissions} , "Permissions patched for simlet ID and user ID");
    res.json(permissions.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function deleteSimletPermissionsForUser (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const userId = parseInt(req.params.user_id as string);
    let currentUser = req.user?.sql;
    logger.debug({simletId, userId: currentUser?.user_id} , "Deleting permissions for simlet ID and user ID");
    await simletService.deleteSimletPermissionsForUser(simletId, userId, currentUser!.user_id as number);
    logger.debug({simletId, userId: currentUser?.user_id} , "Permissions deleted for simlet ID and user ID");
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getSessionPermissions (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    let currentUser = req.user?.sql;
    logger.debug({simletId, sessionId, userId: currentUser?.user_id} , "Getting permissions for session ID and user ID");
    const permissions = await simletService.getSessionPermissions(simletId, sessionId, currentUser!.user_id as number);
    logger.debug({permissions} , "Permissions retrieved for session ID and user ID");
    res.json(permissions.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function createSessionPermissions (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    let body = req.body
    let currentUser = req.user?.sql;
    logger.debug({simletId, sessionId, userId: currentUser?.user_id, body} , "Creating permissions for session ID and user ID");
    const permissions = await simletService.createSessionPermissions(simletId, sessionId, currentUser!.user_id as number, body);
    logger.debug({permissions} , "Permissions created for session ID and user ID");
    res.json(permissions.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function getSessionPermissionsForUser (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    const userId = parseInt(req.params.user_id as string);
    let currentUser = req.user?.sql;
    logger.debug({simletId, sessionId, userId: currentUser?.user_id} , "Getting permissions for session ID and user ID");
    const permissions = await simletService.getSessionPermissionsForUser(simletId, sessionId, userId, currentUser!.user_id as number);
    logger.debug({permissions} , "Permissions retrieved for session ID and user ID");
    res.json(permissions.toJSON());
  }
    catch (err) {
    next(err);
  }
}

export async function patchSessionPermissionsForUser (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    const userId = parseInt(req.params.user_id as string);
    let body = req.body
    let currentUser = req.user?.sql;
    logger.debug({simletId, sessionId, userId: currentUser?.user_id, body} , "Patching permissions for session ID and user ID");
    const permissions = await simletService.patchSessionPermissionsForUser(simletId, sessionId, userId, currentUser!.user_id as number, body);
    logger.debug({permissions} , "Permissions patched for session ID and user ID");
    res.json(permissions.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function deleteSessionPermissionsForUser (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    const userId = parseInt(req.params.user_id as string);
    let currentUser = req.user?.sql;
    logger.debug({simletId, sessionId, userId: currentUser?.user_id} , "Deleting permissions for session ID and user ID");
    await simletService.deleteSessionPermissionsForUser(simletId, sessionId, userId, currentUser!.user_id as number);
    logger.debug({simletId, sessionId, userId: currentUser?.user_id} , "Permissions deleted for session ID and user ID");
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}