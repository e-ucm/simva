/**
 * @fileoverview Express router for simlet allocator API endpoints.
 * Handles routing for allocator management within simlets.
 * 
 * @module routes/simlets/simlet.allocator
 * @requires express
 * @requires @/controlers/simlets/simlet.controller
 */

import { Router } from "express";
import { 
  getAllocatorFromSimlet,
  updateSimletAllocator
} from "@/controlers/simlets/simlet.allocator.controler";

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

export default router;
