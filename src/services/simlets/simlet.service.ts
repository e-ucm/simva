/**
 * @fileoverview Service for Simlet entity operations.
 * Handles all CRUD operations and business logic for SIMVA simlets.
 * 
 * A Simlet (Simulation Learning Environment Template) is the top-level learning container
 * that contains sessions and activities for educational research studies.
 * 
 * @module services/simlets/simlet
 * @requires @/lib/db
 * @requires @/lib/errors/appErrors
 * @requires sequelize
 */

import { Simlet } from "@/lib/mappers/simlet/Simlet";
import { logger } from "@/lib/logger";
import { Allocator } from "@/lib/mappers/allocators/Allocator";
import { SimletParticipant } from "@/lib/mappers/simlet/SimletParticipant";
import { SimletGroup } from "@/lib/mappers/simlet/SimletGroup";
import { Session } from "@/lib/mappers/session/Session";
import { Activity } from "@/lib/mappers/activities/Activity";
import { UserPermission } from "@/lib/mappers/UserPermisions/UserPermission";
import { SingleUserPermission } from "@/lib/mappers/UserPermisions/SingleUserPermission";

/**
 * Service for Simlet entity operations.
 * Handles all CRUD operations and business logic for simlets.
 * 
 * @namespace SimletService
 */

/**
 * Retrieves all simlets for a specific user.
 * Uses the v_complete_simlets_users_permissions view to get user's simlets.
 * 
 * @async
 * @function getSimletsByUserId
 * @param {number} current_user_id - The user ID to search for
 * @returns {Promise<Simlet[]>} Array of simlet records with permission information
 * 
 * @example
 * ```typescript
 * const userSimlets = await getSimletsByUserId(123);
 * ```
 */
export async function getSimletsByUserId(user_id: number, searchString?: string, limit?: number, offset?: number): Promise<Simlet[]> {
  return await Simlet.getAllFromDbData(user_id, false, searchString, limit, offset);
}

/**
 * Retrieves specific simlets for a specific user.
 * Uses the v_complete_simlets_users_permissions view to get user's simlets.
 * 
 * @async
 * @function getSimletBySimletIdAndUserId
 * @param {number} simlet_id - The simlet ID to search for
 * @param {number} current_user_id - The user ID to search for
 * @returns {Promise<Simlet>} simlet record with permission information
 * 
 * @example
 * ```typescript
 * const userSimlet = await getSimletBySimletIdAndUserId(123, 456);
 * ```
 */
export async function getSimletBySimletIdAndUserId(simlet_id: number, current_user_id: number): Promise<Simlet> {
  let simlet = await Simlet.getFromDbData(simlet_id, current_user_id);
  simlet.printInfo(); // Example of using the Simlet class to log info about the first simlet
  return simlet;
}

/**
 * Creates a new simlet with the provided data.
 * 
 * @async
 * @function createSimlet
 * @param {any} simletData - The simlet data to create
 * @returns {Promise<Simlet>} The created simlet instance
 * @throws {ValidationError} When simlet data is invalid
 * 
 * @example
 * ```typescript
 * const newSimlet = await createSimlet({
 *   name: 'My Study',
 *   description: 'A comprehensive learning study',
 *   owner_id: 123
 * });
 * ```
 */
export async function createSimlet(simletData: any): Promise<Simlet> {
  return await Simlet.createSimlet(simletData);
}

/**
 * Updates a simlet with partial data.
 * 
 * @async
 * @function patch
 * @param {number} simletId - The ID of the simlet to update
 * @param {number} current_user_id - The ID of the user requesting the update
 * @param {any} simletData - Partial simlet data to update
 * @returns {Promise<Simlet>} The updated simlet instance
 * @throws {NotFoundError} When simlet is not found
 * @throws {PermissionError} When user lacks update permissions
 * @throws {ValidationError} When update data is invalid
 * 
 * @example
 * ```typescript
 * const updatedSimlet = await patch(123, 456, {
 *   name: 'Updated Study Name',
 *   description: 'New description'
 * });
 * ```
 */
export async function patch(simletId: number, current_user_id: number, simletData: any): Promise<Simlet> {
  let simlet = await Simlet.getFromDbData(simletId, current_user_id);
  return await simlet.patch(simletData);
}

