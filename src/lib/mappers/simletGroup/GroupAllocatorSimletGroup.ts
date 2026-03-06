import { logger } from "@/lib/logger";
import { SimletGroup } from "./SimletGroup";
import { ValidationError } from "@/lib/errors/appErrors";
import { db } from "@/lib/db";
import { Session } from "../session/Session";

export class GroupAllocatorSimletGroup extends SimletGroup {
    /**
     * Gets the allocator type identifier
     * 
     * @static
     * @returns {string} The group allocator type string
     * @description Returns the specific type identifier for group allocators.
     */
    static getType(){
        return 'group';
    }
    
    /**
     * Gets the human-readable name for this allocator type
     * 
     * @static
     * @returns {string} The group allocator type name
     * @description Returns a user-friendly name for group allocation strategy.
     */
    static getName(){
        return 'Group Allocator';
    }
    
    /**
     * Gets a description of this allocator type
     * 
     * @static
     * @returns {string} The group allocator description
     * @description Explains how group-based allocation works.
     */
    static getDescription(){
        return 'An allocator that assigns groups to sessions based on predefined criteria.';
    }

    /**
     * Gets utility functions specific to group allocation for a given user
     * 
     * @static
     * @async
     * @returns {Promise<object>} Object containing group allocation utility functions
     * @description Returns functions for performing group-based allocation operations.
     */
    static async getUtils(){
        return super.getUtils();
    }

    async getDetails(){
        return {};
    }

    async allocateToSession(sessionId: number, group_id: number): Promise<void> {
        logger.debug({ sessionId, group_id }, 'GroupAllocator.allocate started');
        if(typeof group_id !== 'number') {
            logger.debug({ group_id, type: typeof group_id }, 'Allocator.allocate invalid group_id type');
            throw new ValidationError("Not valid");
        }
        if(typeof group_id !== 'number') {
            logger.debug({ group_id, type: typeof group_id }, 'GroupAllocator.allocate invalid group_id type');
            throw new ValidationError("Not valid");
        }
        if(group_id !== this.group_id) {
            logger.debug({ group_id, allocatorGroupId: this.group_id }, 'GroupAllocator.allocate group_id mismatch');
            throw new ValidationError("Not valid");
        }
        if(this.group_allocator_type !== GroupAllocatorSimletGroup.getType()) {
            logger.debug({ allocator_type: this.group_allocator_type, expected: GroupAllocatorSimletGroup.getType() }, 'GroupAllocator.allocate type mismatch');
            throw new ValidationError("Not valid");
        }
        super.allocateToDefault(sessionId);
    }
}