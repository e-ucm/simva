/**
 * @fileoverview Service for xAPI/LRS activity operations.
 * Handles all xAPI statement management and learning record storage for activities.
 * 
 * This service provides full xAPI (Experience API) compliance for tracking
 * learning events and storing them in a Learning Record Store (LRS).
 * 
 * @module services/activities/activitiesLRS
 * @requires @/lib/mappers/activities/Activity
 * @requires @/lib/mappers/simletGroup/SimletGroup
 * @requires @/lib/db
 * @requires @/lib/config
 * @requires @/lib/logger
 */

import { NotFoundError, NotImplementedError, ValidationError } from "@/lib/errors/appErrors";
import { Activity } from "@/lib/mappers/activities/Activity";
import { db } from "@/lib/db";
import { SimletGroup } from "@/lib/mappers/simletGroup/SimletGroup";
import { config } from "@/lib/config";
import { logger } from "@/lib/logger";

/**
 * Retrieves test statements for an activity from the LRS for a specific user.
 * 
 * @async
 * @function getTestStatementsLRSForActivity
 * @param {number} currentUserId - The ID of the user requesting statements
 * @param {string} currentusername - The username of the user requesting statements
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {number} activityId - The ID of the activity
 * @param {any} query - LRS query parameters for filtering statements
 * @returns {Promise<any>} Array of xAPI statements matching the query
 * 
 * @throws {ValidationError} If the current user is not a tester in the session
 * 
 * @example
 * ```typescript
 * const statements = await getTestStatementsLRSForActivity(123, 'user123', false, true, 456, {
 *   actor: 'user123',
 *   verb: 'completed'
 * });
 * ```
 */
export async function getTestStatementsLRSForActivity(currentUserId: number, currentusername: string, is_admin: boolean, allocated: boolean, activityId: number, query: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    const group = await SimletGroup.getGroupFromCurrentUser(currentUserId);
    if (group.participants.includes(currentUserId)) {
        query.actor = JSON.stringify({
            account: {
              name: currentusername,
              homePage: config.externalUrl,
            }
        });
        const groupParticipant = await db.Tables.GroupParticipants.findOne({ where: { group_id: group.group_id, participant_id: currentUserId }});
        if (groupParticipant) {
            query.since = groupParticipant!.createdAt?.toISOString();
        } else {
            query.since = group.createdAt?.toISOString();
        }
        return await activity.getTestLRSStatements(query);
    } else {
        throw new ValidationError('Current user is not a tester in this session');
    }
}

/**
 * Retrieves statements for an activity from the LRS for a specific user.
 * 
 * @async
 * @function getStatementsLRSForActivity
 * @param {number} currentUserId - The ID of the user requesting statements
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {number} activityId - The ID of the activity
 * @param {any} query - LRS query parameters for filtering statements
 * @returns {Promise<any>} Array of xAPI statements matching the query
 * 
 * @example
 * ```typescript
 * const statements = await getStatementsLRSForActivity(123, false, true, 456, {
 *   actor: 'user123',
 *   verb: 'completed'
 * });
 * ```
 */
export async function getStatementsLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, query: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.getLRSStatements(query);
}

/**
 * Retrieves additional statements for an activity from the LRS using a continuation token.
 * 
 * @async
 * @function getMoreStatementsLRSForActivity
 * @param {number} currentUserId - The ID of the user requesting statements
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {number} activityId - The ID of the activity
 * @param {string} more - Continuation token from previous response
 * @returns {Promise<any>} Array of additional xAPI statements
 * 
 * @example
 * ```typescript
 * const moreStatements = await getMoreStatementsLRSForActivity(123, false, true, 456, 'continuation-token');
 * ```
 */
export async function getMoreStatementsLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, more: string) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.getLRSStatements({ more: more });
}

