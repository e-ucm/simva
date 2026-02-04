import { Router } from "express";
import {
  getSimletsByUsernameController,
  getSimletUserPermissionsController,
  getSessionByIdController,
  getSessionBySimletIdAndUsernameController,
  getSessionUserPermissionsController
} from "@/controlers/views/views.controler";

/**
 * Views router for view-based API endpoints in SIMVA.
 * 
 * All routes follow the pattern: /views/<viewname>/<params>
 * These endpoints provide access to database views that aggregate
 * data from multiple tables for complex queries.
 * 
 * Available view endpoints:
 * 
 * Simlet views:
 * - GET /views/simlets/ - Get simlets by username (by current or query param)
 * - GET /views/simlets/:simlet_id/permissions - Get user permissions for a simlet
 * 
 * Session views:
 * - GET /views/simlets/:simlet_id/sessions/ - Get sessions by simlet ID and username (query param)
 * - GET /views/simlets/:simlet_id/sessions/:session_id - Get session by ID
 * - GET /views/simlets/:simlet_id/sessions/:session_id/permissions - Get user permissions for a session
 * 
 * @example
 * ```typescript
 * import viewsRoutes from '@/routes/views.routes';
 * app.use('/views', viewsRoutes);
 * ```
 */

const router = Router();

/**
 * Simlet view routes
 * Base path: /views/simlets/
 * Note: More specific routes must come before parameterized routes
 */
router.get("/simlets", getSimletsByUsernameController);
router.get("/simlets/:simlet_id/permissions", getSimletUserPermissionsController);

/**
 * Session view routes  
 * Base path: /views/simlets/:simlet_id/sessions/
 * Note: More specific routes must come before parameterized routes
 */
router.get("/simlets/:simlet_id/sessions/", getSessionBySimletIdAndUsernameController);
router.get("/simlets/:simlet_id/sessions/:session_id", getSessionByIdController);
router.get("/simlets/:simlet_id/sessions/:session_id/permissions", getSessionUserPermissionsController);

export default router;