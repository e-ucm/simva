/**
 * @fileoverview Allocation mapper for SIMVA API.
 * Manages participant and group allocations within studies (simlets) for experimental research.
 * 
 * @module mappers/allocators/Allocation
 * @requires @/lib/db
 * @requires @/lib/errors/appErrors
 * @requires @/lib/logger
 */

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

/**
 * Allocation mapper class representing participant or group assignments to sessions within studies.
 * Used for managing experimental allocations in educational research studies.
 * 
 * @class Allocation
 * @description Handles the mapping of participants or groups to specific sessions
 * for experimental research studies. Supports different allocation strategies.
 */
export class Allocation {
    /**
     * ID of the session this allocation is assigned to
     */
    session_id: number;
    
    /**
     * ID of the allocated object (participant or group)
     */
    object_id: number;
    
    /**
     * Type of allocated object (participant or group)
     */
    object_type: string;
    
    /**
     * Timestamp when the allocation was created
     */
    createdAt?: Date;
    
    /**
     * Timestamp when the allocation was last updated
     */
    updatedAt?: Date;

    /**
     * Creates a new Allocation instance
     * 
     * @param {string} object_type - Type of allocated object ('group', 'participant', etc.)
     * @param {any} data - Raw data object containing allocation properties
     * @description Initializes allocation properties based on object type.
     * Assigns object_id based on the allocation strategy (group or participant).
     * 
     * @example
     * ```typescript
     * const allocation = new Allocation('group', {
     *   session_id: 123,
     *   group_id: 456
     * });
     * ```
     */
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

    /**
     * Retrieves allocation data from database for a specific simlet and group.
     * 
     * @static
     * @async
     * @method getFromDbData
     * @param {number} simlet_id - ID of the simlet to get allocations for
     * @param {number} group_id - ID of the group to get allocations for
     * @param {string} allocator_type - Type of allocator to use ('default', 'group', 'random', 'session')
     * @returns {Promise<Allocation[]>} Promise resolving to array of Allocation instances
     * @throws {BadRequestError} When unknown allocator type is specified
     * 
     * @example
     * ```typescript
     * const allocations = await Allocation.getFromDbData(123, 456, 'group');
     * ```
     */
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

    /**
     * Converts the Allocation instance to a JSON representation.
     * 
     * @method toJSON
     * @returns {object} Plain object containing allocation properties
     * 
     * @example
     * ```typescript
     * const allocationData = allocation.toJSON();
     * logger.info('Allocation data:', allocationData);
     * ```
     */
    toJSON(): object {
        return { 
            object_id: this.object_id,
            session_id: this.session_id 
        };
    }
}