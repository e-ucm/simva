
import { Response, NextFunction } from "express";
import * as simletShlinkService from "@/services/simlets/simlet.shlink.service";
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { logger } from "@/lib/logger";
import { getAccess } from "@/controlers/users/user.helper";

export async function createShlinkURL(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let simletId = parseInt(req.params.simlet_id as string);
        const access = getAccess(req.user?.sql);
        const response = await simletShlinkService.createShlinkURL(simletId, access.is_admin, access.currentUserId, req.body);
        return res.json(response.toJSON());
    } catch (error) {
        logger.error(error);
        return next(error);
    }
}

export async function getShlinkURL(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let simletId = parseInt(req.params.simlet_id as string);
        const access = getAccess(req.user?.sql);
        const response = await simletShlinkService.getShlinkURL(simletId, access.is_admin, access.currentUserId);
        return res.json(response.toJSON());
    } catch (error) {
        logger.error(error);
        return next(error);
    }
}

export async function updateShlinkURL(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let simletId = parseInt(req.params.simlet_id as string);
        const access = getAccess(req.user?.sql);
        const response = await simletShlinkService.updateShlinkURL(simletId, access.is_admin, access.currentUserId, req.body);
        return res.json(response.toJSON());
    } catch (error) {
        logger.error(error);
        return next(error);
    }
}

export async function deleteShlinkURL(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let simletId = parseInt(req.params.simlet_id as string);
        const access = getAccess(req.user?.sql);
        await simletShlinkService.deleteShlinkURL(simletId, access.is_admin, access.currentUserId);
        return res.status(204).send();
    } catch (error) {
        logger.error(error);
        return next(error);
    }
}