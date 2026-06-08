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
import { SimletGroup } from "@/lib/mappers/simletGroup/SimletGroup";
import { SimletParticipant } from "@/lib/mappers/simlet/SimletParticipant";

/**
 * Retrieves all groups associated with a simlet.
 * Groups define collections of users that can participate in the simlet.
 * 
 * @async
 * @function getSimletGroups
 * @param {number} simletId - The ID of the simlet
 * @param {boolean} is_admin - Whether the user is an admin
 * @param {string} searchString - The search string for filtering groups
 * @param {number} limit - The maximum number of groups to return
 * @param {number} offset - The offset for pagination
 * @param {string} orderBy - The field to order the groups by
 * @param {string} order - The order direction (ASC or DESC)
 * @param {number} current_user_id - The ID of the user requesting the groups
 * @returns {Promise<SimletGroup[]>} Array of groups associated with the simlet
 * @throws {NotFoundError} When simlet is not found
 * @throws {PermissionError} When user lacks read permissions
 * 
 * @example
 * ```typescript
 * const groups = await getSimletGroups(123, false, "search", 10, 0, "group_name", "ASC", 456);
 * groups.forEach(g => logger.info(g.group_name, g.participant_count));
 * ```
 */
export async function getSimletGroups(simletId: number, is_admin: boolean, searchString?: string, limit?: number, offset?: number, orderBy?: string, order?: string, current_user_id?: number): Promise<SimletGroup[]> {
  let simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  return await simlet.getGroups(searchString, limit, offset, orderBy, order);
}

/**
 * Adds a group to a simlet.
 * Associates an existing group with the simlet, allowing group members to participate.
 * 
 * @async
 * @function addSimletGroups
 * @param {number} simletId - The ID of the simlet
 * @param {Partial<SimletGroup>} body - Group data containing group name and generation settings
 * @param {boolean} is_admin - Whether the user is an admin
 * @param {number} current_user_id - The ID of the user adding the group
 * @returns {Promise<Simlet>} The updated simlet instance
 * @throws {NotFoundError} When simlet or group is not found
 * @throws {PermissionError} When user lacks permissions to modify groups
 * @throws {ValidationError} When group is already associated with the simlet
 * 
 * @example
 * ```typescript
 * const simlet = await addSimletGroups(123, { group_name: "New Group" }, false, 789);
 * logger.info(`Group added to simlet: ${simlet.name}`);
 * ```
 */
export async function addSimletGroups(simletId: number, body: Partial<SimletGroup>, is_admin: boolean, current_user_id?: number): Promise<Simlet> {
  const simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  await simlet.createGroup(body);
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
 * const simlet = await deleteSimletGroup(123, 456, false, 789);
 * logger.info(`Group removed from simlet: ${simlet.name}`);
 * ```
 */
export async function deleteSimletGroup(simletId: number, groupId: number, is_admin: boolean, current_user_id?: number): Promise<void> {
  const simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  await simlet.removeGroup(groupId);
}

export async function updateSimletGroup(simletId: number, groupId: number, body: any, is_admin: boolean, current_user_id?: number) : Promise<SimletGroup> {
  const simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  return await simlet.updateGroup(groupId, body);
}

export async function createSimletGroup(simletId: number, body: any, is_admin: boolean, current_user_id?: number) : Promise<SimletGroup> {
  const simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  return await simlet.createGroup(body);
}

export async function getSimletGroupCount(simletId: number, searchString?: string, is_admin: boolean, current_user_id?: number) : Promise<number> {
  const simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  return await simlet.getGroupCount(searchString);
}

export async function getSimletGroupParticipantsCount(simletId: number, groupId: number, is_admin: boolean, current_user_id?: number) : Promise<number | null> {
  const simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  return await simlet.getGroupParticipantsCount(groupId);
}

export async function getTotalSimletGroupParticipantsCount(simletId: number, is_admin: boolean, current_user_id?: number) : Promise<Record<number, number>> {
  const simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  const counts: Record<number, number> = {};
  for (const groupId of simlet.groups) {
    let count = await simlet.getGroupParticipantsCount(groupId);
    if(count !== null) {
      counts[groupId] = count;
    }
  }
  return counts;
} 

export async function getSimletGroupById(simletId: number, groupId: number, is_admin: boolean, current_user_id?: number) : Promise<SimletGroup> {
  const simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  return await simlet.getGroupById(groupId);
}

export async function createSimletGroupParticipant(simletId: number, groupId: number, body: any, is_admin: boolean, current_user_id?: number) : Promise<SimletParticipant> {
  const simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  return await simlet.createGroupParticipant(groupId, body);
}

export async function getSimletGroupParticipants(simletId: number, groupId: number, is_admin: boolean, current_user_id?: number) : Promise<SimletParticipant[]> {
  const simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  return await simlet.getGroupParticipants(groupId);
}

export async function deleteGroupParticipant(simletId: number, groupId: number, participantId: number, is_admin: boolean, current_user_id?: number) : Promise<void> {
  const simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  await simlet.deleteGroupParticipant(groupId, participantId);
}


export async function addSimletGroupParticipant(simletId: number, groupId: number, participantId: number, is_admin: boolean, currentUserId?: number): Promise<SimletGroup> {
  const simlet = await Simlet.getFromDbData(simletId, is_admin, currentUserId);
  return await simlet.addGroupParticipant(groupId, participantId);
}

export async function allocateToSessionSimlet(simletId: number, groupId: number, sessionId: number, participant_id_or_group_id: number, is_admin: boolean, currentUserId?: number) {
  const simlet = await Simlet.getFromDbData(simletId, is_admin, currentUserId);
  return await simlet.allocateToSession(groupId, sessionId, participant_id_or_group_id);
}

