/**
 * @fileoverview Service for Group entity operations.
 * Handles all business logic for group management including participant access.
 * 
 * Groups in SIMVA represent collections of users that can be assigned to studies
 * and learning activities. They provide role-based access control and participant management.
 * 
 * @module services/groups/group
 * @requires @/lib/mappers/group/Group
 * @requires @/lib/mappers/group/GroupParticipant
 * @requires @/lib/db
 * @requires @/lib/errors/appErrors
 */

import { Group } from "@/lib/mappers/group/Group";
import { GroupParticipant } from "@/lib/mappers/group/GroupParticipant";
import { logger } from "@/lib/logger";
import { UserPermission } from "@/lib/mappers/UserPermisions/UserPermission";
import { SingleUserPermission } from "@/lib/mappers/UserPermisions/SingleUserPermission";

/**
 * Retrieves all groups accessible to a specific user.
 * Uses database views to respect user permissions and group access controls.
 * 
 * @async
 * @function getGroups
 * @param {number} user_id - The ID of the user requesting groups
 * @param {boolean | null} [version=null] - Optional version filter for group generation type
 * @returns {Promise<Group[]>} Array of Group objects the user has access to
 * 
 * @throws {Error} If database query fails or user permissions cannot be validated
 * 
 * @example
 * ```typescript
 * // Get all groups for user ID 123
 * const userGroups = await getGroups(123);
 * 
 * // Get groups filtered by generation version
 * const newGenGroups = await getGroups(123, true);
 * ```
 */
export async function getGroups(current_user_id: number, version?: boolean, searchString?: string, limit?: number, offset?: number): Promise<Group[]> {
    return await Group.getAllFromDbData(current_user_id, version, limit, offset, searchString);
}

/**
 * Retrieves a single group by ID for a specific user.
 * Verifies the user has access to the group before returning data.
 * 
 * @async
 * @function getGroup
 * @param {number} group_id - The unique identifier of the group
 * @param {number} user_id - The ID of the user requesting the group
 * @returns {Promise<Group>} The requested Group object
 * 
 * @throws {NotFoundError} If the group doesn't exist or user lacks access
 * @throws {Error} If database query fails
 * 
 * @example
 * ```typescript
 *   const group = await getGroup(456, 123);
 *   logger.info(group.name);
 * ```
 */
export async function getGroup(group_id: number, current_user_id: number): Promise<Group> {
    return await Group.getFromDbData(group_id, current_user_id);
}

/**
 * Retrieves all participants (members) of a specific group.
 * First validates user access to the group, then returns participant list.
 * 
 * @async
 * @function getGroupParticipants
 * @param {number} group_id - The unique identifier of the group
 * @param {number} user_id - The ID of the user requesting participant information
 * @returns {Promise<GroupParticipant[]>} Array of GroupParticipant objects
 * 
 * @throws {NotFoundError} If the group doesn't exist or user lacks access
 * @throws {Error} If database query fails
 * 
 * @example
 * ```typescript
 * // Get all participants for group 456
 * const participants = await getGroupParticipants(456, 123);
 * participants.forEach(participant => {
 *   logger.info(participant.username, participant.role);
 * });
 * ```
 */
export async function getGroupParticipants(group_id: number, current_user_id: number): Promise<GroupParticipant[]> {
    let group = await Group.getFromDbData(group_id, current_user_id);
    return await group.getParticipants();
}

/**
 * Updates an existing group's metadata and properties.
 * Validates user permissions before allowing modifications.
 * 
 * @async
 * @function updateGroup
 * @param {number} groupId - The unique identifier of the group to update
 * @param {number} current_user_id - The ID of the user performing the update
 * @param {Partial<Group>} body - Partial group object containing fields to update
 * @returns {Promise<Group>} The updated group object
 * @throws {NotFoundError} If group doesn't exist or user lacks access
 * @throws {ValidationError} If update data is invalid
 * 
 * @example
 * ```typescript
 * const updatedGroup = await updateGroup(456, 123, { name: 'New Group Name' });
 * ```
 */
