/**
 * @fileoverview ActivityTemplate model for SIMVA API.
 * Represents reusable activity templates for creating standardized learning activities.
 * 
 * @module models/templates/activityTemplate
 */

import { Sequelize, Model, Op } from "sequelize";
import { NotFoundError } from "@/lib/errors/appErrors";

/**
 * ActivityTemplate model representing reusable activity templates in SIMVA.
 * Templates provide standardized configurations for creating learning activities.
 * 
 * @class ActivityTemplate
 * @extends Model
 * 
 * @property {number} activity_template_id - Primary key identifier for the template
 * @property {string} name - Display name of the activity template
 * @property {string} activity_type - Type of activity (default, manual, limesurvey, gameplay, lti_tool)
 * @property {string} description - Detailed description of the template
 * @property {boolean} public - Whether this template is publicly available
 * @property {Date} createdAt - Timestamp when the template was created
 * @property {Date} updatedAt - Timestamp when the template was last updated
 * @property {number} owner_id - Foreign key to the template owner (teacher/admin)
 */
export class ActivityTemplate extends Model {
  declare activity_template_id: number;
  declare name: string;
  declare activity_type: "default" | "manual" | "limesurvey" | "gameplay" | "lti_tool";
  declare description: string;
  declare public: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare owner_id: number;
}

/**
 * Factory function to initialize the ActivityTemplate model with Sequelize.
 * Defines the database schema and validation for activity templates.
 * 
 * @function ActivityTemplateFactory
 * @param {Sequelize} sequelize - The Sequelize instance
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {typeof ActivityTemplate} The initialized ActivityTemplate model
 * 
 * @example
 * ```typescript
 * const ActivityTemplate = ActivityTemplateFactory(sequelize, DataTypes);
 * const template = await ActivityTemplate.create({
 *   name: 'Quiz Template',
 *   activity_type: 'manual',
 *   description: 'Standard quiz format',
 *   public: true,
 *   owner_id: 1
 * });
 * ```
 */
export function ActivityTemplateFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  ActivityTemplate.init({
    activity_template_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    activity_type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [["default", "manual", "limesurvey", "gameplay", "lti_tool"]],
      },
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    public: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    owner_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: "ActivityTemplate",
    tableName: "Activities_template",
    timestamps: true,
  });

  return ActivityTemplate;
}