/**
 * @fileoverview Express router for session permissions API endpoints.
 * Handles routing for session permission management operations.
 * 
 * @module routes/simlets/session.permissions
 * @requires express
 * @requires @/controlers/simlets/simlet.controller
 */

import { Router } from "express";
import { 
  getSessionPermissions,
  createSessionPermissions,
  getSessionPermissionsForUser,
  patchSessionPermissionsForUser,
  deleteSessionPermissionsForUser
} from "@/controlers/simlets/session.permissions.controler";

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

router.get("/", getSessionPermissions);
router.post("/", createSessionPermissions);
router.get("/:user_id", getSessionPermissionsForUser);
router.patch("/:user_id", patchSessionPermissionsForUser);
router.delete("/:user_id", deleteSessionPermissionsForUser);

export default router;
