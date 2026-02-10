import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { Response, NextFunction } from "express";
import * as allocatorTypesservice from "@/services/allocators/allocatorsTypes.service";
import { NotFoundError, AuthentificationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";

/**
 * Retrieves allocator types from the database.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Express request object with optional username query parameter
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes errors to next middleware
 * 
 * @example
 * // GET /allocatortypes
 * // Returns all allocator types
 * 
 * @example
* // GET /allocatortypes?type=random
 * // Returns allocator type with type 'random'
 */
export async function getAllocatorTypes(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let currentUser = req.user?.sql;
    switch(currentUser?.role) {
      case 'admin':
        if(req.query.type) {
          const allocatorType = await allocatorTypesservice.getAllocatorTypes();
          if (!allocatorType) {
            throw new NotFoundError("Allocator type not found");
          }
          logger.info({allocatorType});
          res.json(allocatorType);
        } else {
          const allocatorTypes = await allocatorTypesservice.getAllocatorTypes();
          logger.info({allocatorTypes});
          res.json(allocatorTypes);
        }
      case 'teacher':
      case 'student':
        if(currentUser.user_id) {
          const allocatorTypes = await allocatorTypesservice.getAllocatorTypes();
          logger.info({allocatorTypes});
          res.json(allocatorTypes);
        }
        break;
      default:
        throw new AuthentificationError("Insufficient permissions to access allocator types data");
    }
  } catch (err) {
    next(err);
  }
}