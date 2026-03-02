import { Allocator } from "@/lib/mappers/allocators/Allocator";
import { SessionAllocator } from "@/lib/mappers/allocators/SessionAllocator";
import { RandomAllocator } from "@/lib/mappers/allocators/RandomAllocator";
import { GroupAllocator } from "@/lib/mappers/allocators/GroupAllocator";
import { logger } from "@/lib/logger";

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
export async function AllocatorToClass(allocator: any, current_user_id: number) : Promise<Allocator> {
    logger.debug({allocator}, allocator.allocator_type);
    switch (allocator.allocator_type) {
        case SessionAllocator.getType():
            let sessionAllocator = new SessionAllocator(allocator, current_user_id);
            await sessionAllocator.init();
            return sessionAllocator;
        case RandomAllocator.getType():
            let randomAllocator = new RandomAllocator(allocator, current_user_id);
            await randomAllocator.init();
            return randomAllocator;
        case GroupAllocator.getType():
            let groupAllocator = new GroupAllocator(allocator, current_user_id);
            await groupAllocator.init();
            return groupAllocator;
        case Allocator.getType():
            let baseAllocator = new Allocator(allocator, current_user_id);
            await baseAllocator.init();
            return baseAllocator;
        default:
            logger.warn(`Unknown allocator type: ${allocator.allocator_type}, returning default Allocator instance.`);
            let defaultAllocator = new Allocator(allocator, current_user_id);
            await defaultAllocator.init();
            return defaultAllocator;
    }
}