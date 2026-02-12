/**
 * @fileoverview Manual Template Activity model definition.
 * Represents configuration for manual activities within activity templates.
 * 
 * Manual activities are instructor-defined learning tasks that can reference
 * external resources or web-based content for student interaction.
 * 
 * @module models/templates/manualTemplateActivity
 * @requires sequelize
 */

import { Sequelize, Model } from "sequelize";

/**
 * Manual Template Activity model class.
 * Extends Sequelize Model to represent manual activity template configurations.
 * 
 * @class ManualTemplateActivity
 * @extends Model
 * @property {number} activity_template_id - Primary key referencing ActivityTemplate
 * @property {"EXTERNAL" | "WEB"} ressource_type - Type of resource (external link or web content)
 * @property {string} ressource_url - URL or path to the resource
 */
export class ManualTemplateActivity extends Model {
  declare activity_template_id: number;
  declare ressource_type: "EXTERNAL" | "WEB";
  declare ressource_url: string;
}

/**
 * Factory function to initialize the ManualTemplateActivity model with Sequelize.
 * Defines the database schema and constraints for manual activity templates.
 * 
 * @function ManualTemplateActivityFactory
 * @param {Sequelize} sequelize - The Sequelize instance
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {typeof ManualTemplateActivity} The initialized ManualTemplateActivity model
 * 
 * @example
 * ```typescript
 * const ManualTemplateActivity = ManualTemplateActivityFactory(sequelize, DataTypes);
 * 
 * // Create a new manual template activity
 * const manualTemplate = await ManualTemplateActivity.create({
 *   activity_template_id: 123,
 *   ressource_type: "WEB",
 *   ressource_url: "https://example.com/activity"
 * });
 * ```
 */
export function ManualTemplateActivityFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  ManualTemplateActivity.init({
    activity_template_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    ressource_type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [["EXTERNAL", "WEB"]],
      },
    },
    ressource_url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: "ManualTemplateActivity",
    tableName: "Manual_Template_Activities",
    timestamps: false,
  });

  return ManualTemplateActivity;
}