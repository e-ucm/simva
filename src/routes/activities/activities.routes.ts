import { Router } from "express";
import * as activitiesControlers from "@/controlers/activities/activities.controlers";
import * as activitiesLRSControlers from "@/controlers/activities/activitiesLRS.controler";
import activitiesLRSroutes from "@/routes/activities/activities.lrs.routes";

/**
 * Express router for activity-related API endpoints.
 * 
 * Routes:
 * - GET /:activity_id - Retrieve a specific activity by ID
 * - GET /:activity_id/export - Export an activity
 * - GET /:activity_id/openable - Check if activity is accessible
 * - GET /:activity_id/target - Get activity target URL
 * - GET /:activity_id/open - Open activity for user
 * - GET /:activity_id/initialized - Get initialization status
 * - GET /:activity_id/progress - Get activity progress
 * - GET /:activity_id/completion - Get completion status
 * - GET /:activity_id/suspension - Get suspension status
 * - POST /:activity_id/initialized - Set initialization status
 * - POST /:activity_id/progress - Set activity progress
 * - POST /:activity_id/completion - Mark activity as completed
 * - POST /:activity_id/suspension - Suspend activity
 * - POST /:activity_id/completion/multi - Handle multiple completion events
 * - GET /:activity_id/presignedurl - Get presigned URL for activity
 * - GET /:activity_id/result - Get activity result
 * - POST /:activity_id/result - Set activity result
 * - GET /:activity_id/hasResult - Check if activity has result
 * - GET /:activity_id/tracker_config - Get tracker configuration
 * - GET /:activity_id/lrs_test_statements - Get test LRS statements
 * 
 * Sub-routers:
 * - /:activity_id/lrs - LRS-related activity routes
 * 
 * @module routes/activities/activities
 * @requires express
 * @requires @/controlers/activities/activities.controlers
 * @requires @/controlers/activities/activitiesLRS.controler
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 * 
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
router.get("/:activity_id/export", activitiesControlers.exportActivity);
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
router.get("/:activity_id/lrs_test_statements", activitiesLRSControlers.getTestStatementsLRSForActivity);

router.use("/:activity_id/lrs", activitiesLRSroutes);

export default router;