import { GroupPermissions } from "@/lib/models/groups/groupPermissions.model";
import { NotFoundError } from "@/lib/errors/appErrors";

/**
 * Service for GroupPermissions entity operations.
 * Handles all CRUD operations and business logic for group permissions.
 * 
 * @namespace GroupPermissionsService
 */

/**
 * Retrieve all permissions for a specific group.
 * 
 * @async
 * @function getGroupPermissions
 * @param {number} group_id - The group's ID
 * @returns {Promise<GroupPermissions[]>} Array of permissions for the group
 * 
 * @example
 * ```typescript
 * const permissions = await getGroupPermissions(123);
 * ```
 */
export async function getGroupPermissions(group_id: number): Promise<GroupPermissions[]> {
  return await GroupPermissions.findAll({
    where: { group_id },
    order: [['user_id', 'ASC'], ['permission', 'ASC']]
  });
}

/**
 * Retrieve all permissions for a specific user across all groups.
 * 
 * @async
 * @function getUserPermissions
 * @param {number} user_id - The user's ID
 * @returns {Promise<GroupPermissions[]>} Array of permissions for the user
 * 
 * @example
 * ```typescript
 * const permissions = await getUserPermissions(123);
 * ```
 */
export async function getUserPermissions(user_id: number): Promise<GroupPermissions[]> {
  return await GroupPermissions.findAll({
    where: { user_id },
    order: [['group_id', 'ASC'], ['permission', 'ASC']]
  });
}

/**
 * Retrieve a specific permission record.
 * 
 * @async
 * @function getPermission
 * @param {number} group_id - The group's ID
 * @param {number} user_id - The user's ID
 * @param {string} permission - The permission type
 * @returns {Promise<GroupPermissions>} The permission record
 * @throws {NotFoundError} If the permission record doesn't exist
 * 
 * @example
 * ```typescript
 * const permission = await getPermission(123, 456, 'admin');
 * ```
 */
export async function getPermission(
  group_id: number, 
  user_id: number, 
  permission: string
): Promise<GroupPermissions> {
  const record = await GroupPermissions.findOne({
    where: { group_id, user_id, permission }
  });
  
  if (!record) {
    throw new NotFoundError(
      `Permission ${permission} for user ${user_id} in group ${group_id} not found`
    );
  }
  
  return record;
}

/**
 * Check if a user has a specific permission in a group.
 * 
 * @async
 * @function hasPermission
 * @param {number} group_id - The group's ID
 * @param {number} user_id - The user's ID
 * @param {string} permission - The permission type to check
 * @returns {Promise<boolean>} True if user has the permission, false otherwise
 * 
 * @example
 * ```typescript
 * const hasAdmin = await hasPermission(123, 456, 'admin');
 * ```
 */
export async function hasPermission(
  group_id: number, 
  user_id: number, 
  permission: string
): Promise<boolean> {
  const count = await GroupPermissions.count({
    where: { group_id, user_id, permission }
  });
  return count > 0;
}

/**
 * Grant a permission to a user in a group.
 * 
 * @async
 * @function grantPermission
 * @param {number} group_id - The group's ID
 * @param {number} user_id - The user's ID
 * @param {string} permission - The permission to grant
 * @returns {Promise<GroupPermissions>} The created permission record
 * 
 * @example
 * ```typescript
 * const permission = await grantPermission(123, 456, 'admin');
 * ```
 */
export async function grantPermission(
  group_id: number, 
  user_id: number, 
  permission: string
): Promise<GroupPermissions> {
  return await GroupPermissions.create({ group_id, user_id, permission });
}

/**
 * Revoke a permission from a user in a group.
 * 
 * @async
 * @function revokePermission
 * @param {number} group_id - The group's ID
 * @param {number} user_id - The user's ID
 * @param {string} permission - The permission to revoke
 * @returns {Promise<void>}
 * @throws {NotFoundError} If the permission record doesn't exist
 * 
 * @example
 * ```typescript
 * await revokePermission(123, 456, 'admin');
 * ```
 */
export async function revokePermission(
  group_id: number, 
  user_id: number, 
  permission: string
): Promise<void> {
  const record = await getPermission(group_id, user_id, permission);
  await record.destroy();
}

