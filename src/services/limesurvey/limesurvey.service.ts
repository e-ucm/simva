import { logger } from "@/lib/logger";
import {limeSurveyClient, Survey} from "@/lib/utils/limesurveyclient";
import { User } from "@/lib/mappers/Users/User";

export async function getSurveys(): Promise<Survey[]> {
    return await limeSurveyClient.getSurveyList();
}

export async function isAdmin(user_id: number): Promise<boolean> {
    // This is a placeholder implementation. Replace it with actual logic to check if the user is an admin in LimeSurvey.
    const usernames = await User.getAllCurrentParticipantsUsername([user_id]);
    const username = usernames.get(user_id);
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

export async function getSurveyLanguagesForActivity(survey_id: number, user_id: number): Promise<string[]> {
    // This is a placeholder implementation. Replace it with actual logic to fetch survey languages for the given activity from LimeSurvey.
    const languages = await limeSurveyClient.getSurveyLanguages(survey_id);
    return languages.list;
}

export async function setSurveyOwnerForActivity(survey_id: number, surveyOwner: string, user_id: number): Promise<void> {
    // This is a placeholder implementation. Replace it with actual logic to set the survey owner for the given activity in LimeSurvey.
    // Perform the necessary operations to set the survey owner in LimeSurvey.
    let userId = await limeSurveyClient.getUserIdByUsername(surveyOwner);
    if (!userId) {
        throw new Error(`User with username ${surveyOwner} not found in LimeSurvey`);
    }   
    await limeSurveyClient.setSurveyOwner(survey_id, userId);
}