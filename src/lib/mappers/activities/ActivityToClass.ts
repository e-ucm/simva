import { Activity } from "@/lib/mappers/activities/Activity";
import { GamePlayActivity } from "@/lib/mappers/activities/GameplayActivity";
import { LimesurveyActivity } from "@/lib/mappers/activities/LimesurveyActivity";
import { ManualActivity } from "@/lib/mappers/activities/ManualActivity";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";

/**
 * Factory function that creates appropriate Activity subclass instances based on activity type.
 * Handles polymorphic creation of activity objects with proper database data loading.
 * 
 * @async
 * @function ActivityToClass
 * @param {any} activityData - Raw activity data object containing activity_type and other properties
 * @returns {Promise<Activity>} Promise that resolves to the appropriate Activity subclass instance
 * 
 * @description Factory function that:
 * - Analyzes the activity_type property in the data
 * - Creates and returns the appropriate Activity subclass instance
 * - Uses async getFromDbData methods for database-backed initialization
 * - Falls back to base Activity class for unknown types
 * - Handles LimesurveyActivity, GamePlayActivity, and ManualActivity types
 * 
 * @example
 * const activity = await ActivityToClass({ activity_type: 'limesurvey', activity_id: 123 });
 * // Returns a LimesurveyActivity instance with database data loaded
 */
export async function ActivityToClass(activity_id: number, allocated: boolean, is_admin: boolean, activityData: any, user_id?: number) : Promise<Activity> {
    //logger.debug({activityData}, activityData.activity_type);
    let activity: Activity;
    switch (activityData.activity_type) {
        case GamePlayActivity.getType():
            activity = await GamePlayActivity.getFromDbData(activity_id, allocated, is_admin, activityData, user_id);
            break;
        case LimesurveyActivity.getType():
            activity = await LimesurveyActivity.getFromDbData(activity_id, allocated, is_admin, activityData, user_id);
            break;
        case ManualActivity.getType():
            activity = await ManualActivity.getFromDbData(activity_id, allocated, is_admin, activityData, user_id);
            break;
        case Activity.getType():
            activity = new Activity(allocated, activityData);
            break;
        default:
            logger.warn(`Unknown activity type: ${activityData.activity_type}, returning default Activity instance.`);
            activity = new Activity(allocated, activityData);
            break;
    }
    return activity;
}

export async function createActivityFromType(activityData: any, session_id: number, activity_order: number, is_admin: boolean, current_user_id: number): Promise<Activity> {
    activityData.session_id = session_id;
    if(!activityData.activity_description) {
        activityData.activity_description = "";
    }
    activityData.activity_order = (activity_order ?? 0) + 1; // Add to the end of the activity list
    activityData.activity_comply_with_GDPR = false; // Default to true for new activities, can be updated later
    let activity = await db.Tables.Activities.create(activityData);
    activityData.activity_id = activity.activity_id;
    activityData.createdAt = activity.createdAt;
    activityData.updatedAt = activity.updatedAt;
    let activityInstance = await ActivityToClass(activity.activity_id, false, is_admin, activityData, current_user_id);
    return activityInstance;
}