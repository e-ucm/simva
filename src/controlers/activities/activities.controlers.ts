/**
 * @fileoverview Controller for activity entity operations.
 * Handles HTTP requests and responses for SIMVA activity management endpoints.
 * 
 * Activities represent individual learning tasks within sessions such as
 * gameplay activities, LimeSurvey questionnaires, or manual activities.
 * 
 * @module controllers/activities/activities
 * @requires @/services/activities/activities.service
 * @requires @/middlewares/auth.middleware
 * @requires express
 */

import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { NextFunction, Response } from "express";
import * as activitiesService from "@/services/activities/activities.service";

/**
 * Retrieves a single activity by its ID.
 * Validates user access permissions before returning activity data.
 * 
 * @async
 * @function getActivity
 * @param {AuthenticatedRequest} req - Express request object with activity ID in params
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {NotFoundError} If activity doesn't exist or user lacks access
 * @throws {ValidationError} If activity ID is invalid
 * 
 * @example
 * // GET /activities/123
 * // Returns activity with ID 123 if user has access
 */
export async function getActivity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    const activity = await activitiesService.getActivity(activityId, currentUser!.user_id as number);
    return res.json(activity);
  } catch (err) {
    next(err);
  }
}