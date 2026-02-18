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
  getAllocatorFromSimlet,
  getSimletParticipants,
  getSimletGroups,
  getSimletSessions,
  getSimletSession,
  getSessionActivities
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

// Individual resource endpoints
router.get("/:simlet_id", getSimletById);
router.patch("/:simlet_id", patchSimlet);
router.delete("/:simlet_id", deleteSimlet);

// Session endpoints
router.get("/:simlet_id/sessions", getSimletSessions);
router.get("/:simlet_id/sessions/:session_id", getSimletSession);

// Activity list endpoints
router.get("/:simlet_id/sessions/:session_id/activities", getSessionActivities);

// Additional simlet-related endpoints
router.get("/:simlet_id/allocator", getAllocatorFromSimlet);
router.get("/:simlet_id/participants", getSimletParticipants);
router.get("/:simlet_id/groups", getSimletGroups);

export default router;