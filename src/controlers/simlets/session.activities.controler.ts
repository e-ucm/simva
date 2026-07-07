/**
 * @fileoverview Controller for session activities operations.
 * Handles HTTP requests and responses for activity management within sessions.
 * 
 * @module controllers/simlets/session.activities
 * @requires @/services/simlets/simlet.service
 * @requires @/middlewares/auth.middleware
 * @requires express
 */

import { Response, NextFunction } from "express";
import * as sessionActivitiesService from "@/services/simlets/session.activities.service";
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { logger } from "@/lib/logger";
import { AuthentificationError } from "@/lib/errors/appErrors";
import { getAccess } from "@/controlers/users/user.helper";

/**
 * Retrieves all activities associated with a specific session in a simlet.
 * 
 * @async
 * @function getSessionActivities
 * @param {AuthenticatedRequest} req - Express request object with simlet_id and session_id in URL parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // GET /simlets/:simlet_id/sessions/:session_id/activities
 * // Returns array of activity objects
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function getSessionActivities(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    let currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    let activities;
    if (access.is_admin) {
      activities = await sessionActivitiesService.getSessionActivities(simletId, sessionId, true);
    } else if (!access.allocated) {
      activities = await sessionActivitiesService.getSessionActivities(simletId, sessionId, false, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    res.json(activities.map(a => a.toJSON()));
  } catch (err) {
    next(err);
  }
}

/**
 * Creates a new activity within a specific session in a simlet.
 * 
 * @async
 * @function createSessionActivity
 * @param {AuthenticatedRequest} req - Express request object with simlet_id and session_id in URL parameters and activity data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // POST /simlets/:simlet_id/sessions/:session_id/activities
 * // Body: { "name": "New Activity", "type": "manual" }
 * // Returns: created activity object
 */

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
    const access = getAccess(currentUser);
    let activity;
    if (access.is_admin) {
      activity = await sessionActivitiesService.addSessionActivities(simletId, sessionId, true, body);
    } else if (!access.allocated) {
      activity = await sessionActivitiesService.addSessionActivities(simletId, sessionId, false, body, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug(activity, "Created new activity for session ID: " + sessionId);
    res.json(activity.toJSON());
  } catch (err) {
    next(err);
  }
}

/**
 * Updates an existing activity within a specific session in a simlet.
 * 
 * @async
 * @function updateSessionActivity
 * @param {AuthenticatedRequest} req - Express request object with simlet_id, session_id, and activity_id in URL parameters and update data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // PUT /simlets/:simlet_id/sessions/:session_id/activities/:activity_id
 * // Body: { "name": "Updated Activity Name" }
 * // Returns: updated activity object
 */
export async function updateSessionActivity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    const activityId = parseInt(req.params.activity_id as string);
    let body = req.body;
    let currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    let activity;
    if (access.is_admin) {
      activity = await sessionActivitiesService.updateSessionActivity(simletId, sessionId, activityId, true, body);
    } else if (!access.allocated) {
      activity = await sessionActivitiesService.updateSessionActivity(simletId, sessionId, activityId, false, body, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    res.json(activity.toJSON());
  } catch (err) {
    next(err);
  }
}


/**
 * Deletes an activity from a specific session in a simlet.
 * 
 * @async
 * @function deleteSessionActivity
 * @param {AuthenticatedRequest} req - Express request object with simlet_id, session_id, and activity_id in URL parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // DELETE /simlets/:simlet_id/sessions/:session_id/activities/:activity_id
 * // Returns: 204 No Content
 */
export async function deleteSessionActivity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    const activityId = parseInt(req.params.activity_id as string);
    let currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    if (access.is_admin) {
      await sessionActivitiesService.deleteSessionActivity(simletId, sessionId, activityId, true, undefined);
    } else if (!access.allocated) {
      await sessionActivitiesService.deleteSessionActivity(simletId, sessionId, activityId, false, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
