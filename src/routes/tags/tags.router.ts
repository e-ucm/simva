/**
 * Express router for tag-related API endpoints.
 * 
 * Routes:
 * - GET / - Get simlet tags for user
 * - POST / - Create a new tag element
 * - PATCH /:tag_id - Update a tag element
 * - DELETE /:tag_id - Delete a tag element
 * 
 * @module routes/tags/tags
 * @requires express
 * @requires @/controlers/simlets/tags.controler
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 * 
 * @type {Router}
 */

import * as tagsControler from "@/controlers/simlets/tags.controler";
import { Router } from "express";
const router = Router({ mergeParams: true });

router.get("/", tagsControler.getSimletTagsForUser);
router.post("/", tagsControler.createTagElement);
router.patch("/:tag_id", tagsControler.updateTagElement);
router.delete("/:tag_id", tagsControler.deleteTagElement);

export default router;