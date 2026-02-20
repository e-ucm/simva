/**
 * @fileoverview Controller for activity entity operations.
 * Handles HTTP requests and responses for SIMVA activity management endpoints.
 * 
 * Activities represent individual learning tasks within sessions such as
 * gameplay activities, LimeSurvey questionnaires, or manual activities.
 * 
 * @module controllers/activities/activities
 * @requires @/services/activities/activities.service
 * @requires @/middlewares/auth.middleware
 * @requires express
 */

import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { NextFunction, Response } from "express";
import * as activitiesService from "@/services/activities/activities.service";
import { AuthentificationError, ValidationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";

function mapToParticipantJson<T>(data?: Map<number, T>): Record<string, T> {
  if (!data) {
    return {};
  }
  return Object.fromEntries(data) as Record<string, T>;
}

function parseParticipantsId(participantsIdQuery: unknown): number[] | undefined {
  logger.debug(parseParticipantsId, "Received participants_id query param:");
  if (participantsIdQuery === undefined || participantsIdQuery === null) {
    return undefined;
  }

  const rawValues = Array.isArray(participantsIdQuery)
    ? participantsIdQuery
    : [participantsIdQuery];

  const tokens = rawValues
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (tokens.length === 0) {
    return undefined;
  }

  const participantsId = tokens.map((value) => Number(value));
  if (participantsId.some((value) => !Number.isInteger(value) || value < 0)) {
    throw new ValidationError("Query param participants_id must be a comma-separated list of numeric IDs");
  }

  return participantsId;
}

/**
 * Retrieves a single activity by its ID.
 * Validates user access permissions before returning activity data.
 * 
 * @async
 * @function getActivity
 * @param {AuthenticatedRequest} req - Express request object with activity ID in params
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {NotFoundError} If activity doesn't exist or user lacks access
 * @throws {ValidationError} If activity ID is invalid
 * 
 * @example
 * // GET /activities/123
 * // Returns activity with ID 123 if user has access
 */
export async function getActivity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    switch(currentUser?.role) {
      case "teacher":
        const activity = await activitiesService.getActivity(activityId, currentUser!.user_id as number, false);
        return res.json(activity.toJSON());
      case "student":
        const allocatedActivity = await activitiesService.getActivity(activityId, currentUser!.user_id as number, true);
        return res.json(allocatedActivity.toJSON());  
      default:
        throw new AuthentificationError("User role not recognized"); // Shouldn't happen due to auth middleware, but added for type safety
    }
  } catch (err) {
    next(err);
  }
}

export async function isActivityAccessible(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);

    switch(currentUser?.role) {
      case "teacher":
        const accessible = await activitiesService.isActivityAccessible(activityId, currentUser!.user_id as number, false);
        logger.debug(accessible);
        return res.json({ openable: accessible });
      case "student":
        const allocatedAccessible = await activitiesService.isActivityAccessible(activityId, currentUser!.user_id as number, true);
        logger.debug(allocatedAccessible);
        return res.json({ openable: allocatedAccessible });  
      default:
        throw new AuthentificationError("User role not recognized"); // Shouldn't happen due to auth middleware, but added for type safety
    }
  } catch (err) {
    next(err);
  }
}

export async function openTargetForActivity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    let currentUserId: number = currentUser!.user_id as number;
    const targetUrl = await activitiesService.getUserTargetForActivity(activityId, currentUserId, true);
    logger.debug(`Redirecting to target URL: ${targetUrl}`);
    return res.redirect(targetUrl); 
  } catch (err) {
    next(err);
  }
}

export async function getTargetForActivity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    const participants_id = parseParticipantsId(req.query.participants_id);
    switch(currentUser?.role) {
      case "teacher":
        const target = await activitiesService.getTargetForActivity(activityId, currentUser!.user_id as number, false, participants_id);
        logger.debug(mapToParticipantJson(target));
        return res.json(mapToParticipantJson(target));
      case "student":
        const allocatedTarget = await activitiesService.getTargetForActivity(activityId, currentUser!.user_id as number, true, participants_id);
        logger.debug(mapToParticipantJson(allocatedTarget));
        return res.json(mapToParticipantJson(allocatedTarget));  
      default:
        throw new AuthentificationError("User role not recognized"); // Shouldn't happen due to auth middleware, but added for type safety
    }
  } catch (err) {
    next(err);
  }
}

export async function getProgressForActivity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    const participants_id = parseParticipantsId(req.query.participants_id);
    switch(currentUser?.role) {
      case "teacher":
        const progress = await activitiesService.getProgressForActivity(activityId, currentUser!.user_id as number, false, participants_id);
        logger.debug(mapToParticipantJson(progress));
        return res.json(mapToParticipantJson(progress));
      case "student":
        const allocatedProgress = await activitiesService.getProgressForActivity(activityId, currentUser!.user_id as number, true, participants_id);
        logger.debug(mapToParticipantJson(allocatedProgress));
        return res.json(mapToParticipantJson(allocatedProgress));  
      default:
        throw new AuthentificationError("User role not recognized"); // Shouldn't happen due to auth middleware, but added for type safety
    }
  } catch (err) {
    next(err);
  }
}

export async function setProgressForActivity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    const progress = req.body.progress as number;
    const participants_id = parseParticipantsId(req.query.participants_id);
    switch(currentUser?.role) {
      case "teacher":
        const result = await activitiesService.setProgressForActivity(activityId, currentUser!.user_id as number, false, progress, participants_id);
        logger.debug(result);
        return res.json(result);
      case "student":
        const allocatedResult = await activitiesService.setProgressForActivity(activityId, currentUser!.user_id as number, true, progress, participants_id);
        logger.debug(allocatedResult);
        return res.json(allocatedResult);  
      default:
        throw new AuthentificationError("User role not recognized"); // Shouldn't happen due to auth middleware, but added for type safety
    }
  } catch (err) {
    next(err);
  }
}

