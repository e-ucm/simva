import { Allocator } from "@/lib/mappers/allocators/Allocator";
import { SessionAllocator } from "@/lib/mappers/allocators/SessionAllocator";
import { RandomAllocator } from "@/lib/mappers/allocators/RandomAllocator";
import { GroupAllocator } from "@/lib/mappers/allocators/GroupAllocator";
import { logger } from "@/lib/logger";

export function AllocatorToClass(data: any) : Allocator {
    logger.debug({data}, data.allocator_type);
    switch (data.allocator_type) {
        case SessionAllocator.getType():
            return new SessionAllocator(data);
        case RandomAllocator.getType():
            return new RandomAllocator(data);
        case GroupAllocator.getType():
            return new GroupAllocator(data);
        case Allocator.getType():
            return new Allocator(data);
        default:
            logger.warn(`Unknown allocator type: ${data.allocator_type}, returning default Allocator instance.`);
            return new Allocator(data);
    }
}