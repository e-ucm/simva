/**
 * @fileoverview ActivityTemplateTagsList model for SIMVA API.
 * Represents the list of available tags for activity templates.
 * 
 * @module models/templates/activityTemplateTagsList
 */

import { Sequelize, Model } from "sequelize";

/**
 * ActivityTemplateTagsList model representing available tags for templates.
 * 
 * @class ActivityTemplateTagsList
 * @extends Model
 * 
 * @property {number} tag_id - Primary key identifier for the tag
 * @property {string} tag_name - Name of the tag
 * @property {string} tag_color - Color code for the tag display
 * @property {number} user_id - Foreign key to the user who created the tag
 * @property {boolean} public - Whether the tag is publicly visible
 * @property {Date} createdAt - Timestamp when the tag was created
 * @property {Date} updatedAt - Timestamp when the tag was last updated
 * @property {Date|null} deletedAt - Timestamp when the tag was soft-deleted
 */
export class ActivityTemplateTagsList extends Model {
  declare tag_id: number;
  declare tag_name: string;
  declare tag_color: string;
  declare user_id: number;
  declare public: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt: Date | null;
}

/**
 * Factory function to initialize the ActivityTemplateTagsList model with Sequelize.
 * 
 * @function ActivityTemplateTagsListFactory
 * @param {Sequelize} sequelize - The Sequelize instance
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {typeof ActivityTemplateTagsList} The initialized ActivityTemplateTagsList model
 */
export function ActivityTemplateTagsListFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  ActivityTemplateTagsList.init({
    tag_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
      unique: true,
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
    public: {
      type: DataTypes.BOOLEAN,
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
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: "ActivityTemplateTagsList",
    tableName: "Activities_template_tags_list",
    timestamps: true,
    paranoid: true,
    freezeTableName: true,
  });

  return ActivityTemplateTagsList;
}
