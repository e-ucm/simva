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
 * @route /simlets/:simlet_id/sessions/:session_id/activities
 * @method GET
 * @description Get activities for a session in a simlet
 * @access Protected (requires authentication)
 * 
 * @param {AuthenticatedRequest} req - Express request object containing simlet_id and session_id in URL params and authenticated user info
 * @param {Response} res - Express response object for sending the list of activities
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>} - Returns a promise that resolves when the response is sent
 * @throws {Error} - Passes any errors to the next middleware for handling
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
    logger.debug({sessionId, userId: currentUser?.user_id} , "Getting activities for session ID and user ID");
    let activities;
    if (access.is_admin) {
      activities = await sessionActivitiesService.getSessionActivities(simletId, sessionId, true);
    } else if (!access.allocated) {
      activities = await sessionActivitiesService.getSessionActivities(simletId, sessionId, false, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({activities} , "Activities retrieved for session ID and user ID");
    res.json(activities.map(a => a.toJSON()));
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
    const access = getAccess(currentUser);
    logger.debug({sessionId, userId: currentUser?.user_id, body} , "Adding activities for session ID and user ID");
    let activity;
    if (access.is_admin) {
      activity = await sessionActivitiesService.addSessionActivities(simletId, sessionId, true, body);
    } else if (!access.allocated) {
      activity = await sessionActivitiesService.addSessionActivities(simletId, sessionId, false, body, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({activity} , "Activity added for session ID and user ID");
    res.json(activity.toJSON());
  } catch (err) {
    next(err);
  }
}

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
    logger.debug({simletId, sessionId, activityId, userId: currentUser?.user_id, body} , "Updating activity for session");
    let activity;
    if (access.is_admin) {
      activity = await sessionActivitiesService.updateSessionActivity(simletId, sessionId, activityId, true, body);
    } else if (!access.allocated) {
      activity = await sessionActivitiesService.updateSessionActivity(simletId, sessionId, activityId, false, body, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({activity} , "Activity updated");
    res.json(activity.toJSON());
  } catch (err) {
    next(err);
  }
}

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
    logger.debug({simletId, sessionId, activityId, userId: currentUser?.user_id} , "Deleting activity from session");
    if (access.is_admin) {
      await sessionActivitiesService.deleteSessionActivity(simletId, sessionId, activityId, true, undefined);
    } else if (!access.allocated) {
      await sessionActivitiesService.deleteSessionActivity(simletId, sessionId, activityId, false, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({activityId} , "Activity deleted");
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
