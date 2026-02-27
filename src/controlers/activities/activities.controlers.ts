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


function parseParticipantsId(participantsIdQuery: unknown): number[] | undefined {
  logger.debug(participantsIdQuery, "Received participants_id query param:");
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
  logger.debug(tokens, "Parsed tokens from query param:");
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
    const currentUser = req.user?.sql;
    const currentUserId: number = currentUser!.user_id as number;
    const activityId = parseInt(req.params.activity_id as string);
    switch(currentUser?.role) {
      case "teacher":
        const activity = await activitiesService.getActivity(activityId, currentUserId, false);
        return res.json(activity.toJSON());
      case "student":
        const allocatedActivity = await activitiesService.getActivity(activityId, currentUserId, true);
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
    const currentUser = req.user?.sql;
    const currentUserId: number = currentUser!.user_id as number;
    const activityId = parseInt(req.params.activity_id as string);

    switch(currentUser?.role) {
      case "teacher":
        const accessible = await activitiesService.isActivityAccessible(activityId, currentUserId, false);
        logger.debug(accessible);
        return res.json({ openable: accessible });
      case "student":
        const allocatedAccessible = await activitiesService.isActivityAccessible(activityId, currentUserId, true);
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
    const currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    const currentUserId: number = currentUser!.user_id as number;
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
    const currentUser = req.user?.sql;
    const currentUserId: number = currentUser!.user_id as number;
    const activityId = parseInt(req.params.activity_id as string);
    switch(currentUser?.role) {
      case "teacher":
        const participants_id = parseParticipantsId(req.query.users);
        const target = await activitiesService.getTargetForActivity(activityId, currentUserId, false, participants_id);
        logger.debug(target.toJSON());
        return res.json(target.toJSON());
      case "student":
        const allocatedTarget = await activitiesService.getTargetForActivity(activityId, currentUserId, true, [currentUserId]);
        logger.debug(allocatedTarget.toJSON());
        return res.json(allocatedTarget.toJSON());  
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
    const currentUser = req.user?.sql;
    const currentUserId: number = currentUser!.user_id as number;
    const activityId = parseInt(req.params.activity_id as string);
    switch(currentUser?.role) {
      case "teacher":
        const participants_id = parseParticipantsId(req.query.users);
        const progress = await activitiesService.getProgressForActivity(activityId, currentUserId, false, participants_id);
        logger.debug(progress.toJSON());
        return res.json(progress.toJSON());
      case "student":
        const allocatedProgress = await activitiesService.getProgressForActivity(activityId, currentUserId, true, [currentUserId]);
        logger.debug(allocatedProgress.toJSON());
        return res.json(allocatedProgress.toJSON());  
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
    const currentUser = req.user?.sql;
    const currentUserId: number = currentUser!.user_id as number;
    const activityId = parseInt(req.params.activity_id as string);
    const progress = req.body.progress as number;
    switch(currentUser?.role) {
      case "teacher":
        let participant_id: number = req.query.user ? parseInt(req.query.user as string) : NaN;
        if (isNaN(participant_id)) {
          throw new ValidationError("Query param user must be a numeric ID");
        }
        const result = await activitiesService.setProgressForActivity(activityId, currentUserId, false, progress, participant_id);
        logger.debug(result.toJSON());
        return res.json(result.toJSON());
      case "student":
        const allocatedResult = await activitiesService.setProgressForActivity(activityId, currentUserId, true, progress, currentUserId);
        logger.debug(allocatedResult.toJSON());
        return res.json(allocatedResult.toJSON());  
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
    const currentUser = req.user?.sql;
    const currentUserId: number = currentUser!.user_id as number;
    const activityId = parseInt(req.params.activity_id as string);
    switch(currentUser?.role) {
      case "teacher":
        const participants_id = parseParticipantsId(req.query.users);
        const initialized = await activitiesService.getInitializedForActivity(activityId, currentUserId, false, participants_id);
        logger.debug(initialized.toJSON());
        return res.json(initialized.toJSON());
      case "student":
        const allocatedInitialized = await activitiesService.getInitializedForActivity(activityId, currentUserId, true, [currentUserId]);
        logger.debug(allocatedInitialized.toJSON());
        return res.json(allocatedInitialized.toJSON());  
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
    const currentUser = req.user?.sql;
    const currentUserId: number = currentUser!.user_id as number;
    const activityId = parseInt(req.params.activity_id as string);
    const initialized = req.body.initialized as boolean;
    switch(currentUser?.role) {
      case "teacher":
        let participant_id: number = req.query.user ? parseInt(req.query.user as string) : NaN;
        if (isNaN(participant_id)) {
          throw new ValidationError("Query param user must be a numeric ID");
        }
        const result = await activitiesService.setInitializedForActivity(activityId, currentUserId, false, initialized, participant_id);
        logger.debug(result.toJSON());
        return res.json(result.toJSON());
      case "student":
        const allocatedResult = await activitiesService.setInitializedForActivity(activityId, currentUserId, true, initialized, currentUserId);
        logger.debug(allocatedResult.toJSON());
        return res.json(allocatedResult.toJSON());  
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
    const participants_id = parseParticipantsId(req.query.users);
    switch(currentUser?.role) {
      case "teacher":
        const completion = await activitiesService.getCompletionForActivity(activityId, currentUser!.user_id as number, false, participants_id);
        logger.debug(completion.toJSON());
        return res.json(completion.toJSON());
      case "student":
        const allocatedCompletion = await activitiesService.getCompletionForActivity(activityId, currentUser!.user_id as number, true, participants_id);
        logger.debug(allocatedCompletion.toJSON());
        return res.json(allocatedCompletion.toJSON());  
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
    const currentUser = req.user?.sql;
    const currentUserId: number = currentUser!.user_id as number;
    const activityId = parseInt(req.params.activity_id as string);
    const completed = req.body.completed as boolean;
    switch(currentUser?.role) {
      case "teacher":
         let participant_id: number = req.query.user ? parseInt(req.query.user as string) : NaN;
        if (isNaN(participant_id)) {
          throw new ValidationError("Query param user must be a numeric ID");
        }
        const result = await activitiesService.setCompletionForActivity(activityId, currentUserId, false, completed, participant_id);
        logger.debug(result.toJSON());
        return res.json(result.toJSON());
      case "student":
        const allocatedResult = await activitiesService.setCompletionForActivity(activityId, currentUserId, true, completed, currentUserId);
        logger.debug(allocatedResult.toJSON());
        return res.json(allocatedResult.toJSON());  
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
    const currentUser = req.user?.sql;
    const currentUserId: number = currentUser!.user_id as number;
    const activityId = parseInt(req.params.activity_id as string);
    const status = req.body.status as boolean;
    switch(currentUser?.role) {
      case "teacher":
        const result = await activitiesService.setMultiCompletionForActivity(activityId, currentUserId, false, status);
        logger.debug(result.map((r) => r.toJSON()));
        return res.json(result.map((r) => r.toJSON()));
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
    const currentUser = req.user?.sql;
    const currentUserId: number = currentUser!.user_id as number;
    const activityId = parseInt(req.params.activity_id as string);
    const status = req.body.status as boolean;
    switch(currentUser?.role) {
      case "teacher":
        let participant_id: number = req.query.user ? parseInt(req.query.user as string) : NaN;
        if (isNaN(participant_id)) {
          throw new ValidationError("Query param user must be a numeric ID");
        }
        const result = await activitiesService.setSuspensionForActivity(activityId, currentUserId, false, status, participant_id);
        logger.debug(result.toJSON());
        return res.json(result.toJSON());
      case "student":
        const allocatedResult = await activitiesService.setSuspensionForActivity(activityId, currentUserId, true, status, currentUserId);
        logger.debug(allocatedResult.toJSON());
        return res.json(allocatedResult.toJSON());  
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
    const currentUser = req.user?.sql;
    const currentUserId: number = currentUser!.user_id as number;
    const activityId = parseInt(req.params.activity_id as string);
    const participants_id = parseParticipantsId(req.query.users);
    switch(currentUser?.role) {
      case "teacher":
        const suspension = await activitiesService.getSuspensionForActivity(activityId, currentUserId, false, participants_id);
        logger.debug(suspension.toJSON());
        return res.json(suspension.toJSON());
      case "student":
        const allocatedSuspension = await activitiesService.getSuspensionForActivity(activityId, currentUserId, true, participants_id);
        logger.debug(allocatedSuspension.toJSON());
        return res.json(allocatedSuspension.toJSON());  
      default:
        throw new AuthentificationError("User role not recognized"); // Shouldn't happen due to auth middleware, but added for type safety
    }
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
    const currentUserId: number = currentUser!.user_id as number;
    switch(currentUser?.role) {
      case "teacher":
        const participants_id = parseParticipantsId(req.query.users);
        logger.debug(participants_id, "Parsed participants_id from query param:");
        const hasResults = await activitiesService.hasResultsForActivity(activityId, currentUserId, false, type, participants_id);
        logger.debug(hasResults.toJSON());
        return res.json(hasResults.toJSON());
      case "student":
        const allocatedHasResults = await activitiesService.hasResultsForActivity(activityId, currentUserId, true, type, [currentUserId]);
        logger.debug(allocatedHasResults.toJSON());
        return res.json(allocatedHasResults.toJSON());  
      default:
        throw new AuthentificationError("User role not recognized"); // Shouldn't happen due to auth middleware, but added for type safety
    }
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
    const currentUserId: number = currentUser!.user_id as number;
    const activityId = parseInt(req.params.activity_id as string);
    let type = req.query.type as string;
    if(!type) {
      type = "results";
    }
    if(type !== "results" && type !== "traces") {
      throw new ValidationError("Query param type must be either 'results' or 'traces'");
    }
    const result = req.body.result;
    switch(currentUser?.role) {
      case "teacher":
        let participant_id: number = req.query.user ? parseInt(req.query.user as string) : NaN;
        if (isNaN(participant_id)) {
          throw new ValidationError("Query param user must be a numeric ID");
        }
        await activitiesService.setResultForActivity(activityId, currentUserId, false, type, result, participant_id);
        return res.status(204).send();
      case "student":
        await activitiesService.setResultForActivity(activityId, currentUserId, true, type, result, currentUserId);
        return res.status(204).send();  
      default:
        throw new AuthentificationError("User role not recognized"); // Shouldn't happen due to auth middleware, but added for type safety
    }
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
    const currentUserId: number = currentUser!.user_id as number;
    const activityId = parseInt(req.params.activity_id as string);
    const url = await activitiesService.getPresignedUrlForActivity(activityId, currentUserId, false);
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
    const currentUserId: number = currentUser!.user_id as number;
    switch(currentUser?.role) {
      case "teacher":
        const participants_id = parseParticipantsId(req.query.users);
        const results = await activitiesService.getResultsForActivity(activityId, currentUserId, false, type, participants_id);
        logger.debug(results.toJSON());
        return res.json(results.toJSON());
      case "student":
        const allocatedResults = await activitiesService.getResultsForActivity(activityId, currentUserId, true, type, [currentUserId]);
        logger.debug(allocatedResults.toJSON());
        return res.json(allocatedResults.toJSON());  
      default:
        throw new AuthentificationError("User role not recognized"); // Shouldn't happen due to auth middleware, but added for type safety
    }
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
    const currentUserId: number = currentUser!.user_id as number;
    const activityId = parseInt(req.params.activity_id as string);
    const data = req.body;
    switch(currentUser?.role) {
      case "teacher":
        const activity = await activitiesService.updateActivity(activityId, currentUserId, false, data);
        return res.json(activity.toJSON());
      case "student":
        throw new AuthentificationError("Students cannot update activities");
      default:
        throw new AuthentificationError("User role not recognized");
    }
  } catch (err) {
    next(err);
  }
}