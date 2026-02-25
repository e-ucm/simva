import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

// Allocator type constants to avoid circular dependency imports
const ALLOCATOR_TYPE = {
    DEFAULT: 'default',
    GROUP: 'group',
    RANDOM: 'random',
    SESSION: 'session'
} as const;

export class Allocation {
    session_id: number
    object_id: number
    object_type: string

    constructor(object_type: string, data: any) {
        this.object_type = object_type;
        this.session_id = data.session_id;
        switch(object_type) {
            case ALLOCATOR_TYPE.GROUP:
                this.object_id = data.group_id;
                break;
            case ALLOCATOR_TYPE.DEFAULT:
                this.object_id = data.participant_id;
                break;
            default:
                throw new Error(`Unknown object type: ${object_type}`);
        }
        logger.debug({ object_type, session_id: this.session_id, object_id: this.object_id }, 'Allocation instance created');
    }

    static async getAllFromDbData(allocator_id: number, allocator_type: string) : Promise<Allocation[]> {
        let allocations = await db.Tables.ExperimentalParticipants.findAll({where : {allocator_id}});
        logger.debug({ allocator_id, allocator_type, allocationsCount: allocations.length }, 'Allocation.getAllFromDbData query result');
        
        // For group allocator, deduplicate by group_id (one allocation per group)
        if (allocator_type === ALLOCATOR_TYPE.GROUP) {
            const groupMap = new Map<number, any>();
            for (const allocation of allocations) {
                if (!groupMap.has(allocation.group_id)) {
                    groupMap.set(allocation.group_id, allocation);
                }
            }
            const uniqueAllocations = Array.from(groupMap.values());
            logger.debug({ uniqueGroupsCount: uniqueAllocations.length }, 'Allocation.getAllFromDbData deduplicated by group');
            return uniqueAllocations.map(allocation => new Allocation(allocator_type, allocation));
        }
        
        return allocations.map(allocation => new Allocation(allocator_type, allocation));
    }

    toJSON(): object {
        return { [this.object_id]: this.session_id };
    }
}