import { ActivityToClass } from "@/lib/mappers/activities/ActivityToClass";
import { ValidationError, NotFoundError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { Activity } from "@/lib/mappers/activities/Activity";

export async function getActivity(activityId: number, user_id: number): Promise<Activity> {
  const results = await db.Functions.runViewQuery(
        db.Views.Activity.byActivityIdAndUserId,
        { activity_id: activityId, user_id }
    );
    if (results.length === 0) {
        throw new NotFoundError(`Activity with ID ${activityId} not found for user ID ${user_id}.`);
    } else if (results.length > 1) {
        logger.warn(`Multiple activities found with ID ${activityId} for user ID ${user_id}. Using the first one.`);
    }
    return ActivityToClass(results[0]);
}