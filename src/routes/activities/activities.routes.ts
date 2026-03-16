import { Router } from "express";
import * as activitiesControlers from "@/controlers/activities/activities.controlers";
import activitiesLRSroutes from "@/routes/activities/activities.lrs.routes";

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
const router: Router = Router();
//router.get("/", activitiesControlers.getActivities);
//router.post("/", activitiesControlers.createActivity);
//router.get("/:activity_id/export", activitiesControlers.exportActivity);
//router.patch("/:activity_id", activitiesControlers.updateActivity);
//router.delete("/:activity_id", activitiesControlers.deleteActivity);
//router.get("/:activity_id/surveylanguages", activitiesControlers.getSurveyLanguagesForActivity);
//router.get("/:activity_id/usersurveylist", activitiesControlers.getUserSurveyListForActivity);
//router.patch("/:activity_id/surveyowner", activitiesControlers.setSurveyOwnerForActivity);

// Base activity type operations
router.get("/:activity_id", activitiesControlers.getActivity);
router.get("/:activity_id/openable", activitiesControlers.isActivityAccessible);
router.get("/:activity_id/target", activitiesControlers.getTargetForActivity);
router.get("/:activity_id/open", activitiesControlers.openTargetForActivity);
router.get("/:activity_id/initialized", activitiesControlers.getInitializedForActivity);
router.get("/:activity_id/progress", activitiesControlers.getProgressForActivity);
router.get("/:activity_id/completion", activitiesControlers.getCompletionForActivity);
router.get("/:activity_id/suspension", activitiesControlers.getSuspensionForActivity);
router.post("/:activity_id/initialized", activitiesControlers.setInitializedForActivity);
router.post("/:activity_id/progress", activitiesControlers.setProgressForActivity);
router.post("/:activity_id/completion", activitiesControlers.setCompletionForActivity);
router.post("/:activity_id/suspension", activitiesControlers.setSuspensionForActivity);
router.post("/:activity_id/completion/multi", activitiesControlers.setMultiCompletionForActivity);
router.get("/:activity_id/presignedurl", activitiesControlers.getPresignedUrlForActivity);
router.get("/:activity_id/result", activitiesControlers.getResultsForActivity);
router.post("/:activity_id/result", activitiesControlers.setResultForActivity);
router.get("/:activity_id/hasResult", activitiesControlers.hasResultsForActivity);
router.get("/:activity_id/tracker_config", activitiesControlers.getTrackerConfigForActivity);

router.use("/:activity_id/lrs", activitiesLRSroutes);

export default router;