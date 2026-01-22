/**
 * @fileoverview SessionTagsList model for SIMVA API.
 * Represents predefined tags for categorizing and organizing learning sessions.
 * 
 * @module models/tags/sessionTagsList
 */

import { Sequelize, Model } from "sequelize";

/**
 * SessionTagsList model representing predefined session tags.
 * Provides controlled vocabulary for session categorization and filtering.
 * 
 * @class SessionTagsList
 * @extends Model
 * 
 * @property {number} session_tag_id - Primary key identifier for the session tag
 * @property {string} session_tag_name - Display name of the session tag
 */
export class SessionTagsList extends Model {
  declare session_tag_id: number;
  declare session_tag_name: string;
}

/**
 * Factory function to initialize the SessionTagsList model with Sequelize.
 * Creates the session tags lookup table for session categorization.
 * 
 * @function SessionTagsListFactory
 * @param {Sequelize} sequelize - The Sequelize instance
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {typeof SessionTagsList} The initialized SessionTagsList model
 * 
 * @example
 * ```typescript
 * const SessionTagsList = SessionTagsListFactory(sequelize, DataTypes);
 * await SessionTagsList.create({
 *   session_tag_name: 'collaborative-learning'
 * });
 * ```
 */

export function SessionTagsListFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  SessionTagsList.init({
    session_tag_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    session_tag_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: "SessionTagsList",
    tableName: "Sessions_tags_list",
    timestamps: false,
  });

  return SessionTagsList;
}