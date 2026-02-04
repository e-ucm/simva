/**
 * @fileoverview Service for SimletPermissions entity operations.
 * Handles all CRUD operations and business logic for simlet permissions.
 * 
 * SimletPermissions represents the access control system for simlets,
 * defining what users can do with specific learning environments.
 * 
 * @module services/simlets/simletPermissions
 * @requires @/lib/db
 * @requires @/lib/errors/appErrors
 */

import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/errors/appErrors";

/**
 * Service for SimletPermissions entity operations.
 * Handles all CRUD operations and business logic for simlet permissions.
 * 
 * @namespace SimletPermissionsService
 */

/**
 * Retrieve all permissions for a specific simlet.
 * 
 * @async
 * @function getSimletPermissions
 * @param {number} simlet_id - The simlet's ID
 * @returns {Promise<InstanceType<typeof db.Tables.SimletPermissions>[]>} Array of permissions for the simlet
 * 
 * @example
 * ```typescript
 * const permissions = await getSimletPermissions(123);
 * ```
 */
export async function getSimletPermissions(simlet_id: number): Promise<InstanceType<typeof db.Tables.SimletPermissions>[]> {
  return await db.Tables.SimletPermissions.findAll({
    where: { simlet_id },
    order: [['user_id', 'ASC'], ['permission', 'ASC']]
  });
}

/**
 * Retrieve all permissions for a specific user across all simlets.
 * 
 * @async
 * @function getUserSimletPermissions
 * @param {number} user_id - The user's ID
 * @returns {Promise<InstanceType<typeof db.Tables.SimletPermissions>[]>} Array of permissions for the user
 * 
 * @example
 * ```typescript
 * const permissions = await getUserSimletPermissions(456);
 * ```
 */
export async function getUserSimletPermissions(user_id: number): Promise<InstanceType<typeof db.Tables.SimletPermissions>[]> {
  return await db.Tables.SimletPermissions.findAll({
    where: { user_id },
    order: [['simlet_id', 'ASC'], ['permission', 'ASC']]
  });
}

/**
 * Retrieve all simlet permissions.
 * 
 * @async
 * @function getAllSimletPermissions
 * @param {number} [limit] - Maximum number of permissions to return
 * @param {number} [offset] - Number of permissions to skip for pagination
 * @returns {Promise<InstanceType<typeof db.Tables.SimletPermissions>[]>} Array of all simlet permissions
 * 
 * @example
 * ```typescript
 * const permissions = await getAllSimletPermissions();
 * const paginated = await getAllSimletPermissions(10, 20);
 * ```
 */
export async function getAllSimletPermissions(
  limit?: number,
  offset?: number
): Promise<InstanceType<typeof db.Tables.SimletPermissions>[]> {
  return await db.Tables.SimletPermissions.findAll({
    order: [['simlet_id', 'ASC'], ['user_id', 'ASC'], ['permission', 'ASC']],
    limit,
    offset
  });
}

/**
 * Get a specific simlet permission by composite key.
 * 
 * @async
 * @function getSimletPermissionById
 * @param {number} simlet_id - The simlet's ID
 * @param {number} user_id - The user's ID
 * @param {string} permission - The permission type
 * @returns {Promise<InstanceType<typeof db.Tables.SimletPermissions>>} The simlet permission
 * @throws {NotFoundError} If the permission doesn't exist
 * 
 * @example
 * ```typescript
 * const permission = await getSimletPermissionById(123, 456, 'read');
 * ```
 */
export async function getSimletPermissionById(
  simlet_id: number,
  user_id: number,
  permission: string
): Promise<InstanceType<typeof db.Tables.SimletPermissions>> {
  const simletPermission = await db.Tables.SimletPermissions.findOne({
    where: { simlet_id, user_id, permission }
  });
  
  if (!simletPermission) {
    throw new NotFoundError(`SimletPermission with simlet_id ${simlet_id}, user_id ${user_id}, and permission ${permission} not found`);
  }
  
  return simletPermission;
}

/**
 * Get permissions for a specific user on a specific simlet.
 * 
 * @async
 * @function getUserPermissionsOnSimlet
 * @param {number} simlet_id - The simlet's ID
 * @param {number} user_id - The user's ID
 * @returns {Promise<InstanceType<typeof db.Tables.SimletPermissions>[]>} Array of user's permissions on the simlet
 * 
 * @example
 * ```typescript
 * const permissions = await getUserPermissionsOnSimlet(123, 456);
 * ```
 */
export async function getUserPermissionsOnSimlet(
  simlet_id: number,
  user_id: number
): Promise<InstanceType<typeof db.Tables.SimletPermissions>[]> {
  return await db.Tables.SimletPermissions.findAll({
    where: { simlet_id, user_id },
    order: [['permission', 'ASC']]
  });
}

/**
 * Create a new simlet permission.
 * 
 * @async
 * @function createSimletPermission
 * @param {Partial<InstanceType<typeof db.Tables.SimletPermissions>>} permissionData - The permission data for creation
 * @returns {Promise<InstanceType<typeof db.Tables.SimletPermissions>>} The created simlet permission
 * 
 * @example
 * ```typescript
 * const permission = await createSimletPermission({
 *   simlet_id: 123,
 *   user_id: 456,
 *   permission: 'read'
 * });
 * ```
 */
export async function createSimletPermission(
  permissionData: Partial<InstanceType<typeof db.Tables.SimletPermissions>>
): Promise<InstanceType<typeof db.Tables.SimletPermissions>> {
  return await db.Tables.SimletPermissions.create(permissionData);
}

