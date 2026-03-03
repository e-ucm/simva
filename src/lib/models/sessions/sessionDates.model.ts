/**
 * @fileoverview SessionDates model for SIMVA API.
 * Represents session date boundaries for scheduling learning sessions.
 * 
 * @module models/sessions/sessionDates
 */

import { Sequelize, Model } from "sequelize";

/**
 * SessionDates model representing date boundaries for sessions in SIMVA.
 * Stores the start and end dates for a session's active period.
 * 
 * @class SessionDates
 * @extends Model
 * 
 * @property {number} session_id - Primary key and foreign key to the session
 * @property {Date|null} session_start_date - When the session should start
 * @property {Date|null} session_end_date - When the session should end
 * @property {Date} createdAt - Timestamp when the record was created
 * @property {Date} updatedAt - Timestamp when the record was last updated
 */
export class SessionDates extends Model {
  declare session_id: number;
  declare session_start_date: Date | null;
  declare session_end_date: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

/**
 * Factory function to initialize the SessionDates model with Sequelize.
 * Defines the database schema for session date boundaries.
 * 
 * @function SessionDatesFactory
 * @param {Sequelize} sequelize - The Sequelize instance
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {typeof SessionDates} The initialized SessionDates model
 * 
 * @example
 * ```typescript
 * const SessionDates = SessionDatesFactory(sequelize, DataTypes);
 * await SessionDates.create({
 *   session_id: 1,
 *   session_start_date: new Date('2026-01-01'),
 *   session_end_date: new Date('2026-03-31')
 * });
 * ```
 */
export function SessionDatesFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  SessionDates.init({
    session_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    session_start_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    session_end_date: {
      type: DataTypes.DATE,
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
  }, {
    sequelize,
    modelName: "SessionDates",
    tableName: "Sessions_dates",
    timestamps: true,
    freezeTableName: true,
  });

  return SessionDates;
}
