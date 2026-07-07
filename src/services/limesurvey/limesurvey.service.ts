import { logger } from "@/lib/logger";
import { limeSurveyClient, Survey, SurveyLanguages } from "@/lib/utils/limesurveyclient";
import { Activity } from "@/lib/mappers/activities/Activity";
import { LimesurveyActivity } from "@/lib/mappers/activities/LimesurveyActivity";
import { ValidationError } from "@/lib/errors/appErrors";

/**
 * Retrieves all surveys accessible to a user based on admin status.
 * 
 * @async
 * @function getSurveys
 * @param {boolean} is_admin - Whether the requesting user has admin privileges
 * @param {string} username - The username of the user requesting surveys
 * @returns {Promise<Survey[]>} Array of surveys accessible to the user
 * @throws {Error} If LimeSurvey client fails to retrieve surveys
 * 
 * @example
 * ```typescript
 * const surveys = await getSurveys(true, 'admin_user');
 * const userSurveys = await getSurveys(false, 'student_user');
 * ```
 */
export async function getSurveys(is_admin: boolean, username: string): Promise<Survey[]> {
    if (is_admin) {
        return await limeSurveyClient.getSurveyList();
    } else {
        return await limeSurveyClient.getSurveysFromUser(username);
    }
}

/**
 * Checks if a user has admin privileges in LimeSurvey.
 * 
 * @async
 * @function isAdmin
 * @param {string} username - The username to check
 * @returns {Promise<boolean>} True if user is admin in LimeSurvey, false otherwise
 * @throws {Error} If LimeSurvey client fails to retrieve user data
 * 
 * @example
 * ```typescript
 * const isAdmin = await isAdmin('admin_user');
 * if (isAdmin) {
 *   // Grant admin privileges
 * }
 * ```
 */
export async function isAdmin(username: string): Promise<boolean> {
    if (!username) {
        return false;
    }
    try {
        await limeSurveyClient.getUser(username);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Retrieves available survey languages for a specific Limesurvey activity.
 * 
 * @async
 * @function getSurveyLanguagesForActivity
 * @param {number} activity_id - The ID of the activity
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {boolean} is_admin - Whether the requesting user has admin privileges
 * @param {number} current_user_id - The ID of the requesting user
 * @returns {Promise<SurveyLanguages>} Object containing available survey languages
 * @throws {ValidationError} If the activity is not a Limesurvey activity
 * 
 * @example
 * ```typescript
 * const languages = await getSurveyLanguagesForActivity(123, true, false, 456);
 * console.log(languages.languages);
 * ```
 */
export async function getSurveyLanguagesForActivity(activity_id: number, allocated: boolean, is_admin: boolean, current_user_id: number): Promise<SurveyLanguages> {
    const activity = await Activity.getFromDbData(activity_id, allocated, is_admin, current_user_id);
    if (activity instanceof LimesurveyActivity) {
        const languages = await activity.getSurveyLanguages();
        return languages;
    } else {
        throw new ValidationError(`Activity with ID ${activity_id} is not a Limesurvey activity`);
    }
}

/**
 * Sets the owner of a LimeSurvey for a specific activity.
 * 
 * @async
 * @function setSurveyOwnerForActivity
 * @param {number} activity_id - The ID of the activity
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {boolean} is_admin - Whether the requesting user has admin privileges
 * @param {number} current_user_id - The ID of the requesting user
 * @param {string} surveyOwner - The username of the LimeSurvey owner to assign
 * @returns {Promise<void>} Resolves when owner is successfully set
 * @throws {ValidationError} If the activity is not a Limesurvey activity
 * @throws {Error} If the specified survey owner username is not found in LimeSurvey
 * 
 * @example
 * ```typescript
 * await setSurveyOwnerForActivity(123, true, false, 456, 'new_owner');
 * ```
 */
export async function setSurveyOwnerForActivity(activity_id: number, allocated: boolean, is_admin: boolean, current_user_id: number, surveyOwner: string): Promise<void> {
    let activity = await Activity.getFromDbData(activity_id, allocated, is_admin, current_user_id);
    let userId = await limeSurveyClient.getUserIdByUsername(surveyOwner);
    if (!userId) {
        throw new Error(`User with username ${surveyOwner} not found in LimeSurvey`);
    }
    if (activity instanceof LimesurveyActivity) {
        await limeSurveyClient.setSurveyOwner(activity.survey_id!, userId);
    } else {
        throw new ValidationError(`Activity with ID ${activity_id} is not a Limesurvey activity`);
    }
}