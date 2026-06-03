import { logger } from "@/lib/logger";
import { RandomAllocatorSimletGroup } from "@/lib/mappers/simletGroup/RandomAllocatorSimletGroup";
import { GroupAllocatorSimletGroup } from "@/lib/mappers/simletGroup/GroupAllocatorSimletGroup";
import { SessionAllocatorSimletGroup } from "@/lib/mappers/simletGroup/SessionAllocatorSimletGroup";
import { SimletGroup } from "@/lib/mappers/simletGroup/SimletGroup";

/**
 * Factory function that creates appropriate Allocator subclass instances based on allocator type.
 * Handles polymorphic creation of allocator objects for participant assignment strategies.
 * 
 * @function AllocatorToClass
 * @param {any} data - Raw allocator data object containing allocator_type and other properties
 * @returns {Allocator} The appropriate Allocator subclass instance
 * 
 * @description Factory function that:
 * - Analyzes the allocator_type property in the data
 * - Creates and returns the appropriate Allocator subclass instance
 * - Handles SessionAllocator, RandomAllocator, and GroupAllocator types
 * - Falls back to base Allocator class for unknown types
 * - Uses synchronous constructors for immediate object creation
 * 
 * @example
 * const allocator = AllocatorToClass({ allocator_type: 'random', allocator_id: 456 });
 * // Returns a RandomAllocator instance
 */
export async function SimletGroupAllocatorToClass(allocator: any, current_user_id?: number) : Promise<SimletGroup> {
    logger.debug({allocator}, allocator.group_allocator_type);
    switch (allocator.group_allocator_type) {
        case SessionAllocatorSimletGroup.getType():
            let sessionAllocator = new SessionAllocatorSimletGroup(allocator, current_user_id);
            await sessionAllocator.init();
            return sessionAllocator;
        case RandomAllocatorSimletGroup.getType():
            let randomAllocator = new RandomAllocatorSimletGroup(allocator, current_user_id);
            await randomAllocator.init();
            return randomAllocator;
        case GroupAllocatorSimletGroup.getType():
            let groupAllocator = new GroupAllocatorSimletGroup(allocator, current_user_id);
            await groupAllocator.init();
            return groupAllocator;
        case SimletGroup.getType():
            let baseAllocator = new SimletGroup(allocator, current_user_id);
            await baseAllocator.init();
            return baseAllocator;
        default:
            logger.warn(`Unknown allocator type: ${allocator.group_allocator_type}, returning default Allocator instance.`);
            let defaultAllocator = new SimletGroup(allocator, current_user_id);
            await defaultAllocator.init();
            return defaultAllocator;
    }
}