import { Router } from "express";
import * as LimesurveyControler from "@/controlers/limesurvey/limesurvey.controler";

const router = Router();
router.get("/surveys", LimesurveyControler.getSurveys);
router.get("/isAdmin", LimesurveyControler.isAdmin);
router.get("/:activity_id/surveylanguages", LimesurveyControler.getSurveyLanguagesForActivity);
router.patch("/:activity_id/surveyowner", LimesurveyControler.setSurveyOwnerForActivity);

export default router;