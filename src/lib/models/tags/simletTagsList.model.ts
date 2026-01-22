/**
 * @fileoverview SimletTagsList model for SIMVA API.
 * Represents the master list of available tags for SIMLETs categorization.
 * 
 * @module models/tags/simletTagsList
 */

import { Sequelize, Model } from "sequelize";

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