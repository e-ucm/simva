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
 * @property {number} tag_id - Primary key identifier for the session tag
 * @property {string} tag_name - Display name of the session tag
 * @property {string} tag_color - Color code for visual distinction of the session tag
 */
export class SessionTagsElement extends Model {
  declare tag_id: number;
  declare tag_name: string;
  declare tag_color: string;
  declare user_id: number;
  declare createdAt: Date;
  declare updatedAt: Date;
}

/**
 * Factory function to initialize the SessionTagsList model with Sequelize.
 * Creates the session tags lookup table for session categorization.
 * 
 * @function SessionTagsElementFactory
 * @param {Sequelize} sequelize - The Sequelize instance
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {typeof SessionTagsElement} The initialized SessionTagsElement model
 * 
 * @example
 * ```typescript
 * const SessionTagsElement = SessionTagsElementFactory(sequelize, DataTypes);
 * await SessionTagsElement.create({
 *   tag_name: 'collaborative-learning',
 *   tag_color: '#FF5733'
 * });
 * ```
 */

export function SessionTagsElementFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  SessionTagsElement.init({
    tag_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tag_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tag_color: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    sequelize,
    modelName: "SessionTagsList",
    tableName: "Sessions_tags_list",
    timestamps: true,
  });

  return SessionTagsElement;
}