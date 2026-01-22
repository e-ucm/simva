import { Router } from "express";
import { 
  getUsers, 
  createUser, 
  deleteUserById, 
  patchUser,
  getMe
} from "@/controlers/user.controller";

/**
 * Express router for user-related API endpoints.
 * 
 * Routes:
 * - GET / - Retrieve all users or a single user by username query parameter
 * - POST / - Create a new user
 * - DELETE /:id - Delete a user by ID
 * - PATCH /:username - Modify user (e.g., role)
 * - GET /me - Get current user information
 * 
 * @type {Router}
 * 
 * @example
 * ```typescript
 * import userRoutes from '@/routes/user.routes';
 * app.use('/users', userRoutes);
 * 
 * // GET /users - all users
 * // GET /users?username=john - single user
 * // POST /users - create user
 * // DELETE /users/5 - delete user
 * // PATCH /users/john - modify user
 * // GET /users/me - current user
 * ```
 */
const router = Router();

// Base user operations
router.get("/", getUsers);
router.post("/", createUser);
router.delete("/:id", deleteUserById);

// User-specific operations
router.patch("/:username", patchUser);

// profile
router.get("/me", getMe);

export default router;