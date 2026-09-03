/**
 * @fileoverview Controller for session operations.
 * Handles HTTP requests and responses for session management within simlets.
 * 
 * @module controllers/simlets/session
 * @requires @/services/simlets/simlet.service
 * @requires @/middlewares/auth.middleware
 * @requires express
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */

import { Response, NextFunction } from "express";
import * as sessionService from "@/services/simlets/session.service";
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { logger } from "@/lib/logger";
import { AuthentificationError } from "@/lib/errors/appErrors";
import { getAccess } from "@/controlers/users/user.helper";
import { splitSearchTags } from "@/controlers/simlets/helpers";


/**
 * Retrieves all sessions associated with a specific simlet.
 * Supports filtering by status, search string, tags, and pagination.
 * 
 * @async
 * @function getSimletSessions
 * @param {AuthenticatedRequest} req - Express request object with simlet_id in URL parameters and optional query parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // GET /simlets/:simlet_id/sessions
 * // Returns array of session objects
 */
export async function getSimletSessions(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const searchString = req.query.searchString ? String(req.query.searchString) : undefined;
    const searchTags = req.query.searchTags ? splitSearchTags(req.query.searchTags) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;
    logger.debug(req.query , "Query parameters for getting simlet sessions");
    const limit = req.query.limit ? (Number.isNaN(Number(req.query.limit)) ? undefined : parseInt(req.query.limit as string)) : undefined;
    let offset;
    if(limit !== undefined && req.query.skip === undefined && Number.isNaN(Number(req.query.skip))) {
        offset = 0;
    } else {
        offset = parseInt(req.query.skip as string);
    }
    const simletId = parseInt(req.params.simlet_id as string);
    const orderBy = req.query.orderBy ? String(req.query.orderBy) : undefined;
    const order = req.query.order ? String(req.query.order) : undefined;
    let currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId, userId: currentUser?.user_id, searchString, searchTags, limit, offset, orderBy, order} , "Getting sessions for simlet ID and user ID");
    let sessions;
    if (access.is_admin) {
      sessions = await sessionService.getSimletSessions(simletId, true, status, searchString, searchTags, limit, offset, orderBy, order);
    } else if (!access.allocated) {
      sessions = await sessionService.getSimletSessions(simletId, false, status, searchString, searchTags, limit, offset, orderBy, order, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({sessions} , "Sessions retrieved for simlet ID and user ID");;
    res.json(sessions.map(s => s.toJSON()));
  } catch (err) {
    next(err);
  }
}

/**
 * Gets the count of sessions associated with a specific simlet.
 * Filters by status, search string, and tags.
 * 
 * @async
 * @function getSimletSessionCount
 * @param {AuthenticatedRequest} req - Express request object with simlet_id in URL parameters and optional query parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // GET /simlets/:simlet_id/sessions/count
 * // Returns: { count: 5 }
 */
