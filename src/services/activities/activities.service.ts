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

import { BadRequestError, NotFoundError } from "@/lib/errors/appErrors";
import { Activity } from "@/lib/mappers/activities/Activity";
import { GamePlayActivity } from "@/lib/mappers/activities/GameplayActivity";
import { ActivityCompletion } from "@/lib/mappers/ActivityCompletion/ActivityCompletion";
import { ActivityMappingResult } from "@/lib/mappers/ActivityCompletion/ActivityMappingResult";

/**
 * Retrieves a single activity by ID for a specific user.
 * Validates user permissions and ensures the activity is accessible.
 * 
 * @async
 * @function getActivity
 * @param {number} activityId - The unique identifier of the activity
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {number} [current_user_id] - The ID of the user requesting the activity
 * @returns {Promise<Activity>} The requested Activity object with user-specific data
 * 
 * @throws {NotFoundError} If the activity doesn't exist or user lacks access
 * @throws {ValidationError} If the provided parameters are invalid
 * @throws {Error} If database query fails
 * 
 * @example
 * ```typescript
 *   const activity = await getActivity(789, true, false, 123);
 *   logger.info(activity.name, activity.type);
 * ```
 */
export async function getActivity(activityId: number, allocated: boolean, is_admin: boolean, current_user_id?: number): Promise<Activity> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    //await activity.sendXAPITraceForActivity("test", "initialized", (new Date()).toUTCString(), -1, "");
    return activity;
}

/**
 * Checks if a user can access a specific activity.
 * 
 * @async
 * @function isActivityAccessible
 * @param {number} activityId - The unique identifier of the activity
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {number} [current_user_id] - The ID of the user requesting access
 * @returns {Promise<boolean>} True if the activity is accessible, false otherwise
 * 
 * @example
 * ```typescript
 * const isAccessible = await isActivityAccessible(789, true, false, 123);
 * if (isAccessible) {
 *   // Allow access to activity
 * }
 * ```
 */
export async function isActivityAccessible(activityId: number, allocated: boolean, is_admin: boolean, current_user_id?: number): Promise<boolean> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    return activity.canBeOpened();
}

/**
 * Retrieves the target URL for a specific user to access an activity.
 * 
 * @async
 * @function getUserTargetForActivity
 * @param {number} activityId - The unique identifier of the activity
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {number} [current_user_id] - The ID of the user requesting the target URL
 * @returns {Promise<string>} The target URL for the user to access the activity
 * 
 * @throws {NotFoundError} If the target URL is not found for the current user
 * 
 * @example
 * ```typescript
 * const targetUrl = await getUserTargetForActivity(789, true, false, 123);
 * window.location.href = targetUrl;
 * ```
 */
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

/**
 * Retrieves target URLs for multiple participants for a specific activity.
 * 
 * @async
 * @function getTargetForActivity
 * @param {number} activityId - The unique identifier of the activity
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {number[]} [participants_id] - Array of participant IDs to get targets for
 * @param {number} [current_user_id] - The ID of the user requesting the targets
 * @returns {Promise<ActivityMappingResult<string>>} Mapping of participant IDs to their target URLs
 * 
 * @example
 * ```typescript
 * const targets = await getTargetForActivity(789, true, false, [123, 456, 789], 101);
 * targets.forEach((target, userId) => {
 *   console.log(`User ${userId}: ${target}`);
 * });
 * ```
 */
export async function getTargetForActivity(activityId: number, allocated: boolean, is_admin: boolean, participants_id?: number[], current_user_id?: number): Promise<ActivityMappingResult<string>> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    return activity.target(participants_id);
}

/**
 * Retrieves progress information for participants for a specific activity.
 * 
 * @async
 * @function getProgressForActivity
 * @param {number} activityId - The unique identifier of the activity
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {number[]} [participants_id] - Array of participant IDs to get progress for
 * @param {number} [current_user_id] - The ID of the user requesting the progress
 * @returns {Promise<ActivityMappingResult<number | null>>} Mapping of participant IDs to their progress (0-100)
 * 
 * @example
 * ```typescript
 * const progress = await getProgressForActivity(789, true, false, [123, 456], 101);
 * progress.forEach((p, userId) => {
 *   console.log(`User ${userId} progress: ${p}%`);
 * });
 * ```
 */
export async function getProgressForActivity(activityId: number, allocated: boolean, is_admin: boolean, participants_id?: number[], current_user_id?: number): Promise<ActivityMappingResult<number | null>> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    return activity.getProgress(participants_id);
}

