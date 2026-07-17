import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import * as tagService from "@/services/simlets/tags.services";
import { logger } from "@/lib/logger";

/**
 * Retrieves all simlet tags for the current user.
 * 
 * @async
 * @function getSimletTagsForUser
 * @param {AuthenticatedRequest} req - Express request object with authenticated user info
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes errors to next middleware
 * 
 * @example
 * // GET /tags
 * // Returns array of tag objects
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function getSimletTagsForUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    let currentUser = req.user?.sql.user_id as number;
    const tags = await tagService.getSimletTagsForUser(currentUser);
    res.json(tags.map(tag => tag.toJSON()));
  } catch (error) {
    logger.error(`Error getting simlet tags for user: ${error}`);
    next(error);
  }
}

/**
 * Creates a new simlet tag element.
 * 
 * @async
 * @function createTagElement
 * @param {AuthenticatedRequest} req - Express request object with authenticated user info and tag data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes errors to next middleware
 * 
 * @example
 * // POST /tags
 * // Body: { "name": "Mathematics", "category": "Subject" }
 * // Returns: created tag object
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function createTagElement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const current_user_id = req.user?.sql?.user_id as number;
    const tag = await tagService.createTagElement(req.body, current_user_id);
    res.json(tag.toJSON());
  } catch (error) {
    logger.error(`Error adding simlet tag for user: ${error}`);
    next(error);
  }
}

/**
 * Updates an existing simlet tag element.
 * 
 * @async
 * @function updateTagElement
 * @param {AuthenticatedRequest} req - Express request object with authenticated user info, tag_id in URL parameters, and updated tag data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes errors to next middleware
 * 
 * @example
 * // PATCH /tags/:tag_id
 * // Body: { "name": "Updated Name", "category": "Updated Category" }
 * // Returns: updated tag object
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function updateTagElement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const tag_id = req.params.tag_id as unknown as number;
        const current_user_id = req.user?.sql?.user_id as number;
        const tag = await tagService.updateTagElement(tag_id, req.body, current_user_id);
    res.json(tag.toJSON());
    } catch (error) {
        logger.error(`Error updating simlet tag for user: ${error}`);
        next(error);
    }
}

/**
 * Deletes a simlet tag element.
 * 
 * @async
 * @function deleteTagElement
 * @param {AuthenticatedRequest} req - Express request object with authenticated user info and tag_id in URL parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {Error} Passes errors to next middleware
 * 
 * @example
 * // DELETE /tags/:tag_id
 * // Returns: 200 OK with message "Tag deleted successfully"
 * 
 * @see {@link https://github.com/e-ucm/simva#simva-api-documentation|SIMVA API Documentation}
 */
export async function deleteTagElement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const tag_id = req.params.tag_id as unknown as number;
    const current_user_id = req.user?.sql?.user_id as number;
    await tagService.deleteTagElement(tag_id, current_user_id);
    res.json({ message: "Tag deleted successfully" });
  } catch (error) {
    logger.error(`Error deleting simlet tag for user: ${error}`);
    next(error);
  }
}