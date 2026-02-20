import { Activity } from "@/lib/mappers/activities/Activity";
import { GamePlayActivity } from "@/lib/mappers/activities/GameplayActivity";
import { LimesurveyActivity } from "@/lib/mappers/activities/LimesurveyActivity";
import { ManualActivity } from "@/lib/mappers/activities/ManualActivity";
import { logger } from "@/lib/logger";

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
export async function ActivityToClass(activity_id: number, user_id: number, allocated : boolean, activityData: any) : Promise<Activity> {
    //logger.debug({activityData}, activityData.activity_type);
    let activity: Activity;
    switch (activityData.activity_type) {
        case GamePlayActivity.getType():
            activity = await GamePlayActivity.getFromDbData(activity_id, user_id, allocated, activityData);
            break;
        case LimesurveyActivity.getType():
            activity = await LimesurveyActivity.getFromDbData(activity_id, user_id, allocated, activityData);
            break;
        case ManualActivity.getType():
            activity = await ManualActivity.getFromDbData(activity_id, user_id, allocated, activityData);
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