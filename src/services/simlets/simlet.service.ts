import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/errors/appErrors";
import { Op } from "sequelize";

/**
 * Service for Simlet entity operations.
 * Handles all CRUD operations and business logic for simlets (Simulation Learning Environment Templates).
 * 
 * @namespace SimletService
 */

/**
 * Retrieve all simlets from the database.
 * 
 * @async
 * @function getAllSimlets
 * @returns {Promise<InstanceType<typeof db.Tables.Simlets>[]>} Array of all simlets
 * 
 * @example
 * ```typescript
 * const simlets = await getAllSimlets();
 * ```
 */
export async function getAllSimlets(): Promise<InstanceType<typeof db.Tables.Simlets>[]> {
  return await db.Tables.Simlets.findAll({
    order: [['simlet_id', 'ASC']]
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
export async function getSimletsByCoordinator(simlet_coordinator_id: number): Promise<InstanceType<typeof db.Tables.Simlets>[]> {
  return await db.Tables.Simlets.findAll({
    where: { simlet_coordinator_id },
    order: [['name', 'ASC']]
  });
}

/**
 * Retrieve simlets by allocator ID.
 * 
 * @async
 * @function getSimletsByAllocator
 * @param {number} allocator_id - The allocator's ID
 * @returns {Promise<InstanceType<typeof db.Tables.Simlets>[]>} Array of simlets using the allocator
 * 
 * @example
 * ```typescript
 * const simlets = await getSimletsByAllocator(456);
 * ```
 */
export async function getSimletsByAllocator(allocator_id: number): Promise<InstanceType<typeof db.Tables.Simlets>[]> {
  return await db.Tables.Simlets.findAll({
    where: { allocator_id },
    order: [['name', 'ASC']]
  });
}

/**
 * Search simlets by name pattern.
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
 * Search simlets by description pattern.
 * 
 * @async
 * @function searchSimletsByDescription
 * @param {string} description - The description pattern to search for
 * @returns {Promise<InstanceType<typeof db.Tables.Simlets>[]>} Array of simlets matching the description pattern
 * 
 * @example
 * ```typescript
 * const simlets = await searchSimletsByDescription('learning');
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

/**
 * Create a new simlet.
 * 
 * @async
 * @function createSimlet
 * @param {Partial<InstanceType<typeof db.Tables.Simlets>>} simletData - The simlet data to create
 * @returns {Promise<InstanceType<typeof db.Tables.Simlets>>} The created simlet
 * 
 * @example
 * ```typescript
 * const newSimlet = await createSimlet({
 *   name: 'Mathematics Learning',
 *   description: 'Interactive math problems',
 *   simlet_coordinator_id: 123,
 *   allocator_id: 456
 * });
 * ```
 */
export async function createSimlet(simletData: Partial<InstanceType<typeof db.Tables.Simlets>>): Promise<InstanceType<typeof db.Tables.Simlets>> {
  return await db.Tables.Simlets.create(simletData);
}

/**
 * Update a simlet by ID.
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
 *   name: 'Updated Mathematics Learning',
 *   description: 'Enhanced interactive math problems'
 * });
 * ```
 */
export async function updateSimlet(simlet_id: number, updateData: Partial<InstanceType<typeof db.Tables.Simlets>>): Promise<InstanceType<typeof db.Tables.Simlets>> {
  const simlet = await getSimletById(simlet_id);
  
  await simlet.update(updateData);
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
 * @function getSimletCount
 * @returns {Promise<number>} Total count of simlets
 * 
 * @example
 * ```typescript
 * const count = await getSimletCount();
 * ```
 */
export async function getSimletCount(): Promise<number> {
  return await db.Tables.Simlets.count();
}

/**
 * Get simlets with pagination.
 * 
 * @async
 * @function getSimletsPaginated
 * @param {number} [limit=10] - Maximum number of simlets to return
 * @param {number} [offset=0] - Number of simlets to skip
 * @returns {Promise<{simlets: InstanceType<typeof db.Tables.Simlets>[], total: number}>} Paginated simlets with total count
 * 
 * @example
 * ```typescript
 * const result = await getSimletsPaginated(10, 0);
 * // Returns: { simlets: [...], total: 25 }
 * ```
 */
export async function getSimletsPaginated(limit: number = 10, offset: number = 0): Promise<{
  simlets: InstanceType<typeof db.Tables.Simlets>[];
  total: number;
}> {
  const { rows: simlets, count: total } = await db.Tables.Simlets.findAndCountAll({
    limit,
    offset,
    order: [['simlet_id', 'ASC']]
  });

  return { simlets, total };
}

/**
 * Search simlets with multiple criteria.
 * 
 * @async
 * @function searchSimlets
 * @param {Object} searchCriteria - Search criteria object
 * @param {string} [searchCriteria.name] - Name pattern to search for
 * @param {string} [searchCriteria.description] - Description pattern to search for
 * @param {number} [searchCriteria.coordinator_id] - Coordinator ID to filter by
 * @param {number} [searchCriteria.allocator_id] - Allocator ID to filter by
 * @param {number} [limit=10] - Maximum number of results
 * @param {number} [offset=0] - Number of results to skip
 * @returns {Promise<{simlets: InstanceType<typeof db.Tables.Simlets>[], total: number}>} Search results with total count
 * 
 * @example
 * ```typescript
 * const results = await searchSimlets({
 *   name: 'math',
 *   coordinator_id: 123
 * }, 5, 0);
 * ```
 */
export async function searchSimlets(
  searchCriteria: {
    name?: string;
    description?: string;
    coordinator_id?: number;
    allocator_id?: number;
  },
  limit: number = 10,
  offset: number = 0
): Promise<{
  simlets: InstanceType<typeof db.Tables.Simlets>[];
  total: number;
}> {
  const where: any = {};

  if (searchCriteria.name) {
    where.name = { [Op.like]: `%${searchCriteria.name}%` };
  }

  if (searchCriteria.description) {
    where.description = { [Op.like]: `%${searchCriteria.description}%` };
  }

  if (searchCriteria.coordinator_id) {
    where.simlet_coordinator_id = searchCriteria.coordinator_id;
  }

  if (searchCriteria.allocator_id) {
    where.allocator_id = searchCriteria.allocator_id;
  }

  const { rows: simlets, count: total } = await db.Tables.Simlets.findAndCountAll({
    where,
    limit,
    offset,
    order: [['name', 'ASC']]
  });

  return { simlets, total };
}

/**
 * Get simlets by MongoDB ID.
 * 
 * @async
 * @function getSimletByMongoId
 * @param {string} mongo_id - The MongoDB ID
 * @returns {Promise<InstanceType<typeof db.Tables.Simlets> | null>} The simlet or null if not found
 * 
 * @example
 * ```typescript
 * const simlet = await getSimletByMongoId('507f1f77bcf86cd799439011');
 * ```
 */
export async function getSimletByMongoId(mongo_id: string): Promise<InstanceType<typeof db.Tables.Simlets> | null> {
  return await db.Tables.Simlets.findOne({
    where: { mongo_id }
  });
}