/**
 * Sets the progress for a specific participant in an activity.
 * 
 * @async
 * @function setProgressForActivity
 * @param {number} activityId - The unique identifier of the activity
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {number} progress - The progress value to set (0-100)
 * @param {number} participant_id - The ID of the participant
 * @param {number} [current_user_id] - The ID of the user setting the progress
 * @returns {Promise<ActivityCompletion>} The updated activity completion record
 * 
 * @example
 * ```typescript
 * const completion = await setProgressForActivity(789, true, false, 75, 123, 101);
 * ```
 */
export async function setProgressForActivity(activityId: number, allocated: boolean, is_admin: boolean, progress: number, participant_id: number, current_user_id?: number): Promise<ActivityCompletion> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    return activity.setProgress(progress, new Date(), participant_id);
}


/**
 * Retrieves initialization status for participants for a specific activity.
 * 
 * @async
 * @function getInitializedForActivity
 * @param {number} activityId - The unique identifier of the activity
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {number[]} [participants_id] - Array of participant IDs to get initialization status for
 * @param {number} [current_user_id] - The ID of the user requesting the status
 * @returns {Promise<ActivityMappingResult<boolean | null>>} Mapping of participant IDs to their initialization status
 * 
 * @example
 * ```typescript
 * const initialized = await getInitializedForActivity(789, true, false, [123, 456], 101);
 * initialized.forEach((init, userId) => {
 *   console.log(`User ${userId} initialized: ${init}`);
 * });
 * ```
 */
export async function getInitializedForActivity(activityId: number, allocated: boolean, is_admin: boolean, participants_id?: number[], current_user_id?: number): Promise<ActivityMappingResult<boolean | null>> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    return activity.getInitialized(participants_id);
}

/**
 * Sets the initialization status for a specific participant in an activity.
 * 
 * @async
 * @function setInitializedForActivity
 * @param {number} activityId - The unique identifier of the activity
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {boolean} initialized - The initialization status to set
 * @param {number} participant_id - The ID of the participant
 * @param {number} [current_user_id] - The ID of the user setting the status
 * @returns {Promise<ActivityCompletion>} The updated activity completion record
 * 
 * @example
 * ```typescript
 * const completion = await setInitializedForActivity(789, true, false, true, 123, 101);
 * ```
 */
export async function setInitializedForActivity(activityId: number, allocated: boolean, is_admin: boolean, initialized: boolean, participant_id: number, current_user_id?: number): Promise<ActivityCompletion> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    return activity.setInitialized(initialized, new Date(),  participant_id);
}

/**
 * Retrieves completion status for participants for a specific activity.
 * 
 * @async
 * @function getCompletionForActivity
 * @param {number} activityId - The unique identifier of the activity
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {number[]} [participants_id] - Array of participant IDs to get completion status for
 * @param {number} [current_user_id] - The ID of the user requesting the status
 * @returns {Promise<ActivityMappingResult<boolean | null>>} Mapping of participant IDs to their completion status
 * 
 * @example
 * ```typescript
 * const completion = await getCompletionForActivity(789, true, false, [123, 456], 101);
 * completion.forEach((comp, userId) => {
 *   console.log(`User ${userId} completed: ${comp}`);
 * });
 * ```
 */
export async function getCompletionForActivity(activityId: number, allocated: boolean, is_admin: boolean, participants_id?: number[], current_user_id?: number): Promise<ActivityMappingResult<boolean | null>> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    return activity.getCompletion(participants_id);
}

/**
 * Sets the completion status for a specific participant in an activity.
 * 
 * @async
 * @function setCompletionForActivity
 * @param {number} activityId - The unique identifier of the activity
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {boolean} completed - The completion status to set
 * @param {number} participant_id - The ID of the participant
 * @param {number} [current_user_id] - The ID of the user setting the status
 * @returns {Promise<ActivityCompletion>} The updated activity completion record
 * 
 * @example
 * ```typescript
 * const completion = await setCompletionForActivity(789, true, false, true, 123, 101);
 * ```
 */
export async function setCompletionForActivity(activityId: number, allocated: boolean, is_admin: boolean, completed: boolean, participant_id: number, current_user_id?: number): Promise<ActivityCompletion> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    return activity.setCompletion(completed, new Date(), participant_id);
}

