/**
 * @fileoverview Controller for activity types metadata operations.
 * Handles HTTP requests and responses for retrieving available activity types.
 * 
 * Activity types provide metadata about different kinds of learning activities
 * available in the system (gameplay, limesurvey, manual, etc.).
 * 
 * @module controllers/activitiesTypes/activitiesTypes
 * @requires @/services/activities/activitiesTypes.service
 * @requires @/middlewares/auth.middleware
 * @requires express
 */

import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { Response, NextFunction } from "express";
import * as activitiesTypesservice from "@/services/activities/activitiesTypes.service";
import { NotFoundError, AuthentificationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";

/**
 * Retrieves all available activity types with their metadata and utilities.
 * Each activity type provides configuration options and type-specific functionality.
 * 
 * @async
 * @function getActivityTypes
 * @param {AuthenticatedRequest} req - Express request object
 * @param {Response} res - Express response object  
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes errors to next middleware
 * 
 * @example
 * // GET /activitytypes
 * // Returns all activity types with metadata:
 * // [
 * //   { type: "gameplay", name: "Gameplay Activity", description: "...", utils: {...} },
 * //   { type: "limesurvey", name: "LimeSurvey Activity", description: "...", utils: {...} },
 * //   { type: "manual", name: "Manual Activity", description: "...", utils: {...} }
 * // ]
 */
export async function getActivityTypes(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let currentUser = req.user?.sql;
    switch(currentUser?.role) {
      case 'admin':
        if(req.query.type) {
          const activityType = await activitiesTypesservice.getActivityTypes(String(req.query.type));
          if (!activityType) {
            throw new NotFoundError("Activity type not found");
          }
          return res.json(activityType);
        } else {
          const activityTypes = await activitiesTypesservice.getActivityTypes(currentUser?.username || "");
          return res.json(activityTypes);
        }
      case 'teacher':
      case 'student':
        if(currentUser.user_id) {
          const activityTypes = await activitiesTypesservice.getActivityTypes(currentUser?.username || "");
          return res.json(activityTypes);
        }
        break;
      default:
        throw new AuthentificationError("Insufficient permissions to access activity types data");
    }
  } catch (err) {
    next(err);
  }
}