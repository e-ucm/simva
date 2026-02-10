/**
 * @fileoverview SimletTagsList model for SIMVA API.
 * Represents the master list of available tags for SIMLETs categorization.
 * 
 * @module models/tags/simletTagsList
 */

import { Sequelize, Model, Op } from "sequelize";
import { NotFoundError } from "@/lib/errors/appErrors";

/**
 * SimletTagsList model representing available tags for SIMLET categorization.
 * Provides a controlled vocabulary for tagging and organizing SIMLETs.
 * 
 * @class SimletTagsList
 * @extends Model
 * 
 * @property {number} simlet_tag_id - Primary key identifier for the tag
 * @property {string} simlet_tag_name - Display name of the tag
 */
export class SimletTagsList extends Model {
  declare simlet_tag_id: number;
  declare simlet_tag_name: string;

  /**
   * Retrieve all simlet tags from the database.
   * 
   * @async
   * @function getAllSimletTags
   * @param {number} [limit] - Maximum number of tags to return
   * @param {number} [offset] - Number of tags to skip for pagination
   * @returns {Promise<SimletTagsList[]>} Array of simlet tags
   * 
   * @example
   * ```typescript
   * const tags = await SimletTagsList.getAllSimletTags();
   * const paginatedTags = await SimletTagsList.getAllSimletTags(10, 20);
   * ```
   */
  static async getAllSimletTags(
    limit?: number,
    offset?: number
  ): Promise<SimletTagsList[]> {
    return await SimletTagsList.findAll({
      order: [['simlet_tag_name', 'ASC']],
      limit,
      offset
    });
  }

  /**
   * Retrieve a simlet tag by its ID.
   * 
   * @async
   * @function getSimletTagById
   * @param {number} simlet_tag_id - The tag's ID
   * @returns {Promise<SimletTagsList>} The tag object
   * @throws {NotFoundError} If tag with the specified ID doesn't exist
   * 
   * @example
   * ```typescript
   * const tag = await SimletTagsList.getSimletTagById(123);
   * ```
   */
  static async getSimletTagById(simlet_tag_id: number): Promise<SimletTagsList> {
    const tag = await SimletTagsList.findByPk(simlet_tag_id);
    
    if (!tag) {
      throw new NotFoundError(`Simlet tag with ID ${simlet_tag_id} not found`);
    }
    
    return tag;
  }

  /**
   * Retrieve a simlet tag by its name.
   * 
   * @async
   * @function getSimletTagByName
   * @param {string} simlet_tag_name - The tag's name
   * @returns {Promise<SimletTagsList | null>} The tag object or null if not found
   * 
   * @example
   * ```typescript
   * const tag = await SimletTagsList.getSimletTagByName('Mathematics');
   * ```
   */
  static async getSimletTagByName(simlet_tag_name: string): Promise<SimletTagsList | null> {
    return await SimletTagsList.findOne({
      where: { simlet_tag_name }
    });
  }

  /**
   * Search simlet tags by name pattern.
   * 
   * @async
   * @function searchSimletTagsByName
   * @param {string} name - The name pattern to search for
   * @returns {Promise<SimletTagsList[]>} Array of tags matching the name pattern
   * 
   * @example
   * ```typescript
   * const tags = await SimletTagsList.searchSimletTagsByName('math');
   * ```
   */
  static async searchSimletTagsByName(name: string): Promise<SimletTagsList[]> {
    return await SimletTagsList.findAll({
      where: {
        simlet_tag_name: {
          [Op.like]: `%${name}%`
        }
      },
      order: [['simlet_tag_name', 'ASC']]
    });
  }

  /**
   * Create a new simlet tag.
   * 
   * @async
   * @function createSimletTag
   * @param {Partial<SimletTagsList>} tagData - The tag data for creation
   * @returns {Promise<SimletTagsList>} The created tag
   * 
   * @example
   * ```typescript
   * const newTag = await SimletTagsList.createSimletTag({
   *   simlet_tag_name: 'Mathematics'
   * });
   * ```
   */
  static async createSimletTag(tagData: Partial<SimletTagsList>): Promise<SimletTagsList> {
    return await SimletTagsList.create(tagData);
  }

