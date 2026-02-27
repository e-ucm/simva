import { db } from "@/lib/db";
import { AuthentificationError, NotFoundError, ValidationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";
import { SingleUserPermission } from "@/lib/mappers/UserPermisions/SingleUserPermission";
import { UserPermission } from "@/lib/mappers/UserPermisions/UserPermission";
import { Allocator } from "@/lib/mappers/allocators/Allocator";
import { SimletParticipant } from "@/lib/mappers/simlet/SimletParticipant";
import { SimletGroup } from "@/lib/mappers/simlet/SimletGroup";
import { Session } from "@/lib/mappers/session/Session";
import { GroupAllocator } from "../allocators/GroupAllocator";
import { SessionAllocator } from "../allocators/SessionAllocator";
import { RandomAllocator } from "../allocators/RandomAllocator";

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
     * Description of the study purpose and methodology
     */
    simlet_description: string;
    
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
     
    allocator_id: number;

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
        this.simlet_description = data.simlet_description || ""; // Ensure simlet_description is included in the data
        this.allocator_id = data.allocator_id;
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
            throw new ValidationError(`Simlet name ${simletData.simlet_name} is already taken. Please choose a different name.`);
        }
        const allocator = await db.Tables.Allocators.create({ allocator_type: simletData.allocator_type || "default" });
        logger.debug({allocator} , "Allocator created");
        simletData.allocator_id = allocator.allocator_id;
        if(simletData.simlet_description === undefined){
            simletData.simlet_description = "";
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

    async addGroup(group_id: number): Promise<Simlet> {
        this.canEdit();
        // Implementation for adding a group to this simlet
        let group = await SimletGroup.createSimletGroup(this.simlet_id, group_id);
        this.groups.push(group.group_id);
        if(this.sessions.length > 0) {
            await this.allocateGroupToDefaut(group_id);
        }
        return this;
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
        await db.Tables.ExperimentalParticipants.destroy({ where: { group_id : group_id, allocator_id : this.allocator_id }});
        await group.delete();
        this.groups = this.groups.filter(id => id !== group_id);
        return this;
    }

    async addSession(session_data : any) : Promise<Simlet> {
        this.canEdit();
        session_data.simlet_id = this.simlet_id;
        session_data.session_supervisor_id = this.current_user_id;
        let session = await Session.createFromDbData(session_data);
        this.sessions.push(session.session_id);
        if(this.sessions.length == 1) {
             this.groups.forEach(async (group_id) => {
                await this.allocateGroupToDefaut(group_id);
             })
        }
        return this;
    }

    async getAllocator(): Promise<Allocator> {
      return await Allocator.getFromDbData(this.allocator_id);
    }

    async allocateGroupToDefaut(group_id: number) {
        let allocator = await this.getAllocator();
        let sessionId = this.sessions && this.sessions.length > 0 ? this.sessions[0] : null;
        if (!sessionId) {
            // If no sessions exist, try to fetch the first session from DB
            const sessionIds = await db.Functions.runViewQuery(db.Views.Session.IdsBySimletId, { simlet_id: this.simlet_id });
            if (sessionIds.length > 0) {
                sessionId = sessionIds[0].session_id;
                this.sessions = sessionIds.map((row: any) => row.session_id);
            }
        }
        if (!sessionId) {
            throw new NotFoundError("No sessions found to allocate group to");
        }
        switch(allocator.allocator_type) {
            case Allocator.getType():
                let groupParticipants = await db.Tables.GroupParticipants.findAll({where : { group_id}})
                for (const participant of groupParticipants) {
                    await allocator.allocate(sessionId, participant.participant_id);
                }
                break;
            case GroupAllocator.getType():
                await allocator.allocate(sessionId, group_id);
                break;
            default:
                throw new ValidationError("Method not implemented for this unknwown type.");
        }
    }

    async allocateToSession(sessionId: number, id: number) : Promise<void> {
        this.canEdit();
        let allocator = await this.getAllocator();
        await allocator.allocate(sessionId, id);
    }

    async updateAllocator(data: Partial<Allocator>) : Promise<Allocator> {
      this.canEdit();
      let allocator = await Allocator.getFromDbData(this.allocator_id);
      allocator.update(data);
      switch(allocator.allocator_type) {
            case SessionAllocator.getType():
                this.sessions.forEach(async (session) => {
                        await allocator.allocate(session, this.groups);
                });
                break;
            case RandomAllocator.getType():
                await (allocator as RandomAllocator).allocateRandomly(this.sessions, this.groups);
                break;
            case GroupAllocator.getType():
            case Allocator.getType():
                allocator.allocateToDefault(this.sessions[0]);
                break;
            default:
                throw new ValidationError("Method not implemented for this unknwown type.");
        }
      return allocator;
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

    toJSON(): object {
        return {
            simlet_id: this.simlet_id,
            simlet_name: this.simlet_name,
            simlet_description: this.simlet_description,
            current_user_id: this.current_user_id,
            current_user_username: this.current_user_username,
            current_user_permission: this.current_user_permission,
            sessions: this.sessions,
            groups: this.groups,
            tags: this.tags,
            allocator_id: this.allocator_id,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}