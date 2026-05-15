
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { NextFunction, Response } from "express";
import * as activitiesLRSService from "@/services/activities/activitiesLRS.service";
import { AuthentificationError, BadRequestError, NotFoundError, NotImplementedError, ValidationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";
import { User } from "@/lib/mappers/Users/User";
import { getAccess } from "@/controlers/users/user.helper";

export async function getStatementsLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        const statements = await activitiesLRSService.getStatementsLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, req.query);
        return res.status(200).json(statements); 
    } catch (err) {
        next(err);
    }
}

export async function getTestStatementsLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        const statements = await activitiesLRSService.getTestStatementsLRSForActivity(access.currentUserId as number, currentUser?.username!, access.is_admin, access.allocated, activityId, req.query);
        return res.status(200).json(statements); 
    } catch (err) {
        next(err);
    }
}

export async function getMoreStatementsLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        const moreStatements = req.query.more as string;
        if(!moreStatements) {
            throw new BadRequestError("Invalid query parameter 'more'");
        }
        const statements = await activitiesLRSService.getMoreStatementsLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, moreStatements);
        return res.status(200).json(statements);
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
        const access = getAccess(currentUser);
        let ids: number[] = [];
        if (access.is_admin) {
            ids = await activitiesLRSService.sendStatementsLRSForActivity(access.currentUserId, access.is_admin, access.allocated, activityId, body, access.currentUserId);
        } else if (access.canImpersonate) {
            if(body && body.length > 0 && typeof body[0] === "object") {
                const postuserId = (await User.getFromDbData(undefined, body[0].actor.account.name)).user_id;
                if(isNaN(postuserId)) {
                    throw new ValidationError("Invalid username in query parameter");
                }
                ids = await activitiesLRSService.sendStatementsLRSForActivity(postuserId, false, true, activityId, body, access.currentUserId);
            } else {
                throw new ValidationError("Invalid request body for lrsmanager role");
            }
        } else {
            ids = await activitiesLRSService.sendStatementsLRSForActivity(access.currentUserId, access.is_admin, access.allocated, activityId, body, access.currentUserId);
        }
        return res.status(201).json(ids);
    } catch (err) {
        next(err);
    }
}

export async function putStatementsLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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
        const access = getAccess(currentUser);
        let ids: number[] = [];
        if (access.is_admin) {
            ids = await activitiesLRSService.sendStatementsLRSForActivity(access.currentUserId, access.is_admin, access.allocated, activityId, body, access.currentUserId);
        } else if (access.canImpersonate) {
            if(body && body.length > 0 && typeof body[0] === "object") {
                const postuserId = (await User.getFromDbData(undefined, body[0].actor.account.name)).user_id;
                if(isNaN(postuserId)) {
                    throw new ValidationError("Invalid username in query parameter");
                }
                ids = await activitiesLRSService.sendStatementsLRSForActivity(postuserId, false, true, activityId, body, access.currentUserId);
            } else {
                throw new ValidationError("Invalid request body for lrsmanager role");
            }
        } else {
            ids = await activitiesLRSService.sendStatementsLRSForActivity(access.currentUserId, access.is_admin, access.allocated, activityId, body, access.currentUserId);
        }
        return res.status(201).json(ids);
    } catch (err) {
        next(err);
    }
}

export async function getAgentsLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        const agents = await activitiesLRSService.getAgentsLRSForActivity(access.currentUserId as number, access.is_admin,  access.allocated,activityId, req.query);
        return res.status(200).json(agents);
    } catch (err) {
        next(err);
    }
}

export async function getAgentsProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        const agentsProfile = await activitiesLRSService.getAgentsProfileLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, req.query);
        return res.status(200).json(agentsProfile);
    } catch (err) {
        next(err);
    }
}

export async function postAgentsProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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
        const access = getAccess(currentUser);
        await activitiesLRSService.postAgentsProfileLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, body);
        return res.status(204).send();
    } catch (err) {
        next(err);
    }
}

