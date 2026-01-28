import { GroupParticipants } from "@/lib/models/groups/groupParticipants.model";
import { NotFoundError } from "@/lib/errors/appErrors";

/**
 * Service for GroupParticipants entity operations.
 * Handles all CRUD operations and business logic for group participants.
 * 
 * @namespace GroupParticipantsService
 */

/**
 * Retrieve all group participants from the database.
 * 
 * @async
 * @function getAllGroupParticipants
 * @returns {Promise<GroupParticipants[]>} Array of all group participants
 * 
 * @example
 * ```typescript
 * const participants = await getAllGroupParticipants();
 * ```
 */
export async function getAllGroupParticipants(): Promise<GroupParticipants[]> {
  return await GroupParticipants.findAll({
    order: [['group_id', 'ASC'], ['participant_id', 'ASC']]
  });
}

/**
 * Retrieve a group participant by group and participant ID.
 * 
 * @async
 * @function getGroupParticipantById
 * @param {number} group_id - The group's ID
 * @param {number} participant_id - The participant's ID
 * @returns {Promise<GroupParticipants>} The group participant object
 * @throws {NotFoundError} If participant not found in group
 * 
 * @example
 * ```typescript
 * const participant = await getGroupParticipantById(123, 456);
 * ```
 */
export async function getGroupParticipantById(group_id: number, participant_id: number): Promise<GroupParticipants> {
  const participant = await GroupParticipants.findOne({
    where: { group_id, participant_id }
  });
  
  if (!participant) {
    throw new NotFoundError(`Participant ${participant_id} not found in group ${group_id}`);
  }
  
  return participant;
}

/**
 * Retrieve all participants in a specific group.
 * 
 * @async
 * @function getParticipantsByGroup
 * @param {number} group_id - The group's ID
 * @returns {Promise<GroupParticipants[]>} Array of participant records for the group
 * 
 * @example
 * ```typescript
 * const participants = await getParticipantsByGroup(123);
 * ```
 */
export async function getParticipantsByGroup(group_id: number): Promise<GroupParticipants[]> {
  return await GroupParticipants.findAll({
    where: { group_id },
    order: [['participant_id', 'ASC']]
  });
}

/**
 * Retrieve all groups where a user is a participant.
 * 
 * @async
 * @function getGroupsByParticipant
 * @param {number} participant_id - The participant's user ID
 * @returns {Promise<GroupParticipants[]>} Array of group records where user is a participant
 * 
 * @example
 * ```typescript
 * const groups = await getGroupsByParticipant(456);
 * ```
 */
export async function getGroupsByParticipant(participant_id: number): Promise<GroupParticipants[]> {
  return await GroupParticipants.findAll({
    where: { participant_id },
    order: [['group_id', 'ASC']]
  });
}

/**
 * Check if a user is a participant in a specific group.
 * 
 * @async
 * @function isParticipant
 * @param {number} group_id - The group's ID
 * @param {number} participant_id - The participant's user ID
 * @returns {Promise<boolean>} True if user is a participant, false otherwise
 * 
 * @example
 * ```typescript
 * const isParticipant = await isParticipant(123, 456);
 * ```
 */
export async function isParticipant(group_id: number, participant_id: number): Promise<boolean> {
  const count = await GroupParticipants.count({
    where: { group_id, participant_id }
  });
  return count > 0;
}

/**
 * Add a participant to a group.
 * 
 * @async
 * @function addParticipant
 * @param {number} group_id - The group's ID
 * @param {number} participant_id - The participant's user ID
 * @returns {Promise<GroupParticipants>} The created participant record
 * 
 * @example
 * ```typescript
 * const participant = await addParticipant(123, 456);
 * ```
 */
export async function addParticipant(
  group_id: number, 
  participant_id: number
): Promise<GroupParticipants> {
  return await GroupParticipants.create({ group_id, participant_id });
}

/**
 * Create a group participant (alias for addParticipant).
 * 
 * @async
 * @function createGroupParticipant
 * @param {Partial<GroupParticipants>} participantData - The participant data
 * @returns {Promise<GroupParticipants>} The created participant record
 * 
 * @example
 * ```typescript
 * const participant = await createGroupParticipant({
 *   group_id: 123,
 *   participant_id: 456
 * });
 * ```
 */
