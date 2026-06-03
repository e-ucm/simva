/**
 * @fileoverview Mapper class for Allocator Type metadata.
 * Provides structured representation of allocator types with serialization support.
 * 
 * @module lib/mappers/allocators/AllocatorType
 * @requires @/lib/mappers/allocators/Allocator
 * @requires @/lib/mappers/allocators/GroupAllocator
 * @requires @/lib/mappers/allocators/SessionAllocator
 * @requires @/lib/mappers/allocators/RandomAllocator
 * @requires @/lib/logger
 */

import { SimletGroup } from "@/lib/mappers/simletGroup/SimletGroup";
import { GroupAllocatorSimletGroup } from "@/lib/mappers/simletGroup/GroupAllocatorSimletGroup";
import { SessionAllocatorSimletGroup } from "@/lib/mappers/simletGroup/SessionAllocatorSimletGroup";
import { RandomAllocatorSimletGroup } from "@/lib/mappers/simletGroup/RandomAllocatorSimletGroup";
import { logger } from "@/lib/logger";

/**
 * AllocatorType mapper class representing metadata about an allocator type.
 * Contains type identification, display information, and utility functions.
 * 
 * @class AllocatorType
 * @description Manages allocator type metadata with serialization support for API responses.
 */
export class AllocatorType {
	/**
	 * Unique identifier for the allocator type
	 */
	allocator_type?: string;

	/**
	 * Human-readable name for display
	 */
	allocator_name?: string;

	/**
	 * Description of the allocation strategy
	 */
	allocator_description?: string;

	/**
	 * Type-specific utility functions and configuration
	 */
	allocator_utils: any;

	/**
	 * Creates a new AllocatorType instance from raw data.
	 * 
	 * @constructor
	 * @param {any} data - Raw data object containing allocator type properties
	 * 
	 * @example
	 * ```typescript
	 * const allocatorType = new AllocatorType({
	 *   allocator_type: 'random',
	 *   allocator_name: 'Random Allocator',
	 *   allocator_description: 'Randomly assigns participants to conditions',
	 *   allocator_utils: { ... }
	 * });
	 * ```
	 */
	constructor(data: any) {
		this.allocator_type = data.allocator_type;
		this.allocator_name = data.allocator_name;
		this.allocator_description = data.allocator_description;
		this.allocator_utils = data.allocator_utils;
	}

	/**
	 * Converts the AllocatorType instance to a plain JSON object.
	 * Returns serializable representation for API responses.
	 * 
	 * @method toJSON
	 * @returns {object} Plain object containing allocator type properties
	 * 
	 * @example
	 * ```typescript
	 * const allocatorTypeData = allocatorType.toJSON();
	 * logger.info('Allocator type:', allocatorTypeData.allocator_type);
	 * ```
	 */
	toJSON(): object {
		return {
			allocator_type: this.allocator_type,
			allocator_name: this.allocator_name,
			allocator_description: this.allocator_description,
			allocator_utils: this.allocator_utils
		};
	}

	/**
	 * Retrieves all available allocator types with their metadata and utilities.
	 * Each allocator type provides specific configuration and utility functions
	 * for participant assignment strategies in educational research studies.
	 * 
	 * @static
	 * @async
	 * @method getAll
	 * @returns {Promise<AllocatorType[]>} Array of AllocatorType instances with metadata
	 * 
	 * @example
	 * ```typescript
	 * const types = await AllocatorType.getAll();
	 * types.forEach(type => {
	 *   logger.info(`${type.allocator_name}: ${type.allocator_description}`);
	 * });
	 * ```
	 */
	static async getAll(type?: string[]): Promise<AllocatorType[]> {
        if(!type) {
            type = [SimletGroup.getType(), GroupAllocatorSimletGroup.getType()]; //, SessionAllocatorSimletGroup.getType(), RandomAllocatorSimletGroup.getType()
        }
        const types : any[] = [];
		if(type.includes(SimletGroup.getType())) types.push(SimletGroup);
        if(type.includes(GroupAllocatorSimletGroup.getType())) types.push(GroupAllocatorSimletGroup);
        if(type.includes(SessionAllocatorSimletGroup.getType())) types.push(SessionAllocatorSimletGroup);
        if(type.includes(RandomAllocatorSimletGroup.getType())) types.push(RandomAllocatorSimletGroup);

		const allocatorTypes: AllocatorType[] = [];
		for (let i = 0; i < types.length; i++) {
			const allocatorType = new AllocatorType({
				allocator_type: types[i].getType(),
				allocator_name: types[i].getName(),
				allocator_description: types[i].getDescription(),
				allocator_utils: await types[i].getUtils()
			});
			logger.debug(`Loaded allocator type: ${allocatorType.allocator_type}`);
			allocatorTypes.push(allocatorType);
		}
		logger.debug({ allocatorTypes });
		return allocatorTypes;
	}
}
