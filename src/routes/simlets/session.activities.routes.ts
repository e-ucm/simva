/**
 * @fileoverview Express router for session activities API endpoints.
 * Handles routing for activity management within sessions.
 * 
 * @module routes/simlets/session.activities
 * @requires express
 * @requires @/controlers/simlets/simlet.controller
 */

import { Router } from "express";
import { 
  getSessionActivities,
  createSessionActivity,
  updateSessionActivity,
  deleteSessionActivity
} from "@/controlers/simlets/session.activities.controler";

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

router.get("/", getSessionActivities);
router.post("/", createSessionActivity);
router.patch("/:activity_id", updateSessionActivity);
router.delete("/:activity_id", deleteSessionActivity);

export default router;
