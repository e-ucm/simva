import { logger } from "@/lib/logger";
import {limeSurveyClient} from "@/lib/utils/limesurveyclient";
import { User } from "@/lib/mappers/Users/User";

export async function getSurveys(): Promise<{ id: number, name: string }[]> {
    // This is a placeholder implementation. Replace it with actual logic to fetch surveys from LimeSurvey.
    logger.info("Fetching surveys from LimeSurvey...");
    return (await limeSurveyClient.getSurveyList()).map(survey => ({
        id: typeof survey.sid === "number" ? survey.sid : Number(survey.sid),
        name: String(survey.surveyls_title)
    }));
}

export async function isAdmin(survey_id: number, user_id: number): Promise<boolean> {
    // This is a placeholder implementation. Replace it with actual logic to check if the user is an admin in LimeSurvey.
    logger.info(`Checking if user with ID ${user_id} is an admin in LimeSurvey...`);

    const usernames = await User.getAllCurrentParticipantsUsername([user_id]);
    const username = usernames.get(user_id);
    if (!username) {
        logger.error(`Username not found for user ID ${user_id}`);
        return false;
    }
    const isAdmin = await limeSurveyClient.isUserOwnerOfSurvey(survey_id, username);
    return isAdmin.isOwner;
}

export async function getSurveyLanguagesForActivity(survey_id: number, user_id: number): Promise<string[]> {
    // This is a placeholder implementation. Replace it with actual logic to fetch survey languages for the given activity from LimeSurvey.
    logger.info(`Fetching survey languages for activity with ID ${survey_id} and user ID ${user_id} from LimeSurvey...`);
    const languages = await limeSurveyClient.getSurveyLanguages(survey_id);
    return languages.list;
}

export async function setSurveyOwnerForActivity(survey_id: number, surveyOwner: string, user_id: number): Promise<void> {
    // This is a placeholder implementation. Replace it with actual logic to set the survey owner for the given activity in LimeSurvey.
    logger.info(`Setting survey owner for activity with ID ${survey_id} to ${surveyOwner} by user ID ${user_id} in LimeSurvey...`);
    // Perform the necessary operations to set the survey owner in LimeSurvey.
    let userId = await limeSurveyClient.getUserIdByUsername(surveyOwner);
    if (!userId) {
        logger.error(`User with username ${surveyOwner} not found in LimeSurvey`);
        throw new Error(`User with username ${surveyOwner} not found in LimeSurvey`);
    }   
    await limeSurveyClient.setSurveyOwner(survey_id, userId);
}