export async function updateGroup(groupId: number, current_user_id: number, body: any): Promise<Group> {
    let group = await Group.getFromDbData(groupId, current_user_id);
    return await group.update(body);
}

/**
 * Permanently deletes a group from the database.
 * Validates user permissions before allowing deletion.
 * 
 * @async
 * @function deleteGroup
 * @param {number} groupId - The unique identifier of the group to delete
 * @param {number} current_user_id - The ID of the user performing the deletion
 * @returns {Promise<void>} No return value on successful deletion
 * @throws {NotFoundError} If group doesn't exist or user lacks access
 * @throws {ValidationError} If group cannot be deleted due to constraints
 * 
 * @example
 * ```typescript
 * await deleteGroup(456, 123);
 * ```
 */
export async function deleteGroup(groupId: number, current_user_id: number): Promise<void> {
  let group = await Group.getFromDbData(groupId, current_user_id);
  await group.delete();
}

/**
 * Gets the total count of groups accessible to a user.
 * Used for pagination and statistics.
 * 
 * @async
 * @function getGroupCount
 * @param {number} current_user_id - The ID of the user requesting group count
 * @param {string} searchString - Optional search string to filter groups
 * @returns {Promise<number>} The total number of accessible groups
 * @throws {Error} If database query fails
 * 
 * @example
 * ```typescript
 * const totalGroups = await getGroupCount(123, 'math');
 * logger.info(`Found ${totalGroups} math-related groups`);
 * ```
 */
export async function getGroupCount(current_user_id: number, searchString: string): Promise<number> {
  return await Group.getGroupCountForUser(current_user_id, searchString);
}

/**
 * Adds a new participant to a group.
 * Validates user permissions and creates group membership.
 * 
 * @async
 * @function createGroupParticipant
 * @param {number} groupId - The unique identifier of the group
 * @param {number} current_user_id - The ID of the user performing the action
 * @param {Object} body - Participant data containing user information
 * @returns {Promise<GroupParticipant>} The newly created group participant
 * @throws {NotFoundError} If group doesn't exist or user lacks access
 * @throws {ValidationError} If participant data is invalid
 * 
 * @example
 * ```typescript
 * const participant = await createGroupParticipant(456, 123, { user_id: 789 });
 * ```
 */
export async function createGroupParticipant(groupId: number, current_user_id: number, body: any): Promise<GroupParticipant> {
  let group = await Group.getFromDbData(groupId, current_user_id);
  return await group.createParticipant(body);
}


/**
 * Removes a participant from a group.
 * Validates user permissions and handles optional Keycloak deletion.
 * 
 * @async
 * @function deleteGroupParticipant
 * @param {number} groupId - The unique identifier of the group
 * @param {number} participant_id - The ID of the participant to remove
 * @param {number} current_user_id - The ID of the user performing the action
 * @param {boolean} keycloakDelete - Whether to also delete from Keycloak
 * @returns {Promise<void>} No return value on successful deletion
 * @throws {NotFoundError} If group or participant doesn't exist
 * @throws {ValidationError} If user lacks permission to remove participant
 * 
 * @example
 * ```typescript
 * await deleteGroupParticipant(456, 789, 123, true);
 * ```
 */
export async function deleteGroupParticipant(groupId: number, participant_id: number, current_user_id: number, keycloakDelete : boolean): Promise<void> {
    let group = await Group.getFromDbData(groupId, current_user_id);
    return await group.deleteParticipant(participant_id, keycloakDelete);
}

/**
 * Creates a new group in the database.
 * Supports both old and new generation group types.
 * 
 * @async
 * @function createGroup
 * @param {Object} body - Group data containing name, description, etc.
 * @param {boolean} useNewGeneration - Whether to use new generation group features
 * @param {number} current_user_id - The ID of the user creating the group
 * @returns {Promise<Group>} The newly created group object
 * @throws {ValidationError} If group data is invalid
 * @throws {Error} If database creation fails
 * 
 * @example
 * ```typescript
 * const newGroup = await createGroup(
 *   { name: 'Math Class', description: 'Advanced Mathematics' },
 *   true,
 *   123
 * );
 * ```
 */
