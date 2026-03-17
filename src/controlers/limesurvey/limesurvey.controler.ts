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
    const surveyId = parseInt(req.params.survey_id as string);
    if (isNaN(surveyId)) {
      throw new NotFoundError("Invalid survey ID");
    }
    const languages = await limesurveyService.getSurveyLanguagesForActivity(surveyId, req.user!.sql.user_id as number);
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
    const surveyId = parseInt(req.params.survey_id as string);
    if (isNaN(surveyId)) {
      throw new NotFoundError("Invalid survey ID");
    }
    const { surveyOwner } = req.body;
    if (typeof surveyOwner !== "string") {
      throw new NotFoundError("Invalid survey owner");
    }
    await limesurveyService.setSurveyOwnerForActivity(surveyId, surveyOwner, req.user!.sql.user_id as number);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}