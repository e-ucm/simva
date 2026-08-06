/**
 * @fileoverview Experimental Participants model definition.
 * Represents allocation assignments mapping participants to specific sessions.
 * 
 * This model tracks the assignment of participants to experimental conditions
 * and sessions within research studies, enabling precise control over study design.
 * 
 * @module models/allocators/experimentalParticipants
 * @requires sequelize
 */

import { Sequelize, Model } from "sequelize";

/**
 * Experimental Participants model class.
 * Extends Sequelize Model to represent participant assignments to sessions.
 * 
 * @class ExperimentalParticipants
 * @extends Model
 * @property {number} simlet_id - Primary key: ID of the study (simlet)
 * @property {number} group_id - Primary key: ID of the participant's group
 * @property {number} participant_id - Primary key: ID of the participant
 * @property {number} session_id - The assigned session for this participant
 */
export class ExperimentalParticipants extends Model {
  declare simlet_id: number;
  declare group_id: number;
  declare participant_id: number;
  declare session_id: number;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt: Date | null;
}

/**
 * Factory function to initialize the ExperimentalParticipants model with Sequelize.
 * Defines the database schema for participant session assignments.
 * 
 * @function ExperimentalParticipantsFactory
 * @param {Sequelize} sequelize - The Sequelize instance
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {typeof ExperimentalParticipants} The initialized ExperimentalParticipants model
 * 
 * @example
 * ```typescript
 * const ExperimentalParticipants = ExperimentalParticipantsFactory(sequelize, DataTypes);
 * 
 * // Assign a participant to a session
 * const assignment = await ExperimentalParticipants.create({
 *   simlet_id: 1,
 *   group_id: 10,
 *   participant_id: 123,
 *   session_id: 456
 * });
 * ```
 */
export function ExperimentalParticipantsFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  ExperimentalParticipants.init({
    simlet_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    group_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    participant_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    session_id: {
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
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: "ExperimentalParticipants",
    tableName: "Experimental_Participants",
    timestamps: true,
    paranoid: true,
  });

  return ExperimentalParticipants;
}