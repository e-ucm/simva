import { Router } from "express";
import { 
  getActivityTypes
} from "@/controlers/activitiesTypes/activitiesTypes.controler";

/**
 * Express router for activity type-related API endpoints.
 * 
 * Routes:
 * - GET / - Retrieve all activity types
 * 
 * @module routes/activitiesTypes/activitiesTypes
 * @requires express
 * @requires @/controlers/activitiesTypes/activitiesTypes.controler
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 * 
 * @type {Router}
 * 
 * @example
 * ```typescript
 * import activitiesTypesRoutes from '@/routes/activitiesTypes/activitiesTypes.routes';
 * app.use('/activitiestypes', activitiesTypesRoutes);
 * // GET /activitiestypes - all activity types
 * // GET /activitiestypes?type=gameplay - activity type with type 'gameplay'
 * ``` 
 */
const router = Router();

// Base activity type operations
router.get("/", getActivityTypes);

export default router;