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
export async function getActivity(activityId: number, user_id: number): Promise<Activity> {
    let activity = await Activity.getFromDbData(activityId, user_id);
    await activity.sendXAPITraceForActivity("test", "initialized", (new Date()).toUTCString(), -1, "");
    return activity;
}