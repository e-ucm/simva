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
 * @property {number} simlet_id - Foreign key to the parent simlet/study
 * @property {number} group_id - Primary key identifier for the group
 * @property {string} name - Display name of the group
 * @property {boolean} group_use_new_generation - Whether to use new generation features
 * @property {number|null} group_owner_id - Foreign key to the group owner (teacher/admin)
 * @property {Date} createdAt - Timestamp when the group was created
 * @property {Date} updatedAt - Timestamp when the group was last updated
 * @property {Date|null} deletedAt - Timestamp when the group was soft-deleted
 */
export class Group extends Model {
  declare simlet_id: number;
  declare group_id: number;
  declare mongo_id: string | null;
  declare group_name: string;
  declare group_use_new_generation: boolean;
  declare group_owner_id: number;
  declare group_sandbox: boolean;
  declare group_allocator_mongo_id: string | null;
  declare group_allocator_type: "default" | "group" | "random" | "session";
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt: Date | null;
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
 *   group_use_new_generation: true,
 *   group_owner_id: 1
 * });
 * ```
 */
export function GroupFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  Group.init({
    simlet_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    group_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
      unique: true,
    },
    mongo_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    group_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    group_use_new_generation: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    group_owner_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    group_sandbox: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    group_allocator_mongo_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    group_allocator_type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isIn: [["default", "group", "random", "session"]] },
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
    modelName: "Group",
    tableName: "ParticipantGroups",
    timestamps: true,
    paranoid: true,
  });

  return Group;
}