export async function createGroup(body: any, useNewGeneration: boolean, current_user_id: number) : Promise<Group> {
  return await Group.createInDb(body, useNewGeneration, current_user_id);
}

/**
 * Removes all permissions for a specific user from a group.
 * Validates that current user has admin rights on the group.
 * 
 * @async
 * @function deleteGroupPermissionsForUser
 * @param {number} groupId - The unique identifier of the group
 * @param {number} userId - The ID of the user whose permissions to remove
 * @param {number} current_user_id - The ID of the user performing the action
 * @returns {Promise<void>} No return value on successful deletion
 * @throws {NotFoundError} If group or user doesn't exist
 * @throws {ValidationError} If current user lacks admin rights
 * 
 * @example
 * ```typescript
 * await deleteGroupPermissionsForUser(456, 789, 123);
 * ```
 */
export async function deleteGroupPermissionsForUser(groupId: number, userId: number, current_user_id: number): Promise<void> {
  let group = await Group.getFromDbData(groupId, current_user_id);
  await group.deletePermissionsForUser(userId);
}

/**
 * Updates permissions for a specific user in a group.
 * Allows modifying access rights and role assignments.
 * 
 * @async
 * @function patchGroupPermissionsForUser
 * @param {number} groupId - The unique identifier of the group
 * @param {number} userId - The ID of the user whose permissions to update
 * @param {number} current_user_id - The ID of the user performing the action
 * @param {Object} body - Permission data containing new rights/roles
 * @returns {Promise<UserPermission>} The updated permission object
 * @throws {NotFoundError} If group or user doesn't exist
 * @throws {ValidationError} If permission data is invalid
 * 
 * @example
 * ```typescript
 * const permission = await patchGroupPermissionsForUser(
 *   456, 789, 123,
 *   { permission_level: 'write' }
 * );
 * ```
 */
export async function patchGroupPermissionsForUser(groupId: number, userId: number, current_user_id: number, body: any): Promise<SingleUserPermission> {
  let group = await Group.getFromDbData(groupId, current_user_id);
  return await group.patchPermissionsForUser(userId, body);
}

/**
 * Retrieves permissions for a specific user in a group.
 * Shows what access rights the user has for the group.
 * 
 * @async
 * @function getGroupPermissionsForUser
 * @param {number} groupId - The unique identifier of the group
 * @param {number} userId - The ID of the user whose permissions to retrieve
 * @param {number} current_user_id - The ID of the user requesting permission info
 * @returns {Promise<UserPermission>} The user's permission object for the group
 * @throws {NotFoundError} If group or user doesn't exist
 * @throws {ValidationError} If current user lacks access to view permissions
 * 
 * @example
 * ```typescript
 * const permissions = await getGroupPermissionsForUser(456, 789, 123);
 * logger.info('User permission level:', permissions.permission_level);
 * ```
 */
export async function getGroupPermissionsForUser(groupId: number, userId: number, current_user_id: number): Promise<SingleUserPermission> {
  let group = await Group.getFromDbData(groupId, current_user_id);
  return await group.getPermissionsForUser(userId);
}

export async function createGroupPermissions(groupId: number, current_user_id: number, body: any) : Promise<UserPermission> {
  let group = await Group.getFromDbData(groupId, current_user_id);
  return await group.createPermissions(body);
}

/**
 * Retrieves all permissions associated with a group.
 * Shows all users who have access to the group and their permission levels.
 * 
 * @async
 * @function getGroupPermissions
 * @param {number} groupId - The unique identifier of the group
 * @param {number} current_user_id - The ID of the user requesting permissions list
 * @returns {Promise<UserPermission[]>} Array of all group permissions
 * @throws {NotFoundError} If group doesn't exist or user lacks access
 * 
 * @example
 * ```typescript
 * const allPermissions = await getGroupPermissions(456, 123);
 * allPermissions.forEach(perm => {
 *   logger.info(`User ${perm.user_id}: ${perm.permission_level}`);
 * });
 * ```
 */
export async function getGroupPermissions(groupId: number, current_user_id: number): Promise<UserPermission> {
  let group = await Group.getFromDbData(groupId, current_user_id);
  return await group.getPermissions();
}