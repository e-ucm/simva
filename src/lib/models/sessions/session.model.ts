/**
 * @fileoverview Session model for SIMVA API.
 * Represents a learning session within a SIMLET with specific timing and supervision.
 * 
 * @module models/sessions/session
 */

import { Sequelize, Model } from "sequelize";

/**
 * Session model representing a learning session in SIMVA.
 * Sessions are containers for activities with specific time bounds and supervision.
 * 
 * @class Session
 * @extends Model
 * 
 * @property {number} simlet_id - Foreign key to the parent SIMLET
 * @property {number} session_id - Primary key identifier for the session
 * @property {string|null} mongo_id - Optional MongoDB identifier for external data storage
 * @property {string} name - Display name of the session
 * @property {string} description - Detailed description of the session
 * @property {Date} createdAt - Timestamp when the session was created
 * @property {Date} updatedAt - Timestamp when the session was last updated
 * @property {string|null} experimental_method - Research methodology for the session
 * @property {boolean|null} active - Whether the session is currently active
 * @property {Date|null} session_start_date - When the session should start
 * @property {Date|null} session_end_date - When the session should end
 * @property {number} session_supervisor_id - Foreign key to the session supervisor (teacher)
 */
export class Session extends Model {
  declare simlet_id: number;
  declare session_id: number;
  declare mongo_id: string | null;
  declare name: string;
  declare description: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare experimental_method: string | null;
  declare active: boolean | null;
  declare session_start_date: Date | null;
  declare session_end_date: Date | null;
  declare session_supervisor_id: number;
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
 *   name: 'Week 1 Activities',
 *   description: 'Introduction to concepts',
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
    description: {
      type: DataTypes.STRING,
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
    experimental_method: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    session_start_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    session_end_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    session_supervisor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: "Session",
    tableName: "Sessions",
    timestamps: true,
  });

  return Session;
}