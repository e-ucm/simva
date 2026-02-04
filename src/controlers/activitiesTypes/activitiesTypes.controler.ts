import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { Response, NextFunction } from "express";
import * as activitiesTypesservice from "@/services/activities/activitiesTypes.service";
import { NotFoundError, AuthentificationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";

/**
 * Retrieves users from the database.
 * If a username query parameter is provided, returns a single user by username.
 * Otherwise, returns all users.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Express request object with optional username query parameter
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes errors to next middleware
 * 
 * @example
 * // GET /activitiestypes
 * // Returns all activity types
 * 
 * @example
* // GET /activitiestypes?type=gameplay
 * // Returns activity type with type 'gameplay'
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