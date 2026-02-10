/**
 * @fileoverview Simlet model for SIMVA API.
 * Represents a SIMLET (Simulation Learning Environment Template) - the main learning container.
 * 
 * @module models/simlets/simlet
 */
import { NotFoundError } from "@/lib/errors/appErrors";
import { Sequelize, Model, Op } from "sequelize";

/**
 * Simlet model representing a SIMLET in SIMVA.
 * SIMLETs are the top-level learning environments that contain sessions and activities.
 * 
 * @class Simlet
 * @extends Model
 * 
 * @property {number} simlet_id - Primary key identifier for the SIMLET
 * @property {string|null} mongo_id - Optional MongoDB identifier for external data storage
 * @property {string} name - Display name of the SIMLET
 * @property {Date} createdAt - Timestamp when the SIMLET was created
 * @property {Date} updatedAt - Timestamp when the SIMLET was last updated
 * @property {number|null} sandbox_session_id - Optional reference to sandbox session for testing
 * @property {string} description - Detailed description of the SIMLET
 * @property {string|null} objective - Learning objective of the SIMLET
 * @property {number} allocator_id - Foreign key to the allocator for user assignment
 * @property {number} simlet_coordinator_id - Foreign key to the coordinator (teacher) of this SIMLET
 */
export class Simlet extends Model {
  
  declare simlet_id: number;
  declare mongo_id: string | null;
  declare name: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare sandbox_session_id: number | null;
  declare description: string;
  declare objective: string | null;
  declare allocator_id: number;
  declare simlet_coordinator_id: number;

  /**
   * Retrieve all simlets from the database.
   * 
   * @async
   * @function getAllSimlets
   * @param {number} [limit] - Maximum number of simlets to return
   * @param {number} [offset] - Number of simlets to skip for pagination
   * @returns {Promise<Simlet[]>} Array of simlets
   * 
   * @example
   * ```typescript
   * const simlets = await getAllSimlets();
   * const paginatedSimlets = await getAllSimlets(10, 20);
   * ```
   */
  static async getAllSimlets(
    limit?: number,
    offset?: number
  ): Promise<Simlet[]> {
    return await Simlet.findAll({
      order: [['simlet_id', 'ASC']],
      limit,
      offset
    });
  }

  /**
   * Retrieve a simlet by its ID.
   * 
   * @async
   * @function getSimletById
   * @param {number} simlet_id - The simlet's ID
   * @returns {Promise<Simlet>} The simlet object
   * @throws {NotFoundError} If simlet with the specified ID doesn't exist
   * 
   * @example
   * ```typescript
   * const simlet = await getSimletById(123);
   * ```
   */

  static async getSimletById(simlet_id: number): Promise<Simlet> {
    const simlet = await Simlet.findByPk(simlet_id);
    
    if (!simlet) {
      throw new NotFoundError(`Simlet with ID ${simlet_id} not found`);
    }
    
    return simlet;
  }

