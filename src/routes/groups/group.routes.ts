import { Router } from "express";
import { 
  getGroups, 
  getGroupById,
  createGroup, 
  updateGroup,
  deleteGroup,
  getGroupCount
} from "@/controlers/groups/group.controller";

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
 * ```
 */
const router = Router();

// Base group operations
router.get("/", getGroups);
router.get("/count", getGroupCount);
router.post("/", createGroup);

// Individual group operations
router.get("/:id", getGroupById);
router.put("/:id", updateGroup);
router.delete("/:id", deleteGroup);

export default router;