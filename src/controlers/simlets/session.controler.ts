/**
 * @fileoverview Controller for session operations.
 * Handles HTTP requests and responses for session management within simlets.
 * 
 * @module controllers/simlets/session
 * @requires @/services/simlets/simlet.service
 * @requires @/middlewares/auth.middleware
 * @requires express
 */

import { Response, NextFunction } from "express";
import * as sessionService from "@/services/simlets/session.service";
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { logger } from "@/lib/logger";
import { AuthentificationError } from "@/lib/errors/appErrors";
import { getAccess } from "@/controlers/users/user.helper";
import { splitSearchTags } from "@/controlers/simlets/helpers";

export async function getSimletSessions(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const searchString = req.query.searchString ? String(req.query.searchString) : undefined;
    const searchTags = req.query.searchTags ? splitSearchTags(req.query.searchTags) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    let offset;
    if(limit !== undefined && req.query.skip === undefined) {
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
      sessions = await sessionService.getSimletSessions(simletId, true, searchString, searchTags, limit, offset, orderBy, order);
    } else if (!access.allocated) {
      sessions = await sessionService.getSimletSessions(simletId, false, searchString, searchTags, limit, offset, orderBy, order, access.currentUserId);
    } else {
      throw new AuthentificationError("Invalid user role");
    }
    logger.debug({sessions} , "Sessions retrieved for simlet ID and user ID");;
    res.json(sessions.map(s => s.toJSON()));
  } catch (err) {
    next(err);
  }
}

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
    const simlet_id = parseInt(req.params.simlet_id as string);
    let count;
    if (access.is_admin || !access.allocated) {
      count = await sessionService.getSimletSessionCountByUserId(simlet_id, access.currentUserId, searchString, searchTags);
      res.json({ count });
    } else {
      throw new AuthentificationError("Invalid user role");
    }
  } catch (err) {
    next(err);
  }
}

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