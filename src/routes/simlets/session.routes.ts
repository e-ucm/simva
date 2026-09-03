/**
 * @fileoverview Express router for session API endpoints.
 * Handles routing for session management within simlets.
 * 
 * @module routes/simlets/session
 * @requires express
 * @requires @/controlers/simlets/simlet.controller
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */

import { Router } from "express";
import * as SessionControler from "@/controlers/simlets/session.controler";
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

router.get("/", SessionControler.getSimletSessions);
router.get("/count", SessionControler.getSimletSessionCount);
router.post("/", SessionControler.createSimletSession);
router.get("/:session_id", SessionControler.getSimletSession);
router.patch("/:session_id", SessionControler.patchSimletSession);
router.delete("/:session_id", SessionControler.deleteSimletSession);
router.get("/:session_id/participants", SessionControler.getSimletSessionParticipants);
router.post("/:session_id/activate", SessionControler.activateSimletSession);
router.post("/:session_id/tags/:tag_id", SessionControler.addTagForUser);
router.delete("/:session_id/tags/:tag_id", SessionControler.deleteTagForUser);

router.post("/:session_id/tester", SessionControler.setTesterForSession);
router.patch("/:session_id/tester", SessionControler.resetTesterForSession);
router.delete("/:session_id/tester", SessionControler.deleteTesterForSession);

// New route for getting LRS statements for a session
router.get("/:session_id/lrs/statements", SessionControler.getLRSStatementsForSession);
router.get("/:session_id/lrs_test_statements", SessionControler.getTestLRSStatementsForSession);

// Mount sub-routers
router.use("/:session_id/permissions", sessionPermissionsRouter);
router.use("/:session_id/activities", sessionActivitiesRouter);

export default router;
