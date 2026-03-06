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

import { SimletGroup } from "@/lib/mappers/simlet/SimletGroup";

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
export async function getGroups(current_user_id: number, version?: boolean, searchString?: string, limit?: number, offset?: number): Promise<SimletGroup[]> {
    return await SimletGroup.getCurrentUserAllFromDbData(current_user_id, version, limit, offset, searchString);
}