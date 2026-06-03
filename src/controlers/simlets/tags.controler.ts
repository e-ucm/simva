
import { Response, NextFunction } from "express";
import * as tagService from "@/services/simlets/tags.services";
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { logger } from "@/lib/logger";
import { AuthentificationError } from "@/lib/errors/appErrors";

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