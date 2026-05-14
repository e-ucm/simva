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

const INVALID_USER_QUERY_PARAM_MESSAGE = "Query param user must be a numeric user ID";

function parseParticipantsId(participantsIdQuery: unknown): number[] {
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
  if (tokens.length === 0) {
    return [];
  }

  const participantsId = tokens.map((value) => Number(value));
  if (participantsId.some((value) => !Number.isInteger(value) || value < 0)) {
    throw new ValidationError("Query param participants_id must be a comma-separated list of numeric IDs");
  }

  return participantsId;
}

function parseUserIdQueryParam(userQuery: unknown): number {
  const participantId = userQuery ? parseInt(String(userQuery), 10) : NaN;

  if (Number.isNaN(participantId)) {
    throw new ValidationError(INVALID_USER_QUERY_PARAM_MESSAGE);
  }

  return participantId;
}

function parseBooleanStatus(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();

    if (normalizedValue === "true") {
      return true;
    }

    if (normalizedValue === "false") {
      return false;
    }
  }

  if (typeof value === "number") {
    if (value === 1) {
      return true;
    }

    if (value === 0) {
      return false;
    }
  }

  throw new ValidationError("Body param status must be a boolean");
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
    logger.debug(activity, "Fetched activity with ID: " + activityId);
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
    const progress = parseInt(req.body.progress as string);
    const access = getAccess(currentUser);
    let participant_id = access.currentUserId;
    if (!access.allocated) {
      participant_id = parseUserIdQueryParam(req.query.user);
    }
    const result = await activitiesService.setProgressForActivity(activityId, access.allocated, access.is_admin, progress, participant_id, access.currentUserId);
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
    const initialized = parseBooleanStatus(req.body.status);
    const access = getAccess(currentUser);
    let participant_id = access.currentUserId;
    if (!access.allocated) {
      participant_id = parseUserIdQueryParam(req.query.user);
    }
    const result = await activitiesService.setInitializedForActivity(activityId, access.allocated, access.is_admin, initialized, participant_id, access.currentUserId);
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
    const completed = parseBooleanStatus(req.body.status);
    const access = getAccess(currentUser);
    let participant_id = access.currentUserId;
    if (!access.allocated) {
      participant_id = parseUserIdQueryParam(req.query.user);
    }
    const result = await activitiesService.setCompletionForActivity(activityId, access.allocated, access.is_admin, completed, participant_id, access.currentUserId);
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
    const status = parseBooleanStatus(req.body.status);
    const access = getAccess(currentUser);
    if (access.allocated) {
      throw new AuthentificationError("Students cannot set multi completion for activities");
    }
    const result = await activitiesService.setMultiCompletionForActivity(activityId, access.allocated, access.is_admin, status, access.currentUserId);
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
    const status = parseBooleanStatus(req.body.status);
    const access = getAccess(currentUser);
    let participant_id = access.currentUserId;
    if (!access.allocated) {
      participant_id = parseUserIdQueryParam(req.query.user);
    }
    const result = await activitiesService.setSuspensionForActivity(activityId, access.allocated, access.is_admin, status, participant_id, access.currentUserId);
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
      type = "full";
    }
    if(type !== "full" && type !== "code" && type !== "traces") {
      throw new ValidationError("Query param type must be either 'full', 'code' for backups or 'traces' for traces");
    }
    const access = getAccess(currentUser);
    const participants_id = access.allocated ? [access.currentUserId] : parseParticipantsId(req.query.users);
    const hasResults = await activitiesService.hasResultsForActivity(activityId, access.allocated, access.is_admin, type, participants_id, access.currentUserId);
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
    if (!type) {
      type = "full";
    }
    if(type !== "full" && type !== "code" && type !== "traces") {
      throw new ValidationError("Query param type must be either 'full', 'code' for backups or 'traces' for traces");
    }
    const result = req.body.result;
    const access = getAccess(currentUser);
    let participant_id = access.currentUserId;
    if (!access.allocated) {
      participant_id = parseUserIdQueryParam(req.query.user);
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
    if (!type) {
      type = "backup";
    }
    if (type !== "backup" && type !== "traces") {
      throw new ValidationError(
        "Query param type must be either backup or traces"
      );
    }
    const access = getAccess(currentUser);
    const queryUsers = req.query.users;
    // Normalize "no users provided"
    const hasUsers =
      queryUsers !== undefined &&
      queryUsers !== null &&
      queryUsers !== "";

    const queryAll = req.query.all;
    const hasAll =
      queryAll !== undefined &&
      queryAll !== null &&
      queryAll !== "";
    if (!access.allocated && !hasUsers && hasAll) {
      if (queryAll !== "full" && queryAll !== "code") {
        throw new ValidationError(
          "Query param all must be either full or code"
        );
      }
      // ✅ FIXED CASE
      const resultUrl = await activitiesService.getAllResultForActivity(
        activityId,
        access.allocated,
        access.is_admin,
        queryAll,
        access.currentUserId
      );

      return res.json({ url: resultUrl });
    }

    // otherwise → specific users
    const participants_id = access.allocated
      ? [access.currentUserId]
      : parseParticipantsId(queryUsers);

    const results = await activitiesService.getResultsForActivity(
      activityId,
      access.allocated,
      access.is_admin,
      type,
      participants_id,
      access.currentUserId
    );
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

export async function deleteActivity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    const access = getAccess(currentUser);
    if (access.allocated) {
      throw new AuthentificationError("Students cannot delete activities");
    }
    await activitiesService.deleteActivity(activityId, access.allocated, access.is_admin, access.currentUserId);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getTrackerConfigForActivity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    const access = getAccess(currentUser);
    const trackerConfig = await activitiesService.getTrackerConfigForActivity(activityId, access.allocated, access.is_admin, access.currentUserId);
    return res.json(trackerConfig);
  } catch (err) {
    next(err);
  }
}