/**
 * Revoke all permissions for a user in a specific group.
 * 
 * @async
 * @function revokeAllUserPermissionsInGroup
 * @param {number} group_id - The group's ID
 * @param {number} user_id - The user's ID
 * @returns {Promise<number>} Number of permissions revoked
 * 
 * @example
 * ```typescript
 * const revoked = await revokeAllUserPermissionsInGroup(123, 456);
 * ```
 */
export async function revokeAllUserPermissionsInGroup(
  group_id: number, 
  user_id: number
): Promise<number> {
  return await GroupPermissions.destroy({
    where: { group_id, user_id }
  });
}

/**
 * Revoke all permissions in a group (when deleting a group).
 * 
 * @async
 * @function revokeAllGroupPermissions
 * @param {number} group_id - The group's ID
 * @returns {Promise<number>} Number of permissions revoked
 * 
 * @example
 * ```typescript
 * const revoked = await revokeAllGroupPermissions(123);
 * ```
 */
export async function revokeAllGroupPermissions(group_id: number): Promise<number> {
  return await GroupPermissions.destroy({
    where: { group_id }
  });
}

/**
 * Get all users with a specific permission in a group.
 * 
 * @async
 * @function getUsersWithPermission
 * @param {number} group_id - The group's ID
 * @param {string} permission - The permission type
 * @returns {Promise<number[]>} Array of user IDs with the permission
 * 
 * @example
 * ```typescript
 * const adminUsers = await getUsersWithPermission(123, 'admin');
 * ```
 */
export async function getUsersWithPermission(
  group_id: number, 
  permission: string
): Promise<number[]> {
  const records = await GroupPermissions.findAll({
    where: { group_id, permission },
    attributes: ['user_id'],
    order: [['user_id', 'ASC']]
  });
  
  return records.map(record => record.user_id);
}

/**
 * Get all distinct permission types for a group.
 * 
 * @async
 * @function getGroupPermissionTypes
 * @param {number} group_id - The group's ID
 * @returns {Promise<string[]>} Array of distinct permission types
 * 
 * @example
 * ```typescript
 * const permissions = await getGroupPermissionTypes(123);
 * ```
 */
export async function getGroupPermissionTypes(group_id: number): Promise<string[]> {
  const records = await GroupPermissions.findAll({
    where: { group_id },
    attributes: ['permission'],
    group: ['permission'],
    order: [['permission', 'ASC']]
  });
  
  return records.map(record => record.permission);
}
/**
 * Retrieve all group permissions from the database.
 * 
 * @async
 * @function getAllGroupPermissions
 * @returns {Promise<GroupPermissions[]>} Array of all group permissions
 * 
 * @example
 * ```typescript
 * const permissions = await getAllGroupPermissions();
 * ```
 */
export async function getAllGroupPermissions(): Promise<GroupPermissions[]> {
  return await GroupPermissions.findAll({
    order: [['group_id', 'ASC'], ['user_id', 'ASC'], ['permission', 'ASC']]
  });
}

/**
 * Retrieve a group permission by group and user ID.
 * 
 * @async
 * @function getGroupPermissionById
 * @param {number} group_id - The group's ID
 * @param {number} user_id - The user's ID
 * @returns {Promise<GroupPermissions>} The first permission record found
 * @throws {NotFoundError} If no permission found for the user in group
 * 
 * @example
 * ```typescript
 * const permission = await getGroupPermissionById(123, 456);
 * ```
 */
export async function getGroupPermissionById(group_id: number, user_id: number): Promise<GroupPermissions> {
  const permission = await GroupPermissions.findOne({
    where: { group_id, user_id }
  });
  
  if (!permission) {
    throw new NotFoundError(`Permission for user ${user_id} in group ${group_id} not found`);
  }
  
  return permission;
}

/**
 * Retrieve all permissions for a specific group.
 * 
 * @async
 * @function getGroupPermissionsByGroup
 * @param {number} group_id - The group's ID
 * @returns {Promise<GroupPermissions[]>} Array of permission records for the group
 * 
 * @example
 * ```typescript
 * const permissions = await getGroupPermissionsByGroup(123);
 * ```
 */
export async function getGroupPermissionsByGroup(group_id: number): Promise<GroupPermissions[]> {
  return await GroupPermissions.findAll({
    where: { group_id },
    order: [['user_id', 'ASC'], ['permission', 'ASC']]
  });
}

