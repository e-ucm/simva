import { NotFoundError } from "@/lib/errors/appErrors";
import { Activity } from "@/lib/mappers/activities/Activity";

export function getStatementsLRSForActivity(currentUserid: number, activityId: number) {
    throw new NotFoundError("Endpoint not implemented yet");
}

export async function sendStatementsLRSForActivity(currentUserId: number, activityId: number, body: any, lrsmanagerUserId: number): Promise<number[]> {
    let activity = await Activity.getFromDbData(activityId,currentUserId, true);
    if(!activity) {
        throw new NotFoundError("The user you are trying to set statement to is not a participant");
    }
    if(await activity.canSendStatementsLRS()) {
        let ids = await activity.sendStatementsLRSForActivity(lrsmanagerUserId, body);
        return ids;
    } else {
        return [];
    }
}

export function getAgentsLRSForActivity(currentUserId: number, activityId: number) {
    throw new NotFoundError("Endpoint not implemented yet");
}

export function getAgentsProfileLRSForActivity(currentUserId: number, activityId: number) {
    throw new NotFoundError("Endpoint not implemented yet");
}

export function postAgentsProfileLRSForActivity(currentUserId: number, activityId: number, body: any) {
    throw new NotFoundError("Endpoint not implemented yet");
}

export function updateAgentsProfileLRSForActivity(currentUserId: number, activityId: number, body: any) {
    throw new NotFoundError("Endpoint not implemented yet");
}

export function deleteAgentsProfileLRSForActivity(currentUserId: number, activityId: number) {
    throw new NotFoundError("Endpoint not implemented yet");
}

export function getActivitiesLRSForActivity(currentUserId: number, activityId: number) {
    throw new NotFoundError("Endpoint not implemented yet");
}

export function getActivitiesProfileLRSForActivity(currentUserId: number, activityId: number) {
    throw new NotFoundError("Endpoint not implemented yet");
}

export function postActivitiesProfileLRSForActivity(currentUserId: number, activityId: number, body: any) {
    throw new NotFoundError("Endpoint not implemented yet");
}

export function updateActivitiesProfileLRSForActivity(currentUserId: number, activityId: number, body: any) {
    throw new NotFoundError("Endpoint not implemented yet");
}

export function deleteActivitiesProfileLRSForActivity(currentUserId: number, activityId: number) {
    throw new NotFoundError("Endpoint not implemented yet");
}

export function getActivitiesStateLRSForActivity(currentUserId: number, activityId: number) {
    throw new NotFoundError("Endpoint not implemented yet");
}

export function postActivitiesStateLRSForActivity(currentUserId: number, activityId: number, body: any) {
    throw new NotFoundError("Endpoint not implemented yet");
}

export function updateActivitiesStateLRSForActivity(currentUserId: number, activityId: number, body: any) {
    throw new NotFoundError("Endpoint not implemented yet");
}