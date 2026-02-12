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

import { ValidationError, NotFoundError } from "@/lib/errors/appErrors";
import { Group } from "@/lib/mappers/group/Group";
import { db } from "@/lib/db";
import { GroupParticipant } from "@/lib/mappers/group/GroupParticipant";
import { logger } from "@/lib/logger";

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
export async function getGroups(user_id: number, version?: boolean, searchString?: string, limit?: number, offset?: number): Promise<Group[]> {
    let groups;
    if(searchString != undefined && limit != undefined && offset != undefined && version != undefined) {
        groups = await db.Functions.runViewQuery(db.Views.Group.byUserIdAndVersionWithPagination, { user_id, version, searchString, limit, offset});
    } else if(limit != undefined && offset != undefined && searchString != undefined) {
        groups = await db.Functions.runViewQuery(db.Views.Group.byUserIdAndVersionWithPagination, { user_id, searchString, limit, offset});
    } else if(limit != undefined && offset != undefined && version != undefined) {
        groups = await db.Functions.runViewQuery(db.Views.Group.byUserIdAndVersionWithPagination, { user_id, version, limit, offset});
    } else if(searchString != undefined && version != undefined) {
        groups = await db.Functions.runViewQuery(db.Views.Group.byUserIdAndVersion, { user_id, searchString, version });
    } else if(searchString != undefined) {
        groups = await db.Functions.runViewQuery(db.Views.Group.byUserIdAndVersion, { user_id, searchString });
    } else if(version) {
        groups = await db.Functions.runViewQuery(db.Views.Group.byUserIdAndVersion, { user_id, version });
    } else {
        groups = await db.Functions.runViewQuery(db.Views.Group.byUserIdAndVersion, { user_id });
    }
    return groups.map((groupData: any) => new Group(groupData));
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
 * try {
 *   const group = await getGroup(456, 123);
 *   console.log(group.name);
 * } catch (error) {
 *   // Handle group not found or access denied
 * }
 * ```
 */
export async function getGroup(group_id: number, user_id: number): Promise<Group> {
    return await Group.getFromDbData(group_id, user_id);
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
 *   console.log(participant.username, participant.role);
 * });
 * ```
 */
export async function getGroupParticipants(group_id: number, user_id: number): Promise<GroupParticipant[]> {
    let group = await Group.getFromDbData(group_id, user_id);
    return await group.getParticipants();
}