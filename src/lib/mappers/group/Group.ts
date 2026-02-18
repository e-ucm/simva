import { db } from "@/lib/db";
import { AuthentificationError, NotFoundError, ValidationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";
import { GroupParticipant } from "@/lib/mappers/group/GroupParticipant";
import { SingleUserPermission } from "../UserPermisions/SingleUserPermission";
import { UserPermission } from "../UserPermisions/UserPermission";

/**
 * Group mapper class representing a collection of participants in studies.
 * Groups are used to organize participants and can be assigned to simlets.
 * 
 * @class Group
 * @description Manages participant groups with permissions and generation settings.
 * Supports both manual participant management and automatic code generation.
 */
export class Group {
  delete() {
    throw new Error("Method not implemented.");
  }
    current_user_id: number;
    current_user_username: string;
    current_user_permission: string;

    /**
     * Unique identifier for the group
     */
    group_id: number;
    
    /**
     * Whether to use new generation algorithms for participant codes
     */
    group_use_new_generation: boolean;
    
    /**
     * Human-readable name for the group
     */
    group_name: string;
    
    /**
     * Timestamp when the group was created
     */
    created_at: Date;
    
    /**
     * Array of participant IDs belonging to this group
     */
    participants: number[];
    
    group_owner_user_id : number;
    group_owner_username: string;

    /**
     * Array of direct permissions granted for this group
     */
    direct_permissions: string[] = [];

    /**
     * Creates a new Group instance
     * 
     * @param {any} data - Raw data object containing group properties
     * @description Initializes group properties and parses array fields from string format.
      * Processes participant arrays and ensures proper boolean conversion for group_use_new_generation.
     */
    constructor(data: any) {
        this.group_id = data.group_id; // Ensure group_id is included in the data
        this.group_use_new_generation = Boolean(data.group_use_new_generation); // Ensure group_use_new_generation is included in the data
        this.group_name = data.group_name || data.name || "";
        this.created_at = data.created_at ? new Date(data.created_at) : new Date();
        this.participants = data.participants || [];
        this.group_owner_user_id = data.group_owner_user_id || "";
        this.group_owner_username = data.group_owner_username || "";
        this.current_user_id = data.current_user_id || "";
        this.current_user_username = data.current_user_username || "";
        this.current_user_permission = data.current_user_permission || "";
    }

    async init() {
        //Additional initialization logic can be added here if needed in the future
        const participantIds = await db.Functions.runViewQuery(db.Views.GroupParticipant.IdsByGroupId, { group_id: this.group_id })
        this.participants = participantIds.map((row: any) => row.participant_id) || [];
    }

    static async getAllFromDbData(current_user_id: number, version: boolean | undefined, limit: number | undefined, offset: number | undefined, searchString: string | undefined): Promise<Group[]> {
        let groups;
        if(limit != undefined && offset != undefined) {
            groups = await db.Functions.runViewQuery(db.Views.Group.byVersionAndUserIdWithPagination, { current_user_id, version, search : searchString, limit, offset});
        } else {
            groups = await db.Functions.runViewQuery(db.Views.Group.byVersionAndUserId, { current_user_id, search : searchString, version });
        } 
        return Promise.all(groups.map(async (groupData: any) => { 
            const group = new Group(groupData);
            await group.init();
            return group;
        }));
    }

    static async getFromDbData(group_id: number, current_user_id: number): Promise<Group> {
       let groups = await db.Functions.runViewQuery(
            db.Views.Group.byGroupIdAndUserId, 
            {group_id, current_user_id}
        );
        if(groups.length === 0) {
            throw new NotFoundError(`Group with ID ${group_id} not found for user ${current_user_id}`);
        } else if (groups.length > 1) {
            throw new Error(`Multiple groups found with ID ${group_id} for user ${current_user_id}`);
        }
        logger.debug({ groupData: groups[0] }, `Group data retrieved for group ID ${group_id} and user ID ${current_user_id}`);
        const group = new Group(groups[0]);
        await group.init();
        return group;
    }
    
    static async createInDb(body: Partial<Group>, useNewGeneration : boolean, current_user_id: number): Promise<Group> {
        const newGroupName = typeof body.group_name === "string" ? body.group_name.trim() : null;
        if(!newGroupName) {
            throw new ValidationError("Group name is required");
        }
        let count = await db.Tables.Group.count({where: {group_name: newGroupName }});
        if(count > 0) {
            throw new ValidationError("Group name must be unique");
        }
        body.group_owner_user_id = current_user_id;
        body.group_use_new_generation = useNewGeneration;
        let createdGroup = await db.Tables.Group.create(body);
        return Group.getFromDbData(createdGroup.group_id, current_user_id);
    }

    async getParticipants(): Promise<GroupParticipant[]> {
        return await GroupParticipant.getAllFromDbData(this.group_id);
    }

    /**
     * Prints debugging information about this group instance
     * 
     * @returns {void}
     * @description Logs group information to debug output for troubleshooting.
     */
    printInfo() {
        logger.debug({ Group : this }, "Group information");
    }

    async update(body: any): Promise<Group> {
        this.canEdit();
        let group = await db.Tables.Group.findOne({where:{group_id: this.group_id}});
        if(!group) {
            throw new NotFoundError(`Group with ID ${this.group_id} not found for update`);
        }
        await group.update(body);
        Object.assign(this, body);
        return this;
    }

    async deleteParticipant(user_id: number, keycloakDelete : boolean) {
        this.canEdit();
        let participant = await GroupParticipant.getFromDbData(this.group_id, user_id);
        participant.delete(keycloakDelete);
    }

    async createParticipant(body: Partial<GroupParticipant>) {
        this.canEdit();
        let participant = await GroupParticipant.createInDb(this.group_id, this.group_use_new_generation, body);
        return participant;
    }

    async removeUsersToKeycloak() {
        this.canEdit();
        let participants = await GroupParticipant.getAllFromDbData(this.group_id);
        for(var i = 0; i < participants.length; i++) {
            participants[i].removeUserToKeycloak();
        }
    }

    canEdit() : boolean {
         if(this.current_user_permission.toLowerCase() === "full" || this.current_user_permission.toLowerCase() === "write") {
             return true;
         }
         throw new AuthentificationError("User does not have permission to edit this simlet");
    }

     async getPermissions() {
      return await UserPermission.getFromDbData('group', this.group_id);
    }
    
    async createPermissions(body: any) {
        this.canEdit();
        let permissions = await UserPermission.getFromDbData('group', this.group_id);
        return await permissions.createPermissions(body);
    }
    
    async getPermissionsForUser(userId: number) {
        return await SingleUserPermission.getFromDbData('group', this.group_id, userId);
    }
    
    async patchPermissionsForUser(userId: number, body: any) {
        this.canEdit();
        let permission = await SingleUserPermission.getFromDbData('group', this.group_id, userId);
        return await permission.update(body.permission);
    }

    async deletePermissionsForUser(userId: number) {
        this.canEdit();
        let permission = await SingleUserPermission.getFromDbData('group', this.group_id, userId);
        return await permission.delete();
    }
}