/**
 * Deletes a simlet and all its associated data.
 * 
 * @async
 * @function deleteSimlet
 * @param {number} simletId - The ID of the simlet to delete
 * @param {number} current_user_id - The ID of the user requesting the deletion
 * @returns {Promise<void>} Promise that resolves when deletion is complete
 * @throws {NotFoundError} When simlet is not found
 * @throws {PermissionError} When user lacks delete permissions
 * 
 * @example
 * ```typescript
 * await deleteSimlet(123, 456);
 * ```
 */
export async function deleteSimlet(simletId: number, current_user_id: number): Promise<void> {
  let simlet = await Simlet.getFromDbData(simletId, current_user_id);
  await simlet.delete();
}

/**
 * Retrieves the allocator associated with a simlet.
 * The allocator determines how participants are assigned to different conditions.
 * 
 * @async
 * @function getAllocatorFromSimlet
 * @param {number} simletId - The ID of the simlet
 * @param {number} current_user_id - The ID of the user requesting the allocator
 * @returns {Promise<Allocator>} The allocator instance for the simlet
 * @throws {NotFoundError} When simlet or allocator is not found
 * @throws {PermissionError} When user lacks read permissions
 * 
 * @example
 * ```typescript
 * const allocator = await getAllocatorFromSimlet(123, 456);
 * logger.info(allocator.type); // 'random', 'manual', etc.
 * ```
 */
export async function getAllocatorFromSimlet(simletId: number, current_user_id: number): Promise<Allocator> {
  let simlet = await Simlet.getFromDbData(simletId, current_user_id);
  return await simlet.getAllocator();
}

/**
 * Retrieves all participants allocated to a simlet.
 * Returns participants with their allocation information and assigned conditions.
 * 
 * @async
 * @function getSimletParticipants
 * @param {number} simletId - The ID of the simlet
 * @param {number} current_user_id - The ID of the user requesting the participants
 * @returns {Promise<SimletParticipant[]>} Array of allocated participants
 * @throws {NotFoundError} When simlet is not found
 * @throws {PermissionError} When user lacks read permissions
 * 
 * @example
 * ```typescript
 * const participants = await getSimletParticipants(123, 456);
 * participants.forEach(p => logger.info(p.user_id, p.allocated_group));
 * ```
 */
export async function getSimletParticipants(simletId: number, current_user_id: number): Promise<SimletParticipant[]> {
  let simlet = await Simlet.getFromDbData(simletId, current_user_id);
  return await simlet.getAllocatedParticipants();
}

/**
 * Retrieves all groups associated with a simlet.
 * Groups define collections of users that can participate in the simlet.
 * 
 * @async
 * @function getSimletGroups
 * @param {number} simletId - The ID of the simlet
 * @param {number} current_user_id - The ID of the user requesting the groups
 * @returns {Promise<SimletGroup[]>} Array of groups associated with the simlet
 * @throws {NotFoundError} When simlet is not found
 * @throws {PermissionError} When user lacks read permissions
 * 
 * @example
 * ```typescript
 * const groups = await getSimletGroups(123, 456);
 * groups.forEach(g => logger.info(g.group_name, g.participant_count));
 * ```
 */
export async function getSimletGroups(simletId: number, current_user_id: number): Promise<SimletGroup[]> {
  let simlet = await Simlet.getFromDbData(simletId, current_user_id);
  return await simlet.getGroups();
}

/**
 * Retrieves all sessions within a simlet.
 * Sessions represent discrete test phases or experimental conditions within a study.
 * 
 * @async
 * @function getSimletSessions
 * @param {number} simletId - The ID of the simlet
 * @param {number} current_user_id - The ID of the user requesting the sessions
 * @returns {Promise<Session[]>} Array of sessions within the simlet
 * @throws {NotFoundError} When simlet is not found
 * @throws {PermissionError} When user lacks read permissions
 * 
 * @example
 * ```typescript
 * const sessions = await getSimletSessions(123, 456);
 * sessions.forEach(s => logger.info(s.name, s.open_date, s.close_date));
* ``` */ 
export async function getSimletSessions(simletId: number, current_user_id: number, searchString?: string, limit?: number, offset?: number): Promise<Session[]> { 
  let simlet = await Simlet.getFromDbData(simletId, current_user_id); 
  return await simlet.getSessions(searchString, limit, offset); 
} 

/**
 * Retrieves a specific session within a simlet.
 * 
 * @async
 * @function getSimletSession
 * @param {number} simletId - The ID of the simlet
 * @param {number} sessionId - The ID of the session to retrieve
 * @param {number} current_user_id - The ID of the user requesting the session
 * @returns {Promise<Session>} The requested session instance
 * @throws {NotFoundError} When simlet or session is not found
 * @throws {PermissionError} When user lacks read permissions
 * 
 * @example
 * ```typescript
 * const session = await getSimletSession(123, 789, 456);
 * logger.info(session.name, session.status);
 * ```
 */
