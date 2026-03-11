/**
 * @fileoverview Service for Simlet entity operations.
 * Handles core CRUD operations and business logic for SIMVA simlets.
 * 
 * A Simlet (Simulation Learning Environment Template) is the top-level learning container
 * that contains sessions and activities for educational research studies.
 * 
 * @module services/simlets/simlet
 * @requires @/lib/mappers/simlet/Simlet
 * @requires @/lib/mappers/simlet/SimletParticipant
 * @requires @/lib/mappers/session/SessionScheduler
 */

import { Simlet } from "@/lib/mappers/simlet/Simlet";
import { SimletParticipant } from "@/lib/mappers/simlet/SimletParticipant";
import { SessionScheduler } from "@/lib/mappers/session/SessionScheduler";

/**
 * Service for Simlet entity operations.
 * Handles core CRUD operations and business logic for simlets.
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
 * @param {string} searchString - Optional search string to filter simlets
 * @param {number} limit - Optional limit for pagination
 * @param {number} offset - Optional offset for pagination
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
 * Retrieves simlets accessible to a student user.
 * 
 * @async
 * @function getSimletsForStudent
 * @param {number} current_user_id - The student user ID
 * @param {string} searchString - Optional search string to filter simlets
 * @param {number} limit - Optional limit for pagination
 * @param {number} offset - Optional offset for pagination
 * @returns {Promise<Simlet[]>} Array of simlet records accessible to the student
 */
export async function getSimletsForStudent(current_user_id: number, searchString: string, limit?: number, offset?: number): Promise<Simlet[]> {
  return await Simlet.getAllFromDbData(current_user_id, true, searchString, limit, offset);
}

export async function getAllSimlets(searchString: string, limit?: number, offset?: number): Promise<Simlet[]> {
  return await Simlet.getAdminSimlets(searchString, limit, offset);
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
export async function getSimletBySimletIdAndUserId(simlet_id: number, is_admin: boolean, current_user_id?: number): Promise<Simlet> {
  let simlet = await Simlet.getFromDbData(simlet_id, is_admin, current_user_id);
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
export async function patch(simletId: number, simletData: any, is_admin: boolean, current_user_id?: number): Promise<Simlet> {
  let simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
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
export async function deleteSimlet(simletId: number, is_admin: boolean, current_user_id?: number): Promise<void> {
  let simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  await simlet.delete();
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
export async function getSimletParticipants(simletId: number, is_admin: boolean, current_user_id?: number): Promise<SimletParticipant[]> {
  let simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  return await simlet.getAllocatedParticipants();
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
export async function getSimletCountByUserId(searchString: string, current_user_id?: number): Promise<number> {
  return await Simlet.getSimletCountByUserId(searchString, current_user_id);
}

/**
 * Retrieves the schedule for a simlet.
 * Returns session scheduling information for the simlet.
 * 
 * @async
 * @function getSimletSchedule
 * @param {number} simletId - The ID of the simlet
 * @param {number} current_user_id - The ID of the user requesting the schedule
 * @returns {Promise<SessionScheduler>} The schedule information for the simlet
 * @throws {NotFoundError} When simlet is not found
 * @throws {PermissionError} When user lacks read permissions
 */
export async function getSimletSchedule(simletId: number, is_admin: boolean, current_user_id: number): Promise<SessionScheduler> {
  const schedule = await SessionScheduler.getFromDbData(simletId, is_admin, current_user_id);
  return schedule;
}

/**
 * Exports a simlet with all its data for backup or transfer purposes.
 * 
 * @async
 * @function exportSimlet
 * @param {number} simletId - The ID of the simlet to export
 * @param {number} currentUserId - The ID of the user performing the export
 * @param {boolean} withData - Whether to include participant data in export
 * @returns {Promise<string>} JSON string containing the exported simlet data
 * @throws {NotFoundError} When simlet is not found
 * @throws {PermissionError} When user lacks export permissions
 * 
 * @example
 * ```typescript
 * const exportedData = await exportSimlet(123, 456);
 * fs.writeFileSync('simlet-backup.json', exportedData);
 * ```
 */
export async function exportSimlet(simletId: number, is_admin: boolean, withData: boolean = false, currentUserId?: number): Promise<string> {
  let simlet = await Simlet.getFromDbData(simletId, is_admin, currentUserId);
  let exported = await simlet.export(withData);
  return JSON.stringify(exported);
}
