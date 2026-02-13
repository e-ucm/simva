import { db } from "@/lib/db";
import { AuthentificationError, NotFoundError, ValidationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";
import { SingleUserPermission } from "@/lib/mappers/UserPermisions/SingleUserPermission";
import { UserPermission } from "@/lib/mappers/UserPermisions/UserPermission";
import { Allocator } from "@/lib/mappers/allocators/Allocator";
import { AllocatorToClass } from "@/lib/mappers/allocators/AllocatorToClass";
import { SimletParticipant } from "./SimletParticipant";
import { SimletGroup } from "./SimletGroup";
import { Session } from "../session/Session";

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
    name: string;
    
    /**
     * Description of the study purpose and methodology
     */
    description: string;
    
    user_id: number;

    /**
     * Username of the study owner/researcher
     */
    username: string;
    
    /**
     * Permission level for the current user
     */
    permission: string;
    
    /**
     * Array of session IDs that belong to this study
     */
    sessions: number[];
    
    /**
     * Array of group IDs assigned to this study
     */
    groups: number[];
    
    /**
     * Array of tags for categorizing the study
     */
    tags: string[];
    
    /**
     * Array of direct permissions granted for this study
     */
    direct_permissions: string[] = [];
     
    /**
     * Static array defining which properties should be parsed as numeric arrays
     */
    static numericKeys = ['sessions', 'groups'];
    allocator_id: number;
    

    /**
     * Creates a new Simlet instance
     * 
     * @param {any} data - Raw data object containing simlet properties
     * @description Initializes simlet properties and parses array fields from string format.
     * Uses database utility functions to properly convert string arrays to typed arrays.
     */
    constructor(data: any) {
        this.simlet_id = data.simlet_id; // Ensure simlet_id is included in the data
        this.name = data.name || ""; // Ensure name is included in the data
        this.description = data.description || ""; // Ensure description is included in the data
        this.user_id = data.user_id; // Ensure user_id is included in the data
        this.username = data.username || "";
        this.permission = data.permission;
        this.allocator_id = data.allocator_id;
        logger.debug({data} , "Simlet data before parsing string and numerics arrays");
        let result = db.Functions.parseStringArraysToTypedArrays(data, Simlet.numericKeys, 'number');
        this.sessions = result.sessions;
        this.tags = result.tags;
        this.groups = result.groups;
        logger.debug({result} , "Simlet data after parsing string and numerics arrays");
    }

    static async getAllFromDbData(user_id: number, searchString: string | undefined, limit: number | undefined, offset: number | undefined): Promise<Simlet[]> {
          let results;
        if(limit !== undefined && offset !== undefined) {
            results = await db.Functions.runViewQuery(
            db.Views.Simlet.byUserIdWithPagination,
            { user_id, limit, offset, search: searchString }
            );
        } else {
            results = await db.Functions.runViewQuery(
            db.Views.Simlet.byUserId,
            { user_id, search: searchString }
            );
        }
        logger.debug({results} , "getSimletsByUserId results");
        const processedResults = results.map((simlet: any) => 
            new Simlet(simlet)
        );
        logger.debug({processedResults} , "getSimletsByUserId results");
        return processedResults;
    }

    static async createSimlet(simletData: any): Promise<Simlet> {
        logger.debug({simletData} , "Creating simlet with data");
        if(await db.Tables.Simlets.count({where : {name : simletData.name}}) > 0){
            throw new ValidationError(`Simlet name ${simletData.name} is already taken. Please choose a different name.`);
        }
        const allocator = await db.Tables.Allocators.create({ allocator_type: simletData.allocator_type || "default" });
        logger.debug({allocator} , "Allocator created");
        simletData.allocator_id = allocator.allocator_id;
        if(simletData.description === undefined){
            simletData.description = "";
        }
        const createdSimlet = await db.Tables.Simlets.create(simletData);
        return new Simlet(createdSimlet);
    }

    static async getFromDbData(simlet_id: number, user_id: number) : Promise<Simlet> {
        const result = await db.Functions.runViewQuery(
            db.Views.Simlet.byUserIdAndSimletId,
            { user_id, simlet_id }
        );
        logger.debug({result} , "getSimletBySimletIdAndUserId results");
        if(result.length === 0){
            throw new ValidationError(`Simlet with ID ${simlet_id} not found for user ID ${user_id}.`);
        } else if(result.length > 1){
            logger.warn(`Multiple simlets found with ID ${simlet_id} for user ID ${user_id}. Using the first one.`);
        }
        return new Simlet(result[0]);
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
        if(typeof data.name == "string") {
            toUpdate.name = data.name;
        }
        if(typeof data.description == "string") {
            toUpdate.description = data.description;
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
        if(this.permission === "owner" || this.permission === "write") {
            return true;
        }
        throw new AuthentificationError("User does not have permission to edit this simlet");
    }

    async remove() : Promise<void> {
        this.canEdit();
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
        return this;
    }

    async getUserPermissions() : Promise<SingleUserPermission[]> {
        this.canEdit();
        // Implementation for retrieving user permissions for this simlet
        let permissions = await UserPermission.getFromDbData('simlet', this.simlet_id);
        return permissions.permissions;
    }

    async addUserPermission(user_id: number, permission: string) : Promise<SingleUserPermission[]> {
        this.canEdit();
        // Implementation for adding user permission to this simlet
        let permissions = await UserPermission.getFromDbData('simlet', this.simlet_id);
        return await permissions.addUserPermission(user_id, permission);
    }

    async removeUserPermission(user_id: number, permission: string) : Promise<SingleUserPermission[]> {
        this.canEdit();
        // Implementation for removing user permission from this simlet
        let permissions = await UserPermission.getFromDbData('simlet', this.simlet_id);
        return await permissions.removeUserPermission(user_id, permission);
    }

    async removeGroup(group_id: number): Promise<Simlet> {
        this.canEdit();
        // Implementation for remove a group to this simlet
        let group = await SimletGroup.getFromDbData(this.simlet_id, group_id);
        await group.delete();
        this.groups = this.groups.filter(id => id !== group_id);
        return this;
    }

    async addSession(session_data : any) : Promise<Simlet> {
        this.canEdit();
        session_data.simlet_id = this.simlet_id;
        session_data.session_supervisor_id = this.user_id;
        let session = await Session.createFromDbData(session_data);
        this.sessions.push(session.session_id);
        return this;
    }

    getAllocator(): Promise<Allocator> {
      return AllocatorToClass(this.allocator_id);
    }

    async getAllocatedParticipants(): Promise<SimletParticipant[]> {
      const allocated = await db.Functions.runViewQuery(
        db.Views.AllocatedParticipants.bySimletId,
        { simlet_id: this.simlet_id }
      );
      logger.debug({allocated} , "Participants data from view");
      return allocated.map((participant: any) => new SimletParticipant(participant));
    }

    async getGroups(): Promise<SimletGroup[]> {
        const groups = await db.Functions.runViewQuery(
            db.Views.Group.bySimletId,
            { simlet_id: this.simlet_id }
        );
        logger.debug({groups} , "Groups data from view");
        return groups.map((group: any) => new SimletGroup(group));
    }

    async getSessions(searchString?: string, limit?: number, offset?: number): Promise<Session[]> {
        let sessions;
        if(limit !== undefined && offset !== undefined) {
            sessions = await db.Functions.runViewQuery( 
                db.Views.Session.bySimletIdAndUserIdWithPagination, 
                { simlet_id: this.simlet_id, user_id: this.user_id, search: searchString, limit, offset } 
            ); 
        } else {
            sessions = await db.Functions.runViewQuery(
                db.Views.Session.bySimletIdAndUserId,
                { simlet_id: this.simlet_id, user_id: this.user_id, search: searchString }
            );
        }
        logger.debug({sessions} , "Sessions data from view");
        return sessions.map((session: any) => new Session(session));
    }

    async getSession(sessionId: number): Promise<Session> {
      return await Session.getFromDbData(this.simlet_id, sessionId, this.user_id);
    }
}