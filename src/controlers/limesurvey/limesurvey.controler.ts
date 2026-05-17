import { Response, NextFunction } from "express";
import { logger } from "@/lib/logger";
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import * as limesurveyService from "@/services/limesurvey/limesurvey.service";
import { NotFoundError } from "@/lib/errors/appErrors";
import { getAccess } from "../users/user.helper";

export async function getSurveys(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user?.sql!;
    const access = getAccess(user);
    if (access.allocated) {
      return res.json([]);
    }
    const surveys = await limesurveyService.getSurveys(access.is_admin, user.username!);
    logger.debug(`Fetched surveys: ${JSON.stringify(surveys)}`);
    res.json(surveys);
  } catch (err) {
    next(err);
  }
}

export async function isAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const isAdmin = await limesurveyService.isAdmin(req.user!.sql.username as string);
    res.json({ isAdmin });
  } catch (err) {
    next(err);
  }
}

export async function getSurveyLanguagesForActivity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const activityId = parseInt(req.params.activity_id as string);
    if (isNaN(activityId)) {
      throw new NotFoundError("Invalid activity ID");
    }
    const access = getAccess(req.user!.sql);
    const languages = await limesurveyService.getSurveyLanguagesForActivity(activityId, access.allocated, access.is_admin, access.currentUserId);
    logger.debug(languages, `Fetched languages for activity ${activityId}:`);
    res.json(languages);
  } catch (err) {
    next(err);
  }
}

export async function setSurveyOwnerForActivity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const activityId = parseInt(req.params.activity_id as string);
    if (isNaN(activityId)) {
      throw new NotFoundError("Invalid activity ID");
    }
    const access = getAccess(req.user!.sql);
    await limesurveyService.setSurveyOwnerForActivity(activityId, access.allocated, access.is_admin, access.currentUserId, req.user!.sql.username!);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}