/**
 * Retrieve all permissions for a specific user across all groups.
 * 
 * @async
 * @function getGroupPermissionsByUser
 * @param {number} user_id - The user's ID
 * @returns {Promise<GroupPermissions[]>} Array of permission records for the user
 * 
 * @example
 * ```typescript
 * const permissions = await getGroupPermissionsByUser(456);
 * ```
 */
export async function getGroupPermissionsByUser(user_id: number): Promise<GroupPermissions[]> {
  return await GroupPermissions.findAll({
    where: { user_id },
    order: [['group_id', 'ASC'], ['permission', 'ASC']]
  });
}

/**
 * Retrieve all permissions of a specific type.
 * 
 * @async
 * @function getGroupPermissionsByType
 * @param {string} permission - The permission type
 * @returns {Promise<GroupPermissions[]>} Array of permissions of the specified type
 * 
 * @example
 * ```typescript
 * const permissions = await getGroupPermissionsByType('admin');
 * ```
 */
export async function getGroupPermissionsByType(permission: string): Promise<GroupPermissions[]> {
  return await GroupPermissions.findAll({
    where: { permission },
    order: [['group_id', 'ASC'], ['user_id', 'ASC']]
  });
}

/**
 * Count the total number of group permissions.
 * 
 * @async
 * @function countGroupPermissions
 * @returns {Promise<number>} Total count of permission records
 * 
 * @example
 * ```typescript
 * const total = await countGroupPermissions();
 * ```
 */
export async function countGroupPermissions(): Promise<number> {
  return await GroupPermissions.count();
}

/**
 * Check if a user has a specific permission in a group.
 * 
 * @async
 * @function checkUserGroupPermission
 * @param {number} user_id - The user's ID
 * @param {number} group_id - The group's ID
 * @param {string} permission - The permission type to check
 * @returns {Promise<boolean>} True if user has the permission, false otherwise
 * 
 * @example
 * ```typescript
 * const hasPermission = await checkUserGroupPermission(456, 123, 'admin');
 * ```
 */
export async function checkUserGroupPermission(
  user_id: number,
  group_id: number,
  permission: string
): Promise<boolean> {
  const count = await GroupPermissions.count({
    where: { user_id, group_id, permission }
  });
  return count > 0;
}

/**
 * Create a new group permission.
 * 
 * @async
 * @function createGroupPermission
 * @param {object} permissionData - The permission data to create
 * @returns {Promise<GroupPermissions>} The created permission record
 * 
 * @example
 * ```typescript
 * const permission = await createGroupPermission({
 *   group_id: 123,
 *   user_id: 456,
 *   permission: 'admin'
 * });
 * ```
 */
export async function createGroupPermission(permissionData: {
  group_id: number;
  user_id: number;
  permission: string;
}): Promise<GroupPermissions> {
  return await GroupPermissions.create(permissionData);
}

/**
 * Update an existing group permission.
 * Replaces an old permission with a new one for the same user and group.
 * 
 * @async
 * @function updateGroupPermission
 * @param {number} group_id - The group's ID
 * @param {number} user_id - The user's ID
 * @param {string} oldPermission - The current permission to replace
 * @param {string} newPermission - The new permission to set
 * @returns {Promise<GroupPermissions>} The new permission record
 * @throws {NotFoundError} If old permission not found
 * 
 * @example
 * ```typescript
 * const permission = await updateGroupPermission(123, 456, 'read', 'admin');
 * ```
 */
export async function updateGroupPermission(
  group_id: number,
  user_id: number,
  oldPermission: string,
  newPermission: string
): Promise<GroupPermissions> {
  // Find and delete the old permission
  const deleteCount = await GroupPermissions.destroy({
    where: { group_id, user_id, permission: oldPermission }
  });
  
  if (deleteCount === 0) {
    throw new NotFoundError(`Permission ${oldPermission} for user ${user_id} in group ${group_id} not found`);
  }
  
  // Create the new permission
  return await GroupPermissions.create({ group_id, user_id, permission: newPermission });
}

/**
 * Delete a specific group permission.
 * 
 * @async
 * @function deleteGroupPermission
 * @param {number} group_id - The group's ID
 * @param {number} user_id - The user's ID
 * @param {string} permission - The specific permission to delete
 * @returns {Promise<void>}
 * @throws {NotFoundError} If permission not found
 * 
 * @example
 * ```typescript
 * const deleted = await deleteGroupPermission(123, 456);
 * ```
 */
