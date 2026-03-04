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
  addSimletGroup,
  deleteSimletGroup
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
router.post("/:group_id", addSimletGroup);
router.delete("/:group_id", deleteSimletGroup);

router.use("/:group_id/allocate", allocatorrouter);

export default router;
