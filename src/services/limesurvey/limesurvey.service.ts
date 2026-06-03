import { logger } from "@/lib/logger";
import {limeSurveyClient, Survey, SurveyLanguages} from "@/lib/utils/limesurveyclient";
import { User } from "@/lib/mappers/Users/User";
import { Activity } from "@/lib/mappers/activities/Activity";
import { LimesurveyActivity } from "@/lib/mappers/activities/LimesurveyActivity";
import { ValidationError } from "@/lib/errors/appErrors";

export async function getSurveys(is_admin: boolean,username: string): Promise<Survey[]> {
    if(is_admin) {
        return await limeSurveyClient.getSurveyList();
    } else {
        return await limeSurveyClient.getSurveysFromUser(username);
    }
}

export async function isAdmin(username: string): Promise<boolean> {
    if (!username) {
        return false;
    }
    try {
        const isAdmin = await limeSurveyClient.getUser(username);
        return true;
    } catch(e) {
        return false;
    }
}

export async function getSurveyLanguagesForActivity(activity_id: number, allocated: boolean, is_admin: boolean, current_user_id: number): Promise<SurveyLanguages> {
    const activity = await Activity.getFromDbData(activity_id, allocated, is_admin, current_user_id);
    if(activity instanceof LimesurveyActivity) {
        const languages = await activity.getSurveyLanguages();
        return languages;
    } else {
        throw new ValidationError(`Activity with ID ${activity_id} is not a Limesurvey activity`);
    };
}

export async function setSurveyOwnerForActivity(activity_id: number, allocated: boolean, is_admin: boolean, current_user_id: number, surveyOwner: string): Promise<void> {
    let activity = await Activity.getFromDbData(activity_id, allocated, is_admin, current_user_id);
    let userId = await limeSurveyClient.getUserIdByUsername(surveyOwner);
    if (!userId) {
        throw new Error(`User with username ${surveyOwner} not found in LimeSurvey`);
    }
    if(activity instanceof LimesurveyActivity) {
        await limeSurveyClient.setSurveyOwner(activity.survey_id!, userId);
    } else {
        throw new ValidationError(`Activity with ID ${activity_id} is not a Limesurvey activity`);
    };
}