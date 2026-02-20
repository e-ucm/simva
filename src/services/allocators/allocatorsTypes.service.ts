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
 * @requires @/lib/mappers/allocators/Allocator
 * @requires @/lib/mappers/allocators/SessionAllocator
 * @requires @/lib/mappers/allocators/RandomAllocator
 * @requires @/lib/mappers/allocators/GroupAllocator
 * @requires @/lib/logger
 */

import { Allocator } from "@/lib/mappers/allocators/Allocator";
import { SessionAllocator } from "@/lib/mappers/allocators/SessionAllocator";
import { RandomAllocator } from "@/lib/mappers/allocators/RandomAllocator";
import { GroupAllocator } from "@/lib/mappers/allocators/GroupAllocator";
import { logger } from "@/lib/logger";

/**
 * Represents metadata about an allocator type.
 * Contains type identification, display information, and utility functions.
 * 
 * @class AllocatorType
 * @property {string | undefined} type - Unique identifier for the allocator type
 * @property {string | undefined} name - Human-readable name for display
 * @property {string | undefined} description - Description of the allocation strategy
 * @property {any} utils - Type-specific utility functions and configuration
 */
class AllocatorType {
	type: string | undefined;
	name: string | undefined;
	description: string | undefined;
	utils: any;
}

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
 * const allocatorTypes = await getAllocatorTypes();
 * allocatorTypes.forEach(type => {
 *   logger.info(`${type.name}: ${type.description}`);
 *   // Access type-specific utilities
 *   logger.info(type.utils);
 * });
 * ```
 * 
 * @example
 * ```typescript
 * // Example response structure:
 * [
 *   {
 *     type: "base",
 *     name: "Base Allocator",
 *     description: "Base allocator implementation",
 *     utils: { ... }
 *   },
 *   {
 *     type: "group", 
 *     name: "Group Allocator",
 *     description: "Assigns participants based on group membership",
 *     utils: { ... }
 *   },
 *   {
 *     type: "session",
 *     name: "Session Allocator", 
 *     description: "Assigns participants to specific sessions",
 *     utils: { ... }
 *   },
 *   {
 *     type: "random",
 *     name: "Random Allocator",
 *     description: "Randomly assigns participants to conditions",
 *     utils: { ... }
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
 *   logger.info(`${type.name}: ${type.description}`);
 * });
 * ```
 */
export async function getAllocatorTypes(): Promise<AllocatorType[]> {
	let types = [ Allocator, GroupAllocator, SessionAllocator, RandomAllocator ];
	let allocatortypes : AllocatorType[] = [];
	for (let i = 0; i < types.length; i++) {
		let allocatortype : AllocatorType = {
			type : types[i].getType(),
			name : types[i].getName(),
			description : types[i].getDescription(),
			utils : await types[i].getUtils("")	
		};
		logger.debug(`Loaded allocator type: ${allocatortype.type}`);
		allocatortypes.push(allocatortype);
	}
	logger.debug({allocatortypes});
	return allocatortypes;
}
