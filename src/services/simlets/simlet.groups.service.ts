/**
 * @fileoverview Service for Simlet groups operations.
 * Handles all group management operations for simlets.
 * 
 * Groups define collections of users that can participate in the simlet.
 * 
 * @module services/simlets/simlet.groups
 * @requires @/lib/mappers/simlet/Simlet
 * @requires @/lib/mappers/simlet/SimletGroup
 */

import { Simlet } from "@/lib/mappers/simlet/Simlet";
import { SimletGroup } from "@/lib/mappers/simlet/SimletGroup";

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
 * Adds a group to a simlet.
 * Associates an existing group with the simlet, allowing group members to participate.
 * 
 * @async
 * @function addSimletGroups
 * @param {number} simletId - The ID of the simlet
 * @param {number} groupId - The ID of the group to add
 * @param {number} current_user_id - The ID of the user adding the group
 * @returns {Promise<Simlet>} The updated simlet instance
 * @throws {NotFoundError} When simlet or group is not found
 * @throws {PermissionError} When user lacks permissions to modify groups
 * @throws {ValidationError} When group is already associated with the simlet
 * 
 * @example
 * ```typescript
 * const simlet = await addSimletGroups(123, 456, 789);
 * logger.info(`Group added to simlet: ${simlet.name}`);
 * ```
 */
export async function addSimletGroups(simletId: number, groupId: number, current_user_id: number): Promise<Simlet> {
  const simlet = await Simlet.getFromDbData(simletId, current_user_id);
  await simlet.addGroup(groupId);
  return simlet;
}

/**
 * Removes a group from a simlet.
 * Disassociates the group from the simlet, removing group members' access.
 * 
 * @async
 * @function deleteSimletGroup
 * @param {number} simletId - The ID of the simlet
 * @param {number} groupId - The ID of the group to remove
 * @param {number} current_user_id - The ID of the user removing the group
 * @returns {Promise<Simlet>} The updated simlet instance
 * @throws {NotFoundError} When simlet or group association is not found
 * @throws {PermissionError} When user lacks permissions to modify groups
 * 
 * @example
 * ```typescript
 * const simlet = await deleteSimletGroup(123, 456, 789);
 * logger.info(`Group removed from simlet: ${simlet.name}`);
 * ```
 */
export async function deleteSimletGroup(simletId: number, groupId: number, current_user_id: number): Promise<Simlet> {
  const simlet = await Simlet.getFromDbData(simletId, current_user_id);
  await simlet.removeGroup(groupId);
  return simlet;
}
