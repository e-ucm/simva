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
import { Allocator } from "@/lib/mappers/allocators/Allocator";
import { ValidationError } from "@/lib/errors/appErrors";

/**
 * Retrieves all sessions within a simlet.
 * Sessions represent discrete test phases or experimental conditions within a study.
 * 
 * @async
 * @function getSimletSessions
 * @param {number} simletId - The ID of the simlet
 * @param {number} current_user_id - The ID of the user requesting the sessions
 * @param {string} searchString - Optional search string to filter sessions
 * @param {number} limit - Optional limit for pagination
 * @param {number} offset - Optional offset for pagination
 * @returns {Promise<Session[]>} Array of sessions within the simlet
 * @throws {NotFoundError} When simlet is not found
 * @throws {PermissionError} When user lacks read permissions
 * 
 * @example
 * ```typescript
 * const sessions = await getSimletSessions(123, 456);
 * sessions.forEach(s => logger.info(s.name, s.open_date, s.close_date));
 * ```
 */
export async function getSimletSessions(simletId: number, current_user_id: number, searchString?: string, limit?: number, offset?: number): Promise<Session[]> {
  let simlet = await Simlet.getFromDbData(simletId, current_user_id);
  return await simlet.getSessions(searchString, limit, offset);
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
 * Creates a new session within a simlet.
 * Sessions represent discrete test phases or experimental conditions.
 * 
 * @async
 * @function createSimletSession
 * @param {number} simletId - The ID of the parent simlet
 * @param {number} current_user_id - The ID of the user creating the session
 * @param {Object} body - Session configuration data including name, dates, etc.
 * @returns {Promise<Simlet>} The parent simlet with the newly created session
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
 * Retrieves all participants allocated to a session within a simlet.
 * 
 * @async
 * @function getSimletSessionParticipants
 * @param {number} simletId - The ID of the parent simlet
 * @param {number} sessionId - The ID of the session
 * @param {number} current_user_id - The ID of the user requesting participants
 * @returns {Promise<SimletParticipant[]>} Array of participants in the session
 * @throws {NotFoundError} When simlet or session is not found
 * @throws {PermissionError} When user lacks read permissions
 */
export async function getSimletSessionParticipants(simletId: number, sessionId: number, current_user_id: number) {
  let session = await Session.getFromDbData(simletId, sessionId, current_user_id);
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
 * @param {number} current_user_id - The ID of the user performing the action
 * @param {boolean} activate - True to activate, false to deactivate
 * @returns {Promise<Session>} The updated session instance
 * @throws {NotFoundError} When simlet or session is not found
 * @throws {PermissionError} When user lacks permissions
 * @throws {ValidationError} When session is already in the requested state
 * 
 * @example
 * ```typescript
 * const activeSession = await activateSession(123, 456, 789, true);
 * const inactiveSession = await activateSession(123, 456, 789, false);
 * ```
 */
export async function activateSession(simletId: number, sessionId: number, current_user_id: number, activate: any): Promise<Session> {
  const session = await Session.getFromDbData(simletId, sessionId, current_user_id);
  if (activate) {
    if (session.session_status == session.STATUS.ACTIVE) {
      throw new ValidationError('Session is already active');
    } else {
      return await session.activate();
    }
  } else {
    if (session.session_status == session.STATUS.ACTIVE) {
      return await session.deactivate();
    } else {
      throw new ValidationError('Session is already inactive');
    }
  }
}

/**
 * Allocates a participant or group to a specific session within a simlet.
 * Uses the simlet's allocator to assign the allocation.
 * 
 * @async
 * @function allocateToSessionSimlet
 * @param {number} simletId - The ID of the parent simlet
 * @param {number} sessionId - The ID of the session to allocate to
 * @param {number} current_user_id - The ID of the user performing allocation
 * @param {number} id - The ID of the object being allocated (participant/group)
 * @returns {Promise<Allocator>} The updated allocator with fresh allocation data
 * @throws {NotFoundError} When simlet or session is not found
 * @throws {PermissionError} When user lacks allocation permissions
 * 
 * @example
 * ```typescript
 * const allocator = await allocateToSessionSimlet(123, 456, 789, 555);
 * ```
 */
export async function allocateToSessionSimlet(simletId: number, sessionId: number, current_user_id: number, id: number): Promise<Allocator> {
  const simlet = await Simlet.getFromDbData(simletId, current_user_id);
  await simlet.allocateToSession(sessionId, id);
  // Return updated allocator with fresh allocation data
  const allocator = await simlet.getAllocator();
  return allocator;
}
