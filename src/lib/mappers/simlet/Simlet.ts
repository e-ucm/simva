import { Op } from "sequelize";
import { db } from "@/lib/db";
import { AuthentificationError, ConflictError, NotFoundError, NotImplementedError, ValidationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";
import { SingleUserPermission } from "@/lib/mappers/UserPermisions/SingleUserPermission";
import { UserPermission } from "@/lib/mappers/UserPermisions/UserPermission";
import { SimletParticipant } from "@/lib/mappers/simlet/SimletParticipant";
import { SimletGroup } from "@/lib/mappers/simletGroup/SimletGroup";
import { Session } from "@/lib/mappers/session/Session";
import { config } from "@/lib/config";
import { SessionTag } from "../session/SessionTagsElement";
import { SessionTagList } from "../session/SessionTagsList";
import { SimletShlink } from "./SimletShlink";

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
    
    current_user_id?: number;

    /**
     * Username of the study owner/researcher
     */
    current_user_username?: string;
    
    /**
     * Permission level for the current user
     */
    current_user_permission?: string;
    
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
    tags: SessionTag[] = [];

    createdAt?: Date;
    updatedAt?: Date;
    is_admin: boolean;
    allocated_user?: boolean;
    allocated_user_id?: number;
    allocated_user_username?: string;
    allocated_isToken?: boolean;
    allocated_token?: string;

    /**
     * Creates a new Simlet instance
     * 
     * @param {any} data - Raw data object containing simlet properties
     * @description Initializes simlet properties and parses array fields from string format.
     * Uses database utility functions to properly convert string arrays to typed arrays.
     */
    constructor(data: any, is_admin : boolean, allocated_user: boolean = false) {
        this.is_admin = is_admin;
        this.simlet_id = data.simlet_id; // Ensure simlet_id is included in the data
        this.simlet_name = data.simlet_name || ""; // Ensure simlet_name is included in the data
        this.simlet_archived = Boolean(data.simlet_archived);
        this.simlet_description = data.simlet_description || ""; // Ensure simlet_description is included in the data
        this.simlet_supervisor_id = data.simlet_supervisor_id;
        this.createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : undefined;
        this.allocated_user = Boolean(allocated_user);
        switch(this.allocated_user) {
            case true:
                this.allocated_user_id = data.allocated_user_id;
                this.allocated_user_username = data.allocated_user_username;
                this.allocated_isToken = Boolean(data.allocated_isToken);
                this.allocated_token = data.allocated_token;
                // Some allocated-user views expose only allocated_user_id.
                // Keep current_user_id aligned so downstream queries always have a user id.
                this.current_user_id = data.current_user_id ?? data.allocated_user_id;
                break
            case false:
                this.current_user_id = data.current_user_id; // Ensure current_user_id is included in the data
                this.current_user_username = data.current_user_username;
                this.current_user_permission = data.current_user_permission;
            default:
        }        
    }

    async init() {
        const groupIds = await db.Functions.runViewQuery(db.Views.Simlet.groupIdsBySimletId, { simlet_id: this.simlet_id })
        this.groups = groupIds.map((row: any) => row.group_id) || [];
        const effectiveUserId = this.current_user_id ?? this.allocated_user_id;
        if(this.is_admin) {
            const sessionIds = await db.Functions.runViewQuery(db.Views.Session.IdsBySimletId, { simlet_id: this.simlet_id });
            this.sessions = sessionIds.map((row: any) => row.session_id) || [];
        } else {
            const sessionIds = await db.Functions.runViewQuery(db.Views.Session.IdsBySimletIdAndUserId, { simlet_id: this.simlet_id, current_user_id: effectiveUserId});
            this.sessions = sessionIds.map((row: any) => row.session_id) || [];
        }
        this.tags = await SessionTagList.getSessionsTags(this.sessions, effectiveUserId);
    }
    
    static async getAdminSimlets(searchString: string, limit?: number, offset?: number): Promise<Simlet[]> {
      let results = await db.Tables.Simlets.findAll({
        where: searchString ? { simlet_name: { [Op.like]: `%${searchString}%` } } : undefined,
        limit: limit !== undefined ? limit : undefined,
        offset: offset !== undefined ? offset : undefined
      });
      const processedResults = await Promise.all(results.map(async (simlet: any) => {
            const simletInstance = new Simlet(simlet, true, false);
            await simletInstance.init();
            return simletInstance;
        }));
        return processedResults;
    }

    static async getAllFromDbData(current_user_id: number, allocated_user: boolean, searchString?: string, limit?: number, offset?: number): Promise<Simlet[]> {
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
            const simletInstance = new Simlet(simlet, false, allocated_user);
            await simletInstance.init();
            return simletInstance;
        }));
        logger.debug({processedResults} , "getSimletsByUserId results");
        return processedResults;
    }

    static async createSimlet(simletData: any, is_admin: boolean = false, current_user_id?: number): Promise<Simlet> {
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
        if(simletData.simlet_supervisor_id == undefined) {
            simletData.simlet_supervisor_id = current_user_id;
        }
        const createdSimlet = await db.Tables.Simlets.create(simletData);
        return new Simlet(createdSimlet, is_admin, false);
    }

    static async getFromDbData(simlet_id: number, is_admin : boolean, current_user_id?: number) : Promise<Simlet> {
        let result;
        if(!is_admin) {
            result = await db.Functions.runViewQuery(
                db.Views.Simlet.byUserIdAndSimletId,
                { current_user_id, simlet_id }
            );
        } else {
            result = await db.Tables.Simlets.findAll({ where: { simlet_id } });
        }
        logger.debug({result} , "getSimletBySimletIdAndUserId results");
        if(result.length === 0){
            throw new NotFoundError(`Simlet with ID ${simlet_id} not found for user ID ${current_user_id}.`);
        } else if(result.length > 1){
            logger.warn(`Multiple simlets found with ID ${simlet_id} for user ID ${current_user_id}. Using the first one.`);
        }
        const simlet = new Simlet(result[0],is_admin, false);
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

    static async getSimletCountByUserId(searchString: string, current_user_id?: number): Promise<number> {
        let results;
        if(current_user_id) {
            results = await db.Functions.runViewQuery(db.Views.Simlet.countByUserId, { current_user_id, search: searchString });
        } else {
            results = await db.Tables.Simlets.findAll({ where: { simlet_name: { [Op.like]: `%${searchString}%` } } });
        }
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
        if(typeof data.simlet_archived == "boolean") {
            let sessions = await this.getSessions();
            if(this.simlet_archived) {
                if(data.simlet_archived) {
                    throw new ValidationError(`Simlet is already archived.`);
                } // else: unarchiving, allowed
            } else {
                if(data.simlet_archived) { // archiving request
                    // Only check sessions if there are any
                    if (sessions.length > 0) {
                        for(const session of sessions) {
                            if(session.session_status !== session.STATUS.TERMINATED) {
                                throw new ValidationError(`Cannot archive simlet with active sessions. Please terminate all sessions before archiving.`);
                            }
                        }
                    }
                } else {
                    throw new ValidationError(`Simlet is already active.`);
                }
            }
            toUpdate.simlet_archived = data.simlet_archived;
        } else {
            // If archived status is not being updated, we need to check if the simlet is already archived before allowing other updates
            this.isArchived();
        }
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

    isArchived() : boolean {
        if(this.simlet_archived) {
            throw new ValidationError("Archived simlets cannot be edited. Please unarchive the simlet before making changes.");
        }
        return this.simlet_archived;
    }

    canEdit() : boolean {
        if(this.is_admin) {
            return true;
        }
        if(this.current_user_permission === "FULL" || this.current_user_permission === "WRITE") {
            return true;
        }
        throw new AuthentificationError("User does not have permission to edit this simlet");
    }

    canDelete() : boolean {
        if(this.is_admin) {
            return true;
        }
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
      this.isArchived();
      if (!this.current_user_id) {
            throw new AuthentificationError("Current user ID is not set");
        }
      let group = await SimletGroup.createInDb(this.simlet_id, body, this.current_user_id);
      return group;
    }

    async updateGroup(groupId: number, body: Partial<SimletGroup>): Promise<SimletGroup> {
        this.canEdit();
        this.isArchived();
        let group = await SimletGroup.getFromDbData(this.simlet_id, groupId, this.is_admin, this.current_user_id);
        const oldAllocatorType = group.group_allocator_type;
        logger.debug({ groupId, oldAllocatorType, newAllocatorType: body.group_allocator_type }, 'updateGroup checking allocator type change');
        const updatedGroup = await group.update(body);
        if(body.group_allocator_type && body.group_allocator_type !== oldAllocatorType) {
            logger.debug({ groupId, sessions: this.sessions }, 'updateGroup allocator type changed, reallocating to default');
            // If the allocator type is being updated, we need to allocate all participants to default session
            if(this.sessions.length > 0) {
                await updatedGroup.allocateToDefault(this.sessions[0])
            }
        }
        return updatedGroup;
    }

    async getGroupParticipants(groupId: number): Promise<SimletParticipant[]> {
        let group = await SimletGroup.getFromDbData(this.simlet_id, groupId, this.is_admin, this.current_user_id);
        return await group.getParticipants();
    }
    
    async addGroupParticipant(groupId: number, participantId: number): Promise<SimletGroup> {
        this.canEdit();
        this.isArchived();
        let group = await SimletGroup.getFromDbData(this.simlet_id, groupId, this.is_admin, this.current_user_id);
        return await group.addParticipant(participantId);
    }
    
    async allocateToSession(group_id: number, sessionId: number, group_id_or_participant_id: number) : Promise<SimletGroup>{
        this.canEdit();
        this.isArchived();
        let group = await SimletGroup.getFromDbData(this.simlet_id, group_id, this.is_admin, this.current_user_id);
        await group.allocateToSession(sessionId, group_id_or_participant_id);
        return group;
    }

    async createGroupParticipant(groupId: number, body: Partial<SimletParticipant>): Promise<SimletParticipant> {
        this.canEdit();
        this.isArchived();
        let group = await SimletGroup.getFromDbData(this.simlet_id, groupId, this.is_admin, this.current_user_id);
        let participant = await group.createParticipant(body);
        return participant;
    }

    async deleteGroupParticipant(groupId: number, participantId: number, keycloakDelete: boolean = false): Promise<void> {
        this.canEdit();
        this.isArchived();
        let group = await SimletGroup.getFromDbData(this.simlet_id, groupId, this.is_admin, this.current_user_id);
        await group.deleteParticipant(participantId, keycloakDelete);
    }

    async getGroupById(groupId: number): Promise<SimletGroup> {
        let group = await SimletGroup.getFromDbData(this.simlet_id, groupId, this.is_admin, this.current_user_id);
        return group;
    }

    async getGroupCount(): Promise<number> {
        let count = await SimletGroup.getGroupCountForUser(this.simlet_id);
        return count;
    }

    async getUserPermissions() : Promise<SingleUserPermission[]> {
        this.canEdit();
        this.isArchived();
        // Implementation for retrieving user permissions for this simlet
        let permissions = await UserPermission.getFromDbData('simlet', this.simlet_id, this.current_user_id);
        return permissions.permissions;
    }

    async addUserPermission(user_id: number, permission: string) : Promise<SingleUserPermission[]> {
        this.canEdit();
        this.isArchived();
        // Implementation for adding user permission to this simlet
        let permissions = await UserPermission.getFromDbData('simlet', this.simlet_id, this.current_user_id);
        return await permissions.addUserPermission(user_id, permission);
    }

    async removeUserPermission(user_id: number, permission: string) : Promise<SingleUserPermission[]> {
        this.canEdit();
        this.isArchived();
        // Implementation for removing user permission from this simlet
        let permissions = await UserPermission.getFromDbData('simlet', this.simlet_id, this.current_user_id);
        return await permissions.removeUserPermission(user_id, permission);
    }

    async removeGroup(group_id: number): Promise<Simlet> {
        this.canEdit();
        this.isArchived();
        // Implementation for remove a group to this simlet
        let group = await SimletGroup.getFromDbData(this.simlet_id, group_id, this.is_admin, this.current_user_id);
        await db.Tables.ExperimentalParticipants.destroy({ where: { simlet_id: this.simlet_id, group_id : group_id }});
        await group.delete();
        this.groups = this.groups.filter(id => id !== group_id);
        return this;
    }

    async addSession(session_data : any) : Promise<Session> {
        this.canEdit();
        this.isArchived();
        session_data.simlet_id = this.simlet_id;
        session_data.session_order = this.sessions.length + 1;
        let session = await Session.createFromDbData(session_data, this.is_admin, this.current_user_id!);
        this.sessions.push(session.session_id);
        // Note: allocateGroupToDefaut is now deprecated due to schema changes
        // Allocation logic should be handled at the group level
        return session;
    }

    async getAllocatedParticipants(): Promise<SimletParticipant[]> {
      return await SimletParticipant.getAllFromDbData("simlet", this.simlet_id);
    }

    async getGroups(): Promise<SimletGroup[]> {
        return await SimletGroup.getAllFromDbData(this.simlet_id, this.current_user_id);
    }

    async getSessions(searchString?: string, limit?: number, offset?: number): Promise<Session[]> {
        return await Session.getAllFromDbData(this.simlet_id, this.current_user_id, limit, offset, searchString);
    }

    async getSession(sessionId: number): Promise<Session> {  
        return await Session.getFromDbData(this.simlet_id, sessionId, this.is_admin, this.current_user_id);
    }

    async getPermissions() {
        return await UserPermission.getFromDbData('simlet', this.simlet_id, this.current_user_id, this.is_admin);
    }
    
    async createPermissions(body: any) {
        this.canEdit();
        this.isArchived();
        let permissions = await UserPermission.getFromDbData('simlet', this.simlet_id, this.current_user_id, this.is_admin);
        return await permissions.createPermissions(body);
    }
    
    async getPermissionsForUser(userId: number) {
        return await SingleUserPermission.getFromDbData('simlet', this.simlet_id, userId, this.current_user_id, this.is_admin);
    }
    
    async patchPermissionsForUser(userId: number, body: any) {
        this.canEdit();
        this.isArchived();
        let permission = await SingleUserPermission.getFromDbData('simlet', this.simlet_id, userId, this.current_user_id, this.is_admin);
        return await permission.update(body.permission);
    }

    async deletePermissionsForUser(userId: number) {
        this.canEdit();
        this.isArchived();
        let permission = await SingleUserPermission.getFromDbData('simlet', this.simlet_id, userId, this.current_user_id, this.is_admin);
        logger.debug(permission, "permission");
        return await permission.delete();
    }

    async export(withData: boolean): Promise<object> {
        let simletData: any = this.toJSON();
        simletData.sessions = await Promise.all(this.sessions.map(async (sessionId) => {
            let session = await this.getSession(sessionId);
            return await session.export(withData);
        }));
        simletData.groups = await Promise.all(this.groups.map(async (groupId) => {
            if (!this.current_user_id) {
                throw new AuthentificationError("Current user ID is not set");
            }
            let group = await SimletGroup.getFromDbData(this.simlet_id, groupId, this.is_admin, this.current_user_id);
            return await group.export(withData);
        }));
        return simletData;
    }

    async createShlinkURL(shlink: any): Promise<SimletShlink> {
        this.canEdit();
        this.isArchived();
        shlink.longUrl = `${config.externalUrl}/scheduler/${this.simlet_id}`;
        shlink.title = `scheduler_${this.simlet_id}`;
        shlink.tag = 'simlet';
        return await SimletShlink.createDbData(this.simlet_id, shlink);
    }

    async getShlinkURL(): Promise<SimletShlink> {
        return await SimletShlink.getFromDbData(this.simlet_id);
    }

    async updateShlinkURL(shlink: any): Promise<SimletShlink> {
        this.canEdit();
        this.isArchived();
        let existingShlink = await SimletShlink.getFromDbData(this.simlet_id);
        if(!existingShlink) {
            throw new NotFoundError(`Shlink URL for simlet ID ${this.simlet_id} not found.`);
        }
        return await existingShlink.updateURL(shlink);
    }

    async deleteShlinkURL(): Promise<void> {
        this.canEdit();
        this.isArchived();
        let shlink = await SimletShlink.getFromDbData(this.simlet_id);
        await shlink.deleteShLink();
    }

    toJSON(): object {
        let json: any = {
            simlet_id: this.simlet_id,
            simlet_name: this.simlet_name,
            simlet_archived: this.simlet_archived,
            simlet_description: this.simlet_description,
            simlet_supervisor_id: this.simlet_supervisor_id,
            sessions: this.sessions,
            groups: this.groups,
            tags: this.tags.map(tag => tag.toJSON()),
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
        if(this.allocated_user) {
            return {
                ...json,
                allocated_user_id: this.allocated_user_id,
                allocated_user_username: this.allocated_user_username,
                allocated_isToken: this.allocated_isToken,
                allocated_token: this.allocated_token
            }
        } else {
            return {
                ...json,
                current_user_id: this.current_user_id,
                current_user_username: this.current_user_username,
                current_user_permission: this.current_user_permission
            }
        }
    }

    getTrackerConfig() : object {
        return  {
            "study": `${this.simlet_id}`,
            "host": `${config.api.host}`,
            "protocol": `${config.api.protocol}`,
            "port": `${config.api.port}`,
            "url": `${config.api.url}`,
            "sso": `${config.sso.openIdUrl}`,
            "client_id": `${config.sso.uadventureClientId}`
        }
    }
}