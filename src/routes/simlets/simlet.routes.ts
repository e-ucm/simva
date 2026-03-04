/**
 * @fileoverview Express router for simlet-related API endpoints.
 * Handles routing for SIMVA simlet management operations.
 * 
 * A Simlet (Simulation Learning Environment Template) is the top-level learning container
 * that contains sessions and activities for educational research studies.
 * 
 * @module routes/simlets/simlet
 * @requires express
 * @requires @/controlers/simlets/simlet.controller
 */

import { Router } from "express";
import { 
  getAllSimlets,
  getSimletById,
  createSimlet,
  patchSimlet,
  deleteSimlet,
  getSimletParticipants,
  getSimletSchedule,
  exportSimlet
} from "@/controlers/simlets/simlet.controler";

// Import sub-routers
import simletPermissionsRouter from "./simlet.permissions.routes";
import sessionRouter from "./session.routes";
import simletGroupsRouter from "./simlet.groups.routes";

/**
 * Express router for simlet-related API endpoints.
 * 
 * Routes:
 * - GET / - Retrieve all simlets with optional pagination and filtering
 * - POST / - Create a new simlet
 * - GET /:simlet_id/export - Export a simlet
 * - GET /:simlet_id - Retrieve a simlet by ID
 * - PATCH /:simlet_id - Update a simlet by ID
 * - DELETE /:simlet_id - Delete a simlet by ID
 * - GET /:simlet_id/participants - Get participants allocated to a simlet
 * - GET /:simlet_id/schedule - Get the schedule of a simlet
 * 
 * Sub-routers:
 * - /:simlet_id/permissions - Simlet permissions routes
 * - /:simlet_id/sessions - Session routes (includes activities and session permissions)
 * - /:simlet_id/groups - Group management routes
 * - /:simlet_id/allocator - Allocator management routes
 * 
 * @type {Router}
 * 
 * @example
 * ```typescript
 * import simletRoutes from '@/routes/simlets/simlet.routes';
 * app.use('/simlets', simletRoutes);
 * 
 * // GET /simlets - all simlets
 * // GET /simlets?limit=10&offset=20 - paginated simlets
 * // POST /simlets - create simlet
 * // PATCH /simlets/123 - update simlet
 * // DELETE /simlets/123 - delete simlet
 * // GET /simlets/123 - single simlet
 * // GET /simlets/123/allocator - simlet's allocator
 * // GET /simlets/123/participants - simlet's participants
 * // GET /simlets/123/groups - simlet's groups
 * // GET /simlets/123/sessions - simlet's sessions
 * // GET /simlets/123/sessions/456 - specific session in simlet
 * // GET /simlets/123/sessions/456/activities - activities in session
 * // GET /simlets/123/sessions/456/permissions - session permissions
 * ```
 */
const router = Router();

// Collection endpoints (should come before parameterized routes)
router.get("/", getAllSimlets);
router.post("/", createSimlet);
//router.post('/import', importSimlet);
router.get('/:simlet_id/export', exportSimlet);

// Individual resource endpoints
router.get("/:simlet_id", getSimletById);
router.patch("/:simlet_id", patchSimlet);
router.delete("/:simlet_id", deleteSimlet);

// Additional simlet-related endpoints
router.get("/:simlet_id/participants", getSimletParticipants);
router.get("/:simlet_id/schedule", getSimletSchedule);

// Mount sub-routers
router.use("/:simlet_id/permissions", simletPermissionsRouter);
router.use("/:simlet_id/sessions", sessionRouter);
router.use("/:simlet_id/groups", simletGroupsRouter);

export default router;