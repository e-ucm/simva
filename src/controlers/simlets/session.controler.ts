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

export async function getSimletSessions(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const searchString = String(req.query.search || '');
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    let offset;
    if(limit !== undefined && req.query.offset === undefined) {
        offset = 0;
    } else {
        offset = parseInt(req.query.offset as string)|| undefined;
    }
    const simletId = parseInt(req.params.simlet_id as string);
    let currentUser = req.user?.sql;
    logger.debug({simletId, userId: currentUser?.user_id} , "Getting sessions for simlet ID and user ID");
    const sessions = await sessionService.getSimletSessions(simletId, currentUser!.user_id as number, searchString, limit, offset);
    logger.debug({sessions} , "Sessions retrieved for simlet ID and user ID");
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
    const searchString = String(req.query.search || '');
    const simlet_id = parseInt(req.params.simlet_id as string);
    let count;
    switch(currentUser?.role) {
      case "admin":
      case "teacher":
        count = await sessionService.getSimletSessionCountByUserId(simlet_id, currentUser!.user_id as number, searchString);
        res.json({ count });
        break;
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
    const userId = req.user?.sql.user_id;
    logger.debug({simletId, sessionId, userId} , "Getting session for simlet ID, session ID and user ID");
    const session = await sessionService.getSimletSession(simletId, sessionId, userId!);
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
    logger.debug({simletId, sessionId, userId: currentUser?.user_id} , "Getting participants for simlet session with simlet ID, session ID and user ID");
    const participants = await sessionService.getSimletSessionParticipants(simletId, sessionId, currentUser!.user_id as number);
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
    let activate = Boolean(req.body.activate);
    let currentUser = req.user?.sql;
    logger.debug({simletId, userId: currentUser?.user_id, activate} , "Activare/desactivate session for simlet ID and user ID");
    const session = await sessionService.activateSession(simletId, sessionId, currentUser!.user_id as number, activate);
    logger.debug({session} , "Session created for simlet ID and user ID");
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
    logger.debug({simletId, userId: currentUser?.user_id, body} , "Creating session for simlet ID and user ID");
    const session = await sessionService.createSimletSession(simletId, currentUser!.user_id as number, body);
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
    logger.debug({sessionId, userId: currentUser?.user_id, body} , "Patching session for simlet ID and user ID");
    const session = await sessionService.patchSimletSession(simletId, sessionId, currentUser!.user_id as number, body);
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
    logger.debug({sessionId, userId: currentUser?.user_id} , "Deleting session for simlet ID and user ID");
    await sessionService.deleteSimletSession(simletId, sessionId, currentUser!.user_id as number);
    logger.debug({sessionId, userId: currentUser?.user_id} , "Session deleted for simlet ID and user ID");
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
