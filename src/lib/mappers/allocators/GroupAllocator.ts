import { db } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";
import { Allocator } from "@/lib/mappers/allocators/Allocator";
import { ActivityCompletion } from "@/lib/mappers/ActivityCompletion/ActivityCompletion";
import { Session } from "../session/Session";

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

    constructor(data: any, current_user_id : number) {
        super(data, current_user_id);
        // Additional initialization for GroupAllocator if needed
    }
    async init() : Promise<void> {
        await super.init();
        // Additional initialization logic for GroupAllocator can be added here if needed in the future
    }

    async allocate(sessionId: number, group_id: number | number[]) {
        logger.debug({ allocator_id: this.allocator_id, sessionId, group_id }, 'GroupAllocator.allocate started');
        if(typeof group_id !== 'number') {
            logger.debug({ group_id, type: typeof group_id }, 'GroupAllocator.allocate invalid group_id type');
            throw new ValidationError("Not valid");
        }
        if(this.allocator_type !== GroupAllocator.getType()) {
            logger.debug({ allocator_type: this.allocator_type, expected: GroupAllocator.getType() }, 'GroupAllocator.allocate type mismatch');
            throw new ValidationError("Not valid");
        }
        let foundGroup = await db.Functions.runViewQuery(db.Views.AllocatedParticipants.byAllocatorId, { allocator_id:this.allocator_id, group_id : group_id });
        logger.debug({ 
            foundGroupCount: foundGroup?.length ?? 0,
            foundGroupUsers: foundGroup?.map((u: any) => ({ user_id: u.user_id, username: u.username, group_id: u.group_id })) ?? []
        }, 'GroupAllocator.allocate foundGroup query result');
        if(!foundGroup || foundGroup.length === 0) {
            return;
        }
        let groupParticipantsToUpdate = await db.Tables.ExperimentalParticipants.findAll({ where: { group_id: group_id, allocator_id : this.allocator_id } })
        logger.debug({ 
            existingParticipantsCount: groupParticipantsToUpdate.length,
            existingParticipants: groupParticipantsToUpdate.map((p) => ({ 
                allocator_id: p.allocator_id, 
                group_id: p.group_id, 
                participant_id: p.participant_id, 
                session_id: p.session_id 
            }))
        }, 'GroupAllocator.allocate existing participants');
        if(groupParticipantsToUpdate.length === 0) {
            logger.debug({ 
                usersToCreate: foundGroup.length,
                newParticipants: foundGroup.map((u: any) => ({ 
                    allocator_id: this.allocator_id, 
                    group_id: group_id, 
                    participant_id: u.user_id, 
                    session_id: sessionId 
                }))
            }, 'GroupAllocator.allocate creating new participants');
            const createResults = await Promise.all(foundGroup.map(async (user: any) => {
                const created = await db.Tables.ExperimentalParticipants.create({ 
                    group_id: group_id, 
                    participant_id: user.user_id, 
                    allocator_id: this.allocator_id, 
                    session_id: sessionId 
                });
                logger.debug({ 
                    created: { 
                        allocator_id: created.allocator_id, 
                        group_id: created.group_id, 
                        participant_id: created.participant_id, 
                        session_id: created.session_id 
                    }
                }, 'GroupAllocator.allocate participant created');
                return created;
            }));
            logger.debug({ sessionId, group_id, createdCount: createResults.length }, 'GroupAllocator.allocate created participants');
        } else {
            if(groupParticipantsToUpdate[0].session_id === sessionId) {
                logger.debug({ sessionId, currentSessionId: groupParticipantsToUpdate[0].session_id }, 'GroupAllocator.allocate already allocated to session, skipping');
                return;
            }
            logger.debug({ 
                usersToUpdate: groupParticipantsToUpdate.length, 
                sessionId,
                previousSessionId: groupParticipantsToUpdate[0].session_id,
                participantsToUpdate: groupParticipantsToUpdate.map((p) => ({ 
                    participant_id: p.participant_id, 
                    old_session_id: p.session_id, 
                    new_session_id: sessionId 
                }))
            }, 'GroupAllocator.allocate updating participants (delete+create since session_id is PK)');
            // session_id is part of the composite primary key, so we must delete and recreate
            const updateResults = await Promise.all(groupParticipantsToUpdate.map(async (participant) => {
                const oldSessionId = participant.session_id;
                const participantData = {
                    allocator_id: participant.allocator_id,
                    group_id: participant.group_id,
                    participant_id: participant.participant_id,
                    session_id: sessionId
                };
                // Delete old record
                await participant.destroy();
                logger.debug({ 
                    participant_id: participant.participant_id,
                    old_session_id: oldSessionId
                }, 'GroupAllocator.allocate participant deleted');
                // Create new record with updated session_id
                const newParticipant = await db.Tables.ExperimentalParticipants.create(participantData);
                logger.debug({ 
                    participant_id: newParticipant.participant_id,
                    group_id: newParticipant.group_id,
                    allocator_id: newParticipant.allocator_id,
                    old_session_id: oldSessionId,
                    new_session_id: newParticipant.session_id
                }, 'GroupAllocator.allocate participant recreated with new session');
                let session = await Session.getFromDbData(this.simlet_id, newParticipant.session_id, this.current_user_id);
                await session.addParticipantsToAllActivities([participant.participant_id]);
                return newParticipant;
            }));
            logger.debug({ sessionId, group_id, updatedCount: updateResults.length }, 'GroupAllocator.allocate updated participants');
        }
    }

    toJSON(): object {
        return {
            ...super.toJSON(),
            allocator_type: GroupAllocator.getType()
        }
    }
}   