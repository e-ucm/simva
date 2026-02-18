/**
 * @fileoverview Group model for SIMVA API.
 * Represents participant groups for organizing users in learning activities.
 * 
 * @module models/groups/group
 */

import { Sequelize, Model, Op } from "sequelize";
import { NotFoundError } from "@/lib/errors/appErrors";

/**
 * Group model representing participant groups in SIMVA.
 * Groups organize users for collaborative learning activities and experiments.
 * 
 * @class Group
 * @extends Model
 * 
 * @property {number} group_id - Primary key identifier for the group
 * @property {string} name - Display name of the group
 * @property {boolean} use_new_generation - Whether to use new generation features
 * @property {number|null} group_owner_id - Foreign key to the group owner (teacher/admin)
 * @property {Date} createdAt - Timestamp when the group was created
 * @property {Date} updatedAt - Timestamp when the group was last updated
 */
export class Group extends Model {
  declare group_id: number;
  declare group_name: string;
  declare use_new_generation: boolean;
  declare group_owner_id: number | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

/**
 * Factory function to initialize the Group model with Sequelize.
 * Defines the database schema and relationships for participant groups.
 * 
 * @function GroupFactory
 * @param {Sequelize} sequelize - The Sequelize instance
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {typeof Group} The initialized Group model
 * 
 * @example
 * ```typescript
 * const Group = GroupFactory(sequelize, DataTypes);
 * const group = await Group.create({
 *   name: 'Study Group A',
 *   use_new_generation: true,
 *   group_owner_id: 1
 * });
 * ```
 */
export function GroupFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  Group.init({
    group_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    group_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    use_new_generation: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    group_owner_id: {
      type: DataTypes.INTEGER,
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
    tableName: "ParticipantGroups",
    timestamps: true,
    freezeTableName: true,
  });

  return Group;
};
