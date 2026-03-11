/**
 * @fileoverview Service for Session activities operations.
 * Handles all CRUD operations for activities within sessions.
 * 
 * Activities are individual tasks or components that participants complete
 * within a session, such as surveys, games, or other interactive content.
 * 
 * @module services/simlets/session.activities
 * @requires @/lib/mappers/session/Session
 * @requires @/lib/mappers/activities/Activity
 */

import { Session } from "@/lib/mappers/session/Session";
import { Activity } from "@/lib/mappers/activities/Activity";

/**
 * Retrieves all activities within a specific session.
 * Activities are the individual tasks or components that participants complete.
 * 
 * @async
 * @function getSessionActivities
 * @param {number} simlet_id - The ID of the parent simlet
 * @param {number} sessionId - The ID of the session containing the activities
 * @param {number} current_user_id - The ID of the user requesting the activities
 * @returns {Promise<Activity[]>} Array of activities within the session
 * @throws {NotFoundError} When simlet or session is not found
 * @throws {PermissionError} When user lacks read permissions
 * 
 * @example
 * ```typescript
 * const activities = await getSessionActivities(123, 789, 456);
 * activities.forEach(a => logger.info(a.name, a.type, a.url));
 * ```
 */
export async function getSessionActivities(simlet_id: number, sessionId: number, is_admin: boolean, current_user_id?: number): Promise<Activity[]> {
  let session = await Session.getFromDbData(simlet_id, sessionId, is_admin, current_user_id);
  return await session.getActivities();
}

/**
 * Adds new activities to a session within a simlet.
 * Activities are individual tasks or components that participants complete.
 * 
 * @async
 * @function addSessionActivities
 * @param {number} simletId - The ID of the parent simlet
 * @param {number} sessionId - The ID of the session to add activities to
 * @param {number} current_user_id - The ID of the user adding the activities
 * @param {Object} body - Activity configuration data
 * @returns {Promise<Activity>} The newly created activity instance
 * @throws {NotFoundError} When simlet or session is not found
 * @throws {PermissionError} When user lacks create permissions
 * @throws {ValidationError} When activity configuration is invalid
 * 
 * @example
 * ```typescript
 * const activity = await addSessionActivities(123, 456, 789, {
 *   name: 'Pre-test Survey',
 *   type: 'limesurvey',
 *   url: 'https://survey.example.com/123'
 * });
 * ```
 */
export async function addSessionActivities(simletId: number, sessionId: number, is_admin: boolean, body: any, current_user_id?: number): Promise<Activity> {
  let session = await Session.getFromDbData(simletId, sessionId, is_admin, current_user_id);
  return await session.addActivity(body);
}

/**
 * Updates an activity within a session.
 * Modifies activity properties such as name, configuration, etc.
 * 
 * @async
 * @function updateSessionActivity
 * @param {number} simletId - The ID of the parent simlet
 * @param {number} sessionId - The ID of the session containing the activity
 * @param {number} activityId - The ID of the activity to update
 * @param {number} current_user_id - The ID of the user updating the activity
 * @param {Object} body - Update data containing new activity properties
 * @returns {Promise<Activity>} The updated activity instance
 * @throws {NotFoundError} When simlet, session, or activity is not found
 * @throws {PermissionError} When user lacks update permissions
 * @throws {ValidationError} When update data is invalid
 * 
 * @example
 * ```typescript
 * const activity = await updateSessionActivity(123, 456, 789, 555, {
 *   name: 'Updated Survey Name'
 * });
 * ```
 */
export async function updateSessionActivity(simletId: number, sessionId: number, activityId: number, is_admin: boolean, body: any, current_user_id?: number): Promise<Activity> {
  // First verify the session exists and user has access
  await Session.getFromDbData(simletId, sessionId, is_admin, current_user_id);
  // Get the activity and update it
  let activity = await Activity.getFromDbData(activityId, false, is_admin, current_user_id);
  await activity.patch(body);
  // Return refreshed activity
  return Activity.getFromDbData(activityId, false, is_admin, current_user_id);
}

/**
 * Deletes an activity from a session.
 * Permanently removes the activity and its associated data.
 * 
 * @async
 * @function deleteSessionActivity
 * @param {number} simletId - The ID of the parent simlet
 * @param {number} sessionId - The ID of the session containing the activity
 * @param {number} activityId - The ID of the activity to delete
 * @param {number} current_user_id - The ID of the user deleting the activity
 * @returns {Promise<void>} No return value on successful deletion
 * @throws {NotFoundError} When simlet, session, or activity is not found
 * @throws {PermissionError} When user lacks delete permissions
 * 
 * @example
 * ```typescript
 * await deleteSessionActivity(123, 456, 789, 555);
 * ```
 */
export async function deleteSessionActivity(simletId: number, sessionId: number, activityId: number, is_admin: boolean, current_user_id: number | undefined): Promise<void> {
  // First verify the session exists and user has access
  await Session.getFromDbData(simletId, sessionId, is_admin, current_user_id);
  // Get the activity and delete it
  let activity = await Activity.getFromDbData(activityId, false, is_admin, current_user_id);
  await activity.remove();
}
