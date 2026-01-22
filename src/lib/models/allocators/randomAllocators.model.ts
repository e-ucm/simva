/**
 * @fileoverview RandomAllocators model for SIMVA API.
 * Represents random allocation strategies for distributing participants across sessions.
 * 
 * @module models/allocators/randomAllocators
 */

import { Sequelize, Model } from "sequelize";

/**
 * RandomAllocators model representing random allocation configurations.
 * Manages percentage-based random distribution of participants to sessions.
 * 
 * @class RandomAllocators
 * @extends Model
 * 
 * @property {number} allocator_id - Foreign key to the allocator (composite primary key)
 * @property {number} session_id - Foreign key to the session (composite primary key)
 * @property {number} percentage - Allocation percentage for this session (0-100)
 */
export class RandomAllocators extends Model {
  declare allocator_id: number;
  declare session_id: number;
  declare percentage: number;
}

/**
 * Factory function to initialize the RandomAllocators model with Sequelize.
 * Creates the configuration table for random allocation strategies.
 * 
 * @function RandomAllocatorsFactory
 * @param {Sequelize} sequelize - The Sequelize instance
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {typeof RandomAllocators} The initialized RandomAllocators model
 * 
 * @example
 * ```typescript
 * const RandomAllocators = RandomAllocatorsFactory(sequelize, DataTypes);
 * await RandomAllocators.create({
 *   allocator_id: 1,
 *   session_id: 2,
 *   percentage: 50.0
 * });
 * ```
 */

export function RandomAllocatorsFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  RandomAllocators.init({
    allocator_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    session_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    percentage: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: "RandomAllocators",
    tableName: "Random_Allocators",
    timestamps: false,
  });

  return RandomAllocators;
}