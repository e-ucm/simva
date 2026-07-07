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
 * @param {string} [sandbox] - Optional sandbox identifier for filtering
 * @param {number} [limit] - The maximum number of groups to return
 * @param {number} [offset] - The offset for pagination
 * @param {string} [orderBy] - The field to order the groups by
 * @param {string} [order] - The order direction (ASC or DESC)
 * @param {number} [current_user_id] - The ID of the user requesting the groups
 * @returns {Promise<SimletGroup[]>} Array of groups associated with the simlet
 * @throws {NotFoundError} When simlet is not found
 * @throws {PermissionError} When user lacks read permissions
 * 
 * @example
 * ```typescript
 * const groups = await getSimletGroups(123, false, "search", "sandbox", 10, 0, "group_name", "ASC", 456);
 * groups.forEach(g => logger.info(g.group_name, g.participant_count));
 * ```
 */
export async function getSimletGroups(simletId: number, is_admin: boolean, searchString?: string, sandbox?: string, limit?: number, offset?: number, orderBy?: string, order?: string, current_user_id?: number): Promise<SimletGroup[]> {
  let simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  return await simlet.getGroups(searchString, sandbox, limit, offset, orderBy, order);
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
 * @param {number} [current_user_id] - The ID of the user adding the group
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
 * @param {boolean} is_admin - Whether the user is an admin
 * @param {number} [current_user_id] - The ID of the user removing the group
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

/**
 * Updates a group associated with a simlet.
 * Modifies group properties such as name, generation settings, etc.
 * 
 * @async
 * @function updateSimletGroup
 * @param {number} simletId - The ID of the simlet
 * @param {number} groupId - The ID of the group to update
 * @param {any} body - Update data containing new group properties
 * @param {boolean} is_admin - Whether the user is an admin
 * @param {number} [current_user_id] - The ID of the user updating the group
 * @returns {Promise<SimletGroup>} The updated group instance
 * @throws {NotFoundError} When simlet or group is not found
 * @throws {PermissionError} When user lacks permissions to modify groups
 * @throws {ValidationError} When update data is invalid
 * 
 * @example
 * ```typescript
 * const updatedGroup = await updateSimletGroup(123, 456, { group_name: "Updated Group" }, false, 789);
 * ```
 */
export async function updateSimletGroup(simletId: number, groupId: number, body: any, is_admin: boolean, current_user_id?: number): Promise<SimletGroup> {
  const simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  return await simlet.updateGroup(groupId, body);
}

/**
 * Creates a new group and associates it with a simlet.
 * 
 * @async
 * @function createSimletGroup
 * @param {number} simletId - The ID of the simlet
 * @param {any} body - Group data containing name and configuration
 * @param {boolean} is_admin - Whether the user is an admin
 * @param {number} [current_user_id] - The ID of the user creating the group
 * @returns {Promise<SimletGroup>} The newly created group instance
 * @throws {NotFoundError} When simlet is not found
 * @throws {PermissionError} When user lacks create permissions
 * @throws {ValidationError} When group data is invalid
 * 
 * @example
 * ```typescript
 * const newGroup = await createSimletGroup(123, { group_name: "New Group" }, false, 789);
 * ```
 */
export async function createSimletGroup(simletId: number, body: any, is_admin: boolean, current_user_id?: number): Promise<SimletGroup> {
  const simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  return await simlet.createGroup(body);
}

/**
 * Gets the total count of groups associated with a simlet.
 * 
 * @async
 * @function getSimletGroupCount
 * @param {number} simletId - The ID of the simlet
 * @param {string} [searchString] - Optional search string to filter groups
 * @param {string} [sandbox] - Optional sandbox identifier for filtering
 * @param {boolean} is_admin - Whether the user is an admin
 * @param {number} [current_user_id] - The ID of the user requesting the count
 * @returns {Promise<number>} The total number of groups associated with the simlet
 * @throws {NotFoundError} When simlet is not found
 * @throws {PermissionError} When user lacks read permissions
 * 
 * @example
 * ```typescript
 * const count = await getSimletGroupCount(123, "search", "sandbox", false, 456);
 * ```
 */
export async function getSimletGroupCount(simletId: number, searchString?: string, sandbox?: string, is_admin: boolean, current_user_id?: number): Promise<number> {
  const simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  return await simlet.getGroupCount(searchString, sandbox);
}

/**
 * Gets the count of participants in a specific group associated with a simlet.
 * 
 * @async
 * @function getSimletGroupParticipantsCount
 * @param {number} simletId - The ID of the simlet
 * @param {number} groupId - The ID of the group
 * @param {boolean} is_admin - Whether the user is an admin
 * @param {number} [current_user_id] - The ID of the user requesting the count
 * @returns {Promise<number | null>} The number of participants in the group, or null if not found
 * @throws {NotFoundError} When simlet or group is not found
 * @throws {PermissionError} When user lacks read permissions
 * 
 * @example
 * ```typescript
 * const count = await getSimletGroupParticipantsCount(123, 456, false, 789);
 * ```
 */
export async function getSimletGroupParticipantsCount(simletId: number, groupId: number, is_admin: boolean, current_user_id?: number): Promise<number | null> {
  const simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  return await simlet.getGroupParticipantsCount(groupId);
}

/**
 * Gets the total participant count for all groups associated with a simlet.
 * 
 * @async
 * @function getTotalSimletGroupParticipantsCount
 * @param {number} simletId - The ID of the simlet
 * @param {boolean} is_admin - Whether the user is an admin
 * @param {number} [current_user_id] - The ID of the user requesting the counts
 * @returns {Promise<Record<number, number>>} Object mapping group IDs to their participant counts
 * @throws {NotFoundError} When simlet is not found
 * @throws {PermissionError} When user lacks read permissions
 * 
 * @example
 * ```typescript
 * const counts = await getTotalSimletGroupParticipantsCount(123, false, 456);
 * for (const [groupId, count] of Object.entries(counts)) {
 *   logger.info(`Group ${groupId}: ${count} participants`);
 * }
 * ```
 */
export async function getTotalSimletGroupParticipantsCount(simletId: number, is_admin: boolean, current_user_id?: number): Promise<Record<number, number>> {
  const simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  const counts: Record<number, number> = {};
  for (const groupId of simlet.groups) {
    let count = await simlet.getGroupParticipantsCount(groupId);
    if (count !== null) {
      counts[groupId] = count;
    }
  }
  return counts;
} 

/**
 * Retrieves a specific group by ID associated with a simlet.
 * 
 * @async
 * @function getSimletGroupById
 * @param {number} simletId - The ID of the simlet
 * @param {number} groupId - The ID of the group to retrieve
 * @param {boolean} is_admin - Whether the user is an admin
 * @param {number} [current_user_id] - The ID of the user requesting the group
 * @returns {Promise<SimletGroup>} The requested group instance
 * @throws {NotFoundError} When simlet or group is not found
 * @throws {PermissionError} When user lacks read permissions
 * 
 * @example
 * ```typescript
 * const group = await getSimletGroupById(123, 456, false, 789);
 * ```
 */
export async function getSimletGroupById(simletId: number, groupId: number, is_admin: boolean, current_user_id?: number): Promise<SimletGroup> {
  const simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  return await simlet.getGroupById(groupId);
}

/**
 * Creates a new participant in a group associated with a simlet.
 * 
 * @async
 * @function createSimletGroupParticipant
 * @param {number} simletId - The ID of the simlet
 * @param {number} groupId - The ID of the group
 * @param {any} body - Participant data to create
 * @param {boolean} is_admin - Whether the user is an admin
 * @param {number} [current_user_id] - The ID of the user creating the participant
 * @returns {Promise<SimletParticipant>} The newly created participant instance
 * @throws {NotFoundError} When simlet or group is not found
 * @throws {PermissionError} When user lacks create permissions
 * @throws {ValidationError} When participant data is invalid
 * 
 * @example
 * ```typescript
 * const participant = await createSimletGroupParticipant(123, 456, { user_id: 789 }, false, 101);
 * ```
 */
export async function createSimletGroupParticipant(simletId: number, groupId: number, body: any, is_admin: boolean, current_user_id?: number): Promise<SimletParticipant> {
  const simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  return await simlet.createGroupParticipant(groupId, body);
}

/**
 * Retrieves all participants in a specific group associated with a simlet.
 * 
 * @async
 * @function getSimletGroupParticipants
 * @param {number} simletId - The ID of the simlet
 * @param {number} groupId - The ID of the group
 * @param {boolean} is_admin - Whether the user is an admin
 * @param {number} [current_user_id] - The ID of the user requesting participants
 * @returns {Promise<SimletParticipant[]>} Array of participants in the group
 * @throws {NotFoundError} When simlet or group is not found
 * @throws {PermissionError} When user lacks read permissions
 * 
 * @example
 * ```typescript
 * const participants = await getSimletGroupParticipants(123, 456, false, 789);
 * ```
 */
export async function getSimletGroupParticipants(simletId: number, groupId: number, is_admin: boolean, current_user_id?: number): Promise<SimletParticipant[]> {
  const simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  return await simlet.getGroupParticipants(groupId);
}

/**
 * Deletes a participant from a group associated with a simlet.
 * 
 * @async
 * @function deleteGroupParticipant
 * @param {number} simletId - The ID of the simlet
 * @param {number} groupId - The ID of the group
 * @param {number} participantId - The ID of the participant to delete
 * @param {boolean} is_admin - Whether the user is an admin
 * @param {number} [current_user_id] - The ID of the user deleting the participant
 * @returns {Promise<void>} Resolves when participant is deleted
 * @throws {NotFoundError} When simlet, group, or participant is not found
 * @throws {PermissionError} When user lacks delete permissions
 * 
 * @example
 * ```typescript
 * await deleteGroupParticipant(123, 456, 789, false, 101);
 * ```
 */
export async function deleteGroupParticipant(simletId: number, groupId: number, participantId: number, is_admin: boolean, current_user_id?: number): Promise<void> {
  const simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  await simlet.deleteGroupParticipant(groupId, participantId);
}


/**
 * Adds an existing participant to a group associated with a simlet.
 * 
 * @async
 * @function addSimletGroupParticipant
 * @param {number} simletId - The ID of the simlet
 * @param {number} groupId - The ID of the group
 * @param {number} participantId - The ID of the participant to add
 * @param {boolean} is_admin - Whether the user is an admin
 * @param {number} [currentUserId] - The ID of the user adding the participant
 * @returns {Promise<SimletGroup>} The updated group instance
 * @throws {NotFoundError} When simlet, group, or participant is not found
 * @throws {PermissionError} When user lacks update permissions
 * @throws {ValidationError} When participant is already in the group
 * 
 * @example
 * ```typescript
 * const updatedGroup = await addSimletGroupParticipant(123, 456, 789, false, 101);
 * ```
 */
export async function addSimletGroupParticipant(simletId: number, groupId: number, participantId: number, is_admin: boolean, currentUserId?: number): Promise<SimletGroup> {
  const simlet = await Simlet.getFromDbData(simletId, is_admin, currentUserId);
  return await simlet.addGroupParticipant(groupId, participantId);
}

/**
 * Allocates a participant or group to a specific session within a simlet.
 * Uses the simlet's allocator to assign the allocation.
 * 
 * @async
 * @function allocateToSessionSimlet
 * @param {number} simletId - The ID of the parent simlet
 * @param {number} groupId - The ID of the group or participant to allocate
 * @param {number} sessionId - The ID of the session to allocate to
 * @param {number} participant_id_or_group_id - The ID of the participant or group being allocated
 * @param {boolean} is_admin - Whether the user is an admin
 * @param {number} [currentUserId] - The ID of the user performing allocation
 * @returns {Promise<void>} Resolves when allocation is complete
 * @throws {NotFoundError} When simlet, group, or session is not found
 * @throws {PermissionError} When user lacks allocation permissions
 * 
 * @example
 * ```typescript
 * await allocateToSessionSimlet(123, 456, 789, 101, false, 202);
 * ```
 */
export async function allocateToSessionSimlet(simletId: number, groupId: number, sessionId: number, participant_id_or_group_id: number, is_admin: boolean, currentUserId?: number) {
  const simlet = await Simlet.getFromDbData(simletId, is_admin, currentUserId);
  return await simlet.allocateToSession(groupId, sessionId, participant_id_or_group_id);
}