export async function getSimletSessionCount(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    const searchString = req.query.searchString ? String(req.query.searchString) : undefined;
    const searchTags = req.query.searchTags ? splitSearchTags(req.query.searchTags) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;
    const simlet_id = parseInt(req.params.simlet_id as string);
    let count;
    if (access.is_admin || !access.allocated) {
      count = await sessionService.getSimletSessionCountByUserId(simlet_id, access.currentUserId, status, searchString, searchTags);
      res.json({ count });
    } else {
      throw new AuthentificationError("Invalid user role");
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves a specific session by ID within a simlet.
 * 
 * @async
 * @function getSimletSession
 * @param {AuthenticatedRequest} req - Express request object with simlet_id and session_id in URL parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // GET /simlets/:simlet_id/sessions/:session_id
 * // Returns: session object
 */
export async function getSimletSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    const currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId, sessionId, userId: currentUser?.user_id} , "Getting session for simlet ID, session ID and user ID");
    let session;
    if (access.is_admin) {
      session = await sessionService.getSimletSession(simletId, sessionId, true);
    } else if (!access.allocated) {
      session = await sessionService.getSimletSession(simletId, sessionId, false, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({session} , "Session retrieved for simlet ID, session ID and user ID");
    res.json(session.toJSON());
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves all participants assigned to a specific session within a simlet.
 * 
 * @async
 * @function getSimletSessionParticipants
 * @param {AuthenticatedRequest} req - Express request object with simlet_id and session_id in URL parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // GET /simlets/:simlet_id/sessions/:session_id/participants
 * // Returns: array of participant objects
 */
export async function getSimletSessionParticipants(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    let currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId, sessionId, userId: currentUser?.user_id} , "Getting participants for simlet session with simlet ID, session ID and user ID");
    let participants;
    if (access.is_admin) {
      participants = await sessionService.getSimletSessionParticipants(simletId, sessionId, true);
    } else if (!access.allocated) {
      participants = await sessionService.getSimletSessionParticipants(simletId, sessionId, false, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({participants} , "Participants retrieved for simlet session with simlet ID, session ID and user ID");
    res.json(participants.map(p => p.toJSON()));
  } catch (err) {
    next(err);
  }
}

/**
 * Activates or deactivates a session within a simlet.
 * 
 * @async
 * @function activateSimletSession
 * @param {AuthenticatedRequest} req - Express request object with simlet_id and session_id in URL parameters and activate flag in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // PATCH /simlets/:simlet_id/sessions/:session_id/activate
 * // Body: { "activate": true }
 * // Returns: updated session object
 */
export async function activateSimletSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    let activate = req.body.activate;
    let currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId, userId: currentUser?.user_id, activate} , "Activare/desactivate session for simlet ID and user ID");
    let session;
    if (access.is_admin) {
      session = await sessionService.activateSession(simletId, sessionId, true, activate);
    } else if (!access.allocated) {
      session = await sessionService.activateSession(simletId, sessionId, false, activate, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({session} , "Session activated for simlet ID and user ID");
    res.json(session.toJSON());
  } catch (err) {
    next(err);
  }
}

/**
 * Creates a new session within a simlet.
 * 
 * @async
 * @function createSimletSession
 * @param {AuthenticatedRequest} req - Express request object with simlet_id in URL parameters and session data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // POST /simlets/:simlet_id/sessions
 * // Body: { "name": "New Session", "description": "Session description" }
 * // Returns: created session object
 */
export async function createSimletSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    let body = req.body;
    let currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId, userId: currentUser?.user_id, body} , "Creating session for simlet ID and user ID");
    let session;
    if (access.is_admin) {
      session = await sessionService.createSimletSession(simletId, true, body);
    } else if (!access.allocated) {
      session = await sessionService.createSimletSession(simletId, false, body, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({session} , "Session created for simlet ID and user ID");
    res.json(session.toJSON());
  } catch (err) {
    next(err);
  }
}


/**
 * Updates an existing session within a simlet.
 * 
 * @async
 * @function patchSimletSession
 * @param {AuthenticatedRequest} req - Express request object with simlet_id and session_id in URL parameters and update data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // PATCH /simlets/:simlet_id/sessions/:session_id
 * // Body: { "name": "Updated Name", "description": "Updated description" }
 * // Returns: updated session object
 */
export async function patchSimletSession(
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
    logger.debug({sessionId, userId: currentUser?.user_id, body} , "Patching session for simlet ID and user ID");
    let session;
    if (access.is_admin) {
      session = await sessionService.patchSimletSession(simletId, sessionId, true, body);
    } else if (!access.allocated) {
      session = await sessionService.patchSimletSession(simletId, sessionId, false, body, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({session} , "Session patched for simlet ID and user ID");
    res.json(session.toJSON());
  } catch (err) {
    next(err);
  }
}

/**
 * Deletes a session from a simlet.
 * 
 * @async
 * @function deleteSimletSession
 * @param {AuthenticatedRequest} req - Express request object with simlet_id and session_id in URL parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // DELETE /simlets/:simlet_id/sessions/:session_id
 * // Returns: 204 No Content
 */
export async function deleteSimletSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    let currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({sessionId, userId: currentUser?.user_id} , "Deleting session for simlet ID and user ID");
    if (access.is_admin) {
      await sessionService.deleteSimletSession(simletId, sessionId, true);
    } else if (!access.allocated) {
      await sessionService.deleteSimletSession(simletId, sessionId, false, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({sessionId, userId: currentUser?.user_id} , "Session deleted for simlet ID and user ID");
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * Adds a tag to a specific session for the current user.
 * 
 * @async
 * @function addTagForUser
 * @param {AuthenticatedRequest} req - Express request object with simlet_id, session_id, and tag_id in URL parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // POST /simlets/:simlet_id/sessions/:session_id/tags/:tag_id
 * // Returns: array of tag objects
 */
export async function addTagForUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    const tag_id = parseInt(req.params.tag_id as string);
    let currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId, sessionId, userId: currentUser?.user_id, tag_id} , "Adding tag for user in session for simlet ID and user ID");
    let tags;
    if (!access.allocated) {
      tags = await sessionService.addTagForUser(simletId, sessionId, access.is_admin, access.currentUserId, tag_id);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({tags} , "Tag added for user in session for simlet ID and user ID");
    res.json(tags.map(t => t.toJSON()));
  } catch (err) {
    next(err);
  }
}

