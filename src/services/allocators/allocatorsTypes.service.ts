/**
 * @fileoverview Service for Allocator Type management and registration.
 * Provides metadata about available participant allocation strategies.
 * 
 * Allocator types define different strategies for assigning participants to studies:
 * - Allocator: Base allocator type
 * - GroupAllocator: Assigns participants based on group membership
 * - SessionAllocator: Assigns participants to specific sessions
 * - RandomAllocator: Randomly assigns participants to conditions
 * 
 * @module services/allocators/allocatorsTypes
 * @requires @/lib/mappers/allocators/AllocatorType
 */

import { AllocatorType } from "@/lib/mappers/allocators/AllocatorType";

export { AllocatorType };

/**
 * Retrieves all available allocator types with their metadata and utilities.
 * Each allocator type provides specific configuration and utility functions
 * for participant assignment strategies in educational research studies.
 * 
 * @async
 * @function getAllocatorTypes
 * @returns {Promise<AllocatorType[]>} Array of allocator type objects with metadata
 * 
 * @throws {Error} If allocator type utilities cannot be loaded
 * 
 * @example
 * ```typescript
 * const allocatorTypes = await getAllocatorTypes(['base', 'group', 'session', 'random']);
 * allocatorTypes.forEach(type => {
 *   logger.info(`${type.allocator_name}: ${type.allocator_description}`);
 *   // Access type-specific utilities
 *   logger.info(type.allocator_utils);
 * });
 * ```
 * 
 * @example
 * ```typescript
 * // Example response structure:
 * [
 *   {
 *     allocator_type: "base",
 *     allocator_name: "Base Allocator",
 *     allocator_description: "Base allocator implementation",
 *     allocator_utils: { ... }
 *   },
 *   {
 *     allocator_type: "group", 
 *     allocator_name: "Group Allocator",
 *     allocator_description: "Assigns participants based on group membership",
 *     allocator_utils: { ... }
 *   },
 *   {
 *     allocator_type: "session",
 *     allocator_name: "Session Allocator", 
 *     allocator_description: "Assigns participants to specific sessions",
 *     allocator_utils: { ... }
 *   },
 *   {
 *     allocator_type: "random",
 *     allocator_name: "Random Allocator",
 *     allocator_description: "Randomly assigns participants to conditions",
 *     allocator_utils: { ... }
 *   }
 * ]
 * ```
 */
/**
 * Retrieves all available allocator types in the SIMVA system.
 * Returns metadata and utilities for each allocator type including their
 * configuration options and capabilities.
 *
 * @async
 * @function getAllocatorTypes
 * @returns {Promise<AllocatorType[]>} Array of allocator type definitions
 * @throws {Error} When allocator type initialization fails
 * 
 * @example
 * ```typescript
 * const types = await getAllocatorTypes();
 * types.forEach(type => {
 *   logger.info(`${type.allocator_name}: ${type.allocator_description}`);
 * });
 * ```
 */
export async function getAllocatorTypes(types?: string[]): Promise<AllocatorType[]> {
	return AllocatorType.getAll(types);
}
