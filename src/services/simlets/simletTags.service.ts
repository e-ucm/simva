/**
 * @fileoverview Service for SimletTags entity operations.
 * Handles all CRUD operations and business logic for simlet-tag relationships.
 * 
 * SimletTags represents the many-to-many relationship between simlets and tags,
 * allowing categorization and labeling of learning environments.
 * 
 * @module services/simlets/simletTags
 * @requires @/lib/db
 * @requires @/lib/errors/appErrors
 */

import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/errors/appErrors";

/**
 * Service for SimletTags entity operations.
 * Handles all CRUD operations and business logic for simlet-tag relationships.
 * 
 * @namespace SimletTagsService
 */

/**
 * Retrieve all tags assigned to a specific simlet.
 * 
 * @async
 * @function getSimletTags
 * @param {number} simlet_id - The simlet's ID
 * @returns {Promise<InstanceType<typeof db.Tables.SimletTags>[]>} Array of tags assigned to the simlet
 * 
 * @example
 * ```typescript
 * const tags = await getSimletTags(123);
 * ```
 */
export async function getSimletTags(simlet_id: number): Promise<InstanceType<typeof db.Tables.SimletTags>[]> {
  return await db.Tables.SimletTags.findAll({
    where: { simlet_id },
    order: [['tag_id', 'ASC']]
  });
}

/**
 * Retrieve all simlets assigned to a specific tag.
 * 
 * @async
 * @function getTagSimlets
 * @param {number} tag_id - The tag's ID
 * @returns {Promise<InstanceType<typeof db.Tables.SimletTags>[]>} Array of simlets assigned to the tag
 * 
 * @example
 * ```typescript
 * const simlets = await getTagSimlets(456);
 * ```
 */
export async function getTagSimlets(tag_id: number): Promise<InstanceType<typeof db.Tables.SimletTags>[]> {
  return await db.Tables.SimletTags.findAll({
    where: { tag_id },
    order: [['simlet_id', 'ASC']]
  });
}

/**
 * Retrieve all simlet-tag relationships.
 * 
 * @async
 * @function getAllSimletTags
 * @param {number} [limit] - Maximum number of relationships to return
 * @param {number} [offset] - Number of relationships to skip for pagination
 * @returns {Promise<InstanceType<typeof db.Tables.SimletTags>[]>} Array of all simlet-tag relationships
 * 
 * @example
 * ```typescript
 * const relationships = await getAllSimletTags();
 * const paginated = await getAllSimletTags(10, 20);
 * ```
 */
export async function getAllSimletTags(
  limit?: number,
  offset?: number
): Promise<InstanceType<typeof db.Tables.SimletTags>[]> {
  return await db.Tables.SimletTags.findAll({
    order: [['simlet_id', 'ASC'], ['tag_id', 'ASC']],
    limit,
    offset
  });
}

/**
 * Get a specific simlet-tag relationship by composite key.
 * 
 * @async
 * @function getSimletTagById
 * @param {number} simlet_id - The simlet's ID
 * @param {number} tag_id - The tag's ID
 * @returns {Promise<InstanceType<typeof db.Tables.SimletTags>>} The simlet-tag relationship
 * @throws {NotFoundError} If the relationship doesn't exist
 * 
 * @example
 * ```typescript
 * const relationship = await getSimletTagById(123, 456);
 * ```
 */
export async function getSimletTagById(
  simlet_id: number,
  tag_id: number
): Promise<InstanceType<typeof db.Tables.SimletTags>> {
  const relationship = await db.Tables.SimletTags.findOne({
    where: { simlet_id, tag_id }
  });
  
  if (!relationship) {
    throw new NotFoundError(`SimletTag relationship with simlet_id ${simlet_id} and tag_id ${tag_id} not found`);
  }
  
  return relationship;
}

/**
 * Create a new simlet-tag relationship.
 * 
 * @async
 * @function createSimletTag
 * @param {Partial<InstanceType<typeof db.Tables.SimletTags>>} relationshipData - The relationship data for creation
 * @returns {Promise<InstanceType<typeof db.Tables.SimletTags>>} The created simlet-tag relationship
 * 
 * @example
 * ```typescript
 * const relationship = await createSimletTag({
 *   simlet_id: 123,
 *   tag_id: 456
 * });
 * ```
 */
export async function createSimletTag(
  relationshipData: Partial<InstanceType<typeof db.Tables.SimletTags>>
): Promise<InstanceType<typeof db.Tables.SimletTags>> {
  return await db.Tables.SimletTags.create(relationshipData);
}

/**
 * Delete a simlet-tag relationship by composite key.
 * 
 * @async
 * @function deleteSimletTag
 * @param {number} simlet_id - The simlet's ID
 * @param {number} tag_id - The tag's ID
 * @returns {Promise<void>}
 * @throws {NotFoundError} If the relationship doesn't exist
 * 
 * @example
 * ```typescript
 * await deleteSimletTag(123, 456);
 * ```
 */
export async function deleteSimletTag(simlet_id: number, tag_id: number): Promise<void> {
  const relationship = await getSimletTagById(simlet_id, tag_id);
  await relationship.destroy();
}

/**
 * Count total number of simlet-tag relationships.
 * 
 * @async
 * @function countSimletTags
 * @returns {Promise<number>} Total count of relationships
 * 
 * @example
 * ```typescript
 * const count = await countSimletTags();
 * ```
 */
