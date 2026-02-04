import { Router } from "express";
import { getAllocatorTypes } from "@/services/allocators/allocatorsTypes.service";

/**
 * Express router for allocator type-related API endpoints.
 * 
 * Routes:
 * - GET / - Retrieve all allocator types
 * @type {Router}
 * 
 * @example
 * ```typescript
 * import allocatorsTypesRoutes from '@/routes/allocatorTypes/allocatorTypes.routes';
 * app.use('/allocatortypes', allocatorsTypesRoutes);
 * // GET /allocatortypes - all allocator types
 * // GET /allocatortypes?type=random - allocator type with type 'random'
 * ``` 
 */
const router = Router();

// Base allocator type operations
router.get("/", getAllocatorTypes);

export default router;