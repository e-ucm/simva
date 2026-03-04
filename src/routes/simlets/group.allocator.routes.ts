/**
 * @fileoverview Express router for simlet allocator API endpoints.
 * Handles routing for allocator management within simlets.
 * 
 * @module routes/simlets/simlet.allocator
 * @requires express
 * @requires @/controlers/simlets/simlet.allocator.controler
 */

import { Router } from "express";
import { 
  getAllocatorFromSimlet,
  updateSimletAllocator,
  allocateToSessionSimlet
} from "@/controlers/simlets/group.allocator.controler";

/**
 * Express router for simlet allocator endpoints.
 * 
 * Routes (mounted at /:simlet_id/allocator):
 * - GET / - Get allocator data for a simlet
 * - PATCH / - Update allocator for a simlet
 * 
 * @type {Router}
 */
const router = Router({ mergeParams: true });

router.get("/", getAllocatorFromSimlet);
router.patch("/", updateSimletAllocator);
router.post("/:session_id/allocate/:id", allocateToSessionSimlet);
//router.delete("/:session_id/deallocate/:id", deallocateFromSessionSimlet);

export default router;
