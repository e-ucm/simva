/**
 * @fileoverview Service for Session operations.
 * Handles all CRUD operations and business logic for sessions within simlets.
 * 
 * Sessions represent discrete test phases or experimental conditions within a study.
 * Each session can contain multiple activities and have its own participant allocations.
 * 
 * @module services/simlets/session
 * @requires @/lib/mappers/simlet/Simlet
 * @requires @/lib/mappers/session/Session
 * @requires @/lib/mappers/allocators/Allocator
 * @requires @/lib/errors/appErrors
 */

import { Simlet } from "@/lib/mappers/simlet/Simlet";
import { Session } from "@/lib/mappers/session/Session";
import { NotFoundError, ValidationError } from "@/lib/errors/appErrors";
import { SimletGroup } from "@/lib/mappers/simletGroup/SimletGroup";
import { SessionTag } from "@/lib/mappers/session/SessionTagsElement";
import { config } from "@/lib/config";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Retrieves all sessions within a simlet.
 * Sessions represent discrete test phases or experimental conditions within a study.
 * 
 * @async
 * @function getSimletSessions
 * @param {number} simletId - The ID of the simlet
 * @param {boolean} is_admin - Whether the user is an admin
 * @param {string} [status] - Optional status filter for sessions (active, inactive, terminated)
 * @param {string} [searchString] - Optional search string to filter sessions
 * @param {number[]} [searchTags] - Optional array of tag IDs to filter sessions
 * @param {number} [limit] - Optional limit for pagination
 * @param {number} [offset] - Optional offset for pagination
 * @param {string} [orderBy] - The field to order the sessions by
 * @param {string} [order] - The order direction (ASC or DESC)
 * @param {number} [current_user_id] - The ID of the user requesting the sessions
 * @returns {Promise<Session[]>} Array of sessions within the simlet
 * @throws {NotFoundError} When simlet is not found
 * @throws {PermissionError} When user lacks read permissions
 * 
 * @example
 * ```typescript
 * const sessions = await getSimletSessions(123, false, 'active', 'test', undefined, 10, 0, 'name', 'ASC', 456);
 * sessions.forEach(s => logger.info(s.name, s.open_date, s.close_date));
 * ```
 */
export async function getSimletSessions(simletId: number, is_admin: boolean, status ?: string, searchString?: string, searchTags?: number[], limit?: number, offset?: number, orderBy?: string, order?: string, current_user_id?: number): Promise<Session[]> {
  let simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  return await simlet.getSessions(status, searchString, searchTags, limit, offset, orderBy, order);
}

/**
 * Gets the total count of sessions within a specific simlet.
 * Used for pagination and statistics in session listings.
 * 
 * @async
 * @function getSimletSessionCountByUserId
 * @param {number} simlet_id - The ID of the simlet
 * @param {number} current_user_id - The ID of the user requesting session count
 * @param {string} [status] - Optional status filter for sessions
 * @param {string} [searchString] - Optional search string to filter sessions
 * @param {number[]} [searchTags] - Optional array of tag IDs to filter sessions
 * @returns {Promise<number>} The total number of sessions in the simlet
 * @throws {Error} If database query fails or simlet access is denied
 * 
 * @example
 * ```typescript
 * const sessionCount = await getSimletSessionCountByUserId(456, 123, 'active', 'test');
 * logger.info(`Found ${sessionCount} test sessions`);
 * ```
 */
export async function getSimletSessionCountByUserId(simlet_id: number, current_user_id: number, status ?: string, searchString?: string, searchTags?: number[]): Promise<number> {
  return await Session.getSimletSessionCountByUserId(simlet_id, current_user_id, status, searchString, searchTags);
}

/**
 * Retrieves a specific session within a simlet.
 * 
 * @async
 * @function getSimletSession
 * @param {number} simletId - The ID of the simlet
 * @param {number} sessionId - The ID of the session to retrieve
 * @param {boolean} is_admin - Whether the user is an admin
 * @param {number} [current_user_id] - The ID of the user requesting the session
 * @returns {Promise<Session>} The requested session instance
 * @throws {NotFoundError} When simlet or session is not found
 * @throws {PermissionError} When user lacks read permissions
 * 
 * @example
 * ```typescript
 * const session = await getSimletSession(123, 789, false, 456);
 * logger.info(session.name, session.status);
 * ```
 */
