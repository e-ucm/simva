/**
 * @fileoverview Express router for session permissions API endpoints.
 * Handles routing for session permission management operations.
 * 
 * @module routes/simlets/session.permissions
 * @requires express
 * @requires @/controlers/simlets/simlet.controller
 */

import { Router } from "express";
import * as SessionPermissionControler from "@/controlers/simlets/session.permissions.controler";

/**
 * Express router for session permissions endpoints.
 * 
 * Routes (mounted at /:simlet_id/sessions/:session_id/permissions):
 * - GET / - Get all permissions for a session
 * - POST / - Create permissions for a session
 * - GET /:user_id - Get permissions for a specific user
 * - PATCH /:user_id - Update permissions for a specific user
 * - DELETE /:user_id - Delete permissions for a specific user
 * 
 * @type {Router}
 */
const router = Router({ mergeParams: true });

router.get("/", SessionPermissionControler.getSessionPermissions);
router.post("/", SessionPermissionControler.createSessionPermissions);
router.get("/:user_id", SessionPermissionControler.getSessionPermissionsForUser);
router.patch("/:user_id", SessionPermissionControler.patchSessionPermissionsForUser);
router.delete("/:user_id", SessionPermissionControler.deleteSessionPermissionsForUser);

export default router;