  /**
   * Update an existing simlet tag by ID.
   * 
   * @async
   * @function updateSimletTag
   * @param {number} simlet_tag_id - The tag's ID
   * @param {Partial<SimletTagsList>} updateData - The data to update
   * @returns {Promise<SimletTagsList>} The updated tag
   * @throws {NotFoundError} If tag with the specified ID doesn't exist
   * 
   * @example
   * ```typescript
   * const updatedTag = await SimletTagsList.updateSimletTag(123, {
   *   simlet_tag_name: 'Updated Mathematics'
   * });
   * ```
   */
  static async updateSimletTag(
    simlet_tag_id: number,
    updateData: Partial<SimletTagsList>
  ): Promise<SimletTagsList> {
    const tag = await this.getSimletTagById(simlet_tag_id);
    
    await tag.update(updateData);
    await tag.reload();
    
    return tag;
  }

  /**
   * Delete a simlet tag by ID.
   * 
   * @async
   * @function deleteSimletTag
   * @param {number} simlet_tag_id - The tag's ID
   * @returns {Promise<void>}
   * @throws {NotFoundError} If tag with the specified ID doesn't exist
   * 
   * @example
   * ```typescript
   * await SimletTagsList.deleteSimletTag(123);
   * ```
   */
  static async deleteSimletTag(simlet_tag_id: number): Promise<void> {
    const tag = await this.getSimletTagById(simlet_tag_id);
    await tag.destroy();
  }

  /**
   * Count total number of simlet tags.
   * 
   * @async
   * @function countSimletTags
   * @returns {Promise<number>} Total count of tags
   * 
   * @example
   * ```typescript
   * const count = await SimletTagsList.countSimletTags();
   * ```
   */
  static async countSimletTags(): Promise<number> {
    return await SimletTagsList.count();
  }

  /**
   * Check if a simlet tag exists by ID.
   * 
   * @async
   * @function simletTagExists
   * @param {number} simlet_tag_id - The tag's ID
   * @returns {Promise<boolean>} True if tag exists, false otherwise
   * 
   * @example
   * ```typescript
   * const exists = await SimletTagsList.simletTagExists(123);
   * ```
   */
  static async simletTagExists(simlet_tag_id: number): Promise<boolean> {
    const count = await SimletTagsList.count({ where: { simlet_tag_id } });
    return count > 0;
  }

  /**
   * Check if a simlet tag exists by name.
   * 
   * @async
   * @function simletTagExistsByName
   * @param {string} simlet_tag_name - The tag's name
   * @returns {Promise<boolean>} True if tag exists, false otherwise
   * 
   * @example
   * ```typescript
   * const exists = await SimletTagsList.simletTagExistsByName('Mathematics');
   * ```
   */
  static async simletTagExistsByName(simlet_tag_name: string): Promise<boolean> {
    const count = await SimletTagsList.count({ where: { simlet_tag_name } });
    return count > 0;
  }
}

/**
 * Factory function to initialize the SimletTagsList model with Sequelize.
 * Creates the master tag list for SIMLET categorization.
 * 
 * @function SimletTagsListFactory
 * @param {Sequelize} sequelize - The Sequelize instance
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {typeof SimletTagsList} The initialized SimletTagsList model
 * 
 * @example
 * ```typescript
 * const SimletTagsList = SimletTagsListFactory(sequelize, DataTypes);
 * const tag = await SimletTagsList.create({
 *   simlet_tag_name: 'Mathematics'
 * });
 * ```
 */
export function SimletTagsListFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  SimletTagsList.init({
    simlet_tag_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    simlet_tag_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: "SimletTagsList",
    tableName: "SIMLETs_tags_list",
    timestamps: false,
  });

  return SimletTagsList;
}