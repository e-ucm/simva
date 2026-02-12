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

import { db } from "@/lib/db";
import { Simlet } from "@/lib/mappers/simlet/Simlet";
import { logger } from "@/lib/logger";
import { Allocator } from "@/lib/mappers/allocators/Allocator";
import { SimletParticipant } from "@/lib/mappers/simlet/SimletParticipant";
import { SimletGroup } from "@/lib/mappers/simlet/SimletGroup";
import { Session } from "@/lib/mappers/session/Session";
import { Activity } from "@/lib/mappers/activities/Activity";
import { ValidationError, NotFoundError } from "@/lib/errors/appErrors";

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
 * @param {number} user_id - The user ID to search for
 * @returns {Promise<Simlet[]>} Array of simlet records with permission information
 * 
 * @example
 * ```typescript
 * const userSimlets = await getSimletsByUserId(123);
 * ```
 */
export async function getSimletsByUserId(user_id: number, searchString?: string, limit?: number, offset?: number): Promise<Simlet[]> {
  let results;
  if(searchString !== undefined && limit === undefined && offset === undefined) {
    results = await db.Functions.runViewQuery(
      db.Views.Simlet.byUserId,
      { user_id }
    );
  } else if(searchString !== undefined && searchString.length >= 3) {
    results = await db.Functions.runViewQuery(
      db.Views.Simlet.byUserId,
      { user_id, search: `%${searchString}%` }
    );
  } else if(limit !== undefined && offset !== undefined) {
    results = await db.Functions.runViewQuery(
      db.Views.Simlet.byUserIdWithPagination,
      { user_id, limit, offset }
    );
  } else {
    results = await db.Functions.runViewQuery(
      db.Views.Simlet.byUserIdWithPagination,
      { user_id, search: `%${searchString}%`, limit, offset }
    );
  }
  logger.debug({results} , "getSimletsByUserId results");
  const processedResults = results.map((simlet: any) => 
    new Simlet(simlet)
  );
  logger.debug({processedResults} , "getSimletsByUserId results");
  return processedResults;
}

/**
 * Retrieves specific simlets for a specific user.
 * Uses the v_complete_simlets_users_permissions view to get user's simlets.
 * 
 * @async
 * @function getSimletBySimletIdAndUserId
 * @param {number} simlet_id - The simlet ID to search for
 * @param {number} user_id - The user ID to search for
 * @returns {Promise<Simlet>} simlet record with permission information
 * 
 * @example
 * ```typescript
 * const userSimlet = await getSimletBySimletIdAndUserId(123, 456);
 * ```
 */
