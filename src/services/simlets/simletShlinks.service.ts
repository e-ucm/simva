/**
 * @fileoverview Service for SimletShlinks entity operations.
 * Handles all CRUD operations and business logic for simlet short links.
 * 
 * SimletShlinks represents the URL shortening system for simlets,
 * allowing easy access to learning environments through short URLs.
 * 
 * @module services/simlets/simletShlinks
 * @requires @/lib/db
 * @requires @/lib/errors/appErrors
 * @requires sequelize
 */

import { db } from "@/lib/db";
import { Op } from "sequelize";
import { NotFoundError } from "@/lib/errors/appErrors";

/**
 * Service for SimletShlinks entity operations.
 * Handles all CRUD operations and business logic for simlet short links.
 * 
 * @namespace SimletShlinksService
 */

/**
 * Retrieve all short links for a specific simlet.
 * 
 * @async
 * @function getSimletShlinks
 * @param {number} simlet_id - The simlet's ID
 * @returns {Promise<InstanceType<typeof db.Tables.SimletShlinks>[]>} Array of short links for the simlet
 * 
 * @example
 * ```typescript
 * const shlinks = await getSimletShlinks(123);
 * ```
 */
export async function getSimletShlinks(simlet_id: number): Promise<InstanceType<typeof db.Tables.SimletShlinks>[]> {
  return await db.Tables.SimletShlinks.findAll({
    where: { simlet_id },
    order: [['createdAt', 'DESC']]
  });
}

/**
 * Retrieve all simlet short links.
 * 
 * @async
 * @function getAllSimletShlinks
 * @param {number} [limit] - Maximum number of short links to return
 * @param {number} [offset] - Number of short links to skip for pagination
 * @returns {Promise<InstanceType<typeof db.Tables.SimletShlinks>[]>} Array of all simlet short links
 * 
 * @example
 * ```typescript
 * const shlinks = await getAllSimletShlinks();
 * const paginated = await getAllSimletShlinks(10, 20);
 * ```
 */
