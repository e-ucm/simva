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
 * @param {any} data - Raw activity data object containing activity_type and other properties
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
export async function ActivityToClass(data: any) : Promise<Activity> {
    logger.debug({data}, data.activity_type);
    switch (data.activity_type) {
        case GamePlayActivity.getType():
            return await GamePlayActivity.getFromDbData(data);
        case LimesurveyActivity.getType():
            return await LimesurveyActivity.getFromDbData(data);
        case ManualActivity.getType():
            return await ManualActivity.getFromDbData(data);
        case Activity.getType():
            return new Activity(data);
        default:
            logger.warn(`Unknown activity type: ${data.activity_type}, returning default Activity instance.`);
            return new Activity(data);
    }
}