export async function createGroupParticipant(participantData: Partial<GroupParticipants>): Promise<GroupParticipants> {
  return await GroupParticipants.create(participantData);
}

/**
 * Update a group participant (no-op since there are no updateable fields).
 * 
 * @async
 * @function updateGroupParticipant
 * @param {number} group_id - The group's ID
 * @param {number} participant_id - The participant's ID
 * @param {Partial<GroupParticipants>} updateData - The data to update (ignored)
 * @returns {Promise<GroupParticipants>} The participant record
 * 
 * @example
 * ```typescript
 * const participant = await updateGroupParticipant(123, 456, {});
 * ```
 */
export async function updateGroupParticipant(
  group_id: number,
  participant_id: number,
  updateData: Partial<GroupParticipants>
): Promise<GroupParticipants> {
  return await getGroupParticipantById(group_id, participant_id);
}

/**
 * Remove a participant from a group.
 * 
 * @async
 * @function removeParticipant
 * @param {number} group_id - The group's ID
 * @param {number} participant_id - The participant's user ID
 * @returns {Promise<void>}
 * @throws {NotFoundError} If the participant record doesn't exist
 * 
 * @example
 * ```typescript
 * await removeParticipant(123, 456);
 * ```
 */
export async function removeParticipant(
  group_id: number, 
  participant_id: number
): Promise<void> {
  const deleted = await GroupParticipants.destroy({
    where: { group_id, participant_id }
  });
  
  if (deleted === 0) {
    throw new NotFoundError(
      `Participant ${participant_id} not found in group ${group_id}`
    );
  }
}

/**
 * Remove all participants from a group (when deleting a group).
 * 
 * @async
 * @function removeAllParticipants
 * @param {number} group_id - The group's ID
 * @returns {Promise<number>} Number of participants removed
 * 
 * @example
 * ```typescript
 * const removed = await removeAllParticipants(123);
 * ```
 */
export async function removeAllParticipants(group_id: number): Promise<number> {
  return await GroupParticipants.destroy({
    where: { group_id }
  });
}

/**
 * Remove a user from all groups (when deleting a user).
 * 
 * @async
 * @function removeParticipantFromAllGroups
 * @param {number} participant_id - The participant's user ID
 * @returns {Promise<number>} Number of group memberships removed
 * 
 * @example
 * ```typescript
 * const removed = await removeParticipantFromAllGroups(456);
 * ```
 */
export async function removeParticipantFromAllGroups(participant_id: number): Promise<number> {
  return await GroupParticipants.destroy({
    where: { participant_id }
  });
}

/**
 * Get all participant IDs for a group.
 * 
 * @async
 * @function getParticipantIds
 * @param {number} group_id - The group's ID
 * @returns {Promise<number[]>} Array of participant user IDs
 * 
 * @example
 * ```typescript
 * const participantIds = await getParticipantIds(123);
 * ```
 */
export async function getParticipantIds(group_id: number): Promise<number[]> {
  const records = await GroupParticipants.findAll({
    where: { group_id },
    attributes: ['participant_id'],
    order: [['participant_id', 'ASC']]
  });
  
  return records.map(record => record.participant_id);
}

/**
 * Get all group IDs where a user is a participant.
 * 
 * @async
 * @function getGroupIds
 * @param {number} participant_id - The participant's user ID
 * @returns {Promise<number[]>} Array of group IDs
 * 
 * @example
 * ```typescript
 * const groupIds = await getGroupIds(456);
 * ```
 */
export async function getGroupIds(participant_id: number): Promise<number[]> {
  const records = await GroupParticipants.findAll({
    where: { participant_id },
    attributes: ['group_id'],
    order: [['group_id', 'ASC']]
  });
  
  return records.map(record => record.group_id);
}

/**
 * Count total participants in a group.
 * 
 * @async
 * @function countParticipants
 * @param {number} group_id - The group's ID
 * @returns {Promise<number>} Number of participants in the group
 * 
 * @example
 * ```typescript
 * const count = await countParticipants(123);
 * ```
 */