/**
 * Sets multi-completion status for all participants in an activity.
 * 
 * @async
 * @function setMultiCompletionForActivity
 * @param {number} activityId - The unique identifier of the activity
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {boolean} status - The completion status to set for all participants
 * @param {number} [current_user_id] - The ID of the user setting the status
 * @returns {Promise<ActivityCompletion[]>} Array of updated activity completion records
 * 
 * @example
 * ```typescript
 * const completions = await setMultiCompletionForActivity(789, true, false, true, 101);
 * ```
 */
export async function setMultiCompletionForActivity(activityId: number, allocated: boolean, is_admin: boolean, status: boolean, current_user_id?: number): Promise<ActivityCompletion[]> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    return activity.setMultiCompletion(status);
}

/**
 * Sets suspension status for a specific participant in an activity.
 * 
 * @async
 * @function setSuspensionForActivity
 * @param {number} activityId - The unique identifier of the activity
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {boolean} status - The suspension status to set
 * @param {string} reason - The reason for suspension
 * @param {number} participant_id - The ID of the participant
 * @param {number} [current_user_id] - The ID of the user setting the status
 * @returns {Promise<ActivityCompletion>} The updated activity completion record
 * 
 * @example
 * ```typescript
 * const completion = await setSuspensionForActivity(789, true, false, true, "Technical issue", 123, 101);
 * ```
 */
export async function setSuspensionForActivity(activityId: number, allocated: boolean, is_admin: boolean, status: boolean, reason: string, participant_id: number, current_user_id?: number): Promise<ActivityCompletion> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    return activity.setSuspension(status, participant_id, reason);
}

/**
 * Retrieves suspension status for participants for a specific activity.
 * 
 * @async
 * @function getSuspensionForActivity
 * @param {number} activityId - The unique identifier of the activity
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {number[]} [participants_id] - Array of participant IDs to get suspension status for
 * @param {number} [current_user_id] - The ID of the user requesting the status
 * @returns {Promise<ActivityMappingResult<boolean>>} Mapping of participant IDs to their suspension status
 * 
 * @example
 * ```typescript
 * const suspension = await getSuspensionForActivity(789, true, false, [123, 456], 101);
 * suspension.forEach((susp, userId) => {
 *   console.log(`User ${userId} suspended: ${susp}`);
 * });
 * ```
 */
export async function getSuspensionForActivity(activityId: number, allocated: boolean, is_admin: boolean, participants_id?: number[], current_user_id?: number): Promise<ActivityMappingResult<boolean>> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    return activity.getSuspension(participants_id);
}

/**
 * Checks if participants have results for a specific activity type.
 * 
 * @async
 * @function hasResultsForActivity
 * @param {number} activityId - The unique identifier of the activity
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {string} type - The type of results to check for
 * @param {number[]} [participants_id] - Array of participant IDs to check
 * @param {number} [current_user_id] - The ID of the user requesting the check
 * @returns {Promise<ActivityMappingResult<boolean>>} Mapping of participant IDs to whether they have results
 * 
 * @example
 * ```typescript
 * const hasResults = await hasResultsForActivity(789, true, false, "score", [123, 456], 101);
 * hasResults.forEach((has, userId) => {
 *   console.log(`User ${userId} has results: ${has}`);
 * });
 * ```
 */
export async function hasResultsForActivity(activityId: number, allocated: boolean, is_admin: boolean, type: string, participants_id?: number[], current_user_id?: number): Promise<ActivityMappingResult<boolean>> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    return activity.hasResults(type, participants_id);
}

/**
 * Sets results for a specific participant in an activity.
 * 
 * @async
 * @function setResultForActivity
 * @param {number} activityId - The unique identifier of the activity
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {string} type - The type of results being set
 * @param {any} result - The result data to set
 * @param {number} participant_id - The ID of the participant
 * @param {number} [current_user_id] - The ID of the user setting the results
 * @returns {Promise<void>} Resolves when results are successfully set
 * 
 * @example
 * ```typescript
 * await setResultForActivity(789, true, false, "score", 95, 123, 101);
 * ```
 */
export async function setResultForActivity(activityId: number, allocated: boolean, is_admin: boolean, type: string, result: any, participant_id: number, current_user_id?: number): Promise<void> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    return activity.setResult(type, result, participant_id);
}

/**
 * Retrieves results for participants for a specific activity type.
 * 
 * @async
 * @function getResultsForActivity
 * @param {number} activityId - The unique identifier of the activity
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {string} type - The type of results to retrieve
 * @param {number[]} [participants_id] - Array of participant IDs to get results for
 * @param {number} [current_user_id] - The ID of the user requesting the results
 * @returns {Promise<ActivityMappingResult<any>>} Mapping of participant IDs to their results
 * 
 * @example
 * ```typescript
 * const results = await getResultsForActivity(789, true, false, "score", [123, 456], 101);
 * results.forEach((result, userId) => {
 *   console.log(`User ${userId} score: ${result}`);
 * });
 * ```
 */