export async function getSimletSession(simletId: number, sessionId: number, current_user_id: number): Promise<Session> {
  let simlet = await Simlet.getFromDbData(simletId, current_user_id);
  return await simlet.getSession(sessionId);
}

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
export async function getSessionActivities(simlet_id: number, sessionId: number, current_user_id: number): Promise<Activity[]> {
  let session = await Session.getFromDbData(simlet_id, sessionId, current_user_id);
  return await session.getActivities();
}

/**
 * Gets the total count of simlets accessible to a user.
 * Used for pagination and statistics in simlet listings.
 * 
 * @async
 * @function getSimletCountByUserId
 * @param {number} current_user_id - The ID of the user requesting simlet count
 * @param {string} searchString - Optional search string to filter simlets
 * @returns {Promise<number>} The total number of accessible simlets
 * @throws {Error} If database query fails
 * 
 * @example
 * ```typescript
 * const totalSimlets = await getSimletCountByUserId(123, 'experiment');
 * logger.info(`Found ${totalSimlets} experiment simlets`);
 * ```
 */
export async function getSimletCountByUserId(current_user_id: number, searchString: string): Promise<number> {
  return await Simlet.getSimletCountByUserId(current_user_id, searchString);
}
/**
 * Gets the total count of sessions within a specific simlet.
 * Used for pagination and statistics in session listings.
 * 
 * @async
 * @function getSimletSessionCountByUserId
 * @param {number} simlet_id - The ID of the simlet
 * @param {number} current_user_id - The ID of the user requesting session count
 * @param {string} searchString - Optional search string to filter sessions
 * @returns {Promise<number>} The total number of sessions in the simlet
 * @throws {Error} If database query fails or simlet access is denied
 * 
 * @example
 * ```typescript
 * const sessionCount = await getSimletSessionCountByUserId(456, 123, 'test');
 * logger.info(`Found ${sessionCount} test sessions`);
 * ```
 */
export async function getSimletSessionCountByUserId(simlet_id: number, current_user_id: number, searchString: string): Promise<number> {
  return await Simlet.getSimletSessionCountByUserId(simlet_id, current_user_id, searchString);
}


/**
 * Updates or creates the allocator for a simlet.
 * The allocator determines how participants are assigned to different conditions.
 * 
 * @async
 * @function updateSimletAllocator
 * @param {number} simletId - The ID of the simlet
 * @param {number} current_user_id - The ID of the user updating the allocator
 * @param {Object} body - Allocator configuration data
 * @returns {Promise<Allocator>} The updated allocator instance
 * @throws {NotFoundError} When simlet is not found
 * @throws {PermissionError} When user lacks update permissions
 * @throws {ValidationError} When allocator configuration is invalid
 * 
 * @example
 * ```typescript
 * const allocator = await updateSimletAllocator(123, 456, {
 *   type: 'random',
 *   conditions: ['control', 'experimental']
 * });
 * ```
 */
