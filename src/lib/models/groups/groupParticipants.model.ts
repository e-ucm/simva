/**
 * @fileoverview GroupParticipants model for SIMVA API.
 * Represents the many-to-many relationship between groups and participants.
 * 
 * @module models/groups/groupParticipants
 */

import { Sequelize, Model } from "sequelize";

/**
 * GroupParticipants model representing the junction table between groups and participants.
 * Manages the many-to-many relationship between groups and users.
 * 
 * @class GroupParticipants
 * @extends Model
 * 
 * @property {number} group_id - Foreign key to the group (composite primary key)
 * @property {number} participant_id - Foreign key to the participant/user (composite primary key)
 */
export class GroupParticipants extends Model {
  declare group_id: number;
  declare participant_id: number;
}

/**
 * Factory function to initialize the GroupParticipants model with Sequelize.
 * Creates the junction table for group-participant relationships.
 * 
 * @function GroupParticipantsFactory
 * @param {Sequelize} sequelize - The Sequelize instance
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {typeof GroupParticipants} The initialized GroupParticipants model
 * 
 * @example
 * ```typescript
 * const GroupParticipants = GroupParticipantsFactory(sequelize, DataTypes);
 * await GroupParticipants.create({
 *   group_id: 1,
 *   participant_id: 123
 * });
 * ```
 */
export function GroupParticipantsFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  GroupParticipants.init({
    group_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    participant_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
  },
  {
    sequelize,
    tableName: "ParticipantGroups_participants",
    timestamps: false,
    freezeTableName: true,
  });

  return GroupParticipants;
};
