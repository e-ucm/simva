import { Router } from "express";
import { 
  getGroups
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

export default router;