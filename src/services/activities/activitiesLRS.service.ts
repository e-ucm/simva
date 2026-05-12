import { NotFoundError, NotImplementedError } from "@/lib/errors/appErrors";
import { Activity } from "@/lib/mappers/activities/Activity";

export async function getStatementsLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, query: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.getLRSStatements(query);
}

export async function getMoreStatementsLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, more: string) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.getLRSMoreStatements(more);
}

export async function sendStatementsLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, body: any, lrsmanagerUserId: number): Promise<number[]> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    if(!activity) {
        throw new NotFoundError("The user you are trying to set statement to is not a participant");
    }
    if(await activity.canSendStatementsLRS()) {
        await activity.processStatementsForActivity(currentUserId, body);
        let ids = await activity.sendLRSStatements(lrsmanagerUserId, body);
        return ids;
    } else {
        return [];
    }
}

export async function getAgentsLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, params: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.getLRSAgents(params);
}

export async function getAgentsProfileLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, params: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.getLRSAgentsProfile(params);
}

export async function postAgentsProfileLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, body: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.postLRSAgentsProfile(body);
}

export async function updateAgentsProfileLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, body: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.updateLRSAgentsProfile(body);
}

export async function deleteAgentsProfileLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, params: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.deleteLRSAgentsProfile(params);
}

export async function getActivitiesLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, params: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.getLRSActivities(params);
}

export async function getActivitiesProfileLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, params: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.getLRSActivitiesProfile(params);
}

export async function postActivitiesProfileLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, body: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.postLRSActivitiesProfile(body);
}

export async function updateActivitiesProfileLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, body: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.updateLRSActivitiesProfile(body);
}

export async function deleteActivitiesProfileLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, params: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.deleteLRSActivitiesProfile(params);
}

export async function getActivitiesStateLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, params: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.getLRSActivitiesState(params);
}

export async function postActivitiesStateLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, body: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.postLRSActivitiesState(body);
}

export async function updateActivitiesStateLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, body: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.updateLRSActivitiesState(body);
}

export async function deleteActivitiesStateLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, params: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.deleteLRSActivitiesState(params);
}

export async function putStatementsLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, body: any, lrsmanagerUserId: number): Promise<number[]> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    if(!activity) {
        throw new NotFoundError("The user you are trying to set statement to is not a participant");
    }
    if(await activity.canSendStatementsLRS()) {
        await activity.processStatementsForActivity(currentUserId, body);
        let ids = await activity.sendLRSStatements(lrsmanagerUserId, body);
        return ids;
    } else {
        return [];
    }
}

export async function putAgentsProfileLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, body: any, lrsmanagerUserId: number): Promise<Object> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    if(!activity) {
        throw new NotFoundError("The user you are trying to set statement to is not a participant");
    }
    return await activity.updateLRSAgentsProfile(body);
}

export async function putActivitiesProfileLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, body: any, lrsmanagerUserId: number): Promise<Object> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    if(!activity) {
        throw new NotFoundError("The user you are trying to set statement to is not a participant");
    }
    return await activity.updateLRSActivitiesProfile(body);
}

export async function getAboutLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    if(!activity) {
        throw new NotFoundError("The user you are trying to set statement to is not a participant");
    }
    return await activity.getLRSAbout();
}

export async function getExtensionLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, extensionId: string) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    if(!activity) {
        throw new NotFoundError("The user you are trying to set statement to is not a participant");
    }
    return await activity.getLRSExtension(extensionId);
}   