export async function getResultsForActivity(activityId: number, allocated: boolean, is_admin: boolean, type: string, participants_id?: number[], current_user_id?: number): Promise<ActivityMappingResult<any>> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    return activity.getResults(type, participants_id);
}

/**
 * Updates an activity with partial data.
 * 
 * @async
 * @function updateActivity
 * @param {number} activityId - The unique identifier of the activity
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {any} data - Partial activity data to update
 * @param {number} [current_user_id] - The ID of the user updating the activity
 * @returns {Promise<Activity>} The updated activity instance
 * 
 * @example
 * ```typescript
 * const updatedActivity = await updateActivity(789, true, false, { name: "Updated Activity" }, 101);
 * ```
 */
export async function updateActivity(activityId: number, allocated: boolean, is_admin: boolean, data: any, current_user_id?: number): Promise<Activity> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    await activity.patch(data);
    return Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
}

/**
 * Deletes an activity.
 * 
 * @async
 * @function deleteActivity
 * @param {number} activityId - The unique identifier of the activity
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {number} [current_user_id] - The ID of the user deleting the activity
 * @returns {Promise<void>} Resolves when activity is successfully deleted
 * 
 * @example
 * ```typescript
 * await deleteActivity(789, true, false, 101);
 * ```
 */
export async function deleteActivity(activityId: number, allocated: boolean, is_admin: boolean, current_user_id?: number): Promise<void> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    await activity.remove();
}

/**
 * Generates a presigned URL for an activity's associated file.
 * 
 * @async
 * @function getPresignedUrlForActivity
 * @param {number} activityId - The unique identifier of the activity
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {number} [current_user_id] - The ID of the user requesting the URL
 * @returns {Promise<string>} The presigned URL for the activity's file
 * 
 * @example
 * ```typescript
 * const url = await getPresignedUrlForActivity(789, true, false, 101);
 * window.open(url);
 * ```
 */
export async function getPresignedUrlForActivity(activityId: number, allocated: boolean, is_admin: boolean, current_user_id?: number): Promise<string> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, current_user_id);
    return activity.generatePresignedFileUrl();
}
/**
 * Retrieves the tracker configuration for an activity.
 * 
 * @async
 * @function getTrackerConfigForActivity
 * @param {number} activityId - The unique identifier of the activity
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {number} currentUserId - The ID of the user requesting the configuration
 * @returns {Promise<object>} The tracker configuration object
 * 
 * @example
 * ```typescript
 * const config = await getTrackerConfigForActivity(789, true, false, 101);
 * ```
 */
export async function getTrackerConfigForActivity(activityId: number, allocated: boolean, is_admin: boolean, currentUserId: number): Promise<string> {
  let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
  if(activity instanceof GamePlayActivity) {
      return activity.getTrackerConfig();
  } else {
     throw new BadRequestError("Activity is not of type gameplay.");
  }
}

/**
 * Retrieves all results for a specific activity type.
 * 
 * @async
 * @function getAllResultForActivity
 * @param {number} activityId - The unique identifier of the activity
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {string} type - The type of results to retrieve
 * @param {number} currentUserId - The ID of the user requesting the results
 * @returns {Promise<String>} JSON string containing all results for the activity type
 * 
 * @example
 * ```typescript
 * const allResults = await getAllResultForActivity(789, true, false, "score", 101);
 * const results = JSON.parse(allResults);
 * ```
 */
export async function getAllResultForActivity(activityId: number, allocated: boolean, is_admin: boolean, type: string, currentUserId: number): Promise<String> {
  let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
  return await activity.getAllResults(type);
}

/**
 * Exports an activity's data.
 * 
 * @async
 * @function exportActivity
 * @param {number} activityId - The unique identifier of the activity
 * @param {boolean} completion - Whether to include completion data in export
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {number} currentUserId - The ID of the user exporting the activity
 * @returns {Promise<any>} The exported activity data
 * 
 * @example
 * ```typescript
 * const exportedData = await exportActivity(789, true, true, false, 101);
 * fs.writeFileSync('activity-export.json', JSON.stringify(exportedData));
 * ```
 */
export async function exportActivity(activityId: number, completion: boolean, allocated: boolean, is_admin: boolean, currentUserId: number) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return activity.export(completion);
}