export async function updateAgentsProfileLRSForActivity(req: AuthenticatedRequest, res:  Response, next: NextFunction) {
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
        const access = getAccess(currentUser);
        await activitiesLRSService.updateAgentsProfileLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, body);
        return res.status(204).send();
    } catch (err) {
        next(err);
    }
}

export async function deleteAgentsProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        await activitiesLRSService.deleteAgentsProfileLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, req.query);
        return res.status(204).send();
    } catch (err) {
        next(err);
    }
}

export async function getActivitiesLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        const activities = await activitiesLRSService.getActivitiesLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, req.query);
        return res.status(200).json(activities);
    } catch (err) {
        next(err);
    }
}

export async function getActivitiesProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        const activities = await activitiesLRSService.getActivitiesProfileLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, req.query);
        return res.status(200).json(activities);
    } catch (err) {
        next(err);
    }
}

export async function postActivitiesProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        const activities = await activitiesLRSService.postActivitiesProfileLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, req.body);
        return res.status(201).json(activities);
    } catch (err) {
        next(err);
    }
}

export async function updateActivitiesProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        const activities = await activitiesLRSService.updateActivitiesProfileLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, req.body);
        return res.status(200).json(activities);
    } catch (err) {
        next(err);
    }
}

export async function deleteActivitiesProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        const activities = await activitiesLRSService.deleteActivitiesProfileLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, req.query);
        return res.status(204).send();
    } catch (err) {
        next(err);
    }
}

export async function getActivitiesStateLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        const activities = await activitiesLRSService.getActivitiesStateLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, req.query);
        return res.status(200).json(activities);
    } catch (err) {
        next(err);
    }
}

export async function postActivitiesStateLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        if (!access.is_admin && !access.canImpersonate) {
            throw new AuthentificationError("You don't have the right to access this resource");
        }
        const activities = await activitiesLRSService.postActivitiesStateLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, req.body);
        return res.status(201).json(activities);
    } catch (err) {
        next(err);
    }   
}

export async function updateActivitiesStateLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        if (!access.is_admin && !access.canImpersonate) {
            throw new AuthentificationError("You don't have the right to access this resource");
        }
        const activities = await activitiesLRSService.updateActivitiesStateLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, req.body);
        return res.status(200).json(activities);
    } catch (err) {
        next(err);
    }
}

export async function deleteActivitiesStateLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        if (!access.is_admin && !access.canImpersonate) {
            throw new AuthentificationError("You don't have the right to access this resource");
        }
        const activities = await activitiesLRSService.deleteActivitiesStateLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, req.query);
        return res.status(204).send();
    } catch (err) {
        next(err);
    }
}

export async function getAboutLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        const activities = await activitiesLRSService.getAboutLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId);
        return res.status(200).json(activities);
    } catch (err) {
        next(err);
    }
}

 export async function getExtensionLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        const activities = await activitiesLRSService.getExtensionLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, req.params.extension_id as string);
        return res.status(200).json(activities);
    } catch (err) {
        next(err);
    }
}

export async function putAgentsProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        if (!access.is_admin && !access.canImpersonate) {
            throw new AuthentificationError("You don't have the right to access this resource");
        }
        const activities = await activitiesLRSService.putAgentsProfileLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, req.body, access.currentUserId as number);
        return res.status(200).json(activities);
    } catch (err) {
        next(err);
    }
}

export async function putActivitiesProfileLRSForActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        let currentUser = req.user?.sql;
        const activityId = parseInt(req.params.activity_id as string);
        if(isNaN(activityId)) {
            throw new BadRequestError("Invalid activity ID");
        }
        const access = getAccess(currentUser);
        if (!access.is_admin && !access.canImpersonate) {
            throw new AuthentificationError("You don't have the right to access this resource");
        }
        const activities = await activitiesLRSService.putActivitiesProfileLRSForActivity(access.currentUserId as number, access.is_admin, access.allocated, activityId, req.body, access.currentUserId as number);
        return res.status(200).json(activities);
    } catch (err) {
        next(err);
    }
}