export async function getSimletBySimletIdAndUserId(simlet_id: number, user_id: number): Promise<Simlet> {
  let simlet = await Simlet.getFromDbData(simlet_id, user_id);
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
 * @param {number} user_id - The ID of the user requesting the update
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
export async function patch(simletId: number, user_id: number, simletData: any): Promise<Simlet> {
  let simlet = await Simlet.getFromDbData(simletId, user_id);
  return await simlet.patch(simletData);
}

/**
 * Deletes a simlet and all its associated data.
 * 
 * @async
 * @function deleteSimlet
 * @param {number} simletId - The ID of the simlet to delete
 * @param {number} user_id - The ID of the user requesting the deletion
 * @returns {Promise<void>} Promise that resolves when deletion is complete
 * @throws {NotFoundError} When simlet is not found
 * @throws {PermissionError} When user lacks delete permissions
 * 
 * @example
 * ```typescript
 * await deleteSimlet(123, 456);
 * ```
 */
export async function deleteSimlet(simletId: number, user_id: number): Promise<void> {
  let simlet = await Simlet.getFromDbData(simletId, user_id);
  await simlet.remove();
}

/**
 * Retrieves the allocator associated with a simlet.
 * The allocator determines how participants are assigned to different conditions.
 * 
 * @async
 * @function getAllocatorFromSimlet
 * @param {number} simletId - The ID of the simlet
 * @param {number} user_id - The ID of the user requesting the allocator
 * @returns {Promise<Allocator>} The allocator instance for the simlet
 * @throws {NotFoundError} When simlet or allocator is not found
 * @throws {PermissionError} When user lacks read permissions
 * 
 * @example
 * ```typescript
 * const allocator = await getAllocatorFromSimlet(123, 456);
 * console.log(allocator.type); // 'random', 'manual', etc.
 * ```
 */
export async function getAllocatorFromSimlet(simletId: number, user_id: number): Promise<Allocator> {
  let simlet = await Simlet.getFromDbData(simletId, user_id);
  return await simlet.getAllocator();
}

/**
 * Retrieves all participants allocated to a simlet.
 * Returns participants with their allocation information and assigned conditions.
 * 
 * @async
 * @function getSimletParticipants
 * @param {number} simletId - The ID of the simlet
 * @param {number} user_id - The ID of the user requesting the participants
 * @returns {Promise<SimletParticipant[]>} Array of allocated participants
 * @throws {NotFoundError} When simlet is not found
 * @throws {PermissionError} When user lacks read permissions
 * 
 * @example
 * ```typescript
 * const participants = await getSimletParticipants(123, 456);
 * participants.forEach(p => console.log(p.user_id, p.allocated_group));
 * ```
 */
export async function getSimletParticipants(simletId: number, user_id: number): Promise<SimletParticipant[]> {
  let simlet = await Simlet.getFromDbData(simletId, user_id);
  return await simlet.getAllocatedParticipants();
}

/**
 * Retrieves all groups associated with a simlet.
 * Groups define collections of users that can participate in the simlet.
 * 
 * @async
 * @function getSimletGroups
 * @param {number} simletId - The ID of the simlet
 * @param {number} user_id - The ID of the user requesting the groups
 * @returns {Promise<SimletGroup[]>} Array of groups associated with the simlet
 * @throws {NotFoundError} When simlet is not found
 * @throws {PermissionError} When user lacks read permissions
 * 
 * @example
 * ```typescript
 * const groups = await getSimletGroups(123, 456);
 * groups.forEach(g => console.log(g.group_name, g.participant_count));
 * ```
 */
export async function getSimletGroups(simletId: number, user_id: number): Promise<SimletGroup[]> {
  let simlet = await Simlet.getFromDbData(simletId, user_id);
  return await simlet.getGroups();
}

/**
 * Retrieves all sessions within a simlet.
 * Sessions represent discrete test phases or experimental conditions within a study.
 * 
 * @async
 * @function getSimletSessions
 * @param {number} simletId - The ID of the simlet
 * @param {number} user_id - The ID of the user requesting the sessions
 * @returns {Promise<Session[]>} Array of sessions within the simlet
 * @throws {NotFoundError} When simlet is not found
 * @throws {PermissionError} When user lacks read permissions
 * 
 * @example
 * ```typescript
 * const sessions = await getSimletSessions(123, 456);
 * sessions.forEach(s => console.log(s.name, s.open_date, s.close_date));
* ``` */ 
export async function getSimletSessions(simletId: number, user_id: number, searchString?: string, limit?: number, offset?: number): Promise<Session[]> { 
  let simlet = await Simlet.getFromDbData(simletId, user_id); 
  return await simlet.getSessions(searchString, limit, offset); 
} 

/**
 * Retrieves a specific session within a simlet.
 * 
 * @async
 * @function getSimletSession
 * @param {number} simletId - The ID of the simlet
 * @param {number} sessionId - The ID of the session to retrieve
 * @param {number} user_id - The ID of the user requesting the session
 * @returns {Promise<Session>} The requested session instance
 * @throws {NotFoundError} When simlet or session is not found
 * @throws {PermissionError} When user lacks read permissions
 * 
 * @example
 * ```typescript
 * const session = await getSimletSession(123, 789, 456);
 * console.log(session.name, session.status);
 * ```
 */
export async function getSimletSession(simletId: number, sessionId: number, user_id: number): Promise<Session> {
  let simlet = await Simlet.getFromDbData(simletId, user_id);
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
 * @param {number} user_id - The ID of the user requesting the activities
 * @returns {Promise<Activity[]>} Array of activities within the session
 * @throws {NotFoundError} When simlet or session is not found
 * @throws {PermissionError} When user lacks read permissions
 * 
 * @example
 * ```typescript
 * const activities = await getSessionActivities(123, 789, 456);
 * activities.forEach(a => console.log(a.name, a.type, a.url));
 * ```
 */
export async function getSessionActivities(simlet_id: number, sessionId: number, user_id: number): Promise<Activity[]> {
  let session = await Session.getFromDbData(simlet_id, sessionId, user_id);
  return await session.getActivities();
}