export async function getSimletSession(simletId: number, sessionId: number, is_admin: boolean, current_user_id?: number): Promise<Session> {
  let simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  return await simlet.getSession(sessionId);
}

/**
 * Creates a new session within a simlet.
 * Sessions represent discrete test phases or experimental conditions.
 * 
 * @async
 * @function createSimletSession
 * @param {number} simletId - The ID of the parent simlet
 * @param {boolean} is_admin - Whether the user is an admin
 * @param {any} body - Session configuration data including name, dates, etc.
 * @param {number} [current_user_id] - The ID of the user creating the session
 * @returns {Promise<Session>} The newly created session instance
 * @throws {NotFoundError} When simlet is not found
 * @throws {PermissionError} When user lacks create permissions
 * @throws {ValidationError} When session configuration is invalid
 * 
 * @example
 * ```typescript
 * const session = await createSimletSession(123, false, {
 *   name: 'Phase 1: Pre-assessment',
 *   description: 'Initial evaluation phase',
 *   open_date: '2024-01-15',
 *   close_date: '2024-02-15'
 * }, 456);
 * ```
 */
export async function createSimletSession(simletId: number, is_admin: boolean, body: any, current_user_id?: number): Promise<Session> {
  let simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  return await simlet.addSession(body);
}

/**
 * Updates a session within a simlet.
 * Modifies session properties such as name, description, dates, etc.
 * 
 * @async
 * @function patchSimletSession
 * @param {number} simletId - The ID of the parent simlet
 * @param {number} sessionId - The ID of the session to update
 * @param {boolean} is_admin - Whether the user is an admin
 * @param {any} body - Update data containing new session properties
 * @param {number} [current_user_id] - The ID of the user updating the session
 * @returns {Promise<Session>} The updated session instance
 * @throws {NotFoundError} When simlet or session is not found
 * @throws {PermissionError} When user lacks update permissions
 * @throws {ValidationError} When update data is invalid
 * 
 * @example
 * ```typescript
 * const updatedSession = await patchSimletSession(123, 456, false, {
 *   name: 'Updated Session Name',
 *   close_date: '2024-12-31'
 * }, 789);
 * ```
 */
