/**
 * @fileoverview Service for SimletTagsList entity operations.
 * Handles all CRUD operations and business logic for the master list of simlet tags.
 * 
 * SimletTagsList represents the controlled vocabulary of available tags
 * that can be used to categorize and organize simlets in the SIMVA system.
 * 
 * @module services/simlets/simletTagsList
 * @requires @/lib/db
 * @requires @/lib/errors/appErrors
 * @requires sequelize
 */

import { db } from "@/lib/db";
import { Op } from "sequelize";
import { NotFoundError } from "@/lib/errors/appErrors";

/**
 * Service for SimletTagsList entity operations.
 * Handles all CRUD operations and business logic for simlet tags list.
 * 
 * @namespace SimletTagsListService
 */

/**
 * Retrieve all simlet tags from the master list.
 * 
 * @async
 * @function getAllSimletTagsList
 * @param {number} [limit] - Maximum number of tags to return
 * @param {number} [offset] - Number of tags to skip for pagination
 * @returns {Promise<InstanceType<typeof db.Tables.SimletTagsList>[]>} Array of simlet tags
 * 
 * @example
 * ```typescript
 * const tags = await getAllSimletTagsList();
 * const paginatedTags = await getAllSimletTagsList(10, 20);
 * ```
 */
export async function getAllSimletTagsList(
  limit?: number,
  offset?: number
): Promise<InstanceType<typeof db.Tables.SimletTagsList>[]> {
  return await db.Tables.SimletTagsList.findAll({
    order: [['simlet_tag_name', 'ASC']],
    limit,
    offset
  });
}

/**
 * Retrieve a simlet tag by its ID.
 * 
 * @async
 * @function getSimletTagsListById
 * @param {number} simlet_tag_id - The tag's ID
 * @returns {Promise<InstanceType<typeof db.Tables.SimletTagsList>>} The simlet tag object
 * @throws {NotFoundError} If tag with the specified ID doesn't exist
 * 
 * @example
 * ```typescript
 * const tag = await getSimletTagsListById(123);
 * ```
 */
export async function getSimletTagsListById(simlet_tag_id: number): Promise<InstanceType<typeof db.Tables.SimletTagsList>> {
  const tag = await db.Tables.SimletTagsList.findByPk(simlet_tag_id);
  
  if (!tag) {
    throw new NotFoundError(`SimletTagsList with ID ${simlet_tag_id} not found`);
  }
  
  return tag;
}

/**
 * Retrieve a simlet tag by its name.
 * 
 * @async
 * @function getSimletTagsListByName
 * @param {string} simlet_tag_name - The tag's name
 * @returns {Promise<InstanceType<typeof db.Tables.SimletTagsList>>} The simlet tag object
 * @throws {NotFoundError} If tag with the specified name doesn't exist
 * 
 * @example
 * ```typescript
 * const tag = await getSimletTagsListByName('Mathematics');
 * ```
 */
export async function getSimletTagsListByName(simlet_tag_name: string): Promise<InstanceType<typeof db.Tables.SimletTagsList>> {
  const tag = await db.Tables.SimletTagsList.findOne({
    where: { simlet_tag_name }
  });
  
  if (!tag) {
    throw new NotFoundError(`SimletTagsList with name '${simlet_tag_name}' not found`);
  }
  
  return tag;
}

/**
 * Search simlet tags by name pattern.
 * 
 * @async
 * @function searchSimletTagsListByName
 * @param {string} namePattern - The name pattern to search for
 * @returns {Promise<InstanceType<typeof db.Tables.SimletTagsList>[]>} Array of tags matching the name pattern
 * 
 * @example
 * ```typescript
 * const tags = await searchSimletTagsListByName('math');
 * ```
 */
export async function searchSimletTagsListByName(namePattern: string): Promise<InstanceType<typeof db.Tables.SimletTagsList>[]> {
  return await db.Tables.SimletTagsList.findAll({
    where: {
      simlet_tag_name: {
        [Op.like]: `%${namePattern}%`
      }
    },
    order: [['simlet_tag_name', 'ASC']]
  });
}

