import { Router } from "express";
import { 
  getGroupPermissions, 
  getUserGroupPermissions,
  addGroupPermission,
  removeGroupPermission,
  hasGroupPermission,
  getGroupPermissionsByType,
  getUserGroups
} from "@/controlers/groups/groupPermissions.controler";

/**
 * Express router for group permissions-related API endpoints.
 * 
 * Routes:
 * - GET /group/:groupId - Get all permissions for a specific group
 * - GET /group/:groupId/permission/:permission - Get users with specific permission in group
 * - GET /user/:userId - Get all group permissions for a specific user
 * - GET /user/:userId/groups - Get all groups where user has any permissions
 * - POST /group/:groupId/user/:userId/permission/:permission - Add permission to user in group
 * - DELETE /group/:groupId/user/:userId/permission/:permission - Remove permission from user in group
 * - GET /group/:groupId/user/:userId/permission/:permission/exists - Check if user has permission in group
 * 
 * @type {Router}
 * 
 * @example
 * ```typescript
 * import groupPermissionsRoutes from '@/routes/groups/groupPermissions.routes';
 * app.use('/group-permissions', groupPermissionsRoutes);
 * 
 * // GET /group-permissions/group/5 - all permissions in group 5
 * // POST /group-permissions/group/5/user/123/permission/edit - grant edit permission
 * // DELETE /group-permissions/group/5/user/123/permission/edit - revoke edit permission
 * ```
 */
const router = Router();

// Group-based operations
router.get("/group/:groupId", getGroupPermissions);
router.get("/group/:groupId/permission/:permission", getGroupPermissionsByType);
router.post("/group/:groupId/user/:userId/permission/:permission", addGroupPermission);
router.delete("/group/:groupId/user/:userId/permission/:permission", removeGroupPermission);
router.get("/group/:groupId/user/:userId/permission/:permission/exists", hasGroupPermission);

// User-based operations
router.get("/user/:userId", getUserGroupPermissions);
router.get("/user/:userId/groups", getUserGroups);

export default router;