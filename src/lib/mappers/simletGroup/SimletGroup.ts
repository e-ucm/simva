import { db } from "@/lib/db";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";
import { SimletParticipant } from "../simlet/SimletParticipant";
import { Allocation } from "../allocators/Allocation";
// Note: SimletGroupAllocatorToClass is dynamically imported to avoid circular dependency

/**
 * Simlet Group mapper class representing a group assignment within a study (simlet).
 * Maps groups to studies with participant information and permissions.
 * 
 * @class SimletGroup
 * @description Manages the relationship between groups and studies,
 * including participant lists and permission management.
 */
export class SimletGroup {
    /**
     * ID of the simlet (study) this group is assigned to
     */
    simlet_id: number;
    
    /**
     * ID of the group
     */
    group_id: number;
    
    /**
     * Name of the group for display purposes
     */
    group_name: string;

    group_use_new_generation: boolean;
    group_sandbox: boolean;
    group_allocator_type: string;
    /**
     * Array of participant identifiers in this group
     */
    participants: string[];

    createdAt?: Date;

    updatedAt?: Date;

    allocation: Allocation[] = [];

    group_owner_id : number;
    group_owner_username: string;

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
     * Creates a new SimletGroup instance
     * 
     * @param {any} data - Raw data object containing group and study relationship properties
     * @description Initializes group-study relationship and parses participant arrays from string format.
     * Uses database utility functions to properly convert string arrays to typed arrays.
     */
    constructor(data: any) {
        this.simlet_id = data.simlet_id;
        this.group_id = data.group_id;
        this.group_name = data.group_name;
        this.participants = [];
        this.group_sandbox = data.group_sandbox || false;
        this.group_owner_id = data.group_owner_id || 0;
        this.group_owner_username = data.group_owner_username || "";
        this.createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : undefined;
        this.group_use_new_generation = Boolean(data.group_use_new_generation);
        this.group_allocator_type = data.group_allocator_type;
    }

    async init() {
        //Additional initialization logic can be added here if needed in the future
        const participantIds = await db.Functions.runViewQuery(db.Views.GroupParticipant.IdsByGroupId, { group_id: this.group_id })
        this.participants = participantIds.map((row: any) => row.participant_id) || [];
        this.allocation = await Allocation.getFromDbData(this.simlet_id, this.group_id, this.group_allocator_type);
        logger.debug({ allocationCount: this.allocation.length, allocation: this.allocation }, 'Group initialized with allocations');
    }

    static async createInDb(simlet_id: number, body: Partial<SimletGroup>, current_user_id: number): Promise<SimletGroup> {
        const newGroupName = typeof body.group_name === "string" ? body.group_name.trim() : null;
        if(!newGroupName) {
            throw new ValidationError("Group name is required");
        }
        let count = await db.Tables.Group.count({where: {simlet_id, group_name: newGroupName }});
        if(count > 0) {
            throw new ConflictError("Group name must be unique");
        }
        body.simlet_id = simlet_id;
        body.group_owner_id = current_user_id;
        body.group_use_new_generation = Boolean(body.group_use_new_generation);
        body.group_sandbox = body.group_sandbox ?? false;
        body.group_allocator_type = body.group_allocator_type ?? "group";
        let createdGroup = await db.Tables.Group.create(body);
        return await SimletGroup.getFromDbData(createdGroup.simlet_id, createdGroup.group_id);
    }

    static async getCurrentUserAllFromDbData(current_user_id: number, version: boolean | undefined, limit: number | undefined, offset: number | undefined, searchString: string | undefined): Promise<SimletGroup[]> {
        const { SimletGroupAllocatorToClass } = await import("./GroupAllocatorToClass");
        let groups;
        if(limit != undefined && offset != undefined) {
            groups = await db.Functions.runViewQuery(db.Views.Group.byVersionAndUserIdWithPagination, { current_user_id, version, search : searchString, limit, offset});
        } else {
            groups = await db.Functions.runViewQuery(db.Views.Group.byVersionAndUserId, { current_user_id, search : searchString, version });
        } 
        return Promise.all(groups.map(async (groupData: any) => { 
            const group = await SimletGroupAllocatorToClass(groupData);
            await group.init();
            return group;
        }));
    }

