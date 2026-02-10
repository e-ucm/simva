import { Activity } from "@/lib/classes/activities/Activity";
import { GamePlayActivity } from "@/lib/classes/activities/GameplayActivity";
import { LimesurveyActivity } from "@/lib/classes/activities/LimesurveyActivity";
import { ManualActivity } from "@/lib/classes/activities/ManualActivity";
import { logger } from "@/lib/logger";

export function ActivityToClass(data: any) : Activity {
    logger.info({data}, data.activity_type);
    switch (data.activity_type) {
        case GamePlayActivity.getType():
            return new GamePlayActivity(data);
        case LimesurveyActivity.getType():
            return new LimesurveyActivity(data);
        case ManualActivity.getType():
            return new ManualActivity(data);
        case Activity.getType():
            return new Activity(data);
        default:
            logger.warn(`Unknown activity type: ${data.activity_type}, returning default Activity instance.`);
            return new Activity(data);
    }
}