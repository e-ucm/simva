import { Router } from "express";
import { 
  getActivity
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

export default router;