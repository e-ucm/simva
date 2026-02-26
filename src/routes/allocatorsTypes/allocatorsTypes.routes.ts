import { Router } from "express";
import { getAllocatorTypes } from "@/controlers/allocatorTypes/allocatorTypes.controler";

/**
 * Express router for allocator type-related API endpoints.
 * 
 * Routes:
 * - GET / - Retrieve all allocator types
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
// Validators
import { addValidations } from '@/lib/utils/validator';
addValidations('/allocatortypes', router);

// Base allocator type operations
router.get("/", getAllocatorTypes);

export default router;