export async function patchSimletSession(simletId: number, sessionId: number, is_admin: boolean, body: any, current_user_id?: number): Promise<Session> {
  let session = await Session.getFromDbData(simletId, sessionId, is_admin, current_user_id);
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
 * @param {boolean} is_admin - Whether the user is an admin
 * @param {number} [current_user_id] - The ID of the user deleting the session
 * @returns {Promise<void>} No return value on successful deletion
 * @throws {NotFoundError} When simlet or session is not found
 * @throws {PermissionError} When user lacks delete permissions
 * @throws {ValidationError} When session cannot be deleted due to constraints
 * 
 * @example
 * ```typescript
 * await deleteSimletSession(123, 456, false, 789);
 * ```
 */
export async function deleteSimletSession(simletId: number, sessionId: number, is_admin: boolean, current_user_id?: number): Promise<void> {
  let session = await Session.getFromDbData(simletId, sessionId, is_admin, current_user_id);
  return await session.delete();
}

/**
 * Retrieves all participants allocated to a session within a simlet.
 * 
 * @async
 * @function getSimletSessionParticipants
 * @param {number} simletId - The ID of the parent simlet
 * @param {number} sessionId - The ID of the session
 * @param {boolean} is_admin - Whether the user is an admin
 * @param {number} [current_user_id] - The ID of the user requesting participants
 * @returns {Promise<SimletParticipant[]>} Array of participants in the session
 * @throws {NotFoundError} When simlet or session is not found
 * @throws {PermissionError} When user lacks read permissions
 */
export async function getSimletSessionParticipants(simletId: number, sessionId: number, is_admin: boolean, current_user_id?: number) {
  let session = await Session.getFromDbData(simletId, sessionId, is_admin, current_user_id);
  return await session.getParticipants();
}

/**
 * Activates or deactivates a session.
 * Active sessions allow participants to complete activities.
 * 
 * @async
 * @function activateSession
 * @param {number} simletId - The ID of the parent simlet
 * @param {number} sessionId - The ID of the session to activate/deactivate
 * @param {boolean} is_admin - Whether the user is an admin
 * @param {string} activate - The desired state of the session ("active", "inactive", or "terminated")
 * @param {number} [current_user_id] - The ID of the user performing the action
 * @returns {Promise<Session>} The updated session instance
 * @throws {NotFoundError} When simlet or session is not found
 * @throws {PermissionError} When user lacks permissions
 * @throws {ValidationError} When session is already in the requested state
 * 
 * @example
 * ```typescript
 * const activeSession = await activateSession(123, 456, false, 'active', 789);
 * const inactiveSession = await activateSession(123, 456, false, 'inactive', 789);
 * const terminatedSession = await activateSession(123, 456, false, 'terminated', 789);
 * ```
 */
export async function activateSession(simletId: number, sessionId: number, is_admin: boolean, activate: string, current_user_id?: number): Promise<Session> {
  const session = await Session.getFromDbData(simletId, sessionId, is_admin, current_user_id);
  switch (activate) {
    case session.STATUS.ACTIVE:
      if(session.session_status === session.STATUS.TERMINATED) {
        throw new ValidationError('Session is terminated and cannot be activated');
      }
      if (session.session_status == session.STATUS.ACTIVE) {
        throw new ValidationError('Session is already active');
      } else {
        return await session.activate();
      }
    case session.STATUS.INACTIVE:
      if(session.session_status === session.STATUS.TERMINATED) {
        throw new ValidationError('Session is terminated and cannot be deactivated');
      }
      if (session.session_status == session.STATUS.ACTIVE) {
        return await session.deactivate();
      } else {
        throw new ValidationError('Session is already inactive');
      }
    case session.STATUS.TERMINATED:
      return await session.terminate();
    default:
      throw new ValidationError(`Activate must be either "${session.STATUS.ACTIVE}" or "${session.STATUS.INACTIVE}" or "${session.STATUS.TERMINATED}"`);
  }
}

/**
 * Allocates a participant or group to a specific session within a simlet.
 * Uses the simlet's allocator to assign the allocation.
 * 
 * @async
 * @function allocateToSessionSimlet
 * @param {number} simletId - The ID of the parent simlet
 * @param {number} group_id - The ID of the group to allocate
 * @param {number} sessionId - The ID of the session to allocate to
 * @param {boolean} is_admin - Whether the user is an admin
 * @param {number} id - The ID of the object being allocated (participant/group)
 * @param {number} [current_user_id] - The ID of the user performing allocation
 * @returns {Promise<SimletGroup>} The updated group instance
 * @throws {NotFoundError} When simlet or session is not found
 * @throws {PermissionError} When user lacks allocation permissions
 * 
 * @example
 * ```typescript
 * const allocator = await allocateToSessionSimlet(123, 456, 789, false, 555, 101);
 * ```
 */
export async function allocateToSessionSimlet(simletId: number, group_id: number, sessionId: number, is_admin: boolean, id: number, current_user_id?: number): Promise<SimletGroup> {
  const simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  return await simlet.allocateToSession(group_id, sessionId, id);
}

/**
 * Adds a tag to a session for a specific user.
 * 
 * @async
 * @function addTagForUser
 * @param {number} simletId - The ID of the parent simlet
 * @param {number} sessionId - The ID of the session
 * @param {boolean} is_admin - Whether the user is an admin
 * @param {number} current_user_id - The ID of the user adding the tag
 * @param {number} tag_id - The ID of the tag to add
 * @returns {Promise<SessionTag[]>} Array of tags associated with the session
 * 
 * @example
 * ```typescript
 * const tags = await addTagForUser(123, 456, false, 789, 101);
 * ```
 */
export async function addTagForUser(simletId: number, sessionId: number, is_admin: boolean, current_user_id: number, tag_id: number): Promise<SessionTag[]> {
   const session = await Session.getFromDbData(simletId, sessionId, is_admin, current_user_id);
   let tags = await session.addTagToList(tag_id);
   return tags;
}

/**
 * Deletes a tag from a session for a specific user.
 * 
 * @async
 * @function deleteSimletTagForUser
 * @param {number} simletId - The ID of the parent simlet
 * @param {number} sessionId - The ID of the session
 * @param {boolean} is_admin - Whether the user is an admin
 * @param {number} current_user_id - The ID of the user deleting the tag
 * @param {number} tag_id - The ID of the tag to delete
 * @returns {Promise<SessionTag[]>} Array of remaining tags associated with the session
 * 
 * @example
 * ```typescript
 * const tags = await deleteSimletTagForUser(123, 456, false, 789, 101);
 * ```
 */
export async function deleteSimletTagForUser(simletId: number, sessionId: number, is_admin: boolean, current_user_id: number, tag_id: number): Promise<SessionTag[]> {
  const session = await Session.getFromDbData(simletId, sessionId, is_admin, current_user_id);
  const tags = await session.deleteTagFromList(tag_id);
  return tags;
}

/**
 * Retrieves xAPI statements for a session from the LRS.
 * 
 * @async
 * @function getLRSStatements
 * @param {number} simletId - The ID of the parent simlet
 * @param {number} sessionId - The ID of the session
 * @param {boolean} is_admin - Whether the user is an admin
 * @param {number} currentUserId - The ID of the user requesting statements
 * @param {any} query - LRS query parameters for filtering statements
 * @returns {Promise<Object>} Array of xAPI statements matching the query
 * 
 * @example
 * ```typescript
 * const statements = await getLRSStatements(123, 456, false, 789, {
 *   actor: 'user123',
 *   verb: 'completed'
 * });
 * ```
 */
export async function getLRSStatements(simletId: number, sessionId: number, is_admin: boolean, currentUserId: number, query: any): Promise<Object> {
  const session = await Session.getFromDbData(simletId, sessionId, is_admin, currentUserId);
  return await session.getLRSStatements(query);
}

/**
 * Retrieves test xAPI statements for a session from the LRS for a specific user.
 * 
 * @async
 * @function getTestLRSStatements
 * @param {number} simletId - The ID of the parent simlet
 * @param {number} sessionId - The ID of the session
 * @param {boolean} is_admin - Whether the user is an admin
 * @param {number} currentUserId - The ID of the user requesting statements
 * @param {string} currentusername - The username of the user requesting statements
 * @param {any} query - LRS query parameters for filtering statements
 * @returns {Promise<Object>} Array of test xAPI statements matching the query
 * 
 * @throws {ValidationError} If the current user is not a tester in the session
 * 
 * @example
 * ```typescript
 * const statements = await getTestLRSStatements(123, 456, false, 789, 'user123', {
 *   actor: 'user123',
 *   verb: 'completed'
 * });
 * ```
 */
export async function getTestLRSStatements(simletId: number, sessionId: number, is_admin: boolean, currentUserId: number, currentusername: string,query: any): Promise<Object> {
  const session = await Session.getFromDbData(simletId, sessionId, is_admin, currentUserId);
  const group = await SimletGroup.getGroupFromCurrentUser(currentUserId);
  if (group.participants.includes(currentUserId)) {
    query.actor = JSON.stringify({
        account: {
          name: currentusername,
          homePage: config.externalUrl,
        }
    });
    const groupParticipant = await db.Tables.GroupParticipants.findOne({ where: { group_id: group.group_id, participant_id: currentUserId } });
    if (groupParticipant) {
      query.since = groupParticipant!.createdAt?.toISOString();
    } else {
      query.since = group.createdAt?.toISOString();
    }
    return await session.getTestLRSStatements(query);
  } else {
      throw new ValidationError('Current user is not a tester in this session');
  }
} 


export async function setTesterForSession(simletId: number, sessionId: number, currentUserId: number | undefined, username: string | undefined, allocated: boolean, is_admin: boolean) {
  
  const group = await SimletGroup.getSandboxGroup(simletId, currentUserId!, username!, true);
  logger.info(group, "Group to set tester to:");
  let participant = group.participants.some(p => p === currentUserId);
  logger.info(participant, "participant present in group :");
  if(!participant) {
    await group.addParticipant(currentUserId!, true);
  }
  await group.allocateToSession(sessionId, currentUserId!);
  const session = await Session.getFromDbData(simletId, sessionId, is_admin, currentUserId);
  await session.resetParticipant(currentUserId);
  return group;
}

export async function resetTesterForSession(simletId: number, sessionId: number, currentUserId: number | undefined, username: string | undefined, allocated: boolean, is_admin: boolean) {
  const group = await SimletGroup.getSandboxGroup(simletId, currentUserId!, username!);
  const session = await Session.getFromDbData(simletId, sessionId, is_admin, currentUserId);
  await session.resetParticipant(currentUserId);
  return group;
}

export async function deleteTesterForSession(simletId: number, sessionId: number, currentUserId: number | undefined, username: string | undefined, allocated: boolean, is_admin: boolean) {
  const group = await SimletGroup.getSandboxGroup(simletId, currentUserId!, username!);
  await group.deleteParticipant(currentUserId!, false);
  await group.delete();
}
