/**
 * @fileoverview Service for Activity entity operations.
 * Handles business logic for activity management and access control.
 * 
 * Activities in SIMVA represent individual learning tasks within sessions,
 * such as gameplay activities, LimeSurvey questionnaires, or manual activities.
 * Each activity type has specific behaviors and data requirements.
 * 
 * @module services/activities/activities
 * @requires @/lib/mappers/activities/Activity
 * @requires @/lib/mappers/activities/ActivityToClass
 * @requires @/lib/db
 * @requires @/lib/errors/appErrors
 */

import { NotFoundError } from "@/lib/errors/appErrors";
import { Activity } from "@/lib/mappers/activities/Activity";
import { ActivityCompletion } from "@/lib/mappers/ActivityCompletion/ActivityCompletion";
import { ActivityMappingResult } from "@/lib/mappers/ActivityCompletion/ActivityMappingResult";

/**
 * Retrieves a single activity by ID for a specific user.
 * Validates user permissions and ensures the activity is accessible.
 * 
 * @async
 * @function getActivity
 * @param {number} activityId - The unique identifier of the activity
 * @param {number} user_id - The ID of the user requesting the activity
 * @returns {Promise<Activity>} The requested Activity object with user-specific data
 * 
 * @throws {NotFoundError} If the activity doesn't exist or user lacks access
 * @throws {ValidationError} If the provided parameters are invalid
 * @throws {Error} If database query fails
 * 
 * @example
 * ```typescript
 *   const activity = await getActivity(789, 123);
 *   logger.info(activity.name, activity.type);
 * ```
 */
export async function getActivity(activityId: number, allocated: boolean, is_admin: boolean, current_user_id?: number): Promise<Activity> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    //await activity.sendXAPITraceForActivity("test", "initialized", (new Date()).toUTCString(), -1, "");
    return activity;
}

export async function isActivityAccessible(activityId: number, allocated: boolean, is_admin: boolean, current_user_id?: number): Promise<boolean> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    return activity.canBeOpened();
}

export async function getUserTargetForActivity(activityId: number, allocated: boolean, is_admin: boolean, current_user_id?: number): Promise<string> {
    if (current_user_id === undefined) {
        throw new NotFoundError("Target URL not found for the current user");
    }
    let targetMap = await getTargetForActivity(activityId, allocated, is_admin, [current_user_id], current_user_id);
    const target = targetMap ? targetMap.get(current_user_id) : undefined;
    if (!target) {
        throw new NotFoundError("Target URL not found for the current user");
    }
    return target;
}

export async function getTargetForActivity(activityId: number, allocated: boolean, is_admin: boolean, participants_id?: number[], current_user_id?: number): Promise<ActivityMappingResult<string>> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    return activity.target(participants_id);
}

export async function getProgressForActivity(activityId: number, allocated: boolean, is_admin: boolean, participants_id?: number[], current_user_id?: number): Promise<ActivityMappingResult<number | null>> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    return activity.getProgress(participants_id);
}

export async function setProgressForActivity(activityId: number, allocated: boolean, is_admin: boolean, progress: number, participant_id: number, current_user_id?: number): Promise<ActivityCompletion> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    return activity.setProgress(progress, new Date(), participant_id);
}


export async function getInitializedForActivity(activityId: number, allocated: boolean, is_admin: boolean, participants_id?: number[], current_user_id?: number): Promise<ActivityMappingResult<boolean | null>> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    return activity.getInitialized(participants_id);
}

export async function setInitializedForActivity(activityId: number, allocated: boolean, is_admin: boolean, initialized: boolean, participant_id: number, current_user_id?: number): Promise<ActivityCompletion> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    return activity.setInitialized(initialized, new Date(),  participant_id);
}

export async function getCompletionForActivity(activityId: number, allocated: boolean, is_admin: boolean, participants_id?: number[], current_user_id?: number): Promise<ActivityMappingResult<boolean | null>> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    return activity.getCompletion(participants_id);
}

export async function setCompletionForActivity(activityId: number, allocated: boolean, is_admin: boolean, completed: boolean, participant_id: number, current_user_id?: number): Promise<ActivityCompletion> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    return activity.setCompletion(completed, new Date(), participant_id);
}

export async function setMultiCompletionForActivity(activityId: number, allocated: boolean, is_admin: boolean, status: boolean, current_user_id?: number): Promise<ActivityCompletion[]> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    return activity.setMultiCompletion(status);
}

export async function setSuspensionForActivity(activityId: number, allocated: boolean, is_admin: boolean, status: boolean, participant_id: number, current_user_id?: number): Promise<ActivityCompletion> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    return activity.setSuspension(status, participant_id);
}

export async function getSuspensionForActivity(activityId: number, allocated: boolean, is_admin: boolean, participants_id?: number[], current_user_id?: number): Promise<ActivityMappingResult<boolean>> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    return activity.getSuspension(participants_id);
}

export async function hasResultsForActivity(activityId: number, allocated: boolean, is_admin: boolean, type: string, participants_id?: number[], current_user_id?: number): Promise<ActivityMappingResult<boolean>> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    return activity.hasResults(type, participants_id);
}

export async function setResultForActivity(activityId: number, allocated: boolean, is_admin: boolean, type: string, result: any, participant_id: number, current_user_id?: number): Promise<void> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    return activity.setResult(type, result, participant_id);
}

export async function getResultsForActivity(activityId: number, allocated: boolean, is_admin: boolean, type: string, participants_id?: number[], current_user_id?: number): Promise<ActivityMappingResult<any>> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    return activity.getResults(type, participants_id);
}

export async function updateActivity(activityId: number, allocated: boolean, is_admin: boolean, data: any, current_user_id?: number): Promise<Activity> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    await activity.patch(data);
    return Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
}

export async function deleteActivity(activityId: number, allocated: boolean, is_admin: boolean, current_user_id?: number): Promise<void> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    await activity.remove();
}

export async function getPresignedUrlForActivity(activityId: number, allocated: boolean, is_admin: boolean, current_user_id?: number): Promise<string> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    return activity.generatePresignedFileUrl();
}
export async function getTrackerConfigForActivity(activityId: number, allocated: boolean, is_admin: boolean, currentUserId: number) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return activity.getTrackerConfig();
}

export async function getAllResultForActivity(activityId: number, allocated: boolean, is_admin: boolean, type: string, currentUserId: number): Promise<String> {
  let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
  return await activity.getAllResults(type);
}

export async function exportActivity(activityId: number, completion: boolean, allocated: boolean, is_admin: boolean, currentUserId: number) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return activity.export(completion);
}
