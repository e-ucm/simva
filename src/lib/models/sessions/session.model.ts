/**
 * @fileoverview Session model for SIMVA API.
 * Represents a learning session within a SIMLET with specific timing and supervision.
 * 
 * @module models/sessions/session
 */

import { Sequelize, Model, Op } from "sequelize";
import { NotFoundError } from "@/lib/errors/appErrors";

/**
 * Session model representing a learning session in SIMVA.
 * Sessions are containers for activities with specific time bounds and supervision.
 * 
 * @class Session
 * @extends Model
 * 
 * @property {number} simlet_id - Foreign key to the parent SIMLET
 * @property {number} session_id - Primary key identifier for the session
 * @property {string} session_name - Display name of the session
 * @property {string} session_description - Detailed description of the session
 * @property {Date} createdAt - Timestamp when the session was created
 * @property {Date} updatedAt - Timestamp when the session was last updated
 * @property {Date|null} deletedAt - Timestamp when the session was soft-deleted
 * @property {string|null} session_experimental_method - Research methodology for the session
 * @property {boolean|null} session_active - Whether the session is currently active
 * @property {Date|null} session_start_date - When the session should start
 * @property {Date|null} session_end_date - When the session should end
 * @property {number} session_supervisor_id - Foreign key to the session supervisor (teacher)
 */
export class Session extends Model {
  declare simlet_id: number;
  declare session_id: number;
  declare session_order: number;
  declare session_name: string;
  declare session_description: string;
  declare session_status: "active" | "inactive" | "terminated";
  declare session_can_be_manually_activated: boolean;
  declare session_coordinator_id: number;
  declare session_sandbox_user_id: number | null;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt: Date | null;
}

/**
 * Factory function to initialize the Session model with Sequelize.
 * Defines the database schema and relationships for sessions.
 * 
 * @function SessionFactory
 * @param {Sequelize} sequelize - The Sequelize instance
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {typeof Session} The initialized Session model
 * 
 * @example
 * ```typescript
 * const Session = SessionFactory(sequelize, DataTypes);
 * const session = await Session.create({
 *   simlet_id: 1,
 *   session_name: 'Week 1 Activities',
 *   session_description: 'Introduction to concepts',
 *   session_supervisor_id: 1
 * });
 * ```
 */
export function SessionFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  Session.init({
    simlet_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    session_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
      unique: true,
    },
    session_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    session_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    session_description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    session_status: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isIn: [["active", "inactive", "terminated"]] },
    },
    session_can_be_manually_activated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    session_coordinator_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    session_sandbox_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    modelName: "Session",
    tableName: "Sessions",
    timestamps: true,
    paranoid: true,
  });

  return Session;
}