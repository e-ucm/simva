/**
 * @fileoverview Controller for allocator types metadata operations.
 * Handles HTTP requests and responses for retrieving available allocator types.
 * 
 * Allocator types provide metadata about different participant assignment strategies
 * available in the system (random, group, session, etc.).
 * 
 * @module controllers/allocatorTypes/allocatorTypes
 * @requires @/services/allocators/allocatorsTypes.service
 * @requires @/middlewares/auth.middleware
 * @requires express
 */

import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { Response, NextFunction } from "express";
import * as allocatorTypesservice from "@/services/allocators/allocatorsTypes.service";
import { NotFoundError, AuthentificationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";

/**
 * Retrieves all available allocator types with their metadata and utilities.
 * Each allocator type provides configuration options and assignment strategies
 * for distributing participants across experimental conditions.
 * 
 * @async
 * @function getAllocatorTypes
 * @param {AuthenticatedRequest} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes errors to next middleware
 * 
 * @example
 * // GET /allocatortypes
 * // Returns all allocator types with metadata:
 * // [
 * //   { type: "random", name: "Random Allocator", description: "...", utils: {...} },
 * //   { type: "group", name: "Group Allocator", description: "...", utils: {...} },
 * //   { type: "session", name: "Session Allocator", description: "...", utils: {...} }
 * // ]
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
          logger.debug({allocatorType});
          res.json(allocatorType);
        } else {
          const allocatorTypes = await allocatorTypesservice.getAllocatorTypes();
          logger.debug({allocatorTypes});
          res.json(allocatorTypes);
        }
      case 'teacher':
      case 'student':
        if(currentUser.user_id) {
          const allocatorTypes = await allocatorTypesservice.getAllocatorTypes();
          logger.debug({allocatorTypes});
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