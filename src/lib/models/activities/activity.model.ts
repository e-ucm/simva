/**
 * @fileoverview Activity model for SIMVA API.
 * Represents learning activities within sessions that can be of various types.
 * 
 * @module models/activities/activity
 */

import { Sequelize, Model, Op } from "sequelize";
import { NotFoundError } from "@/lib/errors/appErrors";

/**
 * Activity model representing learning activities in SIMVA sessions.
 * Activities are the core learning components that users interact with.
 * 
 * @class Activity
 * @extends Model
 * 
 * @property {number} session_id - Foreign key to the session containing this activity
 * @property {number} activity_id - Primary key identifier for the activity
 * @property {string|null} mongo_id - Optional MongoDB identifier for external data storage
 * @property {string} name - Display name of the activity
 * @property {string} activity_type - Type of activity (default, manual, limesurvey, gameplay, lti_tool)
 * @property {string|null} activity_presignedUrl - Pre-signed URL for activity resources
 * @property {Date|null} activity_generated_at - Timestamp when the activity was generated
 * @property {number|null} activity_expire_on_seconds - Expiration time in seconds
 * @property {boolean} activity_trace_storage - Whether to store user interaction traces
 * @property {string} description - Detailed description of the activity
 * @property {boolean} activity_comply_with_GDPR - Whether the activity complies with GDPR requirements
 * @property {boolean} activity_can_be_restarted - Whether the activity can be restarted
 * @property {Date} createdAt - Timestamp when the activity was created
 * @property {Date} updatedAt - Timestamp when the activity was last updated
 */
export class Activity extends Model {
  declare session_id: number;
  declare activity_id: number;
  declare mongo_id: string | null;
  declare activity_order: number;
  declare activity_name: string;
  declare activity_type: "default" | "manual" | "limesurvey" | "gameplay" | "lti_tool";
  declare activity_presignedUrl: string | null;
  declare activity_presignedUrl_generated_at: Date | null;
  declare activity_presignedUrl_expire_at: Date | null;
  declare activity_trace_storage: boolean;
  declare activity_description: string;
  declare activity_comply_with_GDPR: boolean;
  declare activity_can_be_restarted: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
}

/**
 * Factory function to initialize the Activity model with Sequelize.
 * Defines the database schema, constraints, and relationships for activities.
 * 
 * @function ActivityFactory
 * @param {Sequelize} sequelize - The Sequelize instance
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {typeof Activity} The initialized Activity model
 * 
 * @example
 * ```typescript
 * const Activity = ActivityFactory(sequelize, DataTypes);
 * const activity = await Activity.create({
 *   session_id: 1,
 *   activity_name: 'Quiz 1',
 *   activity_type: 'manual',
 *   activity_description: 'Introduction quiz'
 * });
 * ```
 */
export function ActivityFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
    Activity.init({
      session_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      activity_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
        unique: true,
      },
      activity_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      activity_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      activity_type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { isIn: [["default", "manual", "limesurvey", "gameplay", "lti_tool"]] },
      },
      activity_presignedUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      activity_presignedUrl_generated_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      activity_presignedUrl_expire_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      activity_trace_storage: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      activity_description: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      activity_comply_with_GDPR: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      activity_can_be_restarted: {
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
    }, {
      sequelize,
      modelName: "Activity",
      tableName: "Activities",
      timestamps: true,
    });

  return Activity;
}