export async function getAllSimletShlinks(
  limit?: number,
  offset?: number
): Promise<InstanceType<typeof db.Tables.SimletShlinks>[]> {
  return await db.Tables.SimletShlinks.findAll({
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
}

/**
 * Get a specific simlet short link by simlet ID.
 * 
 * @async
 * @function getSimletShlinkById
 * @param {number} simlet_id - The simlet's ID
 * @returns {Promise<InstanceType<typeof db.Tables.SimletShlinks>>} The simlet short link
 * @throws {NotFoundError} If the short link doesn't exist
 * 
 * @example
 * ```typescript
 * const shlink = await getSimletShlinkById(123);
 * ```
 */
export async function getSimletShlinkById(simlet_id: number): Promise<InstanceType<typeof db.Tables.SimletShlinks>> {
  const shlink = await db.Tables.SimletShlinks.findByPk(simlet_id);
  
  if (!shlink) {
    throw new NotFoundError(`SimletShlink with simlet_id ${simlet_id} not found`);
  }
  
  return shlink;
}

/**
 * Get a simlet short link by short code.
 * 
 * @async
 * @function getSimletShlinkByShortCode
 * @param {string} short_code - The short code
 * @returns {Promise<InstanceType<typeof db.Tables.SimletShlinks>>} The simlet short link
 * @throws {NotFoundError} If the short link doesn't exist
 * 
 * @example
 * ```typescript
 * const shlink = await getSimletShlinkByShortCode('abc123');
 * ```
 */
export async function getSimletShlinkByShortCode(short_code: string): Promise<InstanceType<typeof db.Tables.SimletShlinks>> {
  const shlink = await db.Tables.SimletShlinks.findOne({
    where: { short_code }
  });
  
  if (!shlink) {
    throw new NotFoundError(`SimletShlink with short_code ${short_code} not found`);
  }
  
  return shlink;
}

/**
 * Get simlet short links by domain.
 * 
 * @async
 * @function getSimletShlinksByDomain
 * @param {string} domain - The domain to search for
 * @returns {Promise<InstanceType<typeof db.Tables.SimletShlinks>[]>} Array of short links for the domain
 * 
 * @example
 * ```typescript
 * const shlinks = await getSimletShlinksByDomain('example.com');
 * ```
 */
export async function getSimletShlinksByDomain(domain: string): Promise<InstanceType<typeof db.Tables.SimletShlinks>[]> {
  return await db.Tables.SimletShlinks.findAll({
    where: { domain },
    order: [['createdAt', 'DESC']]
  });
}

/**
 * Search simlet short links by title.
 * 
 * @async
 * @function searchSimletShlinksByTitle
 * @param {string} title - The title pattern to search for
 * @returns {Promise<InstanceType<typeof db.Tables.SimletShlinks>[]>} Array of short links matching the title pattern
 * 
 * @example
 * ```typescript
 * const shlinks = await searchSimletShlinksByTitle('math');
 * ```
 */
export async function searchSimletShlinksByTitle(title: string): Promise<InstanceType<typeof db.Tables.SimletShlinks>[]> {
  return await db.Tables.SimletShlinks.findAll({
    where: {
      title: {
        [Op.like]: `%${title}%`
      }
    },
    order: [['title', 'ASC']]
  });
}

/**
 * Get active simlet short links (not expired).
 * 
 * @async
 * @function getActiveSimletShlinks
 * @returns {Promise<InstanceType<typeof db.Tables.SimletShlinks>[]>} Array of active short links
 * 
 * @example
 * ```typescript
 * const activeShlinks = await getActiveSimletShlinks();
 * ```
 */
export async function getActiveSimletShlinks(): Promise<InstanceType<typeof db.Tables.SimletShlinks>[]> {
  const now = new Date();
  return await db.Tables.SimletShlinks.findAll({
    where: {
      [Op.or]: [
        { expiration_date: null },
        { expiration_date: { [Op.gt]: now } }
      ]
    },
    order: [['createdAt', 'DESC']]
  });
}

/**
 * Get expired simlet short links.
 * 
 * @async
 * @function getExpiredSimletShlinks
 * @returns {Promise<InstanceType<typeof db.Tables.SimletShlinks>[]>} Array of expired short links
 * 
 * @example
 * ```typescript
 * const expiredShlinks = await getExpiredSimletShlinks();
 * ```
 */
export async function getExpiredSimletShlinks(): Promise<InstanceType<typeof db.Tables.SimletShlinks>[]> {
  const now = new Date();
  return await db.Tables.SimletShlinks.findAll({
    where: {
      expiration_date: {
        [Op.and]: [
          { [Op.not]: null },
          { [Op.lt]: now }
        ]
      }
    },
    order: [['expiration_date', 'DESC']]
  });
}

/**
 * Get simlet short links created after a specific date.
 * 
 * @async
 * @function getSimletShlinksCreatedAfter
 * @param {Date} date - The date to compare against
 * @returns {Promise<InstanceType<typeof db.Tables.SimletShlinks>[]>} Array of short links created after the date
 * 
 * @example
 * ```typescript
 * const recentShlinks = await getSimletShlinksCreatedAfter(new Date('2023-01-01'));
 * ```
 */
export async function getSimletShlinksCreatedAfter(date: Date): Promise<InstanceType<typeof db.Tables.SimletShlinks>[]> {
  return await db.Tables.SimletShlinks.findAll({
    where: {
      createdAt: {
        [Op.gt]: date
      }
    },
    order: [['createdAt', 'DESC']]
  });
}

/**
 * Create a new simlet short link.
 * 
 * @async
 * @function createSimletShlink
 * @param {Partial<InstanceType<typeof db.Tables.SimletShlinks>>} shlinkData - The short link data for creation
 * @returns {Promise<InstanceType<typeof db.Tables.SimletShlinks>>} The created simlet short link
 * 
 * @example
 * ```typescript
 * const shlink = await createSimletShlink({
 *   simlet_id: 123,
 *   short_url: 'https://short.ly/abc123',
 *   short_code: 'abc123',
 *   title: 'Math Learning Environment',
 *   domain: 'short.ly'
 * });
 * ```
 */
export async function createSimletShlink(
  shlinkData: Partial<InstanceType<typeof db.Tables.SimletShlinks>>
): Promise<InstanceType<typeof db.Tables.SimletShlinks>> {
  return await db.Tables.SimletShlinks.create(shlinkData);
}

/**
 * Update an existing simlet short link by simlet ID.
 * 
 * @async
 * @function updateSimletShlink
 * @param {number} simlet_id - The simlet's ID
 * @param {Partial<InstanceType<typeof db.Tables.SimletShlinks>>} updateData - The data to update
 * @returns {Promise<InstanceType<typeof db.Tables.SimletShlinks>>} The updated simlet short link
 * @throws {NotFoundError} If the short link doesn't exist
 * 
 * @example
 * ```typescript
 * const updated = await updateSimletShlink(123, {
 *   title: 'Updated Learning Environment',
 *   expiration_date: new Date('2024-12-31')
 * });
 * ```
 */
export async function updateSimletShlink(
  simlet_id: number,
  updateData: Partial<InstanceType<typeof db.Tables.SimletShlinks>>
): Promise<InstanceType<typeof db.Tables.SimletShlinks>> {
  const shlink = await getSimletShlinkById(simlet_id);
  
  await shlink.update(updateData);
  await shlink.reload();
  
  return shlink;
}

/**
 * Delete a simlet short link by simlet ID.
 * 
 * @async
 * @function deleteSimletShlink
 * @param {number} simlet_id - The simlet's ID
 * @returns {Promise<void>}
 * @throws {NotFoundError} If the short link doesn't exist
 * 
 * @example
 * ```typescript
 * await deleteSimletShlink(123);
 * ```
 */
export async function deleteSimletShlink(simlet_id: number): Promise<void> {
  const shlink = await getSimletShlinkById(simlet_id);
  await shlink.destroy();
}

/**
 * Count total number of simlet short links.
 * 
 * @async
 * @function countSimletShlinks
 * @returns {Promise<number>} Total count of short links
 * 
 * @example
 * ```typescript
 * const count = await countSimletShlinks();
 * ```
 */
export async function countSimletShlinks(): Promise<number> {
  return await db.Tables.SimletShlinks.count();
}

/**
 * Count active simlet short links.
 * 
 * @async
 * @function countActiveSimletShlinks
 * @returns {Promise<number>} Count of active short links
 * 
 * @example
 * ```typescript
 * const count = await countActiveSimletShlinks();
 * ```
 */
export async function countActiveSimletShlinks(): Promise<number> {
  const now = new Date();
  return await db.Tables.SimletShlinks.count({
    where: {
      [Op.or]: [
        { expiration_date: null },
        { expiration_date: { [Op.gt]: now } }
      ]
    }
  });
}

/**
 * Count expired simlet short links.
 * 
 * @async
 * @function countExpiredSimletShlinks
 * @returns {Promise<number>} Count of expired short links
 * 
 * @example
 * ```typescript
 * const count = await countExpiredSimletShlinks();
 * ```
 */
export async function countExpiredSimletShlinks(): Promise<number> {
  const now = new Date();
  return await db.Tables.SimletShlinks.count({
    where: {
      expiration_date: {
        [Op.and]: [
          { [Op.not]: null },
          { [Op.lt]: now }
        ]
      }
    }
  });
}

/**
 * Check if a simlet short link exists.
 * 
 * @async
 * @function simletShlinkExists
 * @param {number} simlet_id - The simlet's ID
 * @returns {Promise<boolean>} True if short link exists, false otherwise
 * 
 * @example
 * ```typescript
 * const exists = await simletShlinkExists(123);
 * ```
 */
export async function simletShlinkExists(simlet_id: number): Promise<boolean> {
  const count = await db.Tables.SimletShlinks.count({ where: { simlet_id } });
  return count > 0;
}

/**
 * Check if a short code is available (not taken).
 * 
 * @async
 * @function isShortCodeAvailable
 * @param {string} short_code - The short code to check
 * @returns {Promise<boolean>} True if short code is available, false if taken
 * 
 * @example
 * ```typescript
 * const available = await isShortCodeAvailable('abc123');
 * ```
 */
export async function isShortCodeAvailable(short_code: string): Promise<boolean> {
  const count = await db.Tables.SimletShlinks.count({ where: { short_code } });
  return count === 0;
}