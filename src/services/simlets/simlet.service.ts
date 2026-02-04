/**
 * @fileoverview Service for Simlet entity operations.
 * Handles all CRUD operations and business logic for SIMVA simlets.
 * 
 * A Simlet (Simulation Learning Environment Template) is the top-level learning container
 * that contains sessions and activities for educational research studies.
 * 
 * @module services/simlets/simlet
 * @requires @/lib/db
 * @requires @/lib/errors/appErrors
 * @requires sequelize
 */

import { db } from "@/lib/db";
import { Op } from "sequelize";
import { NotFoundError } from "@/lib/errors/appErrors";

/**
 * Service for Simlet entity operations.
 * Handles all CRUD operations and business logic for simlets.
 * 
 * @namespace SimletService
 */

/**
 * Retrieve all simlets from the database.
 * 
 * @async
 * @function getAllSimlets
 * @param {number} [limit] - Maximum number of simlets to return
 * @param {number} [offset] - Number of simlets to skip for pagination
 * @returns {Promise<InstanceType<typeof db.Tables.Simlets>[]>} Array of simlets
 * 
 * @example
 * ```typescript
 * const simlets = await getAllSimlets();
 * const paginatedSimlets = await getAllSimlets(10, 20);
 * ```
 */
export async function getAllSimlets(
  limit?: number,
  offset?: number
): Promise<InstanceType<typeof db.Tables.Simlets>[]> {
  return await db.Tables.Simlets.findAll({
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
 * @returns {Promise<InstanceType<typeof db.Tables.Simlets>>} The simlet object
 * @throws {NotFoundError} If simlet with the specified ID doesn't exist
 * 
 * @example
 * ```typescript
 * const simlet = await getSimletById(123);
 * ```
 */
export async function getSimletById(simlet_id: number): Promise<InstanceType<typeof db.Tables.Simlets>> {
  const simlet = await db.Tables.Simlets.findByPk(simlet_id);
  
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
 * @returns {Promise<InstanceType<typeof db.Tables.Simlets>[]>} Array of simlets coordinated by the user
 * 
 * @example
 * ```typescript
 * const simlets = await getSimletsByCoordinator(123);
 * ```
 */
export async function getSimletsByCoordinator(
  simlet_coordinator_id: number
): Promise<InstanceType<typeof db.Tables.Simlets>[]> {
  return await db.Tables.Simlets.findAll({
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
 * @returns {Promise<InstanceType<typeof db.Tables.Simlets>[]>} Array of simlets matching the name pattern
 * 
 * @example
 * ```typescript
 * const simlets = await searchSimletsByName('math');
 * ```
 */
export async function searchSimletsByName(name: string): Promise<InstanceType<typeof db.Tables.Simlets>[]> {
  return await db.Tables.Simlets.findAll({
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
 * @returns {Promise<InstanceType<typeof db.Tables.Simlets>[]>} Array of simlets with the specified allocator
 * 
 * @example
 * ```typescript
 * const simlets = await getSimletsByAllocator(456);
 * ```
 */
export async function getSimletsByAllocator(
  allocator_id: number
): Promise<InstanceType<typeof db.Tables.Simlets>[]> {
  return await db.Tables.Simlets.findAll({
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
 * @returns {Promise<InstanceType<typeof db.Tables.Simlets>[]>} Array of simlets created after the date
 * 
 * @example
 * ```typescript
 * const recentSimlets = await getSimletsCreatedAfter(new Date('2023-01-01'));
 * ```
 */
export async function getSimletsCreatedAfter(date: Date): Promise<InstanceType<typeof db.Tables.Simlets>[]> {
  return await db.Tables.Simlets.findAll({
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
 * @param {Partial<InstanceType<typeof db.Tables.Simlets>>} simletData - The simlet data for creation
 * @returns {Promise<InstanceType<typeof db.Tables.Simlets>>} The created simlet
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
export async function createSimlet(
  simletData: Partial<InstanceType<typeof db.Tables.Simlets>>
): Promise<InstanceType<typeof db.Tables.Simlets>> {
  return await db.Tables.Simlets.create(simletData);
}

/**
 * Update an existing simlet by ID.
 * 
 * @async
 * @function updateSimlet
 * @param {number} simlet_id - The simlet's ID
 * @param {Partial<InstanceType<typeof db.Tables.Simlets>>} updateData - The data to update
 * @returns {Promise<InstanceType<typeof db.Tables.Simlets>>} The updated simlet
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
export async function updateSimlet(
  simlet_id: number,
  updateData: Partial<InstanceType<typeof db.Tables.Simlets>>
): Promise<InstanceType<typeof db.Tables.Simlets>> {
  const simlet = await getSimletById(simlet_id);
  
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
export async function deleteSimlet(simlet_id: number): Promise<void> {
  const simlet = await getSimletById(simlet_id);
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
 * const count = await countSimlets();
 * ```
 */
export async function countSimlets(): Promise<number> {
  return await db.Tables.Simlets.count();
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
 * const count = await countSimletsByCoordinator(123);
 * ```
 */
export async function countSimletsByCoordinator(simlet_coordinator_id: number): Promise<number> {
  return await db.Tables.Simlets.count({ where: { simlet_coordinator_id } });
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
 * const count = await countSimletsByAllocator(456);
 * ```
 */
export async function countSimletsByAllocator(allocator_id: number): Promise<number> {
  return await db.Tables.Simlets.count({ where: { allocator_id } });
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
 * const exists = await simletExists(123);
 * ```
 */
export async function simletExists(simlet_id: number): Promise<boolean> {
  const count = await db.Tables.Simlets.count({ where: { simlet_id } });
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
 * const available = await isSimletNameAvailable('New Learning Environment');
 * ```
 */
export async function isSimletNameAvailable(name: string): Promise<boolean> {
  const count = await db.Tables.Simlets.count({ where: { name } });
  return count === 0;
}

/**
 * Get simlets with sandbox sessions.
 * 
 * @async
 * @function getSimletsWithSandbox
 * @returns {Promise<InstanceType<typeof db.Tables.Simlets>[]>} Array of simlets that have sandbox sessions
 * 
 * @example
 * ```typescript
 * const sandboxSimlets = await getSimletsWithSandbox();
 * ```
 */
export async function getSimletsWithSandbox(): Promise<InstanceType<typeof db.Tables.Simlets>[]> {
  return await db.Tables.Simlets.findAll({
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
 * @returns {Promise<InstanceType<typeof db.Tables.Simlets>[]>} Array of simlets that have objectives defined
 * 
 * @example
 * ```typescript
 * const objectiveSimlets = await getSimletsWithObjectives();
 * ```
 */
export async function getSimletsWithObjectives(): Promise<InstanceType<typeof db.Tables.Simlets>[]> {
  return await db.Tables.Simlets.findAll({
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
 * @returns {Promise<InstanceType<typeof db.Tables.Simlets>[]>} Array of simlets matching the description pattern
 * 
 * @example
 * ```typescript
 * const simlets = await searchSimletsByDescription('interactive');
 * ```
 */
export async function searchSimletsByDescription(description: string): Promise<InstanceType<typeof db.Tables.Simlets>[]> {
  return await db.Tables.Simlets.findAll({
    where: {
      description: {
        [Op.like]: `%${description}%`
      }
    },
    order: [['name', 'ASC']]
  });
}