export async function getInitializedForActivity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    const participants_id = parseParticipantsId(req.query.participants_id);
    switch(currentUser?.role) {
      case "teacher":
        const initialized = await activitiesService.getInitializedForActivity(activityId, currentUser!.user_id as number, false, participants_id);
        logger.debug(mapToParticipantJson(initialized));
        return res.json(mapToParticipantJson(initialized));
      case "student":
        const allocatedInitialized = await activitiesService.getInitializedForActivity(activityId, currentUser!.user_id as number, true, participants_id);
        logger.debug(mapToParticipantJson(allocatedInitialized));
        return res.json(mapToParticipantJson(allocatedInitialized));  
      default:
        throw new AuthentificationError("User role not recognized"); // Shouldn't happen due to auth middleware, but added for type safety
    }
  } catch (err) {
    next(err);
  }
}

export async function setInitializedForActivity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    const initialized = req.body.initialized as boolean;
    const participants_id = parseParticipantsId(req.query.participants_id);
    switch(currentUser?.role) {
      case "teacher":
        const result = await activitiesService.setInitializedForActivity(activityId, currentUser!.user_id as number, false, initialized, participants_id);
        logger.debug(result);
        return res.json(result);
      case "student":
        const allocatedResult = await activitiesService.setInitializedForActivity(activityId, currentUser!.user_id as number, true, initialized, participants_id);
        logger.debug(allocatedResult);
        return res.json(allocatedResult);  
      default:
        throw new AuthentificationError("User role not recognized"); // Shouldn't happen due to auth middleware, but added for type safety
    }
  } catch (err) {
    next(err);
  }
}

export async function getCompletionForActivity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    const participants_id = parseParticipantsId(req.query.participants_id);
    switch(currentUser?.role) {
      case "teacher":
        const completion = await activitiesService.getCompletionForActivity(activityId, currentUser!.user_id as number, false, participants_id);
        logger.debug(mapToParticipantJson(completion));
        return res.json(mapToParticipantJson(completion));
      case "student":
        const allocatedCompletion = await activitiesService.getCompletionForActivity(activityId, currentUser!.user_id as number, true, participants_id);
        logger.debug(mapToParticipantJson(allocatedCompletion));
        return res.json(mapToParticipantJson(allocatedCompletion));  
      default:
        throw new AuthentificationError("User role not recognized"); // Shouldn't happen due to auth middleware, but added for type safety
    }
  } catch (err) {
    next(err);
  }
}

export async function setCompletionForActivity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    const completed = req.body.completed as boolean;
    const participants_id = parseParticipantsId(req.query.participants_id);
    switch(currentUser?.role) {
      case "teacher":
        const result = await activitiesService.setCompletionForActivity(activityId, currentUser!.user_id as number, false, completed, participants_id);
        logger.debug(result);
        return res.json(result);
      case "student":
        const allocatedResult = await activitiesService.setCompletionForActivity(activityId, currentUser!.user_id as number, true, completed, participants_id);
        logger.debug(allocatedResult);
        return res.json(allocatedResult);  
      default:
        throw new AuthentificationError("User role not recognized"); // Shouldn't happen due to auth middleware, but added for type safety
    }
  } catch (err) {
    next(err);
  }
}

export async function setMultiCompletionForActivity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    const status = req.body.status as boolean;
    switch(currentUser?.role) {
      case "teacher":
        const result = await activitiesService.setMultiCompletionForActivity(activityId, currentUser!.user_id as number, false, status);
        logger.debug(result);
        return res.json(result);
      case "student":
        const allocatedResult = await activitiesService.setMultiCompletionForActivity(activityId, currentUser!.user_id as number, true, status);
        logger.debug(allocatedResult);
        return res.json(allocatedResult);  
      default:
        throw new AuthentificationError("User role not recognized"); // Shouldn't happen due to auth middleware, but added for type safety
    }
  } catch (err) {
    next(err);
  }
}

export async function setSuspensionForActivity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    const status = req.body.status as boolean;
    const participants_id = parseParticipantsId(req.query.participants_id);
    switch(currentUser?.role) {
      case "teacher":
        const result = await activitiesService.setSuspensionForActivity(activityId, currentUser!.user_id as number, false, status, participants_id);
        logger.debug(result);
        return res.json(result);
      case "student":
        const allocatedResult = await activitiesService.setSuspensionForActivity(activityId, currentUser!.user_id as number, true, status, participants_id);
        logger.debug(allocatedResult);
        return res.json(allocatedResult);  
      default:
        throw new AuthentificationError("User role not recognized"); // Shouldn't happen due to auth middleware, but added for type safety
    }
  } catch (err) {
    next(err);
  }
}

export async function getSuspensionForActivity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    const participants_id = parseParticipantsId(req.query.participants_id);
    switch(currentUser?.role) {
      case "teacher":
        const suspension = await activitiesService.getSuspensionForActivity(activityId, currentUser!.user_id as number, false, participants_id);
        logger.debug(mapToParticipantJson(suspension));
        return res.json(mapToParticipantJson(suspension));
      case "student":
        const allocatedSuspension = await activitiesService.getSuspensionForActivity(activityId, currentUser!.user_id as number, true, participants_id);
        logger.debug(mapToParticipantJson(allocatedSuspension));
        return res.json(mapToParticipantJson(allocatedSuspension));  
      default:
        throw new AuthentificationError("User role not recognized"); // Shouldn't happen due to auth middleware, but added for type safety
    }
  } catch (err) {
    next(err);
  }
}