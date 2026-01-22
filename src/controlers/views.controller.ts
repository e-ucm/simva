import { Request, Response } from "express";
import { 
  getSimletById,
  getSimletsByUsername,
  getSimletUserPermissions,
  getSessionById,
  getSessionBySimletIdAndUsername,
  getSessionUserPermissions
} from "@/services/views.service";
import { BadRequestError, NotFoundError } from "@/lib/errors/appErrors";
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";

/**
 * Controller for view-based endpoints in SIMVA.
 * Handles requests for database view queries that aggregate data from multiple tables.
 * 
 * View endpoints follow the pattern: /views/<viewname>/<params>
 */

/**
 * Get simlet by ID with complete information.
 * Endpoint: GET /views/simlets/:simlet_id
 * 
 * @async
 * @function getSimletByIdController
 * @param {AuthenticatedRequest} req - Express request object with auth data
 * @param {Response} res - Express response object
 * 
 * @example
 * ```typescript
 * GET /views/simlets/123
 * Response: [{ simlet_id: 123, name: 'My Simlet', ... }]
 * ```
 */
export async function getSimletByIdController(req: AuthenticatedRequest, res: Response) {
  const simlet_id = parseInt(req.params.simlet_id as string);
  
  if (isNaN(simlet_id)) {
    throw new BadRequestError("Invalid simlet_id parameter");
  }

  const simlets = await getSimletById(simlet_id);
  
  if (simlets.length === 0) {
    throw new NotFoundError("Simlet not found");
  }
  
  res.json(simlets);
}

/**
 * Get all simlets for a specific user.
 * Endpoint: GET /views/simlets/user/:username
 * 
 * @async
 * @function getSimletsByUsernameController
 * @param {AuthenticatedRequest} req - Express request object with auth data
 * @param {Response} res - Express response object
 * 
 * @example
 * ```typescript
 * GET /views/simlets/user/john_doe
 * Response: [{ simlet_id: 123, username: 'john_doe', name: 'My Simlet', ... }]
 * ```
 */
export async function getSimletsByUsernameController(req: AuthenticatedRequest, res: Response) {
  const { username } = req.params;
  
  if (!username || (username as string).trim() === '') {
    throw new BadRequestError("Username parameter is required");
  }

  const simlets = await getSimletsByUsername(username as string);
  res.json(simlets);
}

/**
 * Get direct user permissions for a simlet.
 * Endpoint: GET /views/simlets/:simlet_id/permissions
 * 
 * @async
 * @function getSimletUserPermissionsController
 * @param {AuthenticatedRequest} req - Express request object with auth data
 * @param {Response} res - Express response object
 * 
 * @example
 * ```typescript
 * GET /views/simlets/123/permissions
 * Response: [{ user_id: 456, simlet_id: 123, permission: 'READ', ... }]
 * ```
 */
export async function getSimletUserPermissionsController(req: AuthenticatedRequest, res: Response) {
  const simlet_id = parseInt(req.params.simlet_id as string);
  
  if (isNaN(simlet_id)) {
    throw new BadRequestError("Invalid simlet_id parameter");
  }

  const permissions = await getSimletUserPermissions(simlet_id);
  res.json(permissions);
}

/**
 * Get session by ID with complete information.
 * Endpoint: GET /views/sessions/:session_id
 * 
 * @async
 * @function getSessionByIdController
 * @param {AuthenticatedRequest} req - Express request object with auth data
 * @param {Response} res - Express response object
 * 
 * @example
 * ```typescript
 * GET /views/sessions/456
 * Response: [{ session_id: 456, simlet_id: 123, name: 'My Session', ... }]
 * ```
 */
export async function getSessionByIdController(req: AuthenticatedRequest, res: Response) {
  const session_id = parseInt(req.params.session_id as string);
  
  if (isNaN(session_id)) {
    throw new BadRequestError("Invalid session_id parameter");
  }

  const sessions = await getSessionById(session_id);
  
  if (sessions.length === 0) {
    throw new NotFoundError("Session not found");
  }
  
  res.json(sessions);
}

/**
 * Get sessions by simlet ID and username with permission information.
 * Endpoint: GET /views/sessions/simlet/:simlet_id/user/:username
 * 
 * @async
 * @function getSessionBySimletIdAndUsernameController
 * @param {AuthenticatedRequest} req - Express request object with auth data
 * @param {Response} res - Express response object
 * 
 * @example
 * ```typescript
 * GET /views/sessions/simlet/123/user/john_doe
 * Response: [{ session_id: 456, simlet_id: 123, username: 'john_doe', ... }]
 * ```
 */
export async function getSessionBySimletIdAndUsernameController(req: AuthenticatedRequest, res: Response) {
  const simlet_id = parseInt(req.params.simlet_id as string);
  const { username } = req.params;
  
  if (isNaN(simlet_id)) {
    throw new BadRequestError("Invalid simlet_id parameter");
  }
  
  if (!username || (username as string).trim() === '') {
    throw new BadRequestError("Username parameter is required");
  }

  const sessions = await getSessionBySimletIdAndUsername(simlet_id, username as string);
  res.json(sessions);
}

/**
 * Get direct user permissions for a session.
 * Endpoint: GET /views/sessions/:session_id/permissions
 * 
 * @async
 * @function getSessionUserPermissionsController
 * @param {AuthenticatedRequest} req - Express request object with auth data
 * @param {Response} res - Express response object
 * 
 * @example
 * ```typescript
 * GET /views/sessions/456/permissions
 * Response: [{ user_id: 789, session_id: 456, permission: 'WRITE', ... }]
 * ```
 */
export async function getSessionUserPermissionsController(req: AuthenticatedRequest, res: Response) {
  const session_id = parseInt(Array.isArray(req.params.session_id) ? req.params.session_id[0] : req.params.session_id);
  
  if (isNaN(session_id)) {
    throw new BadRequestError("Invalid session_id parameter");
  }

  const permissions = await getSessionUserPermissions(session_id);
  res.json(permissions);
}