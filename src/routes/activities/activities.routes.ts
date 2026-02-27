import { Router } from "express";
import { 
  getActivity,
  getCompletionForActivity,
  getInitializedForActivity,
  getProgressForActivity,
  getSuspensionForActivity,
  getTargetForActivity,
  isActivityAccessible,
  openTargetForActivity,
  setCompletionForActivity,
  setInitializedForActivity,
  setMultiCompletionForActivity,
  setProgressForActivity,
  setSuspensionForActivity,
  getResultsForActivity,
  setResultForActivity,
  hasResultsForActivity,
  updateActivity
} from "@/controlers/activities/activities.controlers";
import {
  getStatementsLRSForActivity,
  postStatementsLRSForActivity,
  putStatementsLRSForActivity,
  getAgentsLRSForActivity,
  getAgentsProfileLRSForActivity,
  postAgentsProfileLRSForActivity,
  updateAgentsProfileLRSForActivity,
  deleteAgentsProfileLRSForActivity,
  getActivitiesLRSForActivity,
  getActivitiesProfileLRSForActivity,
  postActivitiesProfileLRSForActivity,
  updateActivitiesProfileLRSForActivity,
  deleteActivitiesProfileLRSForActivity,
  getActivitiesStateLRSForActivity,
  postActivitiesStateLRSForActivity,
  updateActivitiesStateLRSForActivity,
  deleteActivitiesStateLRSForActivity,
  getAboutLRSForActivity,
  getExtensionLRSForActivity
} from "@/controlers/activities/activitiesLRS.controler";

/**
 * Express router for activity-related API endpoints.
 * 
 * Routes:
 * - GET /:activity_id - Retrieve a specific activity by ID
 * @type {Router}
 * 
 * @example
 * ```typescript
 * import activitiesRoutes from '@/routes/activities/activities.routes';
 * app.use('/activities', activitiesRoutes);
 * // GET /activities/:activity_id - Retrieve a specific activity by ID
 * ``` 
 */
const router = Router();

//router.get("/", getActivities);
//router.post("/", createActivity);
//router.get("/:activity_id/export", exportActivity);
//router.patch("/:activity_id", updateActivity);
//router.delete("/:activity_id", deleteActivity);
//router.get("/:activity_id/surveylanguages", getSurveyLanguagesForActivity);
//router.get("/:activity_id/usersurveylist", getUserSurveyListForActivity);
//router.patch("/:activity_id/surveyowner", setSurveyOwnerForActivity);

// Base activity type operations
router.get("/:activity_id", getActivity);
router.get("/:activity_id/openable", isActivityAccessible);
router.get("/:activity_id/target", getTargetForActivity);
router.get("/:activity_id/open", openTargetForActivity);
router.get("/:activity_id/initialized", getInitializedForActivity);
router.get("/:activity_id/progress", getProgressForActivity);
router.get("/:activity_id/completion", getCompletionForActivity);
router.get("/:activity_id/suspension", getSuspensionForActivity);
router.post("/:activity_id/initialized", setInitializedForActivity);
router.post("/:activity_id/progress", setProgressForActivity);
router.post("/:activity_id/completion", setCompletionForActivity);
router.post("/:activity_id/suspension", setSuspensionForActivity);
router.post("/:activity_id/completion/multi", setMultiCompletionForActivity);
//router.get("/:activity_id/presignedurl", getPresignedUrlForActivity);
router.get("/:activity_id/result", getResultsForActivity);
router.post("/:activity_id/result", setResultForActivity);
router.get("/:activity_id/hasResult", hasResultsForActivity);


///////////////////////////////////////////
/////////////// LRS METHOD ////////////////
///////////////////////////////////////////

router.get("/:activity_id/statements", getStatementsLRSForActivity);
router.post("/:activity_id/statements", postStatementsLRSForActivity);
router.put("/:activity_id/statements", putStatementsLRSForActivity);
router.get("/:activity_id/agents", getAgentsLRSForActivity);
router.get("/:activity_id/agents/profile", getAgentsProfileLRSForActivity);
router.post("/:activity_id/agents/profile", postAgentsProfileLRSForActivity);
router.put("/:activity_id/agents/profile", updateAgentsProfileLRSForActivity);
router.delete("/:activity_id/agents/profile", deleteAgentsProfileLRSForActivity);
router.get("/:activity_id/activities", getActivitiesLRSForActivity);
router.get("/:activity_id/activities/profile", getActivitiesProfileLRSForActivity);
router.post("/:activity_id/activities/profile", postActivitiesProfileLRSForActivity);
router.put("/:activity_id/activities/profile", updateActivitiesProfileLRSForActivity);
router.delete("/:activity_id/activities/profile", deleteActivitiesProfileLRSForActivity);
router.get("/:activity_id/activities/state", getActivitiesStateLRSForActivity);
router.post("/:activity_id/activities/state", postActivitiesStateLRSForActivity);
router.put("/:activity_id/activities/state", updateActivitiesStateLRSForActivity);
router.delete("/:activity_id/activities/state", deleteActivitiesStateLRSForActivity);
router.get("/:activity_id/about", getAboutLRSForActivity);
router.get("/:activity_id/extension/:extension_id", getExtensionLRSForActivity);

export default router;