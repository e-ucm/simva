/**
 * @fileoverview Service for Simlet permissions operations.
 * Handles all permission operations for simlet-level access control.
 * 
 * @module services/simlets/simlet.permissions
 * @requires @/lib/mappers/simlet/Simlet
 * @requires @/lib/mappers/UserPermisions/UserPermission
 * @requires @/lib/mappers/UserPermisions/SingleUserPermission
 */

import { Simlet } from "@/lib/mappers/simlet/Simlet";
import { UserPermission } from "@/lib/mappers/UserPermisions/UserPermission";
import { SingleUserPermission } from "@/lib/mappers/UserPermisions/SingleUserPermission";

/**
 * Retrieves all permissions associated with a simlet.
 * Shows all users who have access to the simlet and their permission levels.
 * 
 * @async
 * @function getSimletPermissions
 * @param {number} simletId - The ID of the simlet
 * @param {number} current_user_id - The ID of the user requesting permissions list
 * @returns {Promise<UserPermission>} Array of all simlet permissions
 * @throws {NotFoundError} When simlet is not found or user lacks access
 * 
 * @example
 * ```typescript
 * const permissions = await getSimletPermissions(123, 456);
 * permissions.forEach(perm => {
 *   logger.info(`User ${perm.user_id}: ${perm.permission_level}`);
 * });
 * ```
 */
export async function getSimletPermissions(simletId: number, is_admin: boolean, current_user_id?: number): Promise<UserPermission> {
  let simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  return await simlet.getPermissions();
}

/**
 * Creates new permissions for a simlet.
 * Grants users specific access rights to the simlet and its contents.
 * 
 * @async
 * @function createSimletPermissions
 * @param {number} simletId - The ID of the simlet
 * @param {number} current_user_id - The ID of the user creating the permissions
 * @param {Object} body - Permission data containing user ID and permission level
 * @returns {Promise<UserPermission>} The newly created permission object
 * @throws {NotFoundError} When simlet is not found
 * @throws {PermissionError} When user lacks admin permissions
 * @throws {ValidationError} When permission data is invalid
 * 
 * @example
 * ```typescript
 * const permission = await createSimletPermissions(123, 456, {
 *   user_id: 789,
 *   permission_level: 'read'
 * });
 * ```
 */
export async function createSimletPermissions(simletId: number, is_admin: boolean, body: any, current_user_id?: number): Promise<UserPermission> {
  let simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  return await simlet.createPermissions(body);
}

/**
 * Retrieves permissions for a specific user in a simlet.
 * Shows what access rights the user has for the simlet.
 * 
 * @async
 * @function getSimletPermissionsForUser
 * @param {number} simletId - The ID of the simlet
 * @param {number} userId - The ID of the user whose permissions to retrieve
 * @param {number} current_user_id - The ID of the user requesting permission info
 * @returns {Promise<SingleUserPermission>} The user's permission object for the simlet
 * @throws {NotFoundError} When simlet or user is not found
 * @throws {PermissionError} When current user lacks access to view permissions
 * 
 * @example
 * ```typescript
 * const permissions = await getSimletPermissionsForUser(123, 789, 456);
 * logger.info('User permission level:', permissions.permission_level);
 * ```
 */
export async function getSimletPermissionsForUser(simletId: number, userId: number, is_admin: boolean, current_user_id?: number): Promise<SingleUserPermission> {
  let simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  return await simlet.getPermissionsForUser(userId);
}

/**
 * Updates permissions for a specific user in a simlet.
 * Modifies the user's access rights and role assignments.
 * 
 * @async
 * @function patchSimletPermissionsForUser
 * @param {number} simletId - The ID of the simlet
 * @param {number} userId - The ID of the user whose permissions to update
 * @param {number} current_user_id - The ID of the user performing the update
 * @param {Object} body - Permission update data
 * @returns {Promise<SingleUserPermission>} The updated permission object
 * @throws {NotFoundError} When simlet or user is not found
 * @throws {PermissionError} When current user lacks admin permissions
 * @throws {ValidationError} When permission data is invalid
 * 
 * @example
 * ```typescript
 * const permission = await patchSimletPermissionsForUser(
 *   123, 789, 456,
 *   { permission_level: 'write' }
 * );
 * ```
 */
export async function patchSimletPermissionsForUser(simletId: number, userId: number, is_admin: boolean, body: any, current_user_id?: number): Promise<SingleUserPermission> {
  let simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  return await simlet.patchPermissionsForUser(userId, body);
}

/**
 * Removes all permissions for a specific user from a simlet.
 * Revokes user's access to the simlet and its contents.
 * 
 * @async
 * @function deleteSimletPermissionsForUser
 * @param {number} simletId - The ID of the simlet
 * @param {number} userId - The ID of the user whose permissions to remove
 * @param {number} current_user_id - The ID of the user performing the deletion
 * @returns {Promise<void>} No return value on successful deletion
 * @throws {NotFoundError} When simlet or user is not found
 * @throws {PermissionError} When current user lacks admin permissions
 * 
 * @example
 * ```typescript
 * await deleteSimletPermissionsForUser(123, 789, 456);
 * ```
 */
export async function deleteSimletPermissionsForUser(simletId: number, userId: number, is_admin: boolean, current_user_id?: number): Promise<void> {
  let simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
  await simlet.deletePermissionsForUser(userId);
}
