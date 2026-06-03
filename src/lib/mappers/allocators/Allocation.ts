import { db } from "@/lib/db";
import { BadRequestError } from "@/lib/errors/appErrors";
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
    createdAt?: Date
    updatedAt?: Date

    constructor(object_type: string, data: any) {
        this.object_type = object_type;
        this.session_id = data.session_id;
        this.createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : undefined;
        switch(object_type) {
            case ALLOCATOR_TYPE.GROUP:
                this.object_id = data.group_id;
                break;
            case ALLOCATOR_TYPE.DEFAULT:
                this.object_id = data.participant_id;
                break;
            case ALLOCATOR_TYPE.RANDOM:
                this.object_id = data.participant_id;
                break;
            case ALLOCATOR_TYPE.SESSION:
                this.object_id = data.group_id;
                break;
            default:
                throw new BadRequestError(`Unknown object type: ${object_type}`);
        }
        logger.debug({ object_type, session_id: this.session_id, object_id: this.object_id }, 'Allocation instance created');
    }

    static async getFromDbData(simlet_id: number, group_id: number, allocator_type: string) : Promise<Allocation[]> {
        let allocations : any = [];
        switch(allocator_type) {
            case ALLOCATOR_TYPE.GROUP: {
                // If there are participants, use ExperimentalParticipants, else use ExperimentalGroups
                const participants = await db.Tables.ExperimentalParticipants.findAll({ where: { simlet_id, group_id } });
                if (participants && participants.length > 0) {
                    allocations = participants;
                } else {
                    const groupAlloc = await db.Tables.ExperimentalGroups.findOne({ where: { simlet_id, group_id } });
                    allocations = groupAlloc ? [groupAlloc] : [];
                }
                break;
            }
            case ALLOCATOR_TYPE.SESSION:
                allocations = await db.Tables.ExperimentalParticipants.findAll({ where: { simlet_id, group_id } });
                break;
            case ALLOCATOR_TYPE.DEFAULT:
            case ALLOCATOR_TYPE.RANDOM:
                allocations = await db.Tables.ExperimentalParticipants.findAll({ where: { simlet_id, group_id } });
                break;
            default:
                throw new BadRequestError(`Unknown allocator type: ${allocator_type}`);
        }
        logger.debug({ simlet_id, allocator_type, allocationsCount: allocations.length }, 'Allocation.getFromDbData query result');
        return allocations.map((allocation: any) => new Allocation(allocator_type, allocation));
    }

    toJSON(): object {
        return { 
            object_id: this.object_id,
            session_id: this.session_id 
        };
    }
}