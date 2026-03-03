/**
 * @fileoverview ActivityTemplateTags model for SIMVA API.
 * Represents the junction table between activity templates and tags.
 * 
 * @module models/templates/activityTemplateTags
 */

import { Sequelize, Model } from "sequelize";

/**
 * ActivityTemplateTags model representing the many-to-many relationship between templates and tags.
 * 
 * @class ActivityTemplateTags
 * @extends Model
 * 
 * @property {number} activity_template_id - Foreign key to the activity template
 * @property {number} tag_id - Foreign key to the tag
 * @property {Date} createdAt - Timestamp when the record was created
 * @property {Date} updatedAt - Timestamp when the record was last updated
 */
export class ActivityTemplateTags extends Model {
  declare activity_template_id: number;
  declare tag_id: number;
  declare createdAt: Date;
  declare updatedAt: Date;
}

/**
 * Factory function to initialize the ActivityTemplateTags model with Sequelize.
 * 
 * @function ActivityTemplateTagsFactory
 * @param {Sequelize} sequelize - The Sequelize instance
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {typeof ActivityTemplateTags} The initialized ActivityTemplateTags model
 */
export function ActivityTemplateTagsFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  ActivityTemplateTags.init({
    activity_template_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    tag_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
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
    modelName: "ActivityTemplateTags",
    tableName: "Activities_template_tags",
    timestamps: true,
    freezeTableName: true,
  });

  return ActivityTemplateTags;
}
