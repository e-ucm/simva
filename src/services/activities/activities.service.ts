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

import { ValidationError, NotFoundError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";
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
export async function getActivity(activityId: number, user_id: number, allocated: boolean): Promise<Activity> {
    let activity = await Activity.getFromDbData(activityId, user_id, allocated);
    await activity.sendXAPITraceForActivity("test", "initialized", (new Date()).toUTCString(), -1, "");
    return activity;
}

export async function isActivityAccessible(activityId: number, current_user_id: number, allocated: boolean): Promise<boolean> {
    let activity = await Activity.getFromDbData(activityId, current_user_id, allocated);
    return activity.canBeOpened();
}

export async function getUserTargetForActivity(activityId: number, current_user_id: number, allocated: boolean): Promise<string> {
    let targetMap = await getTargetForActivity(activityId, current_user_id, allocated, [current_user_id]);
    const target = targetMap ? targetMap.get(current_user_id) : undefined;
    if (!target) {
        throw new NotFoundError("Target URL not found for the current user");
    }
    return target;
}

export async function getTargetForActivity(activityId: number, current_user_id: number, allocated: boolean, participants_id?: number[]): Promise<ActivityMappingResult<string>> {
    let activity = await Activity.getFromDbData(activityId, current_user_id, allocated);
    return activity.target(participants_id);
}

export async function getProgressForActivity(activityId: number, current_user_id: number, allocated: boolean, participants_id?: number[]): Promise<ActivityMappingResult<number>> {
    let activity = await Activity.getFromDbData(activityId, current_user_id, allocated);
    return activity.getProgress(participants_id);
}

export async function setProgressForActivity(activityId: number, current_user_id: number, allocated: boolean, progress: number, participants_id?: number[]): Promise<ActivityCompletion[]> {
    let activity = await Activity.getFromDbData(activityId, current_user_id, allocated);
    return activity.setProgress(progress, participants_id);
}


export async function getInitializedForActivity(activityId: number, current_user_id: number, allocated: boolean, participants_id?: number[]): Promise<ActivityMappingResult<boolean>> {
    let activity = await Activity.getFromDbData(activityId, current_user_id, allocated);
    return activity.getInitialized(participants_id);
}

export async function setInitializedForActivity(activityId: number, current_user_id: number, allocated: boolean, initialized: boolean, participants_id?: number[]): Promise<ActivityCompletion[]> {
    let activity = await Activity.getFromDbData(activityId, current_user_id, allocated);
    return activity.setInitialized(initialized, participants_id);
}

export async function getCompletionForActivity(activityId: number, current_user_id: number, allocated: boolean, participants_id?: number[]): Promise<ActivityMappingResult<boolean>> {
    let activity = await Activity.getFromDbData(activityId, current_user_id, allocated);
    return activity.getCompletion(participants_id);
}

export async function setCompletionForActivity(activityId: number, current_user_id: number, allocated: boolean, completed: boolean, participants_id?: number[]): Promise<ActivityCompletion[]> {
    let activity = await Activity.getFromDbData(activityId, current_user_id, allocated);
    return activity.setCompletion(completed, participants_id);
}

export async function setMultiCompletionForActivity(activityId: number, current_user_id: number, allocated: boolean, status: boolean): Promise<ActivityCompletion[]> {
    let activity = await Activity.getFromDbData(activityId, current_user_id, allocated);
    return activity.setMultiCompletion(status);
}

export async function setSuspensionForActivity(activityId: number, current_user_id: number, allocated: boolean, status: boolean, participants_id?: number[]): Promise<ActivityCompletion[]> {
    let activity = await Activity.getFromDbData(activityId, current_user_id, allocated);
    return activity.setSuspension(status, participants_id);
}

export async function getSuspensionForActivity(activityId: number, current_user_id: number, allocated: boolean, participants_id?: number[]): Promise<ActivityMappingResult<boolean>> {
    let activity = await Activity.getFromDbData(activityId, current_user_id, allocated);
    return activity.getSuspension(participants_id);
}