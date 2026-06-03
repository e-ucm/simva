/**
 * @fileoverview Allocator model for SIMVA API.
 * Represents allocation strategies for distributing users to experimental conditions.
 * 
 * @module models/allocators/allocator
 */

import { Sequelize, Model, Op } from "sequelize";
import { NotFoundError } from "@/lib/errors/appErrors";

/**
 * Allocator model representing user allocation strategies in SIMVA.
 * Allocators determine how users are distributed across experimental conditions or groups.
 * 
 * @class Allocator
 * @extends Model
 * 
 * @property {number} allocator_id - Primary key identifier for the allocator
 * @property {string|null} mongo_id - Optional MongoDB identifier for external data storage
 * @property {string} allocator_type - Type of allocation strategy (default, group, random)
 * @property {Date} createdAt - Timestamp when the allocator was created
 * @property {Date} updatedAt - Timestamp when the allocator was last updated
 */
export class Allocator extends Model {
  declare allocator_id: number;
  declare allocator_type: "default" | "group" | "random";
  declare createdAt: Date;
  declare updatedAt: Date;
}

/**
 * Factory function to initialize the Allocator model with Sequelize.
 * Defines the database schema and validation for allocation strategies.
 * 
 * @function AllocatorFactory
 * @param {Sequelize} sequelize - The Sequelize instance
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {typeof Allocator} The initialized Allocator model
 * 
 * @example
 * ```typescript
 * const Allocator = AllocatorFactory(sequelize, DataTypes);
 * const allocator = await Allocator.create({
 *   allocator_type: 'random'
 * });
 * ```
 */
export function AllocatorFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  Allocator.init({
    allocator_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
      unique: true,
    },
    allocator_type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isIn: [["default", "group", "random"]] },
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
    modelName: "Allocator",
    tableName: "Allocators",
    timestamps: true,
  });
  return Allocator;
}