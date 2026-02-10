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
  declare mongo_id: string | null;
  declare allocator_type: "default" | "group" | "random";
  declare createdAt: Date;
  declare updatedAt: Date;

  /**
   * Retrieve all allocators from the database.
   * 
   * @async
   * @function getAllAllocators
   * @param {number} [limit] - Maximum number of allocators to return
   * @param {number} [offset] - Number of allocators to skip for pagination
   * @returns {Promise<Allocator[]>} Array of allocators
   * 
   * @example
   * ```typescript
   * const allocators = await Allocator.getAllAllocators();
   * const paginatedAllocators = await Allocator.getAllAllocators(10, 20);
   * ```
   */
  static async getAllAllocators(
    limit?: number,
    offset?: number
  ): Promise<Allocator[]> {
    return await Allocator.findAll({
      order: [['allocator_id', 'ASC']],
      limit,
      offset
    });
  }

  /**
   * Retrieve an allocator by its ID.
   * 
   * @async
   * @function getAllocatorById
   * @param {number} allocator_id - The allocator's ID
   * @returns {Promise<Allocator>} The allocator object
   * @throws {NotFoundError} If allocator with the specified ID doesn't exist
   * 
   * @example
   * ```typescript
   * const allocator = await Allocator.getAllocatorById(123);
   * ```
   */
  static async getAllocatorById(allocator_id: number): Promise<Allocator> {
    const allocator = await Allocator.findByPk(allocator_id);
    
    if (!allocator) {
      throw new NotFoundError(`Allocator with ID ${allocator_id} not found`);
    }
    
    return allocator;
  }

  /**
   * Retrieve allocators by type.
   * 
   * @async
   * @function getAllocatorsByType
   * @param {string} allocator_type - The allocator type
   * @returns {Promise<Allocator[]>} Array of allocators of the specified type
   * 
   * @example
   * ```typescript
   * const randomAllocators = await Allocator.getAllocatorsByType('random');
   * ```
   */
  static async getAllocatorsByType(allocator_type: string): Promise<Allocator[]> {
    return await Allocator.findAll({
      where: { allocator_type },
      order: [['allocator_id', 'ASC']]
    });
  }

  /**
   * Retrieve allocators by mongo_id.
   * 
   * @async
   * @function getAllocatorsByMongoId
   * @param {string} mongo_id - The mongo ID to search for
   * @returns {Promise<Allocator[]>} Array of allocators with the specified mongo_id
   * 
   * @example
   * ```typescript
   * const allocators = await Allocator.getAllocatorsByMongoId('mongo_123');
   * ```
   */
  static async getAllocatorsByMongoId(mongo_id: string): Promise<Allocator[]> {
    return await Allocator.findAll({
      where: { mongo_id },
      order: [['allocator_id', 'ASC']]
    });
  }

  /**
   * Get allocators created after a specific date.
   * 
   * @async
   * @function getAllocatorsCreatedAfter
   * @param {Date} date - The date to compare against
   * @returns {Promise<Allocator[]>} Array of allocators created after the date
   * 
   * @example
   * ```typescript
   * const recentAllocators = await Allocator.getAllocatorsCreatedAfter(new Date('2023-01-01'));
   * ```
   */
  static async getAllocatorsCreatedAfter(date: Date): Promise<Allocator[]> {
    return await Allocator.findAll({
      where: {
        createdAt: {
          [Op.gt]: date
        }
      },
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Create a new allocator.
   * 
   * @async
   * @function createAllocator
   * @param {Partial<Allocator>} allocatorData - The allocator data for creation
   * @returns {Promise<Allocator>} The created allocator
   * 
   * @example
   * ```typescript
   * const newAllocator = await Allocator.createAllocator({
   *   allocator_type: 'random',
   *   mongo_id: 'external_123'
   * });
   * ```
   */
  static async createAllocator(allocatorData: Partial<Allocator>): Promise<Allocator> {
    return await Allocator.create(allocatorData);
  }

  /**
   * Update an existing allocator by ID.
   * 
   * @async
   * @function updateAllocator
   * @param {number} allocator_id - The allocator's ID
   * @param {Partial<Allocator>} updateData - The data to update
   * @returns {Promise<Allocator>} The updated allocator
   * @throws {NotFoundError} If allocator with the specified ID doesn't exist
   * 
   * @example
   * ```typescript
   * const updatedAllocator = await Allocator.updateAllocator(123, {
   *   allocator_type: 'group',
   *   mongo_id: 'updated_id_456'
   * });
   * ```
   */
  static async updateAllocator(
    allocator_id: number,
    updateData: Partial<Allocator>
  ): Promise<Allocator> {
    const allocator = await this.getAllocatorById(allocator_id);
    
    await allocator.update(updateData);
    await allocator.reload();
    
    return allocator;
  }

  /**
   * Delete an allocator by ID.
   * 
   * @async
   * @function deleteAllocator
   * @param {number} allocator_id - The allocator's ID
   * @returns {Promise<void>}
   * @throws {NotFoundError} If allocator with the specified ID doesn't exist
   * 
   * @example
   * ```typescript
   * await Allocator.deleteAllocator(123);
   * ```
   */
  static async deleteAllocator(allocator_id: number): Promise<void> {
    const allocator = await this.getAllocatorById(allocator_id);
    await allocator.destroy();
  }

  /**
   * Count total number of allocators.
   * 
   * @async
   * @function countAllocators
   * @returns {Promise<number>} Total count of allocators
   * 
   * @example
   * ```typescript
   * const count = await Allocator.countAllocators();
   * ```
   */
  static async countAllocators(): Promise<number> {
    return await Allocator.count();
  }

  /**
   * Count allocators by type.
   * 
   * @async
   * @function countAllocatorsByType
   * @param {string} allocator_type - The allocator type
   * @returns {Promise<number>} Count of allocators of the specified type
   * 
   * @example
   * ```typescript
   * const randomCount = await Allocator.countAllocatorsByType('random');
   * ```
   */
  static async countAllocatorsByType(allocator_type: string): Promise<number> {
    return await Allocator.count({ where: { allocator_type } });
  }

  /**
   * Check if an allocator exists by ID.
   * 
   * @async
   * @function allocatorExists
   * @param {number} allocator_id - The allocator's ID
   * @returns {Promise<boolean>} True if allocator exists, false otherwise
   * 
   * @example
   * ```typescript
   * const exists = await Allocator.allocatorExists(123);
   * ```
   */
  static async allocatorExists(allocator_id: number): Promise<boolean> {
    const count = await Allocator.count({ where: { allocator_id } });
    return count > 0;
  }

  /**
   * Get distinct allocator types.
   * 
   * @async
   * @function getDistinctAllocatorTypes
   * @returns {Promise<string[]>} Array of distinct allocator types
   * 
   * @example
   * ```typescript
   * const types = await Allocator.getDistinctAllocatorTypes();
   * ```
   */
  static async getDistinctAllocatorTypes(): Promise<string[]> {
    const results = await Allocator.findAll({
      attributes: ['allocator_type'],
      group: ['allocator_type']
    });
    return results.map(a => a.allocator_type);
  }
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
 *   allocator_type: 'random',
 *   mongo_id: 'external_id_123'
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
      autoIncrement: true,
    },
    mongo_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    allocator_type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [["default", "group", "random"]],
      },
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