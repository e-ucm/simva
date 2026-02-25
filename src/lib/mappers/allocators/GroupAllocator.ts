import { db } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/errors/appErrors";
import { Allocator } from "@/lib/mappers/allocators/Allocator";

/**
 * Group Allocator mapper class extending base Allocator.
 * Implements group-based assignment of participants to sessions/conditions.
 * 
 * @class GroupAllocator
 * @extends Allocator
 * @description Handles group-based allocation strategies where participants
 * are assigned to conditions based on their group membership.
 */
export class GroupAllocator extends Allocator {
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

    constructor(data: any) {
        super(data);
        // Additional initialization for GroupAllocator if needed
    }
    async init() : Promise<void> {
        super.init();
        // Additional initialization logic for GroupAllocator can be added here if needed in the future
    }

    async allocate(sessionId: number, group_id: number | number[]) {
        if(typeof group_id !== typeof Number) {
            throw new ValidationError("Not valid");
        }
        if(this.allocator_type !== GroupAllocator.getType()) {
            throw new ValidationError("Not valid");
        }
        let foundGroup = await db.Functions.runViewQuery(db.Views.AllocatedParticipants.byAllocatorId, { allocator_id:this.allocator_id, group_id : group_id });
        if(!foundGroup) {
            throw new NotFoundError("Group not found");
        }
        let groupParticipantsToUpdate = await db.Tables.ExperimentalParticipants.findAll({ where: { group_id: group_id, allocator_id : this.allocator_id } })
        if(!groupParticipantsToUpdate) {
            foundGroup.forEach(async (user) => {
                await db.Tables.ExperimentalParticipants.create({ group_id: group_id, participant_id : user.user_id, allocator_id : this.allocator_id, session_id: sessionId });
            })
        } else {
            if(groupParticipantsToUpdate[0].session_id == sessionId) {
                return;
            }
            groupParticipantsToUpdate.forEach(async (user) => {
                await user.update({session_id : sessionId});
            })
        }
    }

    toJSON(): object {
        return {
            ...super.toJSON(),
            allocator_type: GroupAllocator.getType()
        }
    }
}   