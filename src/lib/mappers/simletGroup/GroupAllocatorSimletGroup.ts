import { SimletGroup } from "./SimletGroup";

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
}