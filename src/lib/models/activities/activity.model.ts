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
 * @property {string|null} presignedUrl - Pre-signed URL for activity resources
 * @property {Date|null} generated_at - Timestamp when the activity was generated
 * @property {number|null} expire_on_seconds - Expiration time in seconds
 * @property {boolean} trace_storage - Whether to store user interaction traces
 * @property {string} description - Detailed description of the activity
 * @property {Date} createdAt - Timestamp when the activity was created
 * @property {Date} updatedAt - Timestamp when the activity was last updated
 */
export class Activity extends Model {
  declare session_id: number;
  declare activity_id: number;
  declare mongo_id: string | null;
  declare name: string;
  declare activity_type: "default" | "manual" | "limesurvey" | "gameplay" | "lti_tool";
  declare presignedUrl: string | null;
  declare generated_at: Date | null;
  declare expire_on_seconds: number | null;
  declare trace_storage: boolean;
  declare description: string;
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
 *   name: 'Quiz 1',
 *   activity_type: 'manual',
 *   description: 'Introduction quiz'
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
      autoIncrement: true,
    },
    mongo_id: {
      type: DataTypes.STRING,
      allowNull: true,
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
    presignedUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    generated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expire_on_seconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    trace_storage: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt:{
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt:{
      type: DataTypes.DATE,
      allowNull: false,
    }
  },
  {
    sequelize,
    tableName: "Activities",
    timestamps: true,
    freezeTableName: true,
  });

  return Activity;
};