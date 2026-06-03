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
import { getAccess } from "@/controlers/users/user.helper";

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
    const access = getAccess(currentUser);
    // Parse query types into an array (supports: ?type=a,b,c or ?type=a&type=b)
    let types: string[] | undefined;
    if (req.query.type) {
      if (Array.isArray(req.query.type)) {
        types = req.query.type.map(t => String(t));
      } else {
        types = String(req.query.type).split(',').map(t => t.trim()).filter(t => t.length > 0);
      }
    }

    if(access.is_admin && types && types.length > 0) {
      const activityType = await activitiesTypesservice.getActivityTypes(types);
      if (!activityType) {
        throw new NotFoundError("Activity type not found");
      }
      return res.json(activityType.map(t => t.toJSON()));
    }

    if(access.currentUserId) {
      const activityTypes = await activitiesTypesservice.getActivityTypes();
      return res.json(activityTypes.map(t => t.toJSON()));
    }

    throw new AuthentificationError("Insufficient permissions to access activity types data");
  } catch (err) {
    next(err);
  }
}