import { Allocator } from "@/lib/mappers/allocators/Allocator";
import { SessionAllocator } from "@/lib/mappers/allocators/SessionAllocator";
import { RandomAllocator } from "@/lib/mappers/allocators/RandomAllocator";
import { GroupAllocator } from "@/lib/mappers/allocators/GroupAllocator";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/errors/appErrors";

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
export async function AllocatorToClass(allocator: any) : Promise<Allocator> {
    logger.debug({allocator}, allocator.allocator_type);
    switch (allocator.allocator_type) {
        case SessionAllocator.getType():
            return new SessionAllocator(allocator);
        case RandomAllocator.getType():
            return new RandomAllocator(allocator);
        case GroupAllocator.getType():
            return new GroupAllocator(allocator);
        case Allocator.getType():
            return new Allocator(allocator);
        default:
            logger.warn(`Unknown allocator type: ${allocator.allocator_type}, returning default Allocator instance.`);
            return new Allocator(allocator);
    }
}