import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { NextFunction, Response } from "express";
import { NotFoundError } from "@/lib/errors/appErrors";
import { getAccess } from "@/controlers/users/user.helper";
import * as limesurveyService from "@/services/limesurvey/limesurvey.service";
import { logger } from "@/lib/logger";

/**
 * Retrieves all surveys from LimeSurvey.
 * 
 * @async
 * @function getSurveys
 * @param {AuthenticatedRequest} req - Express request object with authentication headers
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes errors to next middleware
 * 
 * @example
 * // GET /limesurvey/surveys
 * // Returns list of surveys accessible to the user
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
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

/**
 * Checks if the current user is a LimeSurvey administrator.
 * 
 * @async
 * @function isAdmin
 * @param {AuthenticatedRequest} req - Express request object with authentication headers
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes errors to next middleware
 * 
 * @example
 * // GET /limesurvey/isAdmin
 * // Returns { isAdmin: true } if user is admin, { isAdmin: false } otherwise
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
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

/**
 * Retrieves available languages for a LimeSurvey associated with an activity.
 * 
 * @async
 * @function getSurveyLanguagesForActivity
 * @param {AuthenticatedRequest} req - Express request object with activity_id in URL parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {NotFoundError} If activity ID is invalid
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // GET /limesurvey/:activity_id/surveylanguages
 * // Returns array of language codes (e.g., ["en", "es", "fr"])
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function getSurveyLanguagesForSurvey(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const surveyId = parseInt(req.params.survey_id as string);
    if (isNaN(surveyId)) {
      throw new NotFoundError("Invalid survey ID");
    }
    const languages = await limesurveyService.getSurveyLanguagesForSurvey(surveyId);
    logger.debug(languages, `Fetched languages for survey ${surveyId}:`);
    res.json(languages);
  } catch (err) {
    next(err);
  }
}

/**
 * Sets the owner of a LimeSurvey associated with an activity.
 * 
 * @async
 * @function setSurveyOwnerForActivity
 * @param {AuthenticatedRequest} req - Express request object with activity_id in URL parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {NotFoundError} If activity ID is invalid
 * @throws {Error} Passes other errors to next middleware
 * 
 * @example
 * // PATCH /limesurvey/:activity_id/surveyowner
 * // Body: { owner: "username" }
 * // Returns: 204 No Content on success
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function setSurveyOwnerForSurvey(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const surveyId = parseInt(req.params.survey_id as string);
    if (isNaN(surveyId)) {
      throw new NotFoundError("Invalid survey ID");
    }
    await limesurveyService.setSurveyOwnerForSurvey(surveyId, req.user!.sql.username!);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}