    static async getAllFromDbData(simlet_id: number): Promise<SimletGroup[]> {
        const { SimletGroupAllocatorToClass } = await import("./GroupAllocatorToClass");
        const groups = await db.Functions.runViewQuery(
            db.Views.Group.bySimletId,
            { simlet_id }
        );
        logger.debug({groups} , "Groups data from view");
        return Promise.all(groups.map(async (group: any) => {
            const simletGroup = await SimletGroupAllocatorToClass(group);
            await simletGroup.init();
            return simletGroup;
        }));
    }

    static async getFromDbData(simlet_id: number, group_id: number) : Promise<SimletGroup> {
        const { SimletGroupAllocatorToClass } = await import("./GroupAllocatorToClass");
        let simletGroupData = await db.Tables.Group.findOne({ where: { simlet_id, group_id } });
        if (!simletGroupData) {
            throw new NotFoundError(`SimletGroup with simlet_id ${simlet_id} and group_id ${group_id} not found`);
        }
        const simletGroup = await SimletGroupAllocatorToClass(simletGroupData);
        await simletGroup.init();
        return simletGroup;
    }
    
    async addParticipant(participantId: number) : Promise<SimletGroup> {
        let participant = await SimletParticipant.addToGroup(this.group_id, participantId);
        return this;
    }

    async delete(): Promise<void> {
        let simletGroup = await db.Tables.Group.findOne({ where: { simlet_id: this.simlet_id, group_id: this.group_id } });
        if (!simletGroup) {
            throw new NotFoundError(`SimletGroup with simlet_id ${this.simlet_id} and group_id ${this.group_id} not found`);
        }
        await simletGroup.destroy();
    }

    /**
     * Prints debugging information about this group instance
     * 
     * @returns {void}
     * @description Logs group information to debug output for troubleshooting.
     */
    
    printInfo(): void {
        logger.debug({ SimletGroup : this }, `SimletGroup information - Simlet ID: ${this.simlet_id}, Group ID: ${this.group_id}, Group Name: ${this.group_name}`);
    }

    static async getGroupCountForUser(current_user_id: number, searchString?: string ): Promise<number> {
        const results = await db.Functions.runViewQuery(db.Views.Group.countByUserId, { current_user_id, search: searchString });
        return results[0].count || 0;
    }

    /**
     * Retrieves all participants (members) of this group.
     * Returns full participant objects with usernames and metadata.
     * 
     * @async
     * @method getParticipants
     * @returns {Promise<SimletParticipant[]>} Promise resolving to array of group participants
     * @throws {Error} When participant data cannot be retrieved
     * 
     * @example
     * ```typescript
     * const participants = await group.getParticipants();
     * participants.forEach(p => logger.info(p.username));
     * ```
     */
    async getParticipants(): Promise<SimletParticipant[]> {
        return await SimletParticipant.getGroupAllFromDbData(this.group_id);
    }

    /**
     * Updates group properties in the database.
     * Validates user permissions before allowing modifications.
     * 
     * @async
     * @method update
     * @param {any} body - Object containing fields to update
     * @returns {Promise<Group>} Promise resolving to the updated group instance
     * @throws {AuthentificationError} When user lacks edit permissions
     * @throws {NotFoundError} When group is not found in database
     * 
     * @example
     * ```typescript
     * const updatedGroup = await group.update({
     *   group_name: 'New Group Name',
     *   group_use_new_generation: true
     * });
     * ```
     */
    async update(body: any): Promise<SimletGroup> {
        let group = await db.Tables.Group.findOne({where:{group_id: this.group_id}});
        if(!group) {
            throw new NotFoundError(`Group with ID ${this.group_id} not found for update`);
        }
        await group.update(body);
        Object.assign(this, body);
        return this;
    }

