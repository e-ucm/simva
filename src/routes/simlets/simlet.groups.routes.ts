/**
 * @fileoverview Express router for simlet groups API endpoints.
 * Handles routing for group management within simlets.
 * 
 * @module routes/simlets/simlet.groups
 * @requires express
 * @requires @/controlers/simlets/simlet.controller
 */

import { Router } from "express";
import { 
  getSimletGroups,
  createSimletGroup,
  getSimletGroupCount,
  getSimletGroupById,
  updateSimletGroup,
  deleteSimletGroup,
  getSimletGroupParticipants,
  createSimletGroupParticipant,
  addSimletGroupParticipant,
  deleteGroupParticipant
} from "@/controlers/simlets/simlet.groups.controler";
import allocatorrouter from "@/routes/simlets/group.allocator.routes";

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

router.get("/", getSimletGroups);

// Base group operations
router.get("/", getSimletGroups);
router.get("/count", getSimletGroupCount);
router.post("/", createSimletGroup);

// Individual group operations
router.get("/:group_id", getSimletGroupById);
router.patch("/:group_id", updateSimletGroup);
router.delete("/:group_id", deleteSimletGroup);

// Group participant operations
router.get("/:group_id/participants", getSimletGroupParticipants);
router.post("/:group_id/participants", createSimletGroupParticipant);
router.post("/:group_id/participants/:participant_id", addSimletGroupParticipant);
// Individual participant operations
router.delete("/:group_id/participants/:participant_id", deleteGroupParticipant);

router.use("/:group_id/allocate", allocatorrouter);

export default router;
