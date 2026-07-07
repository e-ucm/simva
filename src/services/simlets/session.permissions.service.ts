/**
 * @fileoverview Service for Session permissions operations.
 * Handles all permission operations for session-level access control.
 * 
 * @module services/simlets/session.permissions
 * @requires @/lib/mappers/session/Session
 * @requires @/lib/mappers/UserPermisions/UserPermission
 * @requires @/lib/mappers/UserPermisions/SingleUserPermission
 */

import { Session } from "@/lib/mappers/session/Session";
import { UserPermission } from "@/lib/mappers/UserPermisions/UserPermission";
import { SingleUserPermission } from "@/lib/mappers/UserPermisions/SingleUserPermission";

/**
 * Retrieves all permissions associated with a session.
 * Shows all users who have access to the session and their permission levels.
 * 
 * @async
 * @function getSessionPermissions
 * @param {number} simletId - The ID of the parent simlet
 * @param {number} sessionId - The ID of the session
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {number} [current_user_id] - The ID of the user requesting permissions list
 * @returns {Promise<UserPermission>} Array of all session permissions
 * @throws {NotFoundError} When simlet or session is not found or user lacks access
 * 
 * @example
 * ```typescript
 * const permissions = await getSessionPermissions(123, 456, false, 789);
 * permissions.forEach(perm => {
 *   logger.info(`User ${perm.user_id}: ${perm.permission_level}`);
 * });
 * ```
 */
export async function getSessionPermissions(simletId: number, sessionId: number, is_admin: boolean, current_user_id?: number): Promise<UserPermission> {
  let session = await Session.getFromDbData(simletId, sessionId, is_admin, current_user_id);
  return await session.getPermissions();
}

/**
 * Creates new permissions for a session.
 * Grants users specific access rights to the session and its activities.
 * 
 * @async
 * @function createSessionPermissions
 * @param {number} simletId - The ID of the parent simlet
 * @param {number} sessionId - The ID of the session
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {Object} body - Permission data containing user ID and permission level
 * @param {number} [current_user_id] - The ID of the user creating the permissions
 * @returns {Promise<UserPermission>} The newly created permission object
 * @throws {NotFoundError} When simlet or session is not found
 * @throws {PermissionError} When user lacks admin permissions
 * @throws {ValidationError} When permission data is invalid
 * 
 * @example
 * ```typescript
 * const permission = await createSessionPermissions(123, 456, false, {
 *   user_id: 555,
 *   permission_level: 'read'
 * }, 789);
 * ```
 */
export async function createSessionPermissions(simletId: number, sessionId: number, is_admin: boolean, body: any, current_user_id?: number): Promise<UserPermission> {
  let session = await Session.getFromDbData(simletId, sessionId, is_admin, current_user_id);
  return await session.createPermissions(body);
}

/**
 * Retrieves permissions for a specific user in a session.
 * Shows what access rights the user has for the session.
 * 
 * @async
 * @function getSessionPermissionsForUser
 * @param {number} simletId - The ID of the parent simlet
 * @param {number} sessionId - The ID of the session
 * @param {number} userId - The ID of the user whose permissions to retrieve
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {number} [current_user_id] - The ID of the user requesting permission info
 * @returns {Promise<SingleUserPermission>} The user's permission object for the session
 * @throws {NotFoundError} When simlet, session, or user is not found
 * @throws {PermissionError} When current user lacks access to view permissions
 * 
 * @example
 * ```typescript
 * const permissions = await getSessionPermissionsForUser(123, 456, 789, false, 555);
 * logger.info('User session permission:', permissions.permission_level);
 * ```
 */
export async function getSessionPermissionsForUser(simletId: number, sessionId: number, userId: number, is_admin: boolean, current_user_id?: number): Promise<SingleUserPermission> {
  let session = await Session.getFromDbData(simletId, sessionId, is_admin, current_user_id);
  return await session.getPermissionsForUser(userId);
}

/**
 * Updates permissions for a specific user in a session.
 * Modifies the user's access rights to the session.
 * 
 * @async
 * @function patchSessionPermissionsForUser
 * @param {number} simletId - The ID of the parent simlet
 * @param {number} sessionId - The ID of the session
 * @param {number} userId - The ID of the user whose permissions to update
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {Object} body - Permission update data
 * @param {number} [current_user_id] - The ID of the user performing the update
 * @returns {Promise<SingleUserPermission>} The updated permission object
 * @throws {NotFoundError} When simlet, session, or user is not found
 * @throws {PermissionError} When current user lacks admin permissions
 * @throws {ValidationError} When permission data is invalid
 * 
 * @example
 * ```typescript
 * const permission = await patchSessionPermissionsForUser(
 *   123, 456, 789, false, {
 *     permission_level: 'read'
 *   }, 555);
 * ```
 */
export async function patchSessionPermissionsForUser(simletId: number, sessionId: number, userId: number, is_admin: boolean, body: any, current_user_id?: number): Promise<SingleUserPermission> {
  let session = await Session.getFromDbData(simletId, sessionId, is_admin, current_user_id);
  return await session.patchPermissionsForUser(userId, body);
}

/**
 * Removes permissions for a specific user from a session.
 * Revokes user's access to the session within the simlet.
 * 
 * @async
 * @function deleteSessionPermissionsForUser
 * @param {number} simletId - The ID of the parent simlet
 * @param {number} sessionId - The ID of the session
 * @param {number} userId - The ID of the user whose permissions to remove
 * @param {boolean} is_admin - Whether the user has admin privileges
 * @param {number} [current_user_id] - The ID of the user performing the deletion
 * @returns {Promise<void>} No return value on successful deletion
 * @throws {NotFoundError} When simlet, session, or user is not found
 * @throws {PermissionError} When current user lacks admin permissions
 * 
 * @example
 * ```typescript
 * await deleteSessionPermissionsForUser(123, 456, 789, false, 555);
 * ```
 */
export async function deleteSessionPermissionsForUser(simletId: number, sessionId: number, userId: number, is_admin: boolean, current_user_id?: number): Promise<void> {
  let session = await Session.getFromDbData(simletId, sessionId, is_admin, current_user_id);
  await session.deletePermissionsForUser(userId);
}
