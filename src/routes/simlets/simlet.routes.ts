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
  updateSimletAllocator,
  getAllocatorFromSimlet,
  getSimletParticipants,
  getSimletGroups,
  getSimletSessions,
  getSimletSession,
  getSessionActivities,
  createSessionActivity,
  createSimletSession,
  patchSimletSession,
  deleteSimletSession,
  getSimletSchedule,
  getSimletPermissions,
  createSimletPermissions,
  getSimletPermissionsForUser,
  patchSimletPermissionsForUser,
  deleteSimletPermissionsForUser,
  getSessionPermissions,
  createSessionPermissions,
  getSessionPermissionsForUser,
  patchSessionPermissionsForUser,
  deleteSessionPermissionsForUser,
  getSimletSessionParticipants
} from "@/controlers/simlets/simlet.controler";

/**
 * Express router for simlet-related API endpoints.
 * 
 * Routes:
 * - GET / - Retrieve all simlets with optional pagination and filtering
 * - POST / - Create a new simlet
 * - GET /search - Search simlets by name or description
 * - GET /:simlet_id - Retrieve a simlet by ID
 * - PUT /:simlet_id - Update a simlet by ID
 * - DELETE /:simlet_id - Delete a simlet by ID
 * - GET /:simlet_id/exists - Check if a simlet exists by ID
 * - GET /:simlet_id/allocator - Get allocator data for a simlet
 * - GET /:simlet_id/participants - Get participants allocated to a simlet
 * - GET /:simlet_id/groups - Get groups associated with a simlet
 * - GET /:simlet_id/sessions - Get sessions of a simlet
 * - GET /:simlet_id/sessions/:session_id - Get details of a specific session in a simlet
 * - GET /:simlet_id/sessions/:session_id/activities - Get activities in a specific session of a simlet
 * - POST /:simlet_id/sessions/:session_id/activities - Create a new activity in a specific session of a simlet
 * - POST /:simlet_id/sessions - Create a new session in a simlet
 * - PATCH /:simlet_id/sessions/:session_id - Update a specific session in a simlet
 * - DELETE /:simlet_id/sessions/:session_id - Delete a specific session in a simlet
 * - GET /:simlet_id/schedule - Get the schedule of a simlet
 * - GET /:simlet_id/permissions - Get permissions for a simlet
 * - POST /:simlet_id/permissions - Create permissions for a simlet
 * - GET /:simlet_id/permissions/:user_id - Get permissions for a user in a simlet
 * - PATCH /:simlet_id/permissions/:user_id - Update permissions for a user in a simlet
 * - DELETE /:simlet_id/permissions/:user_id - Delete permissions for a user in a simlet
 * - GET /:simlet_id/sessions/:session_id/permissions - Get permissions for a session in a simlet
 * - POST /:simlet_id/sessions/:session_id/permissions - Create permissions for a session in a simlet
 * - GET /:simlet_id/sessions/:session_id/permissions/:user_id - Get permissions for a user in a session of a simlet
 * - PATCH /:simlet_id/sessions/:session_id/permissions/:user_id - Update permissions for a user in a session of a simlet
 * - DELETE /:simlet_id/sessions/:session_id/permissions/:user_id - Delete permissions for a user in a session of a simlet
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
 * // PUT /simlets/123 - update simlet
 * // DELETE /simlets/123 - delete simlet
 * // GET /simlets/search?q=math - search simlets
 * // GET /simlets/me - current user's simlets
 * // GET /simlets/123 - single simlet
 * // GET /simlets/123/allocator - simlet's allocator
 * // GET /simlets/123/participants - simlet's participants
 * // GET /simlets/123/groups - simlet's groups
 * // GET /simlets/123/sessions - simlet's sessions
 * // GET /simlets/123/sessions/456 - specific session in simlet
 * ```
 */
const router = Router();

// Collection endpoints (should come before parameterized routes)
router.get("/", getAllSimlets);
router.post("/", createSimlet);
//router.post('/import', importSimlet);
//router.get('/export', exportSimlet);

// Individual resource endpoints
router.get("/:simlet_id", getSimletById);
router.patch("/:simlet_id", patchSimlet);
router.delete("/:simlet_id", deleteSimlet);

//simlet permissions endpoints
router.get("/:simlet_id/permissions", getSimletPermissions);
router.post("/:simlet_id/permissions", createSimletPermissions);
router.get("/:simlet_id/permissions/:user_id", getSimletPermissionsForUser);
router.patch("/:simlet_id/permissions/:user_id", patchSimletPermissionsForUser);
router.delete("/:simlet_id/permissions/:user_id", deleteSimletPermissionsForUser);

// Session endpoints
router.get("/:simlet_id/sessions", getSimletSessions);
router.post("/:simlet_id/sessions", createSimletSession);
router.get("/:simlet_id/sessions/:session_id", getSimletSession);
router.patch("/:simlet_id/sessions/:session_id", patchSimletSession);
router.delete("/:simlet_id/sessions/:session_id", deleteSimletSession);
router.get("/:simlet_id/sessions/:session_id/participants", getSimletSessionParticipants);

//session permissions endpoints
router.get("/:simlet_id/sessions/:session_id/permissions", getSessionPermissions);
router.post("/:simlet_id/sessions/:session_id/permissions", createSessionPermissions);
router.get("/:simlet_id/sessions/:session_id/permissions/:user_id", getSessionPermissionsForUser);
router.patch("/:simlet_id/sessions/:session_id/permissions/:user_id", patchSessionPermissionsForUser);
router.delete("/:simlet_id/sessions/:session_id/permissions/:user_id", deleteSessionPermissionsForUser);

// Activity list endpoints
router.get("/:simlet_id/sessions/:session_id/activities", getSessionActivities);
router.post("/:simlet_id/sessions/:session_id/activities", createSessionActivity);
//router.patch("/:simlet_id/sessions/:session_id/activities/:activity_id", updateActivity);
//router.delete("/:simlet_id/sessions/:session_id/activities/:activity_id", deleteActivity);

// Additional simlet-related endpoints
router.get("/:simlet_id/groups", getSimletGroups);
router.get("/:simlet_id/participants", getSimletParticipants);
router.get("/:simlet_id/allocator", getAllocatorFromSimlet);
router.patch("/:simlet_id/allocator", updateSimletAllocator);

router.get("/:simlet_id/schedule", getSimletSchedule);

export default router;