import { RandomPercentages } from "../allocators/RandomPercentages";
import { SimletGroup } from "./SimletGroup";

/**
 * Random Allocator mapper class extending base Allocator.
 * Implements random assignment of participants to sessions/conditions.
 * 
 * @class RandomAllocatorSimletGroup
 * @extends SimletGroup
 * @description Handles random allocation strategies for distributing participants
 * across different experimental conditions or sessions in a study.
 */
export class RandomAllocatorSimletGroup extends SimletGroup {
    percentages: RandomPercentages[] = [];

    /**
     * Gets the allocator type identifier
     * 
     * @static
     * @returns {string} The random allocator type string
     * @description Returns the specific type identifier for random allocators.
     */
    static getType(){
        return 'random';
    }

    /**
     * Gets the human-readable name for this allocator type
     * 
     * @static
     * @returns {string} The random allocator type name
     * @description Returns a user-friendly name for random allocation strategy.
     */
    static getName(){
        return 'Random Allocator';
    }

    /**
     * Gets a description of this allocator type
     * 
     * @static
     * @returns {string} The random allocator description
     * @description Explains how random allocation works.
     */
    static getDescription(){
        return 'An allocator that randomly assigns users to sessions.';
    }

    /**
     * Gets utility functions specific to random allocation for a given user
     * 
     * @static
     * @async
     * @returns {Promise<object>} Object containing random allocation utility functions
     * @description Returns functions for performing random allocation operations.
     */
    static async getUtils(){
        return super.getUtils();
    }

    /**
     * Gets detailed information about this random allocator instance
     * 
     * @async
     * @returns {Promise<object>} Object containing allocator details
     * @description Returns allocation-specific details and statistics.
     */
    async getDetails(){
        return {};
    }
}