export async function countSimletTags(): Promise<number> {
  return await db.Tables.SimletTags.count();
}

/**
 * Count tags assigned to a specific simlet.
 * 
 * @async
 * @function countSimletTagsBySimlet
 * @param {number} simlet_id - The simlet's ID
 * @returns {Promise<number>} Count of tags assigned to the simlet
 * 
 * @example
 * ```typescript
 * const count = await countSimletTagsBySimlet(123);
 * ```
 */
export async function countSimletTagsBySimlet(simlet_id: number): Promise<number> {
  return await db.Tables.SimletTags.count({ where: { simlet_id } });
}

/**
 * Count simlets assigned to a specific tag.
 * 
 * @async
 * @function countSimletTagsByTag
 * @param {number} tag_id - The tag's ID
 * @returns {Promise<number>} Count of simlets assigned to the tag
 * 
 * @example
 * ```typescript
 * const count = await countSimletTagsByTag(456);
 * ```
 */
export async function countSimletTagsByTag(tag_id: number): Promise<number> {
  return await db.Tables.SimletTags.count({ where: { tag_id } });
}

/**
 * Check if a simlet-tag relationship exists.
 * 
 * @async
 * @function simletTagExists
 * @param {number} simlet_id - The simlet's ID
 * @param {number} tag_id - The tag's ID
 * @returns {Promise<boolean>} True if relationship exists, false otherwise
 * 
 * @example
 * ```typescript
 * const exists = await simletTagExists(123, 456);
 * ```
 */
export async function simletTagExists(simlet_id: number, tag_id: number): Promise<boolean> {
  const count = await db.Tables.SimletTags.count({ where: { simlet_id, tag_id } });
  return count > 0;
}

/**
 * Remove all tags from a simlet.
 * 
 * @async
 * @function removeAllTagsFromSimlet
 * @param {number} simlet_id - The simlet's ID
 * @returns {Promise<number>} Number of relationships removed
 * 
 * @example
 * ```typescript
 * const removed = await removeAllTagsFromSimlet(123);
 * ```
 */
export async function removeAllTagsFromSimlet(simlet_id: number): Promise<number> {
  return await db.Tables.SimletTags.destroy({ where: { simlet_id } });
}

/**
 * Remove all simlets from a tag.
 * 
 * @async
 * @function removeAllSimletsFromTag
 * @param {number} tag_id - The tag's ID
 * @returns {Promise<number>} Number of relationships removed
 * 
 * @example
 * ```typescript
 * const removed = await removeAllSimletsFromTag(456);
 * ```
 */
export async function removeAllSimletsFromTag(tag_id: number): Promise<number> {
  return await db.Tables.SimletTags.destroy({ where: { tag_id } });
}

/**
 * Add multiple tags to a simlet.
 * 
 * @async
 * @function addTagsToSimlet
 * @param {number} simlet_id - The simlet's ID
 * @param {number[]} tag_ids - Array of tag IDs to add
 * @returns {Promise<InstanceType<typeof db.Tables.SimletTags>[]>} Array of created relationships
 * 
 * @example
 * ```typescript
 * const relationships = await addTagsToSimlet(123, [456, 789, 101]);
 * ```
 */
export async function addTagsToSimlet(
  simlet_id: number,
  tag_ids: number[]
): Promise<InstanceType<typeof db.Tables.SimletTags>[]> {
  const relationshipsData = tag_ids.map(tag_id => ({
    simlet_id,
    tag_id
  }));
  
  return await db.Tables.SimletTags.bulkCreate(relationshipsData);
}

/**
 * Add multiple simlets to a tag.
 * 
 * @async
 * @function addSimletsToTag
 * @param {number} tag_id - The tag's ID
 * @param {number[]} simlet_ids - Array of simlet IDs to add
 * @returns {Promise<InstanceType<typeof db.Tables.SimletTags>[]>} Array of created relationships
 * 
 * @example
 * ```typescript
 * const relationships = await addSimletsToTag(456, [123, 789, 101]);
 * ```
 */
export async function addSimletsToTag(
  tag_id: number,
  simlet_ids: number[]
): Promise<InstanceType<typeof db.Tables.SimletTags>[]> {
  const relationshipsData = simlet_ids.map(simlet_id => ({
    simlet_id,
    tag_id
  }));
  
  return await db.Tables.SimletTags.bulkCreate(relationshipsData);
}

/**
 * Replace all tags for a simlet.
 * 
 * @async
 * @function replaceSimletTags
 * @param {number} simlet_id - The simlet's ID
 * @param {number[]} tag_ids - Array of tag IDs to set (replaces existing tags)
 * @returns {Promise<InstanceType<typeof db.Tables.SimletTags>[]>} Array of created relationships
 * 
 * @example
 * ```typescript
 * const newTags = await replaceSimletTags(123, [456, 789]);
 * ```
 */
export async function replaceSimletTags(
  simlet_id: number,
  tag_ids: number[]
): Promise<InstanceType<typeof db.Tables.SimletTags>[]> {
  // Remove existing tags
  await removeAllTagsFromSimlet(simlet_id);
  
  // Add new tags
  return await addTagsToSimlet(simlet_id, tag_ids);
}