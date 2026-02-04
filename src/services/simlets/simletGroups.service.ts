/**
 * @fileoverview Service for SimletGroups entity operations.
 * Handles all CRUD operations and business logic for simlet-group relationships.
 * 
 * SimletGroups represents the many-to-many relationship between simlets and groups,
 * allowing groups to be assigned to specific learning environments.
 * 
 * @module services/simlets/simletGroups
 * @requires @/lib/db
 * @requires @/lib/errors/appErrors
 */

import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/errors/appErrors";

/**
 * Service for SimletGroups entity operations.
 * Handles all CRUD operations and business logic for simlet-group relationships.
 * 
 * @namespace SimletGroupsService
 */

/**
 * Retrieve all groups assigned to a specific simlet.
 * 
 * @async
 * @function getSimletGroups
 * @param {number} simlet_id - The simlet's ID
 * @returns {Promise<InstanceType<typeof db.Tables.SimletGroups>[]>} Array of groups assigned to the simlet
 * 
 * @example
 * ```typescript
 * const groups = await getSimletGroups(123);
 * ```
 */
export async function getSimletGroups(simlet_id: number): Promise<InstanceType<typeof db.Tables.SimletGroups>[]> {
  return await db.Tables.SimletGroups.findAll({
    where: { simlet_id },
    order: [['group_id', 'ASC']]
  });
}

/**
 * Retrieve all simlets assigned to a specific group.
 * 
 * @async
 * @function getGroupSimlets
 * @param {number} group_id - The group's ID
 * @returns {Promise<InstanceType<typeof db.Tables.SimletGroups>[]>} Array of simlets assigned to the group
 * 
 * @example
 * ```typescript
 * const simlets = await getGroupSimlets(456);
 * ```
 */
export async function getGroupSimlets(group_id: number): Promise<InstanceType<typeof db.Tables.SimletGroups>[]> {
  return await db.Tables.SimletGroups.findAll({
    where: { group_id },
    order: [['simlet_id', 'ASC']]
  });
}

/**
 * Retrieve all simlet-group relationships.
 * 
 * @async
 * @function getAllSimletGroups
 * @param {number} [limit] - Maximum number of relationships to return
 * @param {number} [offset] - Number of relationships to skip for pagination
 * @returns {Promise<InstanceType<typeof db.Tables.SimletGroups>[]>} Array of all simlet-group relationships
 * 
 * @example
 * ```typescript
 * const relationships = await getAllSimletGroups();
 * const paginated = await getAllSimletGroups(10, 20);
 * ```
 */
export async function getAllSimletGroups(
  limit?: number,
  offset?: number
): Promise<InstanceType<typeof db.Tables.SimletGroups>[]> {
  return await db.Tables.SimletGroups.findAll({
    order: [['simlet_id', 'ASC'], ['group_id', 'ASC']],
    limit,
    offset
  });
}

/**
 * Get a specific simlet-group relationship by composite key.
 * 
 * @async
 * @function getSimletGroupById
 * @param {number} simlet_id - The simlet's ID
 * @param {number} group_id - The group's ID
 * @returns {Promise<InstanceType<typeof db.Tables.SimletGroups>>} The simlet-group relationship
 * @throws {NotFoundError} If the relationship doesn't exist
 * 
 * @example
 * ```typescript
 * const relationship = await getSimletGroupById(123, 456);
 * ```
 */
export async function getSimletGroupById(
  simlet_id: number,
  group_id: number
): Promise<InstanceType<typeof db.Tables.SimletGroups>> {
  const relationship = await db.Tables.SimletGroups.findOne({
    where: { simlet_id, group_id }
  });
  
  if (!relationship) {
    throw new NotFoundError(`SimletGroup relationship with simlet_id ${simlet_id} and group_id ${group_id} not found`);
  }
  
  return relationship;
}

/**
 * Create a new simlet-group relationship.
 * 
 * @async
 * @function createSimletGroup
 * @param {Partial<InstanceType<typeof db.Tables.SimletGroups>>} relationshipData - The relationship data for creation
 * @returns {Promise<InstanceType<typeof db.Tables.SimletGroups>>} The created simlet-group relationship
 * 
 * @example
 * ```typescript
 * const relationship = await createSimletGroup({
 *   simlet_id: 123,
 *   group_id: 456
 * });
 * ```
 */