/**
 * Sends xAPI statements for an activity to the LRS.
 * 
 * @async
 * @function sendStatementsLRSForActivity
 * @param {number} currentUserId - The ID of the user sending statements
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {number} activityId - The ID of the activity
 * @param {any} body - Array of xAPI statements to send
 * @param {number} lrsmanagerUserId - The ID of the LRS manager user
 * @returns {Promise<number[]>} Array of IDs for the successfully sent statements
 * 
 * @throws {NotFoundError} If the user is not a participant in the activity
 * 
 * @example
 * ```typescript
 * const sentIds = await sendStatementsLRSForActivity(123, false, true, 456, [
 *   { id: '1', actor: { account: { name: 'user123' } }, verb: { id: 'completed' } }
 * ], 789);
 * ```
 */
export async function sendStatementsLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, body: any, lrsmanagerUserId: number): Promise<number[]> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    if(!activity) {
        throw new NotFoundError("The user you are trying to set statement to is not a participant");
    }
    if(await activity.canSendStatementsLRS()) {
        await activity.processStatementsForActivity(currentUserId, body);
        const useTestUrls = await activity.isCurrentUserParticipantAsTester();
        logger.debug({ useTestUrls }, "Determined whether to use test URLs for LRS statements");
        let ids = await activity.sendLRSStatements(lrsmanagerUserId, body, useTestUrls);
        return ids;
    } else {
        return [];
    }
}

/**
 * Retrieves agent information for an activity from the LRS.
 * 
 * @async
 * @function getAgentsLRSForActivity
 * @param {number} currentUserId - The ID of the user requesting agents
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {number} activityId - The ID of the activity
 * @param {any} params - LRS query parameters for filtering agents
 * @returns {Promise<any>} Array of agent objects
 * 
 * @example
 * ```typescript
 * const agents = await getAgentsLRSForActivity(123, false, true, 456, {
 *   agent: 'user123'
 * });
 * ```
 */
export async function getAgentsLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, params: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.getLRSAgents(params);
}

/**
 * Retrieves agent profile information for an activity from the LRS.
 * 
 * @async
 * @function getAgentsProfileLRSForActivity
 * @param {number} currentUserId - The ID of the user requesting agent profiles
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {number} activityId - The ID of the activity
 * @param {any} params - LRS query parameters for filtering agent profiles
 * @returns {Promise<any>} Agent profile data
 * 
 * @example
 * ```typescript
 * const profile = await getAgentsProfileLRSForActivity(123, false, true, 456, {
 *   agent: 'user123'
 * });
 * ```
 */
export async function getAgentsProfileLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, params: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.getLRSAgentsProfile(params);
}

/**
 * Posts agent profile information for an activity to the LRS.
 * 
 * @async
 * @function postAgentsProfileLRSForActivity
 * @param {number} currentUserId - The ID of the user posting agent profiles
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {number} activityId - The ID of the activity
 * @param {any} body - Agent profile data to post
 * @returns {Promise<any>} The created agent profile
 * 
 * @example
 * ```typescript
 * const profile = await postAgentsProfileLRSForActivity(123, false, true, 456, {
 *   name: 'John Doe',
 *   mbox: 'john@example.com'
 * });
 * ```
 */
export async function postAgentsProfileLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, body: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.postLRSAgentsProfile(body);
}

/**
 * Updates agent profile information for an activity in the LRS.
 * 
 * @async
 * @function updateAgentsProfileLRSForActivity
 * @param {number} currentUserId - The ID of the user updating agent profiles
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {number} activityId - The ID of the activity
 * @param {any} body - Agent profile data to update
 * @returns {Promise<any>} The updated agent profile
 * 
 * @example
 * ```typescript
 * const updatedProfile = await updateAgentsProfileLRSForActivity(123, false, true, 456, {
 *   name: 'John Updated'
 * });
 * ```
 */
export async function updateAgentsProfileLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, body: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.updateLRSAgentsProfile(body);
}