    /**
     * Removes a participant from this group.
     * Validates edit permissions and optionally removes from Keycloak.
     * 
     * @async
     * @method deleteParticipant
     * @param {number} user_id - ID of the user to remove from the group
     * @param {boolean} keycloakDelete - Whether to also delete the user from Keycloak  
     * @returns {Promise<void>} Promise that resolves when participant is removed
     * @throws {AuthentificationError} When user lacks edit permissions
     * @throws {NotFoundError} When participant is not found in group
     * 
     * @example
     * ```typescript
     * await group.deleteParticipant(456, true);
     * ```
     */
    async deleteParticipant(user_id: number, keycloakDelete : boolean): Promise<void> {
        let participant = await SimletParticipant.getFromDbData(this.group_id, user_id);
        participant.delete(keycloakDelete);
    }

    /**
     * Adds a new participant to this group.
     * Validates edit permissions and creates participant with proper generation settings.
     * 
     * @async
     * @method createParticipant
     * @param {Partial<SimletParticipant>} body - Participant data for creation
     * @returns {Promise<SimletParticipant>} Promise resolving to the created participant
     * @throws {AuthentificationError} When user lacks edit permissions
     * @throws {NotFoundError} When participant data is invalid
     * 
     * @example
     * ```typescript
     * const participant = await group.createParticipant({
     *   participant_username: 'newuser',
     *   participant_password: 'password123'
     * });
     * ```
     */
    async createParticipant(body: Partial<SimletParticipant>): Promise<SimletParticipant> {
        let participant = await SimletParticipant.createInDb(this.simlet_id, this.group_id, this.group_use_new_generation, body);
        return participant;
    }

    /**
     * Removes all participants from Keycloak.
     * Iterates through group participants and removes them from Keycloak authentication.
     * 
     * @async
     * @method removeUsersToKeycloak
     * @returns {Promise<void>} Promise that resolves when all users are removed from Keycloak
     * @throws {AuthentificationError} When user lacks edit permissions
     * @throws {Error} When Keycloak operations fail
     * 
     * @example
     * ```typescript
     * await group.removeUsersToKeycloak();
     * ```
     */
    async removeUsersToKeycloak(): Promise<void> {
        let participants = await SimletParticipant.getGroupAllFromDbData(this.group_id);
        for(var i = 0; i < participants.length; i++) {
            participants[i].removeUserToKeycloak();
        }
    }

     /**
     * Permanently deletes this group from the database.
     * Validates delete permissions before removal.
     * 
     * @async
     * @method deleteGroup
     * @returns {Promise<void>} Promise that resolves when group is deleted
     * @throws {AuthentificationError} When user lacks delete permissions
     * @throws {Error} When database deletion fails
     * 
     * @example
     * ```typescript
     * await group.deleteGroup();
     * ```
     */
    async deleteGroup(): Promise<void> {
        await db.Tables.Group.destroy({where: {group_id: this.group_id}});
    }

    async export(withData: boolean): Promise<object> {
        throw new Error("Export functionality not implemented for SimletGroup yet");
    }

    toJSON(): object {
        return {
            simlet_id: this.simlet_id,
            group_id: this.group_id,
            group_name: this.group_name,
            group_allocator_type: this.group_allocator_type,
            group_use_new_generation:this.group_use_new_generation,
            participants: this.participants,
            group_owner_user_id: this.group_owner_id,
            group_owner_username: this.group_owner_username,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt, 
            group_sandbox: this.group_sandbox,
            allocations: this.allocation.reduce((acc, curr) => {
                const json = curr.toJSON() as any;
                acc[json.object_id] = json.session_id;
                return acc;
            }, {} as Record<number, number>)
        };
    }
}