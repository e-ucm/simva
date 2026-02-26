import { Router } from "express";
import { 
  getGroups, 
  getGroupById,
  createGroup, 
  updateGroup,
  deleteGroup,
  getGroupCount,
  getGroupParticipants,
  createGroupParticipant,
  deleteGroupParticipant,
  getGroupPermissions,
  createGroupPermissions,
  getGroupPermissionsForUser,
  patchGroupPermissionsForUser,
  deleteGroupPermissionsForUser
} from "@/controlers/groups/group.controler";

/**
 * Express router for group-related API endpoints.
 * 
 * Routes:
 * - GET / - Retrieve all groups with optional pagination and filtering
 * - GET /:id - Retrieve a single group by ID
 * - POST / - Create a new group
 * - PUT /:id - Update an existing group
 * - DELETE /:id - Delete a group by ID
 * - GET /count - Get total count of groups
 * - GET /:id/participants - Get participants of a group
 * - GET /:group_id/permissions - Get permissions for a group
 * - POST /:group_id/permissions - Create permissions for a user in a group
 * - GET /:group_id/permissions/:user_id - Get permissions for a user in a group
 * - PATCH /:group_id/permissions/:user_id - Update permissions for a user in a group
 * - DELETE /:group_id/permissions/:user_id - Delete permissions for a user in a group
 * 
 * @type {Router}
 * 
 * @example
 * ```typescript
 * import groupRoutes from '@/routes/groups/group.routes';
 * app.use('/groups', groupRoutes);
 * 
 * // GET /groups - all groups
 * // GET /groups/5 - single group
 * // POST /groups - create group
 * // PUT /groups/5 - update group
 * // DELETE /groups/5 - delete group
 * // GET /groups/count - count groups
 * // GET /groups/5/participants - get participants of group 5
 * ```
 */
const router = Router();

// Base group operations
router.get("/", getGroups);
router.get("/count", getGroupCount);
router.post("/", createGroup);

// Individual group operations
router.get("/:id", getGroupById);
router.patch("/:id", updateGroup);
router.delete("/:id", deleteGroup);

//router.get("/:id/simlets", getGroupSimlets); // For testing purposes, can be removed later

// Group permissions operations
router.get("/:group_id/permissions", getGroupPermissions);
router.post("/:group_id/permissions", createGroupPermissions);
router.get("/:group_id/permissions/:user_id", getGroupPermissionsForUser);
router.patch("/:group_id/permissions/:user_id", patchGroupPermissionsForUser);
router.delete("/:group_id/permissions/:user_id", deleteGroupPermissionsForUser);

// Group participant operations
router.get("/:id/participants", getGroupParticipants);
router.post("/:id/participants", createGroupParticipant);

// Individual participant operations
router.delete("/:id/participants/:participant_id", deleteGroupParticipant);

export default router;