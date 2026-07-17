/**
 * Express router for LimeSurvey-related API endpoints.
 * 
 * Routes:
 * - GET /surveys - Retrieve all surveys
 * - GET /isAdmin - Check if user is LimeSurvey admin
 * - GET /:activity_id/surveylanguages - Get survey languages for activity
 * - PATCH /:activity_id/surveyowner - Set survey owner for activity
 * 
 * @module routes/limesurvey/limesurvey
 * @requires express
 * @requires @/controlers/limesurvey/limesurvey.controler
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 * 
 * @type {Router}
 */

import { Router } from "express";
import * as LimesurveyControler from "@/controlers/limesurvey/limesurvey.controler";

const router = Router();
router.get("/surveys", LimesurveyControler.getSurveys);
router.get("/isAdmin", LimesurveyControler.isAdmin);
router.get("/:survey_id/surveylanguages", LimesurveyControler.getSurveyLanguagesForSurvey);
router.patch("/:survey_id/surveyowner", LimesurveyControler.setSurveyOwnerForSurvey);

export default router;