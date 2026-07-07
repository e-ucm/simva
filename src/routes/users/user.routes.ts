import { Router } from "express";
import * as UserControler from "@/controlers/users/user.controler";

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
 * @module routes/users/user
 * @requires express
 * @requires @/controlers/users/user.controler
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
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
router.get("/", UserControler.getUsers);
// profile
router.get("/me", UserControler.getMe);

/**
 * Obtains the list of surveys owned by current user.
 * 
 */
//router.get('/islimesurveyadmin', isLimesurveyAdmin); // For testing purposes, can be removed later

/**
 * Receives two valid JWT tokens and adds to the main
 * account, as an external_entity, the secondary account
 * 
 */
//router.post('/link', linkAccount); // For testing purposes, can be removed later
/**
 * Receives the SSO events and updates the users, both creating
 * the users and updating their roles and permissions 
 * 
 */
//router.post('/events', getUserEvents);
// User-specific operations
router.patch("/:username", UserControler.patchUser);

export default router;