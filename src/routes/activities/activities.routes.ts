import { Router } from "express";
import { 
  getActivity,
  getCompletionForActivity,
  getInitializedForActivity,
  getProgressForActivity,
  getSuspensionForActivity,
  getTargetForActivity,
  isActivityAccessible,
  setCompletionForActivity,
  setInitializedForActivity,
  setMultiCompletionForActivity,
  setProgressForActivity,
  setSuspensionForActivity
} from "@/controlers/activities/activities.controlers";

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

// Base activity type operations
router.get("/:activity_id", getActivity);
router.get("/:activity_id/openable", isActivityAccessible);
router.get("/:activity_id/target", getTargetForActivity);
router.get("/:activity_id/open", getTargetForActivity);
router.get("/:activity_id/initialized", getInitializedForActivity);
router.post("/:activity_id/initialized", setInitializedForActivity);
router.get("/:activity_id/progress", getProgressForActivity);
router.post("/:activity_id/progress", setProgressForActivity);
router.get("/:activity_id/completion", getCompletionForActivity);
router.post("/:activity_id/completion", setCompletionForActivity);
router.post("/:activity_id/completion/multi", setMultiCompletionForActivity);
router.get("/:activity_id/suspension", getSuspensionForActivity);
router.post("/:activity_id/suspension", setSuspensionForActivity);

export default router;