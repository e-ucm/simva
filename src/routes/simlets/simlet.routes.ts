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
  updateSimlet,
  deleteSimlet,
  searchSimlets,
  getAllocatorFromSimlet,
  getSimletParticipants
} from "@/controlers/simlets/simlet.controler";

/**
 * Express router for simlet-related API endpoints.
 * 
 * Routes:
 * - GET / - Retrieve all simlets with optional pagination and filtering
 * - POST / - Create a new simlet
 * - GET /search - Search simlets by name or description
 * - GET /:id - Retrieve a simlet by ID
 * - PUT /:id - Update a simlet by ID
 * - DELETE /:id - Delete a simlet by ID
 * - GET /:id/exists - Check if a simlet exists by ID
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
 * // GET /simlets?coordinator=123 - simlets by coordinator
 * // POST /simlets - create simlet
 * // PUT /simlets/123 - update simlet
 * // DELETE /simlets/123 - delete simlet
 * // GET /simlets/count - total count
 * // GET /simlets/search?q=math - search simlets
 * // GET /simlets/sandbox - sandbox simlets
 * // GET /simlets/me - current user's simlets
 * // GET /simlets/123 - single simlet
 * // GET /simlets/123/exists - check existence
 * ```
 */
const router = Router();

// Collection endpoints (should come before parameterized routes)
router.get("/search", searchSimlets);
router.get("/", getAllSimlets);
router.post("/", createSimlet);

// Individual resource endpoints
router.get("/:id/allocator", getAllocatorFromSimlet)
router.get("/:id/participants", getSimletParticipants);
router.get("/:id", getSimletById);
router.put("/:id", updateSimlet);
router.delete("/:id", deleteSimlet);

export default router;