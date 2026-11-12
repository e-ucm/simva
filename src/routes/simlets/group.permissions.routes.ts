import { Router } from "express";
import { 
  getGroupPermissions,
  createGroupPermissions,
  getGroupPermissionsForUser,
  patchGroupPermissionsForUser,
  deleteGroupPermissionsForUser
} from "@/controlers/simlets/group.permissions.controler";

/**
 * Express router for group-related API endpoints.
 * 
 * Routes (mounted at /simlets/:simlet_id/groups):
 * - GET / - Get permissions for a group
 * - POST / - Create permissions for a user in a group
 * - GET /:user_id - Get permissions for a user in a group
 * - PATCH /:user_id - Update permissions for a user in a group
 * - DELETE /:user_id - Delete permissions for a user in a group
 * 
 * @module routes/groups/group
 * @requires express
 * @requires @/controlers/groups/group.controler
 * @requires @/controlers/groups/groupPermissions.controler
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 * 
 * @type {Router}
 * 
 * @example
 * ```typescript
 * import groupRoutes from '@/routes/groups/group.routes';
 * app.use('/simlets/:simlet_id/groups', groupRoutes);
 * 
 * // GET /simlets/123/groups/5/permissions - get group permissions
 * // POST /simlets/123/groups/5/permissions - create group permissions
 * // GET /simlets/123/groups/5/permissions/1 - get user permissions in group
 * // PATCH /simlets/123/groups/5/permissions/1 - update user permissions in group
 * // DELETE /simlets/123/groups/5/permissions/1 - delete user permissions in group
 * ```
 */
const router = Router();

// Base group operations
router.get("/", getGroups);

// Group permissions routes
router.get("/", getGroupPermissions);
router.post("/", createGroupPermissions);
router.get("/:user_id", getGroupPermissionsForUser);
router.patch("/:user_id", patchGroupPermissionsForUser);
router.delete("/:user_id", deleteGroupPermissionsForUser);

export default router;