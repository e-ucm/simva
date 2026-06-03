/**
 * @fileoverview Express router for session activities API endpoints.
 * Handles routing for activity management within sessions.
 * 
 * @module routes/simlets/session.activities
 * @requires express
 * @requires @/controlers/simlets/simlet.controller
 */

import { Router } from "express";
import * as SessionActivitiesControler from "@/controlers/simlets/session.activities.controler";

/**
 * Express router for session activities endpoints.
 * 
 * Routes (mounted at /:simlet_id/sessions/:session_id/activities):
 * - GET / - Get all activities in a session
 * - POST / - Create a new activity in a session
 * - PATCH /:activity_id - Update an activity
 * - DELETE /:activity_id - Delete an activity
 * 
 * @type {Router}
 */
const router = Router({ mergeParams: true });

router.get("/", SessionActivitiesControler.getSessionActivities);
router.post("/", SessionActivitiesControler.createSessionActivity);
router.patch("/:activity_id", SessionActivitiesControler.updateSessionActivity);
router.delete("/:activity_id", SessionActivitiesControler.deleteSessionActivity);

export default router;