export async function createSimletGroup(
  relationshipData: Partial<InstanceType<typeof db.Tables.SimletGroups>>
): Promise<InstanceType<typeof db.Tables.SimletGroups>> {
  return await db.Tables.SimletGroups.create(relationshipData);
}

/**
 * Delete a simlet-group relationship by composite key.
 * 
 * @async
 * @function deleteSimletGroup
 * @param {number} simlet_id - The simlet's ID
 * @param {number} group_id - The group's ID
 * @returns {Promise<void>}
 * @throws {NotFoundError} If the relationship doesn't exist
 * 
 * @example
 * ```typescript
 * await deleteSimletGroup(123, 456);
 * ```
 */
export async function deleteSimletGroup(simlet_id: number, group_id: number): Promise<void> {
  const relationship = await getSimletGroupById(simlet_id, group_id);
  await relationship.destroy();
}

/**
 * Count total number of simlet-group relationships.
 * 
 * @async
 * @function countSimletGroups
 * @returns {Promise<number>} Total count of relationships
 * 
 * @example
 * ```typescript
 * const count = await countSimletGroups();
 * ```
 */
export async function countSimletGroups(): Promise<number> {
  return await db.Tables.SimletGroups.count();
}

/**
 * Count groups assigned to a specific simlet.
 * 
 * @async
 * @function countSimletGroupsBySimlet
 * @param {number} simlet_id - The simlet's ID
 * @returns {Promise<number>} Count of groups assigned to the simlet
 * 
 * @example
 * ```typescript
 * const count = await countSimletGroupsBySimlet(123);
 * ```
 */
export async function countSimletGroupsBySimlet(simlet_id: number): Promise<number> {
  return await db.Tables.SimletGroups.count({ where: { simlet_id } });
}

/**
 * Count simlets assigned to a specific group.
 * 
 * @async
 * @function countSimletGroupsByGroup
 * @param {number} group_id - The group's ID
 * @returns {Promise<number>} Count of simlets assigned to the group
 * 
 * @example
 * ```typescript
 * const count = await countSimletGroupsByGroup(456);
 * ```
 */
export async function countSimletGroupsByGroup(group_id: number): Promise<number> {
  return await db.Tables.SimletGroups.count({ where: { group_id } });
}

/**
 * Check if a simlet-group relationship exists.
 * 
 * @async
 * @function simletGroupExists
 * @param {number} simlet_id - The simlet's ID
 * @param {number} group_id - The group's ID
 * @returns {Promise<boolean>} True if relationship exists, false otherwise
 * 
 * @example
 * ```typescript
 * const exists = await simletGroupExists(123, 456);
 * ```
 */
export async function simletGroupExists(simlet_id: number, group_id: number): Promise<boolean> {
  const count = await db.Tables.SimletGroups.count({ where: { simlet_id, group_id } });
  return count > 0;
}

/**
 * Remove all groups from a simlet.
 * 
 * @async
 * @function removeAllGroupsFromSimlet
 * @param {number} simlet_id - The simlet's ID
 * @returns {Promise<number>} Number of relationships removed
 * 
 * @example
 * ```typescript
 * const removed = await removeAllGroupsFromSimlet(123);
 * ```
 */
export async function removeAllGroupsFromSimlet(simlet_id: number): Promise<number> {
  return await db.Tables.SimletGroups.destroy({ where: { simlet_id } });
}

/**
 * Remove all simlets from a group.
 * 
 * @async
 * @function removeAllSimletsFromGroup
 * @param {number} group_id - The group's ID
 * @returns {Promise<number>} Number of relationships removed
 * 
 * @example
 * ```typescript
 * const removed = await removeAllSimletsFromGroup(456);
 * ```
 */
export async function removeAllSimletsFromGroup(group_id: number): Promise<number> {
  return await db.Tables.SimletGroups.destroy({ where: { group_id } });
}