export async function updateSimletAllocator(simletId: number, current_user_id: number, body : any): Promise<Allocator> {
    let simlet = await Simlet.getFromDbData(simletId, current_user_id);
    return await simlet.updateAllocator(body);
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
export async function addSessionActivities(simletId: number, sessionId: number, current_user_id: number, body: any): Promise<Activity> {
  let session = await Session.getFromDbData(simletId, sessionId, current_user_id);
  return await session.addActivity(body);
}

/**
 * Creates a new session within a simlet.
 * Sessions represent discrete test phases or experimental conditions.
 * 
 * @async
 * @function createSimletSession
 * @param {number} simletId - The ID of the parent simlet
 * @param {number} current_user_id - The ID of the user creating the session
 * @param {Object} body - Session configuration data including name, dates, etc.
 * @returns {Promise<Session>} The newly created session instance
 * @throws {NotFoundError} When simlet is not found
 * @throws {PermissionError} When user lacks create permissions
 * @throws {ValidationError} When session configuration is invalid
 * 
 * @example
 * ```typescript
 * const session = await createSimletSession(123, 456, {
 *   name: 'Phase 1: Pre-assessment',
 *   description: 'Initial evaluation phase',
 *   open_date: '2024-01-15',
 *   close_date: '2024-02-15'
 * });
 * ```
 */
export async function createSimletSession(simletId: number, current_user_id: number, body: any): Promise<Simlet> {
  let simlet = await Simlet.getFromDbData(simletId, current_user_id);
  return await simlet.addSession(body);
}

export async function getSimletSchedule(simletId: number, current_user_id: number) : Promise<any> {
  const session = await Session.getScheduledSessionForUser(simletId, current_user_id);
  let schedule : any = {
      activities: {},
      next: null
  };
  let foundNext = false;
  if(session.allocated_activities && session.allocated_activities.length > 0) {
      for(const activity of session.allocated_activities) {
          schedule.activities[activity.activity_id] = activity;
          if(!schedule.next) {
            if(!activity.activity_completed) {
                schedule.next = activity;
            }
          }
      }
  }
  logger.info(schedule);
  return schedule;
}

/**
 * Updates a session within a simlet.
 * Modifies session properties such as name, description, dates, etc.
 * 
 * @async
 * @function patchSimletSession
 * @param {number} simletId - The ID of the parent simlet
 * @param {number} sessionId - The ID of the session to update
 * @param {number} current_user_id - The ID of the user updating the session
 * @param {Object} body - Update data containing new session properties
 * @returns {Promise<Session>} The updated session instance
 * @throws {NotFoundError} When simlet or session is not found
 * @throws {PermissionError} When user lacks update permissions
 * @throws {ValidationError} When update data is invalid
 * 
 * @example
 * ```typescript
 * const updatedSession = await patchSimletSession(123, 456, 789, {
 *   name: 'Updated Session Name',
 *   close_date: '2024-12-31'
 * });
 * ```
 */
export async function patchSimletSession(simletId: number, sessionId: number, current_user_id: number, body: any): Promise<Session> {
  let session = await Session.getFromDbData(simletId, sessionId, current_user_id);
  return await session.update(body);
}

/**
 * Deletes a session from a simlet.
 * Permanently removes the session and all associated activities.
 * 
 * @async
 * @function deleteSimletSession
 * @param {number} simletId - The ID of the parent simlet
 * @param {number} sessionId - The ID of the session to delete
 * @param {number} current_user_id - The ID of the user deleting the session
 * @returns {Promise<void>} No return value on successful deletion
 * @throws {NotFoundError} When simlet or session is not found
 * @throws {PermissionError} When user lacks delete permissions
 * @throws {ValidationError} When session cannot be deleted due to constraints
 * 
 * @example
 * ```typescript
 * await deleteSimletSession(123, 456, 789);
 * ```
 */
export async function deleteSimletSession(simletId: number, sessionId: number, current_user_id: number): Promise<void> {
  let session = await Session.getFromDbData(simletId, sessionId, current_user_id);
  return await session.delete();
}

/**
 * Retrieves all permissions associated with a simlet.
 * Shows all users who have access to the simlet and their permission levels.
 * 
 * @async
 * @function getSimletPermissions
 * @param {number} simletId - The ID of the simlet
 * @param {number} current_user_id - The ID of the user requesting permissions list
 * @returns {Promise<UserPermission[]>} Array of all simlet permissions
 * @throws {NotFoundError} When simlet is not found or user lacks access
 * 
 * @example
 * ```typescript
 * const permissions = await getSimletPermissions(123, 456);
 * permissions.forEach(perm => {
 *   logger.info(`User ${perm.user_id}: ${perm.permission_level}`);
 * });
 * ```
 */
export async function getSimletPermissions(simletId: number, current_user_id: number): Promise<UserPermission> {
  let simlet = await Simlet.getFromDbData(simletId, current_user_id);
  return await simlet.getPermissions();
}

/**
 * Creates new permissions for a simlet.
 * Grants users specific access rights to the simlet and its contents.
 * 
 * @async
 * @function createSimletPermissions
 * @param {number} simletId - The ID of the simlet
 * @param {number} current_user_id - The ID of the user creating the permissions
 * @param {Object} body - Permission data containing user ID and permission level
 * @returns {Promise<UserPermission>} The newly created permission object
 * @throws {NotFoundError} When simlet is not found
 * @throws {PermissionError} When user lacks admin permissions
 * @throws {ValidationError} When permission data is invalid
 * 
 * @example
 * ```typescript
 * const permission = await createSimletPermissions(123, 456, {
 *   user_id: 789,
 *   permission_level: 'read'
 * });
 * ```
 */
export async function createSimletPermissions(simletId: number, current_user_id: number, body: any): Promise<UserPermission> {
  let simlet = await Simlet.getFromDbData(simletId, current_user_id);
  return await simlet.createPermissions(body);
}

/**
 * Retrieves permissions for a specific user in a simlet.
 * Shows what access rights the user has for the simlet.
 * 
 * @async
 * @function getSimletPermissionsForUser
 * @param {number} simletId - The ID of the simlet
 * @param {number} userId - The ID of the user whose permissions to retrieve
 * @param {number} current_user_id - The ID of the user requesting permission info
 * @returns {Promise<UserPermission>} The user's permission object for the simlet
 * @throws {NotFoundError} When simlet or user is not found
 * @throws {PermissionError} When current user lacks access to view permissions
 * 
 * @example
 * ```typescript
 * const permissions = await getSimletPermissionsForUser(123, 789, 456);
 * logger.info('User permission level:', permissions.permission_level);
 * ```
 */
export async function getSimletPermissionsForUser(simletId: number, userId: number, current_user_id: number): Promise<SingleUserPermission> {
  let simlet = await Simlet.getFromDbData(simletId, current_user_id);
  return await simlet.getPermissionsForUser(userId);
}

/**
 * Updates permissions for a specific user in a simlet.
 * Modifies the user's access rights and role assignments.
 * 
 * @async
 * @function patchSimletPermissionsForUser
 * @param {number} simletId - The ID of the simlet
 * @param {number} userId - The ID of the user whose permissions to update
 * @param {number} current_user_id - The ID of the user performing the update
 * @param {Object} body - Permission update data
 * @returns {Promise<UserPermission>} The updated permission object
 * @throws {NotFoundError} When simlet or user is not found
 * @throws {PermissionError} When current user lacks admin permissions
 * @throws {ValidationError} When permission data is invalid
 * 
 * @example
 * ```typescript
 * const permission = await patchSimletPermissionsForUser(
 *   123, 789, 456,
 *   { permission_level: 'write' }
 * );
 * ```
 */
export async function patchSimletPermissionsForUser(simletId: number, userId: number, current_user_id: number, body: any): Promise<SingleUserPermission> {
  let simlet = await Simlet.getFromDbData(simletId, current_user_id);
  return await simlet.patchPermissionsForUser(userId, body);
}

/**
 * Removes all permissions for a specific user from a simlet.
 * Revokes user's access to the simlet and its contents.
 * 
 * @async
 * @function deleteSimletPermissionsForUser
 * @param {number} simletId - The ID of the simlet
 * @param {number} userId - The ID of the user whose permissions to remove
 * @param {number} current_user_id - The ID of the user performing the deletion
 * @returns {Promise<void>} No return value on successful deletion
 * @throws {NotFoundError} When simlet or user is not found
 * @throws {PermissionError} When current user lacks admin permissions
 * 
 * @example
 * ```typescript
 * await deleteSimletPermissionsForUser(123, 789, 456);
 * ```
 */
export async function deleteSimletPermissionsForUser(simletId: number, userId: number, current_user_id: number): Promise<void> {
  let simlet = await Simlet.getFromDbData(simletId, current_user_id);
  await simlet.deletePermissionsForUser(userId);
}

/**
 * Removes permissions for a specific user from a session.
 * Revokes user's access to the session within the simlet.
 * 
 * @async
 * @function deleteSessionPermissionsForUser
 * @param {number} simletId - The ID of the parent simlet
 * @param {number} sessionId - The ID of the session
 * @param {number} userId - The ID of the user whose permissions to remove
 * @param {number} current_user_id - The ID of the user performing the deletion
 * @returns {Promise<void>} No return value on successful deletion
 * @throws {NotFoundError} When simlet, session, or user is not found
 * @throws {PermissionError} When current user lacks admin permissions
 * 
 * @example
 * ```typescript
 * await deleteSessionPermissionsForUser(123, 456, 789, 555);
 * ```
 */
export async function deleteSessionPermissionsForUser(simletId: number, sessionId: number, userId: number, current_user_id: number): Promise<void> {
  let session = await Session.getFromDbData(simletId, sessionId, current_user_id);
  await session.deletePermissionsForUser(userId);
}

/**
 * Updates permissions for a specific user in a session.
 * Modifies the user's access rights to the session.
 * 
 * @async
 * @function patchSessionPermissionsForUser
 * @param {number} simletId - The ID of the parent simlet
 * @param {number} sessionId - The ID of the session
 * @param {number} userId - The ID of the user whose permissions to update
 * @param {number} current_user_id - The ID of the user performing the update
 * @param {Object} body - Permission update data
 * @returns {Promise<UserPermission>} The updated permission object
 * @throws {NotFoundError} When simlet, session, or user is not found
 * @throws {PermissionError} When current user lacks admin permissions
 * @throws {ValidationError} When permission data is invalid
 * 
 * @example
 * ```typescript
 * const permission = await patchSessionPermissionsForUser(
 *   123, 456, 789, 555,
 *   { permission_level: 'read' }
 * );
 * ```
 */
export async function patchSessionPermissionsForUser(simletId: number, sessionId: number, userId: number, current_user_id: number, body: any): Promise<SingleUserPermission> {
  let session = await Session.getFromDbData(simletId, sessionId, current_user_id);
  return await session.patchPermissionsForUser(userId, body);
}

/**
 * Retrieves permissions for a specific user in a session.
 * Shows what access rights the user has for the session.
 * 
 * @async
 * @function getSessionPermissionsForUser
 * @param {number} simletId - The ID of the parent simlet
 * @param {number} sessionId - The ID of the session
 * @param {number} userId - The ID of the user whose permissions to retrieve
 * @param {number} current_user_id - The ID of the user requesting permission info
 * @returns {Promise<UserPermission>} The user's permission object for the session
 * @throws {NotFoundError} When simlet, session, or user is not found
 * @throws {PermissionError} When current user lacks access to view permissions
 * 
 * @example
 * ```typescript
 * const permissions = await getSessionPermissionsForUser(123, 456, 789, 555);
 * logger.info('User session permission:', permissions.permission_level);
 * ```
 */
export async function getSessionPermissionsForUser(simletId: number, sessionId: number, userId: number, current_user_id: number): Promise<SingleUserPermission> {
  let session = await Session.getFromDbData(simletId, sessionId, current_user_id);
  return await session.getPermissionsForUser(userId);
}

/**
 * Creates new permissions for a session.
 * Grants users specific access rights to the session and its activities.
 * 
 * @async
 * @function createSessionPermissions
 * @param {number} simletId - The ID of the parent simlet
 * @param {number} sessionId - The ID of the session
 * @param {number} current_user_id - The ID of the user creating the permissions
 * @param {Object} body - Permission data containing user ID and permission level
 * @returns {Promise<SingleUserPermission>} The newly created permission object
 * @throws {NotFoundError} When simlet or session is not found
 * @throws {PermissionError} When user lacks admin permissions
 * @throws {ValidationError} When permission data is invalid
 * 
 * @example
 * ```typescript
 * const permission = await createSessionPermissions(123, 456, 789, {
 *   user_id: 555,
 *   permission_level: 'read'
 * });
 * ```
 */
export async function createSessionPermissions(simletId: number, sessionId: number, current_user_id: number, body: any): Promise<UserPermission> {
  let session = await Session.getFromDbData(simletId, sessionId, current_user_id);
  return await session.createPermissions(body);
}

/**
 * Retrieves all permissions associated with a session.
 * Shows all users who have access to the session and their permission levels.
 * 
 * @async
 * @function getSessionPermissions
 * @param {number} simletId - The ID of the parent simlet
 * @param {number} sessionId - The ID of the session
 * @param {number} current_user_id - The ID of the user requesting permissions list
 * @returns {Promise<UserPermission>} Array of all session permissions
 * @throws {NotFoundError} When simlet or session is not found or user lacks access
 * 
 * @example
 * ```typescript
 * const permissions = await getSessionPermissions(123, 456, 789);
 * permissions.forEach(perm => {
 *   logger.info(`User ${perm.user_id}: ${perm.permission_level}`);
 * });
 * ```
 */
export async function getSessionPermissions(simletId: number, sessionId: number, current_user_id: number): Promise<UserPermission> {
  let session = await Session.getFromDbData(simletId, sessionId, current_user_id);
  return await session.getPermissions();
}

export async function getSimletsForStudent(current_user_id: number, searchString: string, limit: number | undefined, offset: number | undefined): Promise<Simlet[]> {
  return await Simlet.getAllFromDbData(current_user_id, true, searchString, limit, offset);
}

export async function getSimletSessionParticipants(simletId: number, sessionId: number, current_user_id: number) {
  let session = await Session.getFromDbData(simletId, sessionId, current_user_id);
  return await session.getParticipants();
}