/**
 * Deletes agent profile information for an activity from the LRS.
 * 
 * @async
 * @function deleteAgentsProfileLRSForActivity
 * @param {number} currentUserId - The ID of the user deleting agent profiles
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {number} activityId - The ID of the activity
 * @param {any} params - LRS query parameters for identifying profile to delete
 * @returns {Promise<any>} The deleted agent profile
 * 
 * @example
 * ```typescript
 * const deletedProfile = await deleteAgentsProfileLRSForActivity(123, false, true, 456, {
 *   agent: 'user123'
 * });
 * ```
 */
export async function deleteAgentsProfileLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, params: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.deleteLRSAgentsProfile(params);
}

/**
 * Retrieves sub-activities for an activity from the LRS.
 * 
 * @async
 * @function getActivitiesLRSForActivity
 * @param {number} currentUserId - The ID of the user requesting sub-activities
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {number} activityId - The ID of the activity
 * @param {any} params - LRS query parameters for filtering sub-activities
 * @returns {Promise<any>} Array of sub-activity objects
 * 
 * @example
 * ```typescript
 * const activities = await getActivitiesLRSForActivity(123, false, true, 456, {
 *   activity: 'parent-activity-id'
 * });
 * ```
 */
export async function getActivitiesLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, params: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.getLRSActivities(params);
}

/**
 * Retrieves sub-activity profile information for an activity from the LRS.
 * 
 * @async
 * @function getActivitiesProfileLRSForActivity
 * @param {number} currentUserId - The ID of the user requesting sub-activity profiles
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {number} activityId - The ID of the activity
 * @param {any} params - LRS query parameters for filtering sub-activity profiles
 * @returns {Promise<any>} Sub-activity profile data
 * 
 * @example
 * ```typescript
 * const profile = await getActivitiesProfileLRSForActivity(123, false, true, 456, {
 *   activity: 'child-activity-id'
 * });
 * ```
 */
export async function getActivitiesProfileLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, params: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.getLRSActivitiesProfile(params);
}

/**
 * Posts sub-activity profile information for an activity to the LRS.
 * 
 * @async
 * @function postActivitiesProfileLRSForActivity
 * @param {number} currentUserId - The ID of the user posting sub-activity profiles
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {number} activityId - The ID of the activity
 * @param {any} body - Sub-activity profile data to post
 * @returns {Promise<any>} The created sub-activity profile
 * 
 * @example
 * ```typescript
 * const profile = await postActivitiesProfileLRSForActivity(123, false, true, 456, {
 *   name: 'Child Activity',
 *   definition: { type: 'http://adlnet.gov/expapi/activities/cmi.interaction' }
 * });
 * ```
 */
export async function postActivitiesProfileLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, body: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.postLRSActivitiesProfile(body);
}

/**
 * Updates sub-activity profile information for an activity in the LRS.
 * 
 * @async
 * @function updateActivitiesProfileLRSForActivity
 * @param {number} currentUserId - The ID of the user updating sub-activity profiles
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {number} activityId - The ID of the activity
 * @param {any} body - Sub-activity profile data to update
 * @returns {Promise<any>} The updated sub-activity profile
 * 
 * @example
 * ```typescript
 * const updatedProfile = await updateActivitiesProfileLRSForActivity(123, false, true, 456, {
 *   name: 'Updated Child Activity'
 * });
 * ```
 */
export async function updateActivitiesProfileLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, body: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.updateLRSActivitiesProfile(body);
}

/**
 * Deletes sub-activity profile information for an activity from the LRS.
 * 
 * @async
 * @function deleteActivitiesProfileLRSForActivity
 * @param {number} currentUserId - The ID of the user deleting sub-activity profiles
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {number} activityId - The ID of the activity
 * @param {any} params - LRS query parameters for identifying profile to delete
 * @returns {Promise<any>} The deleted sub-activity profile
 * 
 * @example
 * ```typescript
 * const deletedProfile = await deleteActivitiesProfileLRSForActivity(123, false, true, 456, {
 *   activity: 'child-activity-id'
 * });
 * ```
 */
