import { db } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/errors/appErrors";
import { Allocator } from "@/lib/mappers/allocators/Allocator";

/**
 * Session Allocator mapper class extending base Allocator.
 * Implements session-based assignment ensuring no date overlaps between sessions.
 * 
 * @class SessionAllocator
 * @extends Allocator
 * @description Handles session allocation with date validation to prevent conflicts.
 * Ensures participants are assigned to non-overlapping session schedules.
 */
export class SessionAllocator extends Allocator {
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
     * @param {string} username - The username to get utilities for
     * @returns {Promise<object>} Object containing session allocation utility functions
     * @description Returns functions for session allocation with date conflict prevention.
     */
    static async getUtils(username : string){
        return {};
    }

    async getDetails(){
        return {};
    }

    constructor(data: any) {
        super(data);
        // Additional initialization for SessionAllocator if needed
    }

    async init() : Promise<void> {
        super.init();
        // Additional initialization logic for SessionAllocator can be added here if needed in the future
    }


    async allocate(sessionId: number, groups_id: number | number[]) {
        const foundGroups = await db.Functions.runViewQuery(db.Views.AllocatedParticipants.byAllocatorId, { allocator_id:this.allocator_id, groups_id : groups_id });
        if(!foundGroups || foundGroups.length === 0) {
            throw new NotFoundError("Groups not found");
        }
        const groupParticipants = await db.Tables.ExperimentalParticipants.findAll({ where: { session_id : sessionId, allocator_id : this.allocator_id } });
        const existingParticipantIds = new Set(groupParticipants.map((participant) => participant.participant_id));
        const groupParticipantsToCreate = foundGroups.filter((user: { user_id: number }) => !existingParticipantIds.has(user.user_id));

        await Promise.all(
            groupParticipantsToCreate.map((user: { group_id: number; user_id: number }) =>
                db.Tables.ExperimentalParticipants.create({
                    group_id: user.group_id,
                    participant_id: user.user_id,
                    allocator_id: this.allocator_id,
                    session_id: sessionId,
                })
            )
        );

    }

}