export async function countParticipants(group_id: number): Promise<number> {
  return await GroupParticipants.count({
    where: { group_id }
  });
}

/**
 * Count total groups where a user is a participant.
 * 
 * @async
 * @function countUserGroups
 * @param {number} participant_id - The participant's user ID
 * @returns {Promise<number>} Number of groups where user is a participant
 * 
 * @example
 * ```typescript
 * const count = await countUserGroups(456);
 * ```
 */
export async function countUserGroups(participant_id: number): Promise<number> {
  return await GroupParticipants.count({
    where: { participant_id }
  });
}

/**
 * Delete a group participant.
 * 
 * @async
 * @function deleteGroupParticipant
 * @param {number} group_id - The group's ID
 * @param {number} participant_id - The participant's ID
 * @returns {Promise<void>}
 * @throws {NotFoundError} If participant not found in group
 * 
 * @example
 * ```typescript
 * await deleteGroupParticipant(123, 456);
 * ```
 */
export async function deleteGroupParticipant(group_id: number, participant_id: number): Promise<void> {
  const participant = await getGroupParticipantById(group_id, participant_id);
  await participant.destroy();
}

/**
 * Delete all participants from a group.
 * 
 * @async
 * @function deleteParticipantsByGroup
 * @param {number} group_id - The group's ID
 * @returns {Promise<number>} Number of participants removed
 * 
 * @example
 * ```typescript
 * const count = await deleteParticipantsByGroup(123);
 * ```
 */
export async function deleteParticipantsByGroup(group_id: number): Promise<number> {
  return await GroupParticipants.destroy({
    where: { group_id }
  });
}

/**
 * Delete a user from all groups.
 * 
 * @async
 * @function deleteParticipantsByUser
 * @param {number} participant_id - The participant's user ID
 * @returns {Promise<number>} Number of group memberships removed
 * 
 * @example
 * ```typescript
 * const count = await deleteParticipantsByUser(456);
 * ```
 */
export async function deleteParticipantsByUser(participant_id: number): Promise<number> {
  return await GroupParticipants.destroy({
    where: { participant_id }
  });
}

/**
 * Count total group participants.
 * 
 * @async
 * @function countGroupParticipants
 * @returns {Promise<number>} Total count of all group participants
 * 
 * @example
 * ```typescript
 * const count = await countGroupParticipants();
 * ```
 */
export async function countGroupParticipants(): Promise<number> {
  return await GroupParticipants.count();
}

/**
 * Count participants by group.
 * 
 * @async
 * @function countParticipantsByGroup
 * @param {number} group_id - The group's ID
 * @returns {Promise<number>} Count of participants in the group
 * 
 * @example
 * ```typescript
 * const count = await countParticipantsByGroup(123);
 * ```
 */
export async function countParticipantsByGroup(group_id: number): Promise<number> {
  return await GroupParticipants.count({ where: { group_id } });
}

/**
 * Count participants by user.
 * 
 * @async
 * @function countParticipantsByUser
 * @param {number} participant_id - The participant's user ID
 * @returns {Promise<number>} Count of groups the user participates in
 * 
 * @example
 * ```typescript
 * const count = await countParticipantsByUser(456);
 * ```
 */
export async function countParticipantsByUser(participant_id: number): Promise<number> {
  return await GroupParticipants.count({ where: { participant_id } });
}

/**
 * Check if group participant exists.
 * 
 * @async
 * @function groupParticipantExists
 * @param {number} group_id - The group's ID
 * @param {number} participant_id - The participant's ID
 * @returns {Promise<boolean>} True if participant exists in group
 * 
 * @example
 * ```typescript
 * const exists = await groupParticipantExists(123, 456);
 * ```
 */
export async function groupParticipantExists(group_id: number, participant_id: number): Promise<boolean> {
  const count = await GroupParticipants.count({ where: { group_id, participant_id } });
  return count > 0;
}

// Aliases for test compatibility
export const getGroupParticipants = getParticipantsByGroup;
export const addParticipantToGroup = addParticipant;
export const removeParticipantFromGroup = removeParticipant;
export const getParticipantGroups = getGroupsByParticipant;
export const isParticipantInGroup = isParticipant;
export const getGroupParticipantsCount = countParticipants;