export async function deleteGroupPermission(group_id: number, user_id: number): Promise<number> {
  let deleteCount = await GroupPermissions.destroy({
    where: { group_id, user_id }
  });
  if (deleteCount === 0) {
    throw new NotFoundError(`Permission for user ${user_id} in group ${group_id} not found`);
  }
  return deleteCount;
}

/**
 * Delete all permissions for a specific group.
 * 
 * @async
 * @function deleteGroupPermissionsByGroup
 * @param {number} group_id - The group's ID
 * @returns {Promise<number>} Number of deleted records
 * 
 * @example
 * ```typescript
 * const deleted = await deleteGroupPermissionsByGroup(123);
 * ```
 */
export async function deleteGroupPermissionsByGroup(group_id: number): Promise<number> {
  return await GroupPermissions.destroy({
    where: { group_id }
  });
}

/**
 * Delete all permissions for a specific user across all groups.
 * 
 * @async
 * @function deleteGroupPermissionsByUser
 * @param {number} user_id - The user's ID
 * @returns {Promise<number>} Number of deleted records
 * 
 * @example
 * ```typescript
 * const deleted = await deleteGroupPermissionsByUser(456);
 * ```
 */
export async function deleteGroupPermissionsByUser(user_id: number): Promise<number> {
  return await GroupPermissions.destroy({
    where: { user_id }
  });
}

/**
 * Count permissions for a specific group.
 * 
 * @async
 * @function countPermissionsByGroup
 * @param {number} group_id - The group's ID
 * @returns {Promise<number>} Count of permissions for the group
 * 
 * @example
 * ```typescript
 * const count = await countPermissionsByGroup(123);
 * ```
 */
export async function countPermissionsByGroup(group_id: number): Promise<number> {
  return await GroupPermissions.count({
    where: { group_id }
  });
}

/**
 * Count permissions for a specific user across all groups.
 * 
 * @async
 * @function countPermissionsByUser
 * @param {number} user_id - The user's ID
 * @returns {Promise<number>} Count of permissions for the user
 * 
 * @example
 * ```typescript
 * const count = await countPermissionsByUser(456);
 * ```
 */
export async function countPermissionsByUser(user_id: number): Promise<number> {
  return await GroupPermissions.count({
    where: { user_id }
  });
}

/**
 * Check if a group permission exists.
 * 
 * @async
 * @function groupPermissionExists
 * @param {number} group_id - The group's ID
 * @param {number} user_id - The user's ID
 * @returns {Promise<boolean>} True if permission exists, false otherwise
 * 
 * @example
 * ```typescript
 * const exists = await groupPermissionExists(123, 456);
 * ```
 */
export async function groupPermissionExists(group_id: number, user_id: number): Promise<boolean> {
  const count = await GroupPermissions.count({
    where: { group_id, user_id }
  });
  return count > 0;
}

/**
 * Get all distinct permission types across all groups.
 * 
 * @async
 * @function getDistinctPermissionTypes
 * @returns {Promise<string[]>} Array of unique permission types
 * 
 * @example
 * ```typescript
 * const types = await getDistinctPermissionTypes();
 * ```
 */
export async function getDistinctPermissionTypes(): Promise<string[]> {
  const records = await GroupPermissions.findAll({
    attributes: ['permission'],
    group: ['permission'],
    order: [['permission', 'ASC']]
  });
  
  return records.map(record => record.permission);
}

// Aliases for test compatibility
export const getUserGroupPermissions = getUserPermissions;
export const addGroupPermission = grantPermission;
export const removeGroupPermission = revokePermission;
export const hasGroupPermission = hasPermission;
export const getGroupUsersWithPermission = async (group_id: number, permission: string): Promise<GroupPermissions[]> => {
  return getUsersWithPermission(group_id, permission);
};
export const getUserGroups = async (user_id: number): Promise<any[]> => {
  // Get all group permissions for user, then return unique groups
  const permissions = await getUserPermissions(user_id);
  const uniqueGroups = permissions.reduce((acc: any[], perm) => {
    const existing = acc.find(g => g.group_id === perm.group_id);
    if (!existing) {
      acc.push({ group_id: perm.group_id });
    }
    return acc;
  }, []);
  return uniqueGroups;
};
