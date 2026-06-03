import { ValidationError } from "@/lib/errors/appErrors";
import { SimletGroup } from "./SimletGroup";
import { logger } from "@/lib/logger";

/**
 * Session Allocator mapper class extending base Allocator.
 * Implements session-based assignment ensuring no date overlaps between sessions.
 * 
 * @class SessionAllocatorSimletGroup
 * @extends SimletGroup
 * @description Handles session allocation with date validation to prevent conflicts.
 * Ensures participants are assigned to non-overlapping session schedules.
 */
export class SessionAllocatorSimletGroup extends SimletGroup {
    /**
     * Gets the allocator type identifier
     * 
     * @static
     * @returns {string} The session allocator type string
     * @description Returns the specific type identifier for session allocators.
     */
    static getType(){
        return 'session';
    }
    
    /**
     * Gets the human-readable name for this allocator type
     * 
     * @static
     * @returns {string} The session allocator type name
     * @description Returns a user-friendly name for session allocation strategy.
     */
    static getName(){
        return 'Session Allocator';
    }
    
    /**
     * Gets a description of this allocator type
     * 
     * @static
     * @returns {string} The session allocator description
     * @description Explains how session allocation with date validation works.
     */
    static getDescription(){
        return 'An allocator that assigns the users to all sessions and check if the date dont overlap.';
    }

    /**
     * Gets utility functions specific to session allocation for a given user
     * 
     * @static
     * @async
     * @returns {Promise<object>} Object containing session allocation utility functions
     * @description Returns functions for session allocation with date conflict prevention.
     */
    static async getUtils(){
        return super.getUtils();
    }

    async getDetails(){
        return {};
    }

    async allocate(sessionsids: number[]): Promise<void> {
        logger.debug({ sessionsids }, 'SessionAllocator.allocate started');
        if(!Array.isArray(sessionsids)) {
            logger.debug({ sessionsids, type: typeof sessionsids }, 'SessionAllocator.allocate invalid sessionsids type');
            throw new ValidationError("Not valid");
        }
        for(const sessionId of sessionsids) {
            if(typeof sessionId !== 'number') {
                logger.debug({ sessionId, type: typeof sessionId }, 'SessionAllocator.allocate invalid sessionId type');
                throw new ValidationError("Not valid");
            }
            super.allocateToDefault(sessionId);
        }
    }
}