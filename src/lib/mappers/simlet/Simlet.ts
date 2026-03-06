import { db } from "@/lib/db";
import { AuthentificationError, ConflictError, NotFoundError, NotImplementedError, ValidationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";
import { SingleUserPermission } from "@/lib/mappers/UserPermisions/SingleUserPermission";
import { UserPermission } from "@/lib/mappers/UserPermisions/UserPermission";
import { Allocator } from "@/lib/mappers/allocators/Allocator";
import { SimletParticipant } from "@/lib/mappers/simlet/SimletParticipant";
import { SimletGroup } from "@/lib/mappers/simletGroup/SimletGroup";
import { Session } from "@/lib/mappers/session/Session";

/**
 * Simlet (Simple Study) mapper class representing a research study.
 * A Simlet contains multiple sessions (tests) and can be assigned to groups.
 * 
 * @class Simlet
 * @description Represents a complete study with sessions, participants, and metadata.
 * Handles validation and serious game research workflows.
 */
export class Simlet {
    /**
     * Unique identifier for the simlet/study
     */
    simlet_id: number;
    
    /**
     * Human-readable name of the study
     */
    simlet_name: string;

    /**
     * Whether the simlet is archived
     */
    simlet_archived: boolean;
    
    /**
     * Description of the study purpose and methodology
     */
    simlet_description: string;

    /**
     * ID of the study supervisor
     */
    simlet_supervisor_id: number;
    
    current_user_id: number;

    /**
     * Username of the study owner/researcher
     */
    current_user_username: string;
    
    /**
     * Permission level for the current user
     */
    current_user_permission: string;
    
    /**
     * Array of session IDs that belong to this study
     */
    sessions: number[] = [];
    
    /**
     * Array of group IDs assigned to this study
     */
    groups: number[] = [];
    
    /**
     * Array of tags for categorizing the study
     */
    tags: string[] = [];

    createdAt?: Date;
    updatedAt?: Date;

    /**
     * Creates a new Simlet instance
     * 
     * @param {any} data - Raw data object containing simlet properties
     * @description Initializes simlet properties and parses array fields from string format.
     * Uses database utility functions to properly convert string arrays to typed arrays.
     */
    constructor(data: any) {
        this.simlet_id = data.simlet_id; // Ensure simlet_id is included in the data
        this.simlet_name = data.simlet_name || ""; // Ensure simlet_name is included in the data
        this.simlet_archived = Boolean(data.simlet_archived);
        this.simlet_description = data.simlet_description || ""; // Ensure simlet_description is included in the data
        this.simlet_supervisor_id = data.simlet_supervisor_id;
        this.createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : undefined;
        this.current_user_id = data.current_user_id; // Ensure current_user_id is included in the data
        this.current_user_username = data.current_user_username || "";
        this.current_user_permission = data.current_user_permission;
    }

    async init() {
        //Additional initialization logic can be added here if needed in the future
        const tagIds = await db.Functions.runViewQuery(db.Views.Simlet.tagsBySimletId, { simlet_id: this.simlet_id })
        this.tags = tagIds.map((row: any) => row.tag_name) || [];
        const groupIds = await db.Functions.runViewQuery(db.Views.Simlet.groupIdsBySimletId, { simlet_id: this.simlet_id })
        this.groups = groupIds.map((row: any) => row.group_id) || [];
        const sessionIds = await db.Functions.runViewQuery(db.Views.Session.IdsBySimletId, { simlet_id: this.simlet_id })
        this.sessions = sessionIds.map((row: any) => row.session_id) || [];
    }

    static async getAllFromDbData(current_user_id: number, allocated_user: boolean, searchString: string | undefined, limit: number | undefined, offset: number | undefined): Promise<Simlet[]> {
          let results;
          if(allocated_user) {
            if(limit !== undefined && offset !== undefined) {
                results = await db.Functions.runViewQuery(
                db.Views.Simlet.byAllocatedUserIdWithPagination,
                { current_user_id, limit, offset, search: searchString }
                );
            } else {
                results = await db.Functions.runViewQuery(
                db.Views.Simlet.ByAllocatedUserId,
                { current_user_id, search: searchString }
                );
            }
        } else {
            if(limit !== undefined && offset !== undefined) {
                results = await db.Functions.runViewQuery(
                db.Views.Simlet.byUserIdWithPagination,
                { current_user_id, limit, offset, search: searchString }
                );
            } else {
                results = await db.Functions.runViewQuery(
                db.Views.Simlet.byUserId,
                { current_user_id, search: searchString }
                );
            }
        }
        logger.debug({results} , "getSimletsByUserId results");
        const processedResults =  await Promise.all(results.map(async (simlet: any) => {
            const simletInstance = new Simlet(simlet);
            await simletInstance.init();
            return simletInstance;
        }));
        logger.debug({processedResults} , "getSimletsByUserId results");
        return processedResults;
    }

    static async createSimlet(simletData: any): Promise<Simlet> {
        logger.debug({simletData} , "Creating simlet with data");
        if(await db.Tables.Simlets.count({where : {simlet_name : simletData.simlet_name}}) > 0){
            throw new ConflictError(`Simlet name ${simletData.simlet_name} is already taken. Please choose a different name.`);
        }
        if(simletData.simlet_description === undefined){
            simletData.simlet_description = "";
        }
        if(simletData.simlet_archived === undefined){
            simletData.simlet_archived = false;
        }
        const createdSimlet = await db.Tables.Simlets.create(simletData);
        return new Simlet(createdSimlet);
    }

    static async getFromDbData(simlet_id: number, current_user_id: number) : Promise<Simlet> {
        let result = await db.Functions.runViewQuery(
            db.Views.Simlet.byUserIdAndSimletId,
            { current_user_id, simlet_id }
        );
        logger.debug({result} , "getSimletBySimletIdAndUserId results");
        if(result.length === 0){
            throw new NotFoundError(`Simlet with ID ${simlet_id} not found for user ID ${current_user_id}.`);
        } else if(result.length > 1){
            logger.warn(`Multiple simlets found with ID ${simlet_id} for user ID ${current_user_id}. Using the first one.`);
        }
        const simlet = new Simlet(result[0]);
        await simlet.init();
        return simlet;
    }

    static async getSimletSessionCountByUserId(simlet_id: number, current_user_id: number, searchString: string): Promise<number> {
        const results = await db.Functions.runViewQuery(
            db.Views.Session.countBySimletIdAndUserId, 
            { simlet_id, current_user_id, search: searchString }
        );
        return results[0].count || 0;
    }

    static async getSimletCountByUserId(current_user_id: number, searchString: string): Promise<number> {
      const results = await db.Functions.runViewQuery(db.Views.Simlet.countByUserId, { current_user_id, search: searchString });
      return results[0].count || 0;
    }
    
    /**
     * Prints debugging information about this simlet instance
     * 
     * @returns {void}
     * @description Logs simlet information to debug output for troubleshooting.
     */
    printInfo() : void {
        logger.debug({ Simlet : this }, "Simlet information");
    }

    async patch(data: any) : Promise<Simlet> {
        this.canEdit();
        let toUpdate: any = {};
        if(typeof data.simlet_name == "string") {
            toUpdate.simlet_name = data.simlet_name;
        }
        if(typeof data.simlet_description == "string") {
            toUpdate.simlet_description = data.simlet_description;
        }
        let model = await db.Tables.Simlets.findOne({ where: { simlet_id: this.simlet_id } });
        if(!model) {
            throw new NotFoundError(`Simlet with ID ${this.simlet_id} not found.`);
        }
        await model.update(toUpdate);
        Object.assign(this, toUpdate);
        return this;
    }

    canEdit() : boolean {
        if(this.current_user_permission === "FULL" || this.current_user_permission === "WRITE") {
            return true;
        }
        throw new AuthentificationError("User does not have permission to edit this simlet");
    }

    canDelete() : boolean {
        if(this.current_user_permission === "FULL") {
            return true;
        }
        throw new AuthentificationError("User does not have permission to delete this simlet");
    }

    async delete() : Promise<void> {
        this.canDelete();
        let model = await db.Tables.Simlets.findOne({ where: { simlet_id: this.simlet_id } });
        if(!model) {
            throw new NotFoundError(`Simlet with ID ${this.simlet_id} not found.`);
        }
        await model.destroy();
    }

    async createGroup(body: Partial<SimletGroup>): Promise<SimletGroup> {
      this.canEdit();
      let group = await SimletGroup.createInDb(this.simlet_id, body, this.current_user_id as number);
      return group;
    }

    async updateGroup(groupId: number, body: Partial<SimletGroup>): Promise<SimletGroup> {
        this.canEdit();
        let group = await SimletGroup.getFromDbData(this.simlet_id, groupId);
        return await group.update(body);
    }

    async getGroupParticipants(groupId: number): Promise<SimletParticipant[]> {
        let group = await SimletGroup.getFromDbData(this.simlet_id, groupId);
        return await group.getParticipants();
    }
    
    async addGroupParticipant(groupId: number, participantId: number): Promise<SimletGroup> {
        this.canEdit();
        let group = await SimletGroup.getFromDbData(this.simlet_id, groupId);
        return await group.addParticipant(participantId);
    }
    
    async allocateToSession(sessionId: number, id: number) {
      throw new Error("Method not implemented.");
    }
    async createGroupParticipant(groupId: number, body: Partial<SimletParticipant>): Promise<SimletParticipant> {
        this.canEdit();
        let group = await SimletGroup.getFromDbData(this.simlet_id, groupId);
        return await group.createParticipant(body);
    }

    async deleteGroupParticipant(groupId: number, participantId: number, keycloakDelete: boolean = false): Promise<void> {
        this.canEdit();
        let group = await SimletGroup.getFromDbData(this.simlet_id, groupId);
        await group.deleteParticipant(participantId, keycloakDelete);
    }

    async getGroupById(groupId: number): Promise<SimletGroup> {
        let group = await SimletGroup.getFromDbData(this.simlet_id, groupId);
        return group;
    }

    async getGroupCount(): Promise<number> {
        let count = await SimletGroup.getGroupCountForUser(this.simlet_id);
        return count;
    }

    async getUserPermissions() : Promise<SingleUserPermission[]> {
        this.canEdit();
        // Implementation for retrieving user permissions for this simlet
        let permissions = await UserPermission.getFromDbData('simlet', this.simlet_id, this.current_user_id as number);
        return permissions.permissions;
    }

    async addUserPermission(user_id: number, permission: string) : Promise<SingleUserPermission[]> {
        this.canEdit();
        // Implementation for adding user permission to this simlet
        let permissions = await UserPermission.getFromDbData('simlet', this.simlet_id, this.current_user_id as number);
        return await permissions.addUserPermission(user_id, permission);
    }

    async removeUserPermission(user_id: number, permission: string) : Promise<SingleUserPermission[]> {
        this.canEdit();
        // Implementation for removing user permission from this simlet
        let permissions = await UserPermission.getFromDbData('simlet', this.simlet_id, this.current_user_id as number);
        return await permissions.removeUserPermission(user_id, permission);
    }

    async removeGroup(group_id: number): Promise<Simlet> {
        this.canEdit();
        // Implementation for remove a group to this simlet
        let group = await SimletGroup.getFromDbData(this.simlet_id, group_id);
        await db.Tables.ExperimentalParticipants.destroy({ where: { simlet_id: this.simlet_id, group_id : group_id }});
        await group.delete();
        this.groups = this.groups.filter(id => id !== group_id);
        return this;
    }

    async addSession(session_data : any) : Promise<Simlet> {
        this.canEdit();
        session_data.simlet_id = this.simlet_id;
        session_data.session_coordinator_id = this.current_user_id;
        let session = await Session.createFromDbData(session_data);
        this.sessions.push(session.session_id);
        // Note: allocateGroupToDefaut is now deprecated due to schema changes
        // Allocation logic should be handled at the group level
        return this;
    }

    async getAllocator(): Promise<Allocator> {
      // Allocators are now at the group level (group_allocator_type)
      // This method is deprecated and needs refactoring
      throw new NotImplementedError("Allocators are now managed at the group level. Use Group.group_allocator_type instead.");
    }

    async getAllocatedParticipants(): Promise<SimletParticipant[]> {
      return await SimletParticipant.getAllFromDbData("simlet", this.simlet_id);
    }

    async getGroups(): Promise<SimletGroup[]> {
        return await SimletGroup.getAllFromDbData(this.simlet_id);
    }

    async getSessions(searchString?: string, limit?: number, offset?: number): Promise<Session[]> {
        return await Session.getAllFromDbData(this.simlet_id, this.current_user_id as number, limit, offset, searchString);
    }

    async getSession(sessionId: number): Promise<Session> {  
        return await Session.getFromDbData(this.simlet_id, sessionId, this.current_user_id as number);
    }

    async getPermissions() {
      return await UserPermission.getFromDbData('simlet', this.simlet_id, this.current_user_id as number);
    }
    
    async createPermissions(body: any) {
        this.canEdit();
        let permissions = await UserPermission.getFromDbData('simlet', this.simlet_id, this.current_user_id as number);
        return await permissions.createPermissions(body);
    }
    
    async getPermissionsForUser(userId: number) {
        return await SingleUserPermission.getFromDbData('simlet', this.simlet_id, userId, this.current_user_id as number);
    }
    
    async patchPermissionsForUser(userId: number, body: any) {
        this.canEdit();
        let permission = await SingleUserPermission.getFromDbData('simlet', this.simlet_id, userId, this.current_user_id as number);
        return await permission.update(body.permission);
    }

    async deletePermissionsForUser(userId: number) {
        this.canEdit();
        let permission = await SingleUserPermission.getFromDbData('simlet', this.simlet_id, userId, this.current_user_id as number);
        return await permission.delete();
    }

    async export(withData: boolean): Promise<object> {
        let simletData: any = this.toJSON();
        simletData.sessions = await Promise.all(this.sessions.map(async (sessionId) => {
            let session = await this.getSession(sessionId);
            return await session.export(withData);
        }));
        simletData.groups = await Promise.all(this.groups.map(async (groupId) => {
            let group = await SimletGroup.getFromDbData(this.simlet_id, groupId);
            return await group.export(withData);
        }));
        return simletData;
    }

    toJSON(): object {
        return {
            simlet_id: this.simlet_id,
            simlet_name: this.simlet_name,
            simlet_archived: this.simlet_archived,
            simlet_description: this.simlet_description,
            simlet_supervisor_id: this.simlet_supervisor_id,
            current_user_id: this.current_user_id,
            current_user_username: this.current_user_username,
            current_user_permission: this.current_user_permission,
            sessions: this.sessions,
            groups: this.groups,
            tags: this.tags,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}