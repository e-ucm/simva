
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { NextFunction, Response } from "express";
import * as activitiesLRSService from "@/services/activities/activitiesLRS.service";
import { AuthentificationError, BadRequestError, NotFoundError, NotImplementedError, ValidationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";
import { User } from "@/lib/mappers/Users/User";
import { getAccess } from "@/controlers/users/user.helper";

export function getStatementsLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotImplementedError("Endpoint not implemented yet");    
    } catch (err) {
        next(err);
    }
}

export async function postStatementsLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        let body = req.body;
        if(!body || typeof body !== "object") {
            throw new BadRequestError("Invalid request body");
        }
        const access = currentUser?.role === "lrsmanager"
            ? { currentUserId: currentUser.user_id as number, is_admin: false, canImpersonate: true }
            : { ...getAccess(currentUser), canImpersonate: false };
        let ids: number[] = [];
        if (access.is_admin) {
            ids = await activitiesLRSService.sendStatementsLRSForActivity(activityId, body, access.currentUserId, access.is_admin, access.currentUserId);
        } else if (access.canImpersonate) {
            if(body && body.length > 0 && typeof body[0] === "object") {
                const postuserId = (await User.getFromDbData(undefined, body[0].actor.account.name)).user_id;
                if(isNaN(postuserId)) {
                    throw new ValidationError("Invalid username in query parameter");
                }
                ids = await activitiesLRSService.sendStatementsLRSForActivity(activityId, body, access.currentUserId, false, postuserId);
            } else {
                throw new ValidationError("Invalid request body for lrsmanager role");
            }
        } else {
            ids = await activitiesLRSService.sendStatementsLRSForActivity(activityId, body, access.currentUserId, false, access.currentUserId);
        }
        return res.status(201).json(ids);
    } catch (err) {
        next(err);
    }
}

export function putStatementsLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotImplementedError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

export function getAgentsLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotImplementedError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

export function getAgentsProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotImplementedError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

export function postAgentsProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotImplementedError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

export function updateAgentsProfileLRSForActivity(req: AuthenticatedRequest, res:  Response, next: NextFunction) {
    try {
        throw new NotImplementedError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

export function deleteAgentsProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotImplementedError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

export function getActivitiesLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotImplementedError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

export function getActivitiesProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotImplementedError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

export function postActivitiesProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotImplementedError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

export function updateActivitiesProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotImplementedError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

export function deleteActivitiesProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotImplementedError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

export function getActivitiesStateLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotImplementedError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

export function postActivitiesStateLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotImplementedError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }   
}

export function updateActivitiesStateLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotImplementedError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

export function deleteActivitiesStateLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotImplementedError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

export function getAboutLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotImplementedError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

 export function getExtensionLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotImplementedError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

export function putAgentsProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotImplementedError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

export function putActivitiesProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotImplementedError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}