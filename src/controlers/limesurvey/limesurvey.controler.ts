import { Response, NextFunction } from "express";
import { logger } from "@/lib/logger";
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import * as limesurveyService from "@/services/limesurvey/limesurvey.service";
import { NotFoundError } from "@/lib/errors/appErrors";

export async function getSurveys(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const surveys = await limesurveyService.getSurveys();
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
    const isAdmin = await limesurveyService.isAdmin(req.user!.sql.user_id as number);
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
    const languages = await limesurveyService.getSurveyLanguagesForActivity(activityId, req.user!.sql.user_id as number);
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
    await limesurveyService.setSurveyOwnerForActivity(activityId, req.user!.sql.username!, req.user!.sql.user_id as number);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}