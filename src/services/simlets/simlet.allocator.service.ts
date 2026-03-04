/**
 * @fileoverview Service for Simlet allocator operations.
 * Handles all allocator management operations for simlets.
 * 
 * The allocator determines how participants are assigned to different conditions
 * or experimental groups within a simlet.
 * 
 * @module services/simlets/simlet.allocator
 * @requires @/lib/mappers/simlet/Simlet
 * @requires @/lib/mappers/allocators/Allocator
 */

import { Simlet } from "@/lib/mappers/simlet/Simlet";
import { Allocator } from "@/lib/mappers/allocators/Allocator";

/**
 * Retrieves the allocator associated with a simlet.
 * The allocator determines how participants are assigned to different conditions.
 * 
 * @async
 * @function getAllocatorFromSimlet
 * @param {number} simletId - The ID of the simlet
 * @param {number} current_user_id - The ID of the user requesting the allocator
 * @returns {Promise<Allocator>} The allocator instance for the simlet
 * @throws {NotFoundError} When simlet or allocator is not found
 * @throws {PermissionError} When user lacks read permissions
 * 
 * @example
 * ```typescript
 * const allocator = await getAllocatorFromSimlet(123, 456);
 * logger.info(allocator.type); // 'random', 'manual', etc.
 * ```
 */
export async function getAllocatorFromSimlet(simletId: number, current_user_id: number): Promise<Allocator> {
  let simlet = await Simlet.getFromDbData(simletId, current_user_id);
  return await simlet.getAllocator();
}

/**
 * Updates or creates the allocator for a simlet.
 * The allocator determines how participants are assigned to different conditions.
 * 
 * @async
 * @function updateSimletAllocator
 * @param {number} simletId - The ID of the simlet
 * @param {number} current_user_id - The ID of the user updating the allocator
 * @param {Object} body - Allocator configuration data
 * @returns {Promise<Allocator>} The updated allocator instance
 * @throws {NotFoundError} When simlet is not found
 * @throws {PermissionError} When user lacks update permissions
 * @throws {ValidationError} When allocator configuration is invalid
 * 
 * @example
 * ```typescript
 * const allocator = await updateSimletAllocator(123, 456, {
 *   type: 'random',
 *   conditions: ['control', 'experimental']
 * });
 * ```
 */
export async function updateSimletAllocator(simletId: number, current_user_id: number, body: any): Promise<Allocator> {
  let simlet = await Simlet.getFromDbData(simletId, current_user_id);
  return await simlet.updateAllocator(body);
}