export async function deleteActivitiesProfileLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, params: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.deleteLRSActivitiesProfile(params);
}

/**
 * Retrieves sub-activity state information for an activity from the LRS.
 * 
 * @async
 * @function getActivitiesStateLRSForActivity
 * @param {number} currentUserId - The ID of the user requesting sub-activity state
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {number} activityId - The ID of the activity
 * @param {any} params - LRS query parameters for filtering state
 * @returns {Promise<any>} Sub-activity state data
 * 
 * @example
 * ```typescript
 * const state = await getActivitiesStateLRSForActivity(123, false, true, 456, {
 *   activity: 'child-activity-id'
 * });
 * ```
 */
export async function getActivitiesStateLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, params: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.getLRSActivitiesState(params);
}

/**
 * Posts sub-activity state information for an activity to the LRS.
 * 
 * @async
 * @function postActivitiesStateLRSForActivity
 * @param {number} currentUserId - The ID of the user posting sub-activity state
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {number} activityId - The ID of the activity
 * @param {any} body - Sub-activity state data to post
 * @returns {Promise<any>} The created sub-activity state
 * 
 * @example
 * ```typescript
 * const state = await postActivitiesStateLRSForActivity(123, false, true, 456, {
 *   stateId: 'state-1',
 *   data: { progress: 0.75 }
 * });
 * ```
 */
export async function postActivitiesStateLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, body: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.postLRSActivitiesState(body);
}

/**
 * Updates sub-activity state information for an activity in the LRS.
 * 
 * @async
 * @function updateActivitiesStateLRSForActivity
 * @param {number} currentUserId - The ID of the user updating sub-activity state
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {number} activityId - The ID of the activity
 * @param {any} body - Sub-activity state data to update
 * @returns {Promise<any>} The updated sub-activity state
 * 
 * @example
 * ```typescript
 * const updatedState = await updateActivitiesStateLRSForActivity(123, false, true, 456, {
 *   stateId: 'state-1',
 *   data: { progress: 0.9 }
 * });
 * ```
 */
export async function updateActivitiesStateLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, body: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.updateLRSActivitiesState(body);
}

/**
 * Deletes sub-activity state information for an activity from the LRS.
 * 
 * @async
 * @function deleteActivitiesStateLRSForActivity
 * @param {number} currentUserId - The ID of the user deleting sub-activity state
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {number} activityId - The ID of the activity
 * @param {any} params - LRS query parameters for identifying state to delete
 * @returns {Promise<any>} The deleted sub-activity state
 * 
 * @example
 * ```typescript
 * const deletedState = await deleteActivitiesStateLRSForActivity(123, false, true, 456, {
 *   stateId: 'state-1'
 * });
 * ```
 */
export async function deleteActivitiesStateLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, params: any) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    return await activity.deleteLRSActivitiesState(params);
}

/**
 * Posts xAPI statements for an activity to the LRS (PUT method).
 * 
 * @async
 * @function putStatementsLRSForActivity
 * @param {number} currentUserId - The ID of the user sending statements
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {number} activityId - The ID of the activity
 * @param {any} body - Array of xAPI statements to send
 * @param {number} lrsmanagerUserId - The ID of the LRS manager user
 * @returns {Promise<number[]>} Array of IDs for the successfully sent statements
 * 
 * @throws {NotFoundError} If the user is not a participant in the activity
 * 
 * @example
 * ```typescript
 * const sentIds = await putStatementsLRSForActivity(123, false, true, 456, [
 *   { id: '1', actor: { account: { name: 'user123' } }, verb: { id: 'completed' } }
 * ], 789);
 * ```
 */
