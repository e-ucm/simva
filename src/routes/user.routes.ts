import { Router } from "express";
import { getUsers , createUser, deleteUserById } from "@/controlers/user.controller";

/**
 * Express router for user-related API endpoints.
 * 
 * Routes:
 * - GET / - Retrieve all users or a single user by username query parameter
 * - POST / - Create a new user
 * - DELETE /:id - Delete a user by ID
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
 * ```
 */
const router = Router();

router.get("/", getUsers);
router.post("/", createUser);
router.delete("/:id", deleteUserById);

export default router;