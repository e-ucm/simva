/**
 * @fileoverview Express router for simlet permissions API endpoints.
 * Handles routing for simlet permission management operations.
 * 
 * @module routes/simlets/simlet.permissions
 * @requires express
 * @requires @/controlers/simlets/simlet.controller
 */

import { Router } from "express";
import { 
  getSimletPermissions,
  createSimletPermissions,
  getSimletPermissionsForUser,
  patchSimletPermissionsForUser,
  deleteSimletPermissionsForUser
} from "@/controlers/simlets/simlet.permissions.controler";

/**
 * Express router for simlet permissions endpoints.
 * 
 * Routes (mounted at /:simlet_id/permissions):
 * - GET / - Get all permissions for a simlet
 * - POST / - Create permissions for a simlet
 * - GET /:user_id - Get permissions for a specific user
 * - PATCH /:user_id - Update permissions for a specific user
 * - DELETE /:user_id - Delete permissions for a specific user
 * 
 * @type {Router}
 */
const router = Router({ mergeParams: true });

router.get("/", getSimletPermissions);
router.post("/", createSimletPermissions);
router.get("/:user_id", getSimletPermissionsForUser);
router.patch("/:user_id", patchSimletPermissionsForUser);
router.delete("/:user_id", deleteSimletPermissionsForUser);

export default router;
