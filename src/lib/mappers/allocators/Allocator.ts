import { db } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";
import { GroupAllocator } from "./GroupAllocator";

/**
 * Base Allocator mapper class for managing participant allocation to sessions.
 * Allocators determine how participants are assigned to different experimental conditions.
 * 
 * @class Allocator
 * @description Base class for all allocator types that handle participant assignment logic.
 * Can be extended by specific allocator types like RandomAllocator, GroupAllocator, etc.
 */
export class Allocator {
    /**
     * ID of the simlet (study) this allocator belongs to
     */
    simlet_id: number;
    
    /**
     * Unique identifier for this allocator
     */
    allocator_id: number;
    
    /**
     * Type of allocator (e.g., 'random', 'group', 'session')
     */
    allocator_type: string;
    
    /**
     * Timestamp when the allocator was created
     */
    createdAt: Date;
    
    /**
     * Timestamp when the allocator was last updated
     */
    updatedAt: Date;

    static async getFromDbData(allocator_id: number) : Promise<Allocator> {
        let allocator = await db.Tables.Allocators.findOne({ where: { allocator_id } });
        if(!allocator){
           throw new NotFoundError(`Allocator with ID ${allocator_id} not found.`);
        }
        let { AllocatorToClass } = await import("@/lib/mappers/allocators/AllocatorToClass");
        return AllocatorToClass(allocator);
    }

    /**
     * Gets the allocator type identifier
     * 
     * @static
     * @returns {string} The allocator type string
     * @description Returns the base allocator type. Should be overridden by subclasses.
     */
    static getType(){
        return 'default';
    }
    
    /**
     * Gets the human-readable name for this allocator type
     * 
     * @static
     * @returns {string} The allocator type name
     * @description Returns a user-friendly name for the allocator type.
     */
    static getName(){
        return 'Default Allocator';
    }

    /**
     * Gets a description of this allocator type
     * 
     * @static
     * @returns {string} The allocator type description
     * @description Returns a detailed description of how this allocator works.
     */
    static getDescription(){
        return 'A basic allocator that allocate to the first session.';
    }

    /**
     * Gets utility functions specific to this allocator type for a given user
     * 
     * @static
     * @async
     * @param {string} username - The username to get utilities for
     * @returns {Promise<object>} Object containing utility functions
     * @description Returns allocator-specific utility functions. Base implementation returns empty object.
     */
    static async getUtils(username : string){
        return {};
    }

    /**
     * Gets detailed information about this allocator instance
     * 
     * @async
     * @returns {Promise<object>} Object containing allocator details
     * @description Returns instance-specific details. Base implementation returns empty object.
     */
    async getDetails(){
        return {};
    }

    /**
     * Creates a new Allocator instance
     * 
     * @param {any} data - Raw data object containing allocator properties
     * @description Initializes allocator properties from provided data object.
     */
    constructor(data: any) {
        this.simlet_id = data.simlet_id;
        this.allocator_id = data.allocator_id;
        this.allocator_type = data.allocator_type;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    async init() : Promise<void> {
        // Base initialization logic can be added here if needed in the future
    }
    
    async update(data: Partial<Allocator>) {
        let allocator = await db.Tables.Allocators.findOne({where : {allocator_id : this.allocator_id}});
        if(allocator) {
            await allocator.update(data);
            return Allocator.getFromDbData(this.allocator_id);
        } else {
            throw new NotFoundError("allocator not found");
        }
    }

    async allocate(sessionId: number, object_id: number | number[]) {
        if(typeof object_id !== typeof Number) {
            throw new ValidationError("Not valid");
        }
        if(this.allocator_type !== Allocator.getType()) {
            throw new ValidationError("Not valid");
        }
        let foundParticipant = await db.Functions.runViewQuery(db.Views.AllocatedParticipants.byAllocatorId, { allocator_id:this.allocator_id, user_id: object_id });
        if(!foundParticipant) {
            throw new NotFoundError("participant not found");
        }
        let groupId = foundParticipant[0].group_id as number;
        let participantToUpdate = await db.Tables.ExperimentalParticipants.findOne({ where: { group_id : groupId, participant_id : object_id, allocator_id : this.allocator_id } })
        if(!participantToUpdate) {
            await db.Tables.ExperimentalParticipants.create({ group_id : groupId, participant_id : object_id, allocator_id : this.allocator_id, session_id: sessionId });
        } else {
            if(participantToUpdate.session_id == sessionId) {
                return;
            }
            await participantToUpdate.update({session_id : sessionId});
        }
    }

    async allocateToDefault(defaultSession: number) {
        let founds = await db.Functions.runViewQuery(db.Views.AllocatedParticipants.byAllocatorId, { allocator_id:this.allocator_id });
        let allocateParticipantsToUpdate = await db.Tables.ExperimentalParticipants.findAll({ where: { allocator_id : this.allocator_id } })
        if(!allocateParticipantsToUpdate) {
            founds.forEach(async (user) => {
                await db.Tables.ExperimentalParticipants.create({ group_id: user.group_id, participant_id : user.user_id, allocator_id : this.allocator_id, session_id: defaultSession });
            })
        } else {
            allocateParticipantsToUpdate.forEach(async (user) => {
                await db.Tables.ExperimentalParticipants.update({session_id: defaultSession }, { where : { group_id: user.group_id, participant_id : user.participant_id, allocator_id : this.allocator_id}});
            })
        }
    }

    printInfo() {
        logger.info({allocator : this}, `Allocator ID: ${this.allocator_id}, Type: ${this.allocator_type}`);
    }

    toJSON(): object {
        return {
            allocator_type: this.allocator_type,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        }
    }
}