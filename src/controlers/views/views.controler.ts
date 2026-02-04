import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { Response, NextFunction } from "express";
import {
  getSimletsByUsername,
  getSimletUserPermissions,
  getSessionById,
  getSessionBySimletIdAndUsername,
  getSessionUserPermissions,
  CompleteSession,
  CompleteSimlet
} from "@/services/views/views.service";
import { BadRequestError, NotFoundError } from "@/lib/errors/appErrors";

/**
 * Get all simlets for a specific user.
 * Endpoint: GET /views/simlets?user=:username
 * 
 * @async
 * @function getSimletsByUsernameController
 * @param {AuthenticatedRequest} req - Express request object with auth data
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * 
 * @example
 * ```typescript
 * GET /views/simlets?user=john_doe
 * Response: [{ simlet_id: 123, username: 'john_doe', name: 'My Simlet', ... }]
 * ```
 */
export async function getSimletsByUsernameController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const currentUser = req.user?.sql;
    let simlets: CompleteSimlet[] = []; 
    switch(currentUser?.role) {
      case 'admin':
        const { user: username } = req.query;
        
        if (!username || (username as string).trim() === '') {
          throw new BadRequestError("Username parameter is required");
        }

        simlets = await getSimletsByUsername(username as string);
        res.json(simlets);
        break;
      case 'teacher':
      case 'student':
        if(currentUser?.username === undefined) {
          throw new BadRequestError("Current user username is undefined");
        }
        if(req.query.user && req.query.user !== currentUser.username) {
          throw new BadRequestError("Insufficient permissions to access other user's simlets");
        }
        req.query.user = currentUser.username;

        break;
      default:
        throw new BadRequestError("Invalid user role");
    }
    let username = req.query.user as string | undefined;
    simlets = await getSimletsByUsername(username as string);
    res.json(simlets);
  } catch (err) {
    next(err);
  }
}

/**
 * Get direct user permissions for a simlet.
 * Endpoint: GET /views/simlets/:simlet_id/permissions
 * 
 * @async
 * @function getSimletUserPermissionsController
 * @param {AuthenticatedRequest} req - Express request object with auth data
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * 
 * @example
 * ```typescript
 * GET /views/simlets/123/permissions
 * Response: [{ user_id: 456, simlet_id: 123, permission: 'READ', ... }]
 * ```
 */
export async function getSimletUserPermissionsController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    switch(req.user?.sql.role) {
      case 'admin':
        break;
      case 'teacher':
      case 'student':
        throw new BadRequestError("Insufficient permissions to access simlet permissions");
      default:
        throw new BadRequestError("Invalid user role");
    }
    const simlet_id = parseInt(req.params.simlet_id as string);

    if (isNaN(simlet_id)) {
      throw new BadRequestError("Invalid simlet_id parameter");
    }
    const permissions = await getSimletUserPermissions(simlet_id);
    res.json(permissions);
  } catch (err) {
    next(err);
  }
}

/**
 * Get session by ID with complete information.
 * Endpoint: GET /views/sessions/:session_id
 * 
 * @async
 * @function getSessionByIdController
 * @param {AuthenticatedRequest} req - Express request object with auth data
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 *  
 * @example
 * ```typescript
 * GET /views/sessions/456
 * Response: [{ session_id: 456, simlet_id: 123, name: 'My Session', ... }]
 * ```
 */
export async function getSessionByIdController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const currentUser = req.user?.sql;
    const simlet_id = parseInt(req.params.simlet_id as string);
    const session_id = parseInt(req.params.session_id as string);
    let sessions: CompleteSession[] = [];
    switch(currentUser?.role) {
      case 'admin':
        break;
      case 'teacher':
      case 'student':
        if(currentUser?.username === undefined) {
          throw new BadRequestError("Current user username is undefined");
        }
        if(req.query.user && req.query.user !== currentUser.username) {
          throw new BadRequestError("Insufficient permissions to access other user's sessions");
        }
        req.query.user = currentUser.username;
        break;
      default:
        throw new BadRequestError("Invalid user role");
    }
    const { user: username } = req.query;

    if (!username || (username as string).trim() === '') {
      throw new BadRequestError("Username parameter is required");
    }

    sessions = await getSessionById(username as string, simlet_id, session_id);
    res.json(sessions);
  } catch (err) {
    next(err);
  }
}

/**
 * Get sessions by simlet ID and username with permission information.
 * Endpoint: GET /views/sessions/simlet/:simlet_id/user/:username
 * 
 * @async
 * @function getSessionBySimletIdAndUsernameController
 * @param {AuthenticatedRequest} req - Express request object with auth data
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * 
 * @example
 * ```typescript
 * GET /views/sessions/simlet/123?user=john_doe
 * Response: [{ session_id: 456, simlet_id: 123, username: 'john_doe', ... }]
 * ```
 */
export async function getSessionBySimletIdAndUsernameController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const currentUser = req.user?.sql;
    switch(currentUser?.role) {
      case 'admin':
        break;
      case 'teacher':
      case 'student':
        if(currentUser?.username === undefined) {
          throw new BadRequestError("Current user username is undefined");
        }
        if(req.query.user && req.query.user !== currentUser.username) {
          throw new BadRequestError("Insufficient permissions to access other user's sessions");
        }
        req.query.user = currentUser.username;
        break;
      default:
        throw new BadRequestError("Invalid user role");
    }
    const simlet_id = parseInt(req.params.simlet_id as string);
    const { user: username } = req.query;
    
    if (isNaN(simlet_id)) {
      throw new BadRequestError("Invalid simlet_id parameter");
    }
    
    if (!username || (username as string).trim() === '') {
      throw new BadRequestError("Username parameter is required");
    }

    const sessions = await getSessionBySimletIdAndUsername(username as string, simlet_id);
    res.json(sessions);
  } catch (err) {
    next(err);
  }
}

/**
 * Get direct user permissions for a session.
 * Endpoint: GET /views/sessions/:session_id/permissions
 * 
 * @async
 * @function getSessionUserPermissionsController
 * @param {AuthenticatedRequest} req - Express request object with auth data
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * 
 * @example
 * ```typescript
 * GET /views/sessions/456/permissions
 * Response: [{ user_id: 789, session_id: 456, permission: 'WRITE', ... }]
 * ```
 */
export async function getSessionUserPermissionsController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const session_id = parseInt(String(req.params.session_id));
  
    if (isNaN(session_id)) {
      throw new BadRequestError("Invalid session_id parameter");
    }

    const permissions = await getSessionUserPermissions(session_id);
    res.json(permissions);
  } catch (err) {
    next(err);
  }
}