import { db } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";
import { Allocation } from "./Allocation";
import { ActivityCompletion } from "@/lib/mappers/ActivityCompletion/ActivityCompletion";

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

    allocation: Allocation[] = [];

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
     * @returns {Promise<object>} Object containing utility functions
     * @description Returns allocator-specific utility functions. Base implementation returns empty object.
     */
    static async getUtils(){
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
        this.allocation = await Allocation.getAllFromDbData(this.allocator_id, this.allocator_type);
        logger.debug({ allocator_id: this.allocator_id, allocationCount: this.allocation.length, allocation: this.allocation }, 'Allocator initialized with allocations');
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
        logger.debug({ allocator_id: this.allocator_id, sessionId, object_id }, 'Allocator.allocate started');
        if(typeof object_id !== 'number') {
            logger.debug({ object_id, type: typeof object_id }, 'Allocator.allocate invalid object_id type');
            throw new ValidationError("Not valid");
        }
        if(this.allocator_type !== Allocator.getType()) {
            logger.debug({ allocator_type: this.allocator_type, expected: Allocator.getType() }, 'Allocator.allocate type mismatch');
            throw new ValidationError("Not valid");
        }
        let foundParticipant = await db.Functions.runViewQuery(db.Views.AllocatedParticipants.byAllocatorId, { allocator_id:this.allocator_id, user_id: object_id });
        logger.debug({ foundParticipantCount: foundParticipant?.length ?? 0 }, 'Allocator.allocate foundParticipant query result');
        if(!foundParticipant || foundParticipant.length === 0) {
            throw new NotFoundError("participant not found");
        }
        let groupId = foundParticipant[0].group_id as number;
        let participantToUpdate = await db.Tables.ExperimentalParticipants.findOne({ where: { group_id : groupId, participant_id : object_id, allocator_id : this.allocator_id } })
        logger.debug({ participantExists: !!participantToUpdate, groupId }, 'Allocator.allocate participant lookup');
        if(!participantToUpdate) {
            logger.debug({ groupId, object_id, sessionId }, 'Allocator.allocate creating new participant');
            await db.Tables.ExperimentalParticipants.create({ group_id : groupId, participant_id : object_id, allocator_id : this.allocator_id, session_id: sessionId });
            logger.debug({ sessionId, object_id }, 'Allocator.allocate created participant');
        } else {
            if(participantToUpdate.session_id === sessionId) {
                logger.debug({ sessionId }, 'Allocator.allocate already allocated to session, skipping');
                return;
            }
            // session_id is part of the composite primary key, so we must delete and recreate
            const oldSessionId = participantToUpdate.session_id;
            const participantData = {
                allocator_id: participantToUpdate.allocator_id,
                group_id: participantToUpdate.group_id,
                participant_id: participantToUpdate.participant_id,
                session_id: sessionId
            };
            logger.debug({ sessionId, object_id, oldSessionId }, 'Allocator.allocate updating participant (delete+create)');
            await participantToUpdate.destroy();
            await db.Tables.ExperimentalParticipants.create(participantData);
            logger.debug({ sessionId, object_id, oldSessionId }, 'Allocator.allocate updated participant');
        }
    }

    async allocateToDefault(defaultSession: number) {
        logger.debug({ allocator_id: this.allocator_id, defaultSession }, 'Allocator.allocateToDefault started');
        let founds = await db.Functions.runViewQuery(db.Views.AllocatedParticipants.byAllocatorId, { allocator_id:this.allocator_id });
        logger.debug({ foundUsersCount: founds?.length ?? 0 }, 'Allocator.allocateToDefault found users');
        let allocateParticipantsToUpdate = await db.Tables.ExperimentalParticipants.findAll({ where: { allocator_id : this.allocator_id } })
        logger.debug({ existingParticipantsCount: allocateParticipantsToUpdate.length }, 'Allocator.allocateToDefault existing participants');
        if(allocateParticipantsToUpdate.length === 0) {
            logger.debug({ usersToCreate: founds?.length ?? 0, defaultSession }, 'Allocator.allocateToDefault creating participants');
            await Promise.all(founds.map((user) =>
                db.Tables.ExperimentalParticipants.create({ group_id: user.group_id, participant_id : user.user_id, allocator_id : this.allocator_id, session_id: defaultSession })
            ));
            logger.debug({ defaultSession }, 'Allocator.allocateToDefault created participants');
        } else {
            // session_id is part of the composite primary key, so we must delete and recreate
            logger.debug({ usersToUpdate: allocateParticipantsToUpdate.length, defaultSession }, 'Allocator.allocateToDefault updating participants (delete+create)');
            await Promise.all(allocateParticipantsToUpdate.map(async (user) => {
                const participantData = {
                    allocator_id: user.allocator_id,
                    group_id: user.group_id,
                    participant_id: user.participant_id,
                    session_id: defaultSession
                };
                await user.destroy();
                await db.Tables.ExperimentalParticipants.create(participantData);
                await ActivityCompletion.createAllFromSession(defaultSession, [user.participant_id]);
            }));
            logger.debug({ defaultSession }, 'Allocator.allocateToDefault updated participants');
        }
    }

    printInfo() {
        logger.info({allocator : this}, `Allocator ID: ${this.allocator_id}, Type: ${this.allocator_type}`);
    }

    toJSON(): object {
        // For group allocator, merge into single map {session_id: group_id, ...}
        const allocations = this.allocator_type === 'group'
            ? Object.assign({}, ...this.allocation.map(a => a.toJSON()))
            : this.allocation.map(allocation => allocation.toJSON());
        
        return {
            allocator_type: this.allocator_type,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            allocations
        }
    }
}