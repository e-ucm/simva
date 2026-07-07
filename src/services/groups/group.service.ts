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

import { SimletGroup } from "@/lib/mappers/simletGroup/SimletGroup";

/**
 * Retrieves all groups accessible to a specific user.
 * Uses database views to respect user permissions and group access controls.
 * 
 * @async
 * @function getGroups
 * @param {number} current_user_id - The ID of the user requesting groups
 * @param {boolean} [version] - Optional version filter for group generation type
 * @param {string} [searchString] - Optional search string to filter groups
 * @param {number} [limit] - Optional limit for pagination
 * @param {number} [offset] - Optional offset for pagination
 * @returns {Promise<SimletGroup[]>} Array of SimletGroup objects the user has access to
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
 * 
 * // Get groups with search string and pagination
 * const filteredGroups = await getGroups(123, undefined, 'research', 10, 0);
 * ```
 */
export async function getGroups(current_user_id: number, version?: boolean, searchString?: string, limit?: number, offset?: number): Promise<SimletGroup[]> {
    return await SimletGroup.getCurrentUserAllFromDbData(current_user_id, version, limit, offset, searchString);
}

/**
 * Retrieves all groups for admin users.
 * 
 * @async
 * @function getAdminGroups
 * @param {boolean} [version] - Optional version filter for group generation type
 * @param {string} [searchString] - Optional search string to filter groups
 * @param {number} [limit] - Optional limit for pagination
 * @param {number} [offset] - Optional offset for pagination
 * @returns {Promise<SimletGroup[]>} Array of all SimletGroup objects
 * 
 * @example
 * ```typescript
 * // Get all groups for admin
 * const allGroups = await getAdminGroups();
 * 
 * // Get groups with search string and pagination
 * const filteredGroups = await getAdminGroups(true, 'research', 10, 0);
 * ```
 */
export async function getAdminGroups(version: boolean | undefined, searchString: string | undefined, limit: number | undefined, offset: number | undefined): Promise<SimletGroup[] | PromiseLike<SimletGroup[]>> {
  return await SimletGroup.getAdminAllFromDbData(version, limit, offset, searchString);
} 
