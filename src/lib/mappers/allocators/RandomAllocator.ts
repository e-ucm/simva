import { Allocator } from "@/lib/mappers/allocators/Allocator";
import { RandomPercentages } from "@/lib/mappers/allocators/RandomPercentages";
import { ValidationError } from "@/lib/errors/appErrors";

/**
 * Random Allocator mapper class extending base Allocator.
 * Implements random assignment of participants to sessions/conditions.
 * 
 * @class RandomAllocator
 * @extends Allocator
 * @description Handles random allocation strategies for distributing participants
 * across different experimental conditions or sessions in a study.
 */
export class RandomAllocator extends Allocator {
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
     * @param {string} username - The username to get utilities for
     * @returns {Promise<object>} Object containing random allocation utility functions
     * @description Returns functions for performing random allocation operations.
     */
    static async getUtils(username : string){
        return {};
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
    
    /**
     * Creates a new RandomAllocator instance
     * 
     * @param {any} data - Raw data object containing allocator properties
     * @description Initializes random allocator with parent class constructor.
     */
    constructor(data: any) {
        super(data);
        // Additional initialization for RandomAllocator if needed
    }

    async init() : Promise<void> {
        super.init();
        this.percentages = await RandomPercentages.getAllFromDbData(this.allocator_id);
        // Additional initialization logic for RandomAllocator can be added here if needed in the future
    }

    async allocate(sessionId: number, object_id: number) {
        throw new ValidationError("Not implemented");
    }

    toJSON(): object {
        return {
            ...super.toJSON(),
            allocator_type: RandomAllocator.getType(),
            percentages: this.percentages.map(p => p.toJSON())
        }
    }
}