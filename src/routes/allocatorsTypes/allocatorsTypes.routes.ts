import { Router } from "express";
import { getAllocatorTypes } from "@/controlers/allocatorTypes/allocatorTypes.controler";

/**
 * Express router for allocator type-related API endpoints.
 * 
 * Routes:
 * - GET / - Retrieve all allocator types
 * 
 * @module routes/allocatorsTypes/allocatorsTypes
 * @requires express
 * @requires @/controlers/allocatorTypes/allocatorTypes.controler
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 * 
 * @type {Router}
 * 
 * @example
 * ```typescript
 * import allocatorsTypesRoutes from '@/routes/allocatorsTypes/allocatorsTypes.routes';
 * app.use('/allocatortypes', allocatorsTypesRoutes);
 * // GET /allocatortypes - all allocator types
 * // GET /allocatortypes?type=random - allocator type with type 'random'
 * ``` 
 */
const router = Router();

// Base allocator type operations
router.get("/", getAllocatorTypes);

export default router;