  /**
   * Retrieve simlets by coordinator ID.
   * 
   * @async
   * @function getSimletsByCoordinator
   * @param {number} simlet_coordinator_id - The coordinator's user ID
   * @returns {Promise<Simlet[]>} Array of simlets coordinated by the user
   * 
   * @example
   * ```typescript
   * const simlets = await getSimletsByCoordinator(123);
   * ```
   */
  static async getSimletsByCoordinator(
    simlet_coordinator_id: number
  ): Promise<Simlet[]> {
    return await Simlet.findAll({
      where: { simlet_coordinator_id },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Search simlets by name.
   * 
   * @async
   * @function searchSimletsByName
   * @param {string} name - The name pattern to search for
   * @returns {Promise<Simlet[]>} Array of simlets matching the name pattern
   * 
   * @example
   * ```typescript
   * const simlets = await searchSimletsByName('math');
   * ```
   */
  static async searchSimletsByName(name: string): Promise<Simlet[]> {
    return await Simlet.findAll({
      where: {
        name: {
          [Op.like]: `%${name}%`
        }
      },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Retrieve simlets by allocator ID.
   * 
   * @async
   * @function getSimletsByAllocator
   * @param {number} allocator_id - The allocator's ID
   * @returns {Promise<Simlet[]>} Array of simlets with the specified allocator
   * 
   * @example
   * ```typescript
   * const simlets = await getSimletsByAllocator(456);
   * ```
   */
  static async getSimletsByAllocator(
    allocator_id: number
  ): Promise<Simlet[]> {
    return await Simlet.findAll({
      where: { allocator_id },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Get simlets created after a specific date.
   * 
   * @async
   * @function getSimletsCreatedAfter
   * @param {Date} date - The date to compare against
   * @returns {Promise<Simlet[]>} Array of simlets created after the date
   * 
   * @example
   * ```typescript
   * const recentSimlets = await getSimletsCreatedAfter(new Date('2023-01-01'));
   * ```
   */
  static async getSimletsCreatedAfter(date: Date): Promise<Simlet[]> {
    return await Simlet.findAll({
      where: {
        createdAt: {
          [Op.gt]: date
        }
      },
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Create a new simlet.
   * 
   * @async
   * @function createSimlet
   * @param {Partial<Simlet>} simletData - The simlet data for creation
   * @returns {Promise<Simlet>} The created simlet
   * 
   * @example
   * ```typescript
   * const newSimlet = await createSimlet({
   *   name: 'Mathematics Learning Environment',
   *   description: 'Interactive mathematics simulation',
   *   allocator_id: 1,
   *   simlet_coordinator_id: 123
   * });
   * ```
   */
  static async createSimlet(
    simletData: Partial<Simlet>
  ): Promise<Simlet> {
    return await Simlet.create(simletData);
  }

  /**
   * Update an existing simlet by ID.
   * 
   * @async
   * @function updateSimlet
   * @param {number} simlet_id - The simlet's ID
   * @param {Partial<Simlet>} updateData - The data to update
   * @returns {Promise<Simlet>} The updated simlet
   * @throws {NotFoundError} If simlet with the specified ID doesn't exist
   * 
   * @example
   * ```typescript
   * const updatedSimlet = await updateSimlet(123, {
   *   name: 'Updated Simlet Name',
   *   description: 'Updated description'
   * });
   * ```
   */
  static async updateSimlet(
    simlet_id: number,
    updateData: Partial<Simlet>
  ): Promise<Simlet> {
    const simlet = await this.getSimletById(simlet_id);
    
    await simlet.update(updateData);
    await simlet.reload();
    
    return simlet;
  }

  /**
   * Delete a simlet by ID.
   * 
   * @async
   * @function deleteSimlet
   * @param {number} simlet_id - The simlet's ID
   * @returns {Promise<void>}
   * @throws {NotFoundError} If simlet with the specified ID doesn't exist
   * 
   * @example
   * ```typescript
   * await deleteSimlet(123);
   * ```
   */
  static async deleteSimlet(simlet_id: number): Promise<void> {
    const simlet = await this.getSimletById(simlet_id);
    await simlet.destroy();
  }

  /**
   * Count total number of simlets.
   * 
   * @async
   * @function countSimlets
   * @returns {Promise<number>} Total count of simlets
   * 
   * @example
   * ```typescript
   * const count = await this.countSimlets();
   * ```
   */
  static async countSimlets(): Promise<number> {
    return await Simlet.count();
  }

  /**
   * Count simlets by coordinator.
   * 
   * @async
   * @function countSimletsByCoordinator
   * @param {number} simlet_coordinator_id - The coordinator's user ID
   * @returns {Promise<number>} Count of simlets coordinated by the user
   * 
   * @example
   * ```typescript
   * const count = await this.countSimletsByCoordinator(123);
   * ```
   */
  static async countSimletsByCoordinator(simlet_coordinator_id: number): Promise<number> {
    return await Simlet.count({ where: { simlet_coordinator_id } });
  }

  /**
   * Count simlets by allocator.
   * 
   * @async
   * @function countSimletsByAllocator
   * @param {number} allocator_id - The allocator's ID
   * @returns {Promise<number>} Count of simlets with the specified allocator
   * 
   * @example
   * ```typescript
   * const count = await this.countSimletsByAllocator(456);
   * ```
   */
  static async countSimletsByAllocator(allocator_id: number): Promise<number> {
    return await Simlet.count({ where: { allocator_id } });
  }

  /**
   * Check if a simlet exists by ID.
   * 
   * @async
   * @function simletExists
   * @param {number} simlet_id - The simlet's ID
   * @returns {Promise<boolean>} True if simlet exists, false otherwise
   * 
   * @example
   * ```typescript
   * const exists = await this.simletExists(123);
   * ```
   */
  static async simletExists(simlet_id: number): Promise<boolean> {
    const count = await Simlet.count({ where: { simlet_id } });
    return count > 0;
  }

  /**
   * Check if a simlet name is available (not taken).
   * 
   * @async
   * @function isSimletNameAvailable
   * @param {string} name - The simlet name to check
   * @returns {Promise<boolean>} True if name is available, false if taken
   * 
   * @example
   * ```typescript
   * const available = await this.isSimletNameAvailable('New Learning Environment');
   * ```
   */
  static async isSimletNameAvailable(name: string): Promise<boolean> {
    const count = await Simlet.count({ where: { name } });
    return count === 0;
  }

  /**
   * Get simlets with sandbox sessions.
   * 
   * @async
   * @function getSimletsWithSandbox
   * @returns {Promise<Simlet[]>} Array of simlets that have sandbox sessions
   * 
   * @example
   * ```typescript
   * const sandboxSimlets = await this.getSimletsWithSandbox();
   * ```
   */
  static async getSimletsWithSandbox(): Promise<Simlet[]> {
    return await Simlet.findAll({
      where: {
        sandbox_session_id: {
          [Op.not]: null
        }
      },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Get simlets with objectives defined.
   * 
   * @async
   * @function getSimletsWithObjectives
   * @returns {Promise<Simlet[]>} Array of simlets that have objectives defined
   * 
   * @example
   * ```typescript
   * const objectiveSimlets = await getSimletsWithObjectives();
   * ```
   */
  static async getSimletsWithObjectives(): Promise<Simlet[]> {
    return await Simlet.findAll({
      where: {
        objective: {
          [Op.not]: null
        }
      },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Search simlets by description.
   * 
   * @async
   * @function searchSimletsByDescription
   * @param {string} description - The description pattern to search for
   * @returns {Promise<Simlet[]>} Array of simlets matching the description pattern
   * 
   * @example
   * ```typescript
   * const simlets = await searchSimletsByDescription('interactive');
   * ```
   */
  static async searchSimletsByDescription(description: string): Promise<Simlet[]> {
    return await Simlet.findAll({
      where: {
        description: {
          [Op.like]: `%${description}%`
        }
      },
      order: [['name', 'ASC']]
    });
  }
}

/**
 * Factory function to initialize the Simlet model with Sequelize.
 * Defines the database schema and relationships for SIMLETs.
 * 
 * @function SimletFactory
 * @param {Sequelize} sequelize - The Sequelize instance
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {typeof Simlet} The initialized Simlet model
 * 
 * @example
 * ```typescript
 * const Simlet = SimletFactory(sequelize, DataTypes);
 * const simlet = await Simlet.create({
 *   name: 'Mathematics Simulation',
 *   description: 'Interactive math learning environment',
 *   allocator_id: 1,
 *   simlet_coordinator_id: 1
 * });
 * ```
 */
export function SimletFactory(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  Simlet.init({
    simlet_id: {
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
    sandbox_session_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    objective: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    allocator_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    simlet_coordinator_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: "Simlet",
    tableName: "SIMLETs",
    timestamps: true,
  });

  return Simlet;
}