export async function putStatementsLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, body: any, lrsmanagerUserId: number): Promise<number[]> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    if(!activity) {
        throw new NotFoundError("The user you are trying to set statement to is not a participant");
    }
    if(await activity.canSendStatementsLRS()) {
        await activity.processStatementsForActivity(currentUserId, body);
        const useTestUrls = await activity.isCurrentUserParticipantAsTester();
        logger.debug({ useTestUrls }, "Determined whether to use test URLs for LRS statements");
        let ids = await activity.sendLRSStatements(lrsmanagerUserId, body, useTestUrls);
        return ids;
    } else {
        return [];
    }
}

/**
 * Updates agent profile information for an activity in the LRS (PUT method).
 * 
 * @async
 * @function putAgentsProfileLRSForActivity
 * @param {number} currentUserId - The ID of the user updating agent profiles
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {number} activityId - The ID of the activity
 * @param {any} body - Agent profile data to update
 * @param {number} lrsmanagerUserId - The ID of the LRS manager user
 * @returns {Promise<Object>} The updated agent profile
 * 
 * @example
 * ```typescript
 * const updatedProfile = await putAgentsProfileLRSForActivity(123, false, true, 456, {
 *   name: 'John Updated'
 * }, 789);
 * ```
 */
export async function putAgentsProfileLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, body: any, lrsmanagerUserId: number): Promise<Object> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    if(!activity) {
        throw new NotFoundError("The user you are trying to set statement to is not a participant");
    }
    return await activity.updateLRSAgentsProfile(body);
}

/**
 * Updates sub-activity profile information for an activity in the LRS (PUT method).
 * 
 * @async
 * @function putActivitiesProfileLRSForActivity
 * @param {number} currentUserId - The ID of the user updating sub-activity profiles
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {number} activityId - The ID of the activity
 * @param {any} body - Sub-activity profile data to update
 * @param {number} lrsmanagerUserId - The ID of the LRS manager user
 * @returns {Promise<Object>} The updated sub-activity profile
 * 
 * @example
 * ```typescript
 * const updatedProfile = await putActivitiesProfileLRSForActivity(123, false, true, 456, {
 *   name: 'Updated Child Activity'
 * }, 789);
 * ```
 */
export async function putActivitiesProfileLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, body: any, lrsmanagerUserId: number): Promise<Object> {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    if(!activity) {
        throw new NotFoundError("The user you are trying to set statement to is not a participant");
    }
    return await activity.updateLRSActivitiesProfile(body);
}

/**
 * Retrieves activity information from the LRS.
 * 
 * @async
 * @function getAboutLRSForActivity
 * @param {number} currentUserId - The ID of the user requesting activity information
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {number} activityId - The ID of the activity
 * @returns {Promise<any>} Activity information object
 * 
 * @throws {NotFoundError} If the user is not a participant in the activity
 * 
 * @example
 * ```typescript
 * const about = await getAboutLRSForActivity(123, false, true, 456);
 * ```
 */
export async function getAboutLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    if(!activity) {
        throw new NotFoundError("The user you are trying to set statement to is not a participant");
    }
    return await activity.getLRSAbout();
}

/**
 * Retrieves an extension from the LRS for an activity.
 * 
 * @async
 * @function getExtensionLRSForActivity
 * @param {number} currentUserId - The ID of the user requesting the extension
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {boolean} allocated - Whether the user is allocated to the activity
 * @param {number} activityId - The ID of the activity
 * @param {string} extensionId - The ID of the extension to retrieve
 * @returns {Promise<any>} The extension data
 * 
 * @throws {NotFoundError} If the user is not a participant in the activity
 * 
 * @example
 * ```typescript
 * const extension = await getExtensionLRSForActivity(123, false, true, 456, 'com.example.extension');
 * ```
 */
export async function getExtensionLRSForActivity(currentUserId: number, is_admin: boolean, allocated: boolean, activityId: number, extensionId: string) {
    let activity = await Activity.getFromDbData(activityId, allocated, is_admin, currentUserId);
    if(!activity) {
        throw new NotFoundError("The user you are trying to set statement to is not a participant");
    }
    return await activity.getLRSExtension(extensionId);
}   