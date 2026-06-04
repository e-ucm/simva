/**
 * @fileoverview Express router for simlet groups API endpoints.
 * Handles routing for group management within simlets.
 * 
 * @module routes/simlets/simlet.groups
 * @requires express
 * @requires @/controlers/simlets/simlet.controller
 */

import { Router } from "express";
import * as SimletGroupsControler from "@/controlers/simlets/simlet.groups.controler";

/**
 * Express router for simlet groups endpoints.
 * 
 * Routes (mounted at /:simlet_id/groups):
 * - GET / - Get all groups associated with a simlet
 * - POST /:group_id - Add a group to a simlet
 * - DELETE /:group_id - Remove a group from a simlet
 * 
 * @type {Router}
 */
const router = Router({ mergeParams: true });

router.get("/", SimletGroupsControler.getSimletGroups);

// Base group operations
router.get("/", SimletGroupsControler.getSimletGroups);
router.get("/count", SimletGroupsControler.getSimletGroupCount);
router.get("/participants/count", SimletGroupsControler.getSimletGroupParticipantsCount);
router.post("/", SimletGroupsControler.createSimletGroup);

// Individual group operations
router.get("/:group_id", SimletGroupsControler.getSimletGroupById);
router.patch("/:group_id", SimletGroupsControler.updateSimletGroup);
router.delete("/:group_id", SimletGroupsControler.deleteSimletGroup);

// Group participant operations
router.get("/:group_id/participants", SimletGroupsControler.getSimletGroupParticipants);
router.get("/:group_id/participants/count", SimletGroupsControler.getSimletGroupParticipantsCount);
router.post("/:group_id/participants", SimletGroupsControler.createSimletGroupParticipant);
router.post("/:group_id/participants/:participant_id", SimletGroupsControler.addSimletGroupParticipant);
// Individual participant operations
router.delete("/:group_id/participants/:participant_id", SimletGroupsControler.deleteGroupParticipant);
router.post("/:group_id/allocate/:session_id", SimletGroupsControler.allocateToSessionSimlet);
export default router;