/**
 * Deletes a tag from a specific session for the current user.
 * 
 * @async
 * @function deleteTagForUser
 * @param {AuthenticatedRequest} req - Express request object with simlet_id, session_id, and tag_id in URL parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // DELETE /simlets/:simlet_id/sessions/:session_id/tags/:tag_id
 * // Returns: array of tag objects
 */
export async function deleteTagForUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    const tag_id = parseInt(req.params.tag_id as string);
    let currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId, sessionId, userId: currentUser?.user_id, tag_id} , "Deleting tag for user in session for simlet ID and user ID");
    let tags;
    if (!access.allocated) {
      tags = await sessionService.deleteSimletTagForUser(simletId, sessionId, access.is_admin, access.currentUserId, tag_id);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({tags} , "Tag deleted for user in session for simlet ID and user ID");
    res.json(tags.map(t => t.toJSON()));
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves LRS (Learning Record Store) statements for a specific session.
 * Supports filtering via query parameters.
 * 
 * @async
 * @function getLRSStatementsForSession
 * @param {AuthenticatedRequest} req - Express request object with simlet_id and session_id in URL parameters and optional query filters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes errors to next middleware
 * 
 * @example
 * // GET /simlets/:simlet_id/sessions/:session_id/lrs
 * // Returns: array of xAPI statements
 */
export async function getLRSStatementsForSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    let currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId, sessionId, userId: currentUser?.user_id} , "Getting LRS statements for session with simlet ID, session ID and user ID");
    let statements= await sessionService.getLRSStatements(simletId, sessionId, access.is_admin, access.currentUserId, req.query);
    logger.debug("LRS statements retrieved for session with simlet ID, session ID and user ID");
    res.json(statements);
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves test LRS (Learning Record Store) statements for a specific session.
 * Includes username in query for test-specific filtering.
 * 
 * @async
 * @function getTestLRSStatementsForSession
 * @param {AuthenticatedRequest} req - Express request object with simlet_id and session_id in URL parameters and optional query filters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes errors to next middleware
 * 
 * @example
 * // GET /simlets/:simlet_id/sessions/:session_id/test/lrs
 * // Returns: array of test-specific xAPI statements
 */
export async function getTestLRSStatementsForSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    let currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    logger.debug({simletId, sessionId, userId: currentUser?.user_id} , "Getting LRS statements for session with simlet ID, session ID and user ID");
    let statements= await sessionService.getTestLRSStatements(simletId, sessionId, access.is_admin, access.currentUserId, currentUser?.username!, req.query);
    logger.debug("LRS statements retrieved for session with simlet ID, session ID and user ID");
    res.json(statements);
  } catch (err) {
    next(err);
  }
}

export async function setTesterForSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    let currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    let tester = await sessionService.setTesterForSession(simletId, sessionId, currentUser?.user_id, currentUser?.username, access.allocated, access.is_admin);
    res.json(tester);
  } catch (err) {
    next(err);
  }
}


export async function resetTesterForSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
      try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    let currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    let tester = await sessionService.resetTesterForSession(simletId, sessionId, currentUser?.user_id, currentUser?.username, access.allocated, access.is_admin);
    res.json(tester);
  } catch (err) {
    next(err);
  }
}


export async function deleteTesterForSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const sessionId = parseInt(req.params.session_id as string);
    let currentUser = req.user?.sql;
    const access = getAccess(currentUser);
    let tester = await sessionService.deleteTesterForSession(simletId, sessionId, currentUser?.user_id, currentUser?.username, access.allocated, access.is_admin);
    res.json(tester);
  } catch (err) {
    next(err);
  }
}
