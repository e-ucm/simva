
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { NextFunction, Response } from "express";
import * as activitiesService from "@/services/activities/activitiesLRS.service";
import { AuthentificationError, NotFoundError, ValidationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";
import { Activity } from "@/lib/mappers/activities/Activity";
import { User } from "@/lib/mappers/Users/User";

export function getStatementsLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotFoundError("Endpoint not implemented yet");    
    } catch (err) {
        next(err);
    }
}

export async function postStatementsLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new ValidationError("Invalid activity ID");
        }
        let body = req.body;
        if(!body || typeof body !== "object") {
            throw new ValidationError("Invalid request body");
        }
        let postuser = req.query["user"] as string;
        let currentUserId = currentUser!.user_id as number;
        let ids: number[] = [];
        switch(currentUser?.role) {
            case "lrsmanager":
                if(postuser) {
                    const postuserId = (await User.getFromDbData(undefined, postuser)).user_id;
                    if(isNaN(postuserId)) {
                        throw new ValidationError("Invalid user ID in query parameter");
                    }
                    ids = await activitiesService.sendStatementsLRSForActivity(postuserId, activityId, body, currentUserId!);
                } else {
                    throw new ValidationError("Missing user ID in query parameter for lrsmanager role");
                }
                break;
            case "teacher":
            case "student":
                ids = await activitiesService.sendStatementsLRSForActivity(currentUserId, activityId, body, currentUserId);
                break;
            default:
                throw new AuthentificationError("User role not recognized");
        }
        return res.status(201).json({ ids });
    } catch (err) {
        next(err);
    }
}

export function putStatementsLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotFoundError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

export function getAgentsLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotFoundError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

export function getAgentsProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotFoundError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

export function postAgentsProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotFoundError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

export function updateAgentsProfileLRSForActivity(req: AuthenticatedRequest, res:  Response, next: NextFunction) {
    try {
        throw new NotFoundError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

export function deleteAgentsProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotFoundError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

export function getActivitiesLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotFoundError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

export function getActivitiesProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotFoundError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

export function postActivitiesProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotFoundError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

export function updateActivitiesProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotFoundError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

export function deleteActivitiesProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotFoundError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

export function getActivitiesStateLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotFoundError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

export function postActivitiesStateLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotFoundError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }   
}

export function updateActivitiesStateLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotFoundError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

export function deleteActivitiesStateLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotFoundError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

export function getAboutLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotFoundError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}

 export function getExtensionLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        throw new NotFoundError("Endpoint not implemented yet");
    } catch (err) {
        next(err);
    }
}