import { db } from "@/lib/db";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";
import { SimletParticipant } from "../simlet/SimletParticipant";
import { Allocation } from "../allocators/Allocation";
import { Op } from "sequelize";
import { Session } from "../session/Session";
import { UserPermission } from "../UserPermisions/UserPermission";
// Note: SimletGroupAllocatorToClass is dynamically imported to avoid circular dependency

/**
 * Simlet Group mapper class representing a group assignment within a study (simlet).
 * Maps groups to studies with participant information and permissions.
 * 
 * @class SimletGroup
 * @description Manages the relationship between groups and studies,
 * including participant lists and permission management.
 * 
 * @module lib/mappers/simletGroup/SimletGroup
 * @requires @/lib/db
 * @requires @/lib/errors/appErrors
 * @requires @/lib/logger
 * @requires @/lib/mappers/simlet/SimletParticipant
 * @requires @/lib/mappers/allocators/Allocation
 * @requires @/lib/mappers/session/Session
 * @requires @/lib/mappers/UserPermisions/UserPermission
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
    participants: number[];

    createdAt?: Date;

    updatedAt?: Date;

    allocation: Allocation[] = [];

    group_owner_id : number;
    group_owner_username: string;
    is_admin: boolean = false;
    current_user_id?: number;
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
    constructor(data: any, current_user_id?: number) {
        this.simlet_id = data.simlet_id;
        this.group_id = data.group_id;
        this.group_name = data.group_name;
        this.participants = [];
        this.group_sandbox = data.group_sandbox ? Boolean(data.group_sandbox) : false;
        this.group_owner_id = data.group_owner_id || 0;
        this.group_owner_username = data.group_owner_username || "";
        this.createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : undefined;
        this.group_use_new_generation = Boolean(data.group_use_new_generation);
        this.group_allocator_type = data.group_allocator_type;
        if(current_user_id !== undefined && current_user_id !== null && current_user_id !== 0) {
            this.current_user_id = current_user_id;
            this.is_admin = false;
        } else {
            this.is_admin = true;
        }
    }

    async init() {
        //Additional initialization logic can be added here if needed in the future
        const participantIds = await db.Functions.runViewQuery(db.Views.GroupParticipant.IdsByGroupId, { group_id: this.group_id })
        this.participants = participantIds.map((row: any) => parseInt(row.participant_id as string)) || [];
        this.allocation = await Allocation.getFromDbData(this.simlet_id, this.group_id, this.group_allocator_type);
        logger.debug({ allocationCount: this.allocation.length, allocation: this.allocation }, 'Group initialized with allocations');
    }

    static async getGroupFromCurrentUser(current_user_id: number): Promise<SimletGroup> {
        let groupData = await db.Tables.Group.findOne({ where: { group_owner_id: current_user_id, group_sandbox: true } });
        if(!groupData) {
            throw new NotFoundError("Group not found for current user");
        }
        let group = new SimletGroup(groupData, current_user_id);
        await group.init();
        return group;
    }

    static async createInDb(simlet_id: number, body: Partial<SimletGroup>, current_user_id: number): Promise<SimletGroup> {
        const newGroupName = typeof body.group_name === "string" ? body.group_name.trim() : null;
        if(!newGroupName) {
            throw new ValidationError("Group name is required");
        }
        let count = await db.Tables.Group.count({where: {simlet_id, group_name: newGroupName }});
        if(count > 0) {
            throw new ConflictError("Group name must be unique within the simlet");
        }
        body.simlet_id = simlet_id;
        body.group_owner_id = current_user_id;
        body.group_use_new_generation = Boolean(body.group_use_new_generation);
        body.group_sandbox = body.group_sandbox ?? false;
        body.group_allocator_type = body.group_allocator_type ?? "group";
        let createdGroup = await db.Tables.Group.create(body);
        return await SimletGroup.getFromDbData(createdGroup.simlet_id, createdGroup.group_id, false, current_user_id);
    }

    static async getAdminAllFromDbData(version?: boolean, limit?: number, offset?: number, searchString?: string): Promise<SimletGroup[]> {
        const where: any = {};
        if (searchString) {
            where.group_name = { [Op.like]: `%${searchString}%` };
        }
        if (typeof version === 'boolean') {
            where.group_use_new_generation = version;
        }
        let groups;
        try {
            groups = await db.Tables.Group.findAll({
                where: Object.keys(where).length > 0 ? where : undefined,
                order: [['createdAt', 'DESC']],
                limit: limit,
                offset: offset
            });
        } catch (err) {
            logger.error({err}, 'Error fetching groups in getAdminAllFromDbData');
            throw err;
        }
        return Promise.all(groups.map(async (groupData) => {
            try {
                const group = new SimletGroup(groupData, 0);
                await group.init();
                return group;
            } catch (e) {
                logger.error({e, groupData}, 'Error initializing group in getAdminAllFromDbData');
                throw e;
            }
        }));
    }

    static async getCurrentUserAllFromDbData(current_user_id: number, version?: boolean, limit?: number, offset?: number, searchString?: string): Promise<SimletGroup[]> {
        const { SimletGroupAllocatorToClass } = await import("./GroupAllocatorToClass");
        let groups;
        if(limit != undefined && offset != undefined) {
            groups = await db.Functions.runViewQuery(db.Views.Group.byVersionAndUserIdWithPagination, { current_user_id, version, search : searchString, limit, offset});
        } else {
            groups = await db.Functions.runViewQuery(db.Views.Group.byVersionAndUserId, { current_user_id, search : searchString, version });
        } 
        return Promise.all(groups.map(async (groupData: any) => { 
            const group = await SimletGroupAllocatorToClass(groupData, current_user_id);
            await group.init();
            return group;
        }));
    }

    static getOrderNameColumn(orderBy?: string): string {
        if(!orderBy) {
            return "group_id";
        }
        const orderColumns = {
            id: "group_id",
            name: "group_name",
            createdAt: "createdAt",
            updatedAt: "updatedAt",
        } as Record<string, string>;
        if(orderBy in orderColumns) {
            return orderColumns[orderBy];
        }
        return "group_id";
    }

    static getOrder(order?: string): "ASC" | "DESC" {
        if(!order) {
            return "ASC";
        }
        const orderOptions = ["ASC", "DESC"];
        if(orderOptions.includes(order.toUpperCase())) {
            return order.toUpperCase() as "ASC" | "DESC";
        }
        return "ASC";
    }

    static async getAllFromDbData(simlet_id: number, current_user_id?: number, searchString?: string, sandbox?: boolean, limit?: number, offset?: number, orderBy?: string, order?: string ): Promise<SimletGroup[]> {
        const { SimletGroupAllocatorToClass } = await import("./GroupAllocatorToClass");
        let groups; 
        if(limit != undefined && offset != undefined) {
            groups = await db.Functions.runViewQuery(
                db.Views.Group.bySimletIdWithPagination,
                { simlet_id, search: searchString, sandbox, limit, offset },
                SimletGroup.getOrderNameColumn(orderBy),
                SimletGroup.getOrder(order)
            );
        } else {
            groups = await db.Functions.runViewQuery(
                db.Views.Group.bySimletId,
                { simlet_id, search: searchString, sandbox },
                SimletGroup.getOrderNameColumn(orderBy),
                SimletGroup.getOrder(order)
            );
        }
        logger.debug({groups} , "Groups data from view");
        return Promise.all(groups.map(async (group: any) => {
            const simletGroup = await SimletGroupAllocatorToClass(group, current_user_id);
            await simletGroup.init();
            return simletGroup;
        }));
    }

    static async getFromDbData(simlet_id: number, group_id: number, is_admin: boolean, current_user_id?: number) : Promise<SimletGroup> {
        const { SimletGroupAllocatorToClass } = await import("./GroupAllocatorToClass");
        let simletGroupData = await db.Tables.Group.findOne({ where: { simlet_id, group_id } });
        if (!simletGroupData) {
            throw new NotFoundError(`SimletGroup with simlet_id ${simlet_id} and group_id ${group_id} not found`);
        }
        const simletGroup = await SimletGroupAllocatorToClass(simletGroupData, is_admin ? 0 : current_user_id);
        await simletGroup.init();
        return simletGroup;
    }
    
    async addParticipant(participantId: number) : Promise<SimletGroup> {
        if(!this.group_sandbox) {
            let owners = await UserPermission.getFromDbData('simlet', this.simlet_id, this.current_user_id);
            if(this.current_user_id === participantId) {
                throw new NotFoundError(`Cannot add yourself as participant to your own sandbox group`);
            } else if(owners.permissions.find((p) => p.user_id === participantId) !== undefined) {
                throw new ValidationError(`Cannot add an coordinator as participant if you are an owner of the simlet`);
            }
        }
        
        // Check if participant is already assigned to any group within this simlet
        const existingAssignment = await db.Tables.ExperimentalParticipants.findOne({
            where: { 
                simlet_id: this.simlet_id, 
                participant_id: participantId 
            }
        });
        if (existingAssignment) {
            throw new ConflictError(`Participant with ID ${participantId} is already assigned to a group within this simlet`);
        }
        
        await SimletParticipant.addToGroup(this.group_id, participantId);
        const targetSessionId = await this.resolveTargetSessionId(participantId);
        await db.Tables.ExperimentalParticipants.upsert({
            simlet_id: this.simlet_id,
            group_id: this.group_id,
            participant_id: participantId,
            session_id: targetSessionId,
        });
        await this.syncParticipantActivityCompletions(participantId, undefined, targetSessionId);
        return this;
    }

    private async resolveTargetSessionId(participantId?: number): Promise<number> {
        if (this.group_allocator_type === 'group' || this.group_allocator_type === 'session') {
            const allocation = participantId !== undefined
                ? await db.Tables.ExperimentalParticipants.findOne({
                    where: { simlet_id: this.simlet_id, group_id: this.group_id, participant_id: participantId }
                })
                : this.allocation[0];

            if (allocation?.session_id) {
                return allocation.session_id;
            }

            if (this.allocation.length > 0 && this.allocation[0]?.session_id) {
                return this.allocation[0].session_id;
            }
        }

        return await Session.getDefaultSessionId(this.simlet_id);
    }

    getGroupParticipantsCount(): number {
        return this.participants.length;
    }

    private async syncParticipantActivityCompletions(
        participantId: number,
        previousSessionId: number | null | undefined,
        nextSessionId: number | null
    ): Promise<void> {
        if (previousSessionId && previousSessionId !== nextSessionId) {
            const previousSession = await Session.getFromDbData(this.simlet_id, previousSessionId, this.is_admin, this.current_user_id);
            await previousSession.removeParticipantsFromAllActivities([participantId]);
        }
        if(!nextSessionId || nextSessionId === -1) {
            return;
        }
        const nextSession = await Session.getFromDbData(this.simlet_id, nextSessionId, this.is_admin, this.current_user_id);
        await nextSession.addParticipantsToAllActivities([participantId]);
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

    static async getGroupCountForUser(simlet_id: number, current_user_id: number, searchString?: string, sandbox?: boolean): Promise<number> {
        const results = await db.Functions.runViewQuery(db.Views.Group.countByUserId, { simlet_id, current_user_id, search: searchString, sandbox });
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
    private async hasSimletRoleForParticipant(participantId: number): Promise<boolean> {
        const permissionRows = await db.Functions.runViewQuery(
            db.Views.Simlet.byUserIdAndSimletId,
            { current_user_id: participantId, simlet_id: this.simlet_id }
        );
        if (!permissionRows || permissionRows.length === 0) {
            return false;
        }
        const permission = String(permissionRows[0].current_user_permission || "").toUpperCase();
        return permission.length > 0;
    }

    async deleteParticipant(user_id: number, keycloakDelete : boolean): Promise<void> {
        let participant = await SimletParticipant.getFromDbData(this.group_id, user_id);
        const allocation = await db.Tables.ExperimentalParticipants.findOne({
            where: { simlet_id: this.simlet_id, group_id: this.group_id, participant_id: user_id }
        });
        if (allocation) {
            const session = await Session.getFromDbData(this.simlet_id, allocation.session_id, this.is_admin, this.current_user_id);
            await session.removeParticipantsFromAllActivities([user_id]);
            await allocation.destroy();
        } else if (await this.hasSimletRoleForParticipant(user_id)) {
            // User has a simlet role (e.g. teacher self-added as tester) but no allocation record —
            // remove from all sessions' activities so LimeSurvey tokens are deleted and can be re-created later
            const sessionRows = await db.Functions.runViewQuery(
                db.Views.Session.IdsBySimletId,
                { simlet_id: this.simlet_id },
                "session_order", "ASC"
            );
            for (const row of sessionRows || []) {
                const session = await Session.getFromDbData(this.simlet_id, row.session_id, this.is_admin, this.current_user_id);
                await session.removeParticipantsFromAllActivities([user_id]);
            }
        }
        await participant.delete(keycloakDelete);
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
        const targetSessionId = await this.resolveTargetSessionId(participant.user_id);
        if(targetSessionId === -1) {
            return participant;
        }
        await db.Tables.ExperimentalParticipants.upsert({
            simlet_id: this.simlet_id,
            group_id: this.group_id,
            participant_id: participant.user_id,
            session_id: targetSessionId,
        });
        await this.syncParticipantActivityCompletions(participant.user_id, undefined, targetSessionId);
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
    
    async allocateToSession(sessionId: number, participant_id: number): Promise<void> {
        if(typeof participant_id !== 'number') {
            logger.debug({ participant_id, type: typeof participant_id }, 'Allocator.allocate invalid participant_id type');
            throw new ValidationError("Not valid");
        }
        //if(this.group_allocator_type !== SimletGroup.getType()) {
        //    logger.debug({ allocator_type: this.group_allocator_type, expected: SimletGroup.getType() }, 'Allocator.allocate type mismatch');
        //    throw new ValidationError("Not valid");
        //}
        const participantGroupFound = this.participants.find(p => p === participant_id);
        logger.debug({ participant_id, participantGroupFound }, 'Allocator.allocate participant membership check');
        if(!participantGroupFound) {
            throw new NotFoundError(`Participant with id ${participant_id} not found`);
        }
        let participantToUpdate = await db.Tables.ExperimentalParticipants.findOne({ where: { simlet_id: this.simlet_id, group_id : this.group_id, participant_id : participant_id } })
        logger.debug({ participantExists: !!participantToUpdate, group_id: this.group_id }, 'Allocator.allocate participant lookup');
        if(!participantToUpdate) {
            logger.debug({ group_id: this.group_id, participant_id, sessionId }, 'Allocator.allocate creating new participant');
            await db.Tables.ExperimentalParticipants.create({ simlet_id: this.simlet_id, group_id : this.group_id, participant_id : participant_id, session_id: sessionId });
            logger.debug({ sessionId, participant_id }, 'Allocator.allocate created participant');
        } else {
            if(participantToUpdate.session_id === sessionId) {
                logger.debug({ sessionId }, 'Allocator.allocate already allocated to session, skipping');
                return;
            }
            const oldSessionId = participantToUpdate.session_id;
            logger.debug({ sessionId, participant_id, oldSessionId }, 'Allocator.allocate updating participant session');
            await participantToUpdate.update({ session_id: sessionId });
            await this.syncParticipantActivityCompletions(participant_id, oldSessionId, sessionId);
            logger.debug({ sessionId, participant_id, oldSessionId }, 'Allocator.allocate updated participant');
        }
        if(!participantToUpdate) {
            await this.syncParticipantActivityCompletions(participant_id, undefined, sessionId);
        }
    }

    async allocateToDefault(defaultSession: number) {
        logger.debug({ 
            defaultSession, 
            simlet_id: this.simlet_id, 
            group_id: this.group_id,
            allocatorType: this.group_allocator_type,
            participantsCount: this.participants.length,
            participants: this.participants 
        }, 'Allocator.allocateToDefault starting');

        // If group allocator type is 'group', use Experimental_Groups table
        if (!(this.group_allocator_type === 'group')) {
            // If not group mode, ensure no group assignment exists
            await db.Tables.ExperimentalGroups.destroy({
                where: {
                    simlet_id: this.simlet_id,
                    group_id: this.group_id
                }
            });
            logger.debug({ simlet_id: this.simlet_id, group_id: this.group_id }, 'Allocator.allocateToDefault: not group mode, cleared Experimental_Groups');
        } else {
            logger.debug({ defaultSession, group_id: this.group_id }, 'GroupAllocator.allocateToDefault started');
            // Always create group-level assignment for group allocator
            await db.Tables.ExperimentalGroups.destroy({
                where: {
                    simlet_id: this.simlet_id,
                    group_id: this.group_id
                }
            });
            await db.Tables.ExperimentalGroups.create({
                simlet_id: this.simlet_id,
                group_id: this.group_id,
                session_id: defaultSession
            });
            logger.debug({ simlet_id: this.simlet_id, group_id: this.group_id, session_id: defaultSession }, 'GroupAllocatorSimletGroup.allocateToDefault: group assignment created in Experimental_Groups');
            // Refresh internal allocation state from database
            this.allocation = await Allocation.getFromDbData(this.simlet_id, this.group_id, this.group_allocator_type);
            logger.debug({ defaultSession, allocationCount: this.allocation.length }, 'GroupAllocatorSimletGroup.allocateToDefault synchronized group allocation');
            // Call super to handle any additional logic (if needed)
        }
        // Refresh internal allocation state from database
        this.allocation = await Allocation.getFromDbData(this.simlet_id, this.group_id, this.group_allocator_type);
        logger.debug({ defaultSession, allocationCount: this.allocation.length }, 'Allocator.allocateToDefault synchronized participants');
    }

    toJSON(): object {
        let allocationsObj: Record<number, number> = {};
        // If group allocator and no participants, try to fetch from ExperimentalGroups
        if (this.group_allocator_type === 'group' && (!this.participants || this.participants.length === 0)) {
            // allocation may be empty, so try to fetch from ExperimentalGroups
            if (this.allocation.length === 0) {
                // Synchronously return empty, but note: allocation should be hydrated in init()
                // If not, fallback to last known session assignment
                // This is a limitation of toJSON being sync, but allocation should be hydrated before
            } else {
                for (const alloc of this.allocation) {
                    allocationsObj[alloc.object_id] = alloc.session_id;
                }
            }
        } else {
            for (const alloc of this.allocation) {
                allocationsObj[alloc.object_id] = alloc.session_id;
            }
        }
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
            allocations: allocationsObj
        };
    }
}