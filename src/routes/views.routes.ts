import { Router } from "express";
import { 
  getSimletByIdController,
  getSimletsByUsernameController,
  getSimletUserPermissionsController,
  getSessionByIdController,
  getSessionBySimletIdAndUsernameController,
  getSessionUserPermissionsController
} from "@/controlers/views.controller";

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
 * - GET /views/simlets/:simlet_id - Get simlet by ID
 * - GET /views/simlets/user/:username - Get simlets for a user
 * - GET /views/simlets/:simlet_id/permissions - Get user permissions for a simlet
 * 
 * Session views:
 * - GET /views/sessions/:session_id - Get session by ID
 * - GET /views/sessions/simlet/:simlet_id/user/:username - Get sessions by simlet and user
 * - GET /views/sessions/:session_id/permissions - Get user permissions for a session
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
router.get("/simlets/user/:username", getSimletsByUsernameController);
router.get("/simlets/:simlet_id/permissions", getSimletUserPermissionsController);
router.get("/simlets/:simlet_id", getSimletByIdController);

/**
 * Session view routes  
 * Base path: /views/sessions/
 * Note: More specific routes must come before parameterized routes
 */
router.get("/sessions/simlet/:simlet_id/user/:username", getSessionBySimletIdAndUsernameController);
router.get("/sessions/:session_id/permissions", getSessionUserPermissionsController);
router.get("/sessions/:session_id", getSessionByIdController);

export default router;