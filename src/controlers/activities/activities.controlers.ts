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
import { getAccess } from "@/controlers/users/user.helper";


function parseParticipantsId(participantsIdQuery: unknown): number[] {
  logger.debug(participantsIdQuery, "Received participants_id query param:");
  if (participantsIdQuery === undefined || participantsIdQuery === null) {
    return [];
  }

  const rawValues = Array.isArray(participantsIdQuery)
    ? participantsIdQuery
    : [participantsIdQuery];

  const tokens = rawValues
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  logger.debug(tokens, "Parsed tokens from query param:");
  if (tokens.length === 0) {
    return [];
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
    const currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    const access = getAccess(currentUser);
    const activity = await activitiesService.getActivity(activityId, access.allocated, access.is_admin, access.currentUserId);
    return res.json(activity.toJSON());
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
    const currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    const access = getAccess(currentUser);
    const accessible = await activitiesService.isActivityAccessible(activityId, access.allocated, access.is_admin, access.currentUserId);
    logger.debug(accessible);
    return res.json({ openable: accessible });
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
    const currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    const access = getAccess(currentUser);
    const targetUrl = await activitiesService.getUserTargetForActivity(activityId, access.allocated, access.is_admin, access.currentUserId);
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
    const currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    const access = getAccess(currentUser);
    const participants_id = access.allocated ? [access.currentUserId] : parseParticipantsId(req.query.users);
    const target = await activitiesService.getTargetForActivity(activityId, access.allocated, access.is_admin, participants_id, access.currentUserId);
    logger.debug(target.toJSON());
    return res.json(target.toJSON());
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
    const currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    const access = getAccess(currentUser);
    const participants_id = access.allocated ? [access.currentUserId] : parseParticipantsId(req.query.users);
    const progress = await activitiesService.getProgressForActivity(activityId, access.allocated, access.is_admin, participants_id, access.currentUserId);
    logger.debug(progress.toJSON());
    return res.json(progress.toJSON());
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
    const currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    const progress = req.body.progress as number;
    const access = getAccess(currentUser);
    let participant_id = access.currentUserId;
    if (!access.allocated) {
      participant_id = req.query.user ? parseInt(req.query.user as string) : NaN;
      if (isNaN(participant_id)) {
        throw new ValidationError("Query param user must be a numeric ID");
      }
    }
    const result = await activitiesService.setProgressForActivity(activityId, access.allocated, access.is_admin, progress, participant_id, access.currentUserId);
    logger.debug(result.toJSON());
    return res.json(result.toJSON());
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
    const currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    const access = getAccess(currentUser);
    const participants_id = access.allocated ? [access.currentUserId] : parseParticipantsId(req.query.users);
    const initialized = await activitiesService.getInitializedForActivity(activityId, access.allocated, access.is_admin, participants_id, access.currentUserId);
    logger.debug(initialized.toJSON());
    return res.json(initialized.toJSON());
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
    const currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    const initialized = req.body.initialized as boolean;
    const access = getAccess(currentUser);
    let participant_id = access.currentUserId;
    if (!access.allocated) {
      participant_id = req.query.user ? parseInt(req.query.user as string) : NaN;
      if (isNaN(participant_id)) {
        throw new ValidationError("Query param user must be a numeric ID");
      }
    }
    const result = await activitiesService.setInitializedForActivity(activityId, access.allocated, access.is_admin, initialized, participant_id, access.currentUserId);
    logger.debug(result.toJSON());
    return res.json(result.toJSON());
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
    const access = getAccess(currentUser);
    const participants_id = access.allocated ? [access.currentUserId] : parseParticipantsId(req.query.users);
    const completion = await activitiesService.getCompletionForActivity(activityId, access.allocated, access.is_admin, participants_id, access.currentUserId);
    logger.debug(completion.toJSON());
    return res.json(completion.toJSON());
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
    const currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    const completed = req.body.completed as boolean;
    const access = getAccess(currentUser);
    let participant_id = access.currentUserId;
    if (!access.allocated) {
      participant_id = req.query.user ? parseInt(req.query.user as string) : NaN;
      if (isNaN(participant_id)) {
        throw new ValidationError("Query param user must be a numeric ID");
      }
    }
    const result = await activitiesService.setCompletionForActivity(activityId, access.allocated, access.is_admin, completed, participant_id, access.currentUserId);
    logger.debug(result.toJSON());
    return res.json(result.toJSON());
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
    const currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    const status = req.body.status as boolean;
    const access = getAccess(currentUser);
    if (access.allocated) {
      throw new AuthentificationError("Students cannot set multi completion for activities");
    }
    const result = await activitiesService.setMultiCompletionForActivity(activityId, access.allocated, access.is_admin, status, access.currentUserId);
    logger.debug(result.map((r) => r.toJSON()));
    return res.json(result.map((r) => r.toJSON()));
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
    const currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    const status = req.body.status as boolean;
    const access = getAccess(currentUser);
    let participant_id = access.currentUserId;
    if (!access.allocated) {
      participant_id = req.query.user ? parseInt(req.query.user as string) : NaN;
      if (isNaN(participant_id)) {
        throw new ValidationError("Query param user must be a numeric ID");
      }
    }
    const result = await activitiesService.setSuspensionForActivity(activityId, access.allocated, access.is_admin, status, participant_id, access.currentUserId);
    logger.debug(result.toJSON());
    return res.json(result.toJSON());
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
    const currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    const access = getAccess(currentUser);
    const participants_id = access.allocated ? [access.currentUserId] : parseParticipantsId(req.query.users);
    const suspension = await activitiesService.getSuspensionForActivity(activityId, access.allocated, access.is_admin, participants_id, access.currentUserId);
    logger.debug(suspension.toJSON());
    return res.json(suspension.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function hasResultsForActivity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    let type = req.query.type as string;
    if (!type) {
      type = "results";
    }
    if(type !== "results" && type !== "traces") {
      throw new ValidationError("Query param type must be either 'results' or 'traces'");
    }
    const access = getAccess(currentUser);
    const participants_id = access.allocated ? [access.currentUserId] : parseParticipantsId(req.query.users);
    logger.debug(participants_id, "Parsed participants_id from query param:");
    const hasResults = await activitiesService.hasResultsForActivity(activityId, access.allocated, access.is_admin, type, participants_id, access.currentUserId);
    logger.debug(hasResults.toJSON());
    return res.json(hasResults.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function setResultForActivity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    let type = req.query.type as string;
    if(!type) {
      type = "results";
    }
    if(type !== "results" && type !== "traces") {
      throw new ValidationError("Query param type must be either 'results' or 'traces'");
    }
    const result = req.body.result;
    const access = getAccess(currentUser);
    let participant_id = access.currentUserId;
    if (!access.allocated) {
      participant_id = req.query.user ? parseInt(req.query.user as string) : NaN;
      if (isNaN(participant_id)) {
        throw new ValidationError("Query param user must be a numeric ID");
      }
    }
    await activitiesService.setResultForActivity(activityId, access.allocated, access.is_admin, type, result, participant_id, access.currentUserId);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getPresignedUrlForActivity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    const access = getAccess(currentUser);
    const url = await activitiesService.getPresignedUrlForActivity(activityId, access.allocated, access.is_admin, access.currentUserId);
    logger.debug(url);
    return res.json({ url: url });
  } catch (err) {
    next(err);
  }
}

export async function getResultsForActivity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    let type = req.query.type as string;
    if(!type) {
      type = "results";
    }
    if(type !== "results" && type !== "traces") {
      throw new ValidationError("Query param type must be either 'results' or 'traces'");
    }
    const access = getAccess(currentUser);
    const participants_id = access.allocated ? [access.currentUserId] : parseParticipantsId(req.query.users);
    const results = await activitiesService.getResultsForActivity(activityId, access.allocated, access.is_admin, type, participants_id, access.currentUserId);
    logger.debug(results.toJSON());
    return res.json(results.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function updateActivity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    const data = req.body;
    const access = getAccess(currentUser);
    if (access.allocated) {
      throw new AuthentificationError("Students cannot update activities");
    }
    const activity = await activitiesService.updateActivity(activityId, access.allocated, access.is_admin, data, access.currentUserId);
    return res.json(activity.toJSON());
  } catch (err) {
    next(err);
  }
}