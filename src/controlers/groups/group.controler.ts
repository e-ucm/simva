import { Response, NextFunction } from "express";
import { logger } from "@/lib/logger";
import * as groupService from "@/services/groups/group.service";
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { SimletGroup } from "@/lib/mappers/simletGroup/SimletGroup";
import { AuthentificationError } from "@/lib/errors/appErrors";
/**
 * Retrieves all groups from the database.
 * Supports optional pagination through limit and offset query parameters.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Express request object with optional limit and offset query parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes errors to next middleware
 * 
 * @example
 * // GET /groups
 * // Returns all groups
 * 
 * @example
 * // GET /groups?limit=10&offset=20
 * // Returns 10 groups starting from offset 20
 */
export async function getGroups(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let version = req.query.use_new_generation? Boolean(req.query.use_new_generation) : undefined;
    const searchString = req.query.searchstring as string | undefined;
    const limit = parseInt(req.query.limit as string) || undefined;
    let offset;
    if(limit !== undefined && req.query.offset === undefined) {
        offset = 0;
    } else {
        offset = parseInt(req.query.offset as string)|| undefined;
    }
    logger.debug({version, searchString, limit, offset}, "Getting groups with query parameters");
    let groups: SimletGroup[];
    switch(req.user?.sql.role) {
      case "administrator":
        groups = await groupService.getAdminGroups(version, searchString, limit, offset);
        break;
      case "teacher":    
        groups = await groupService.getGroups(req.user!.sql.user_id as number, version, searchString, limit, offset);
        break;
      default:
        throw new AuthentificationError("Invalid user role");
    }
    res.json(groups.map(g => g.toJSON()));
  } catch (err) {
    next(err);
  }
}