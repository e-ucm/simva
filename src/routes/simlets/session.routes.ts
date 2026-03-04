/**
 * @fileoverview Express router for session API endpoints.
 * Handles routing for session management within simlets.
 * 
 * @module routes/simlets/session
 * @requires express
 * @requires @/controlers/simlets/simlet.controller
 */

import { Router } from "express";
import { 
  getSimletSessions,
  createSimletSession,
  getSimletSession,
  patchSimletSession,
  deleteSimletSession,
  getSimletSessionParticipants,
  activateSimletSession,
  allocateToSessionSimlet,
  getSimletSessionCount
} from "@/controlers/simlets/session.controler";
import sessionPermissionsRouter from "./session.permissions.routes";
import sessionActivitiesRouter from "./session.activities.routes";

/**
 * Express router for session endpoints.
 * 
 * Routes (mounted at /:simlet_id/sessions):
 * - GET / - Get all sessions in a simlet
 * - POST / - Create a new session
 * - GET /:session_id - Get a specific session
 * - PATCH /:session_id - Update a session
 * - DELETE /:session_id - Delete a session
 * - GET /:session_id/participants - Get session participants
 * - POST /:session_id/activate - Activate a session
 * - POST /:session_id/allocate/:id - Allocate to a session
 * 
 * Sub-routers:
 * - /:session_id/permissions - Session permissions routes
 * - /:session_id/activities - Session activities routes
 * 
 * @type {Router}
 */
const router = Router({ mergeParams: true });

router.get("/", getSimletSessions);
router.get("/count", getSimletSessionCount);
router.post("/", createSimletSession);
router.get("/:session_id", getSimletSession);
router.patch("/:session_id", patchSimletSession);
router.delete("/:session_id", deleteSimletSession);
router.get("/:session_id/participants", getSimletSessionParticipants);
router.post("/:session_id/activate", activateSimletSession);
router.post("/:session_id/allocate/:id", allocateToSessionSimlet);

// Mount sub-routers
router.use("/:session_id/permissions", sessionPermissionsRouter);
router.use("/:session_id/activities", sessionActivitiesRouter);

export default router;
