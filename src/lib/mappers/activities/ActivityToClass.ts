import { Activity } from "@/lib/mappers/activities/Activity";
import { GamePlayActivity } from "@/lib/mappers/activities/GameplayActivity";
import { LimesurveyActivity } from "@/lib/mappers/activities/LimesurveyActivity";
import { ManualActivity } from "@/lib/mappers/activities/ManualActivity";
import { logger } from "@/lib/logger";

export async function ActivityToClass(data: any) : Promise<Activity> {
    logger.debug({data}, data.activity_type);
    switch (data.activity_type) {
        case GamePlayActivity.getType():
            return await GamePlayActivity.createWithDbData(data);
        case LimesurveyActivity.getType():
            return await LimesurveyActivity.createWithDbData(data);
        case ManualActivity.getType():
            return await ManualActivity.createWithDbData(data);
        case Activity.getType():
            return new Activity(data);
        default:
            logger.warn(`Unknown activity type: ${data.activity_type}, returning default Activity instance.`);
            return new Activity(data);
    }
}