/**
 * Update an existing simlet permission.
 * 
 * @async
 * @function updateSimletPermission
 * @param {number} simlet_id - The simlet's ID
 * @param {number} user_id - The user's ID
 * @param {string} oldPermission - The current permission type
 * @param {string} newPermission - The new permission type
 * @returns {Promise<InstanceType<typeof db.Tables.SimletPermissions>>} The updated simlet permission
 * @throws {NotFoundError} If the permission doesn't exist
 * 
 * @example
 * ```typescript
 * const updated = await updateSimletPermission(123, 456, 'read', 'WRITE');
 * ```
 */
export async function updateSimletPermission(
  simlet_id: number,
  user_id: number,
  oldPermission: string,
  newPermission: string
): Promise<InstanceType<typeof db.Tables.SimletPermissions>> {
  // First delete the old permission
  await deleteSimletPermission(simlet_id, user_id, oldPermission);
  
  // Then create the new permission
  return await createSimletPermission({
    simlet_id,
    user_id,
    permission: newPermission as "read" | "WRITE"
  });
}

/**
 * Delete a simlet permission by composite key.
 * 
 * @async
 * @function deleteSimletPermission
 * @param {number} simlet_id - The simlet's ID
 * @param {number} user_id - The user's ID
 * @param {string} permission - The permission type
 * @returns {Promise<void>}
 * @throws {NotFoundError} If the permission doesn't exist
 * 
 * @example
 * ```typescript
 * await deleteSimletPermission(123, 456, 'read');
 * ```
 */
export async function deleteSimletPermission(
  simlet_id: number,
  user_id: number,
  permission: string
): Promise<void> {
  const simletPermission = await getSimletPermissionById(simlet_id, user_id, permission);
  await simletPermission.destroy();
}

/**
 * Count total number of simlet permissions.
 * 
 * @async
 * @function countSimletPermissions
 * @returns {Promise<number>} Total count of permissions
 * 
 * @example
 * ```typescript
 * const count = await countSimletPermissions();
 * ```
 */
export async function countSimletPermissions(): Promise<number> {
  return await db.Tables.SimletPermissions.count();
}

/**
 * Count permissions for a specific simlet.
 * 
 * @async
 * @function countSimletPermissionsBySimlet
 * @param {number} simlet_id - The simlet's ID
 * @returns {Promise<number>} Count of permissions for the simlet
 * 
 * @example
 * ```typescript
 * const count = await countSimletPermissionsBySimlet(123);
 * ```
 */
export async function countSimletPermissionsBySimlet(simlet_id: number): Promise<number> {
  return await db.Tables.SimletPermissions.count({ where: { simlet_id } });
}

/**
 * Count permissions for a specific user.
 * 
 * @async
 * @function countSimletPermissionsByUser
 * @param {number} user_id - The user's ID
 * @returns {Promise<number>} Count of permissions for the user
 * 
 * @example
 * ```typescript
 * const count = await countSimletPermissionsByUser(456);
 * ```
 */
export async function countSimletPermissionsByUser(user_id: number): Promise<number> {
  return await db.Tables.SimletPermissions.count({ where: { user_id } });
}

/**
 * Check if a simlet permission exists.
 * 
 * @async
 * @function simletPermissionExists
 * @param {number} simlet_id - The simlet's ID
 * @param {number} user_id - The user's ID
 * @param {string} permission - The permission type
 * @returns {Promise<boolean>} True if permission exists, false otherwise
 * 
 * @example
 * ```typescript
 * const exists = await simletPermissionExists(123, 456, 'read');
 * ```
 */
export async function simletPermissionExists(
  simlet_id: number,
  user_id: number,
  permission: string
): Promise<boolean> {
  const count = await db.Tables.SimletPermissions.count({ where: { simlet_id, user_id, permission } });
  return count > 0;
}

/**
 * Remove all permissions from a simlet.
 * 
 * @async
 * @function removeAllPermissionsFromSimlet
 * @param {number} simlet_id - The simlet's ID
 * @returns {Promise<number>} Number of permissions removed
 * 
 * @example
 * ```typescript
 * const removed = await removeAllPermissionsFromSimlet(123);
 * ```
 */
export async function removeAllPermissionsFromSimlet(simlet_id: number): Promise<number> {
  return await db.Tables.SimletPermissions.destroy({ where: { simlet_id } });
}

/**
 * Remove all permissions for a user.
 * 
 * @async
 * @function removeAllPermissionsFromUser
 * @param {number} user_id - The user's ID
 * @returns {Promise<number>} Number of permissions removed
 * 
 * @example
 * ```typescript
 * const removed = await removeAllPermissionsFromUser(456);
 * ```
 */
export async function removeAllPermissionsFromUser(user_id: number): Promise<number> {
  return await db.Tables.SimletPermissions.destroy({ where: { user_id } });
}

/**
 * Check if user has specific permission on simlet.
 * 
 * @async
 * @function hasSimletPermission
 * @param {number} simlet_id - The simlet's ID
 * @param {number} user_id - The user's ID
 * @param {string} permission - The permission type to check
 * @returns {Promise<boolean>} True if user has the permission, false otherwise
 * 
 * @example
 * ```typescript
 * const canWrite = await hasSimletPermission(123, 456, 'WRITE');
 * ```
 */
export async function hasSimletPermission(
  simlet_id: number,
  user_id: number,
  permission: string
): Promise<boolean> {
  return await simletPermissionExists(simlet_id, user_id, permission);
}