/**
 * Get simlet tags starting with a specific prefix.
 * 
 * @async
 * @function getSimletTagsListByPrefix
 * @param {string} prefix - The prefix to search for
 * @returns {Promise<InstanceType<typeof db.Tables.SimletTagsList>[]>} Array of tags starting with the prefix
 * 
 * @example
 * ```typescript
 * const tags = await getSimletTagsListByPrefix('Sci');
 * ```
 */
export async function getSimletTagsListByPrefix(prefix: string): Promise<InstanceType<typeof db.Tables.SimletTagsList>[]> {
  return await db.Tables.SimletTagsList.findAll({
    where: {
      simlet_tag_name: {
        [Op.like]: `${prefix}%`
      }
    },
    order: [['simlet_tag_name', 'ASC']]
  });
}

/**
 * Create a new simlet tag.
 * 
 * @async
 * @function createSimletTagsList
 * @param {Partial<InstanceType<typeof db.Tables.SimletTagsList>>} tagData - The tag data for creation
 * @returns {Promise<InstanceType<typeof db.Tables.SimletTagsList>>} The created simlet tag
 * 
 * @example
 * ```typescript
 * const tag = await createSimletTagsList({
 *   simlet_tag_name: 'Physics'
 * });
 * ```
 */
export async function createSimletTagsList(
  tagData: Partial<InstanceType<typeof db.Tables.SimletTagsList>>
): Promise<InstanceType<typeof db.Tables.SimletTagsList>> {
  return await db.Tables.SimletTagsList.create(tagData);
}

/**
 * Update an existing simlet tag by ID.
 * 
 * @async
 * @function updateSimletTagsList
 * @param {number} simlet_tag_id - The tag's ID
 * @param {Partial<InstanceType<typeof db.Tables.SimletTagsList>>} updateData - The data to update
 * @returns {Promise<InstanceType<typeof db.Tables.SimletTagsList>>} The updated simlet tag
 * @throws {NotFoundError} If tag with the specified ID doesn't exist
 * 
 * @example
 * ```typescript
 * const updatedTag = await updateSimletTagsList(123, {
 *   simlet_tag_name: 'Advanced Mathematics'
 * });
 * ```
 */
export async function updateSimletTagsList(
  simlet_tag_id: number,
  updateData: Partial<InstanceType<typeof db.Tables.SimletTagsList>>
): Promise<InstanceType<typeof db.Tables.SimletTagsList>> {
  const tag = await getSimletTagsListById(simlet_tag_id);
  
  await tag.update(updateData);
  await tag.reload();
  
  return tag;
}

/**
 * Delete a simlet tag by ID.
 * 
 * @async
 * @function deleteSimletTagsList
 * @param {number} simlet_tag_id - The tag's ID
 * @returns {Promise<void>}
 * @throws {NotFoundError} If tag with the specified ID doesn't exist
 * 
 * @example
 * ```typescript
 * await deleteSimletTagsList(123);
 * ```
 */
export async function deleteSimletTagsList(simlet_tag_id: number): Promise<void> {
  const tag = await getSimletTagsListById(simlet_tag_id);
  await tag.destroy();
}

/**
 * Count total number of simlet tags.
 * 
 * @async
 * @function countSimletTagsList
 * @returns {Promise<number>} Total count of tags
 * 
 * @example
 * ```typescript
 * const count = await countSimletTagsList();
 * ```
 */
export async function countSimletTagsList(): Promise<number> {
  return await db.Tables.SimletTagsList.count();
}

/**
 * Check if a simlet tag exists by ID.
 * 
 * @async
 * @function simletTagsListExists
 * @param {number} simlet_tag_id - The tag's ID
 * @returns {Promise<boolean>} True if tag exists, false otherwise
 * 
 * @example
 * ```typescript
 * const exists = await simletTagsListExists(123);
 * ```
 */
export async function simletTagsListExists(simlet_tag_id: number): Promise<boolean> {
  const count = await db.Tables.SimletTagsList.count({ where: { simlet_tag_id } });
  return count > 0;
}

/**
 * Check if a simlet tag name is available (not taken).
 * 
 * @async
 * @function isSimletTagNameAvailable
 * @param {string} simlet_tag_name - The tag name to check
 * @returns {Promise<boolean>} True if name is available, false if taken
 * 
 * @example
 * ```typescript
 * const available = await isSimletTagNameAvailable('Chemistry');
 * ```
 */
export async function isSimletTagNameAvailable(simlet_tag_name: string): Promise<boolean> {
  const count = await db.Tables.SimletTagsList.count({ where: { simlet_tag_name } });
  return count === 0;
}

/**
 * Get all distinct tag names (useful for autocomplete).
 * 
 * @async
 * @function getDistinctSimletTagNames
 * @returns {Promise<string[]>} Array of distinct tag names
 * 
 * @example
 * ```typescript
 * const tagNames = await getDistinctSimletTagNames();
 * ```
 */
export async function getDistinctSimletTagNames(): Promise<string[]> {
  const records = await db.Tables.SimletTagsList.findAll({
    attributes: ['simlet_tag_name'],
    order: [['simlet_tag_name', 'ASC']]
  });
  
  return records.map(record => record.simlet_tag_name);
}

/**
 * Create multiple simlet tags in bulk.
 * 
 * @async
 * @function createBulkSimletTagsList
 * @param {string[]} tagNames - Array of tag names to create
 * @returns {Promise<InstanceType<typeof db.Tables.SimletTagsList>[]>} Array of created tags
 * 
 * @example
 * ```typescript
 * const tags = await createBulkSimletTagsList(['Physics', 'Chemistry', 'Biology']);
 * ```
 */
export async function createBulkSimletTagsList(tagNames: string[]): Promise<InstanceType<typeof db.Tables.SimletTagsList>[]> {
  const tagData = tagNames.map(name => ({
    simlet_tag_name: name
  }));
  
  return await db.Tables.SimletTagsList.bulkCreate(tagData);
}

/**
 * Find or create a simlet tag by name.
 * 
 * @async
 * @function findOrCreateSimletTagsList
 * @param {string} simlet_tag_name - The tag name to find or create
 * @returns {Promise<[InstanceType<typeof db.Tables.SimletTagsList>, boolean]>} Tuple of [tag, wasCreated]
 * 
 * @example
 * ```typescript
 * const [tag, created] = await findOrCreateSimletTagsList('Mathematics');
 * if (created) {
 *   console.log('New tag was created');
 * }
 * ```
 */
export async function findOrCreateSimletTagsList(
  simlet_tag_name: string
): Promise<[InstanceType<typeof db.Tables.SimletTagsList>, boolean]> {
  return await db.Tables.SimletTagsList.findOrCreate({
    where: { simlet_tag_name },
    defaults: { simlet_tag_name }
  });
}

/**
 * Get tags sorted by usage frequency (requires joining with SimletTags).
 * 
 * @async
 * @function getSimletTagsListByPopularity
 * @param {number} [limit] - Maximum number of tags to return
 * @returns {Promise<InstanceType<typeof db.Tables.SimletTagsList>[]>} Array of tags sorted by popularity
 * 
 * @example
 * ```typescript
 * const popularTags = await getSimletTagsListByPopularity(10);
 * ```
 */
export async function getSimletTagsListByPopularity(
  limit?: number
): Promise<InstanceType<typeof db.Tables.SimletTagsList>[]> {
  return await db.Tables.SimletTagsList.findAll({
    attributes: [
      'simlet_tag_id',
      'simlet_tag_name',
      [db.sequelize.fn('COUNT', db.sequelize.col('SimletTags.tag_id')), 'usage_count']
    ],
    include: [{
      model: db.Tables.SimletTags,
      attributes: [],
      required: false
    }],
    group: ['SimletTagsList.simlet_tag_id', 'SimletTagsList.simlet_tag_name'],
    order: [[db.sequelize.fn('COUNT', db.sequelize.col('SimletTags.tag_id')), 'DESC']],
    limit
  });
}