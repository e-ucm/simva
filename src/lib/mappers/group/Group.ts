import { db } from "@/lib/db";
import { AuthentificationError, NotFoundError, ValidationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";
import { GroupParticipant } from "@/lib/mappers/group/GroupParticipant";
import { SingleUserPermission } from "@/lib/mappers/UserPermisions/SingleUserPermission";
import { UserPermission } from "@/lib/mappers/UserPermisions/UserPermission";

/**
 * Group mapper class representing a collection of participants in studies.
 * Groups are used to organize participants and can be assigned to simlets.
 * 
 * @class Group
 * @description Manages participant groups with permissions and generation settings.
 * Supports both manual participant management and automatic code generation.
 */
export class Group {
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
    createdAt?: Date;
    updatedAt?: Date;

    /**
     * Array of participant IDs belonging to this group
     */
    participants: number[];
    
    group_owner_user_id : number;
    group_owner_username: string;

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
        this.participants = data.participants || [];
        this.group_owner_user_id = data.group_owner_user_id || "";
        this.group_owner_username = data.group_owner_username || "";
        this.current_user_id = data.current_user_id || "";
        this.current_user_username = data.current_user_username || "";
        this.current_user_permission = data.current_user_permission || "";
        this.createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : undefined;
    }

    /**
     * Initializes the group instance by loading participant data.
     * Fetches participant IDs associated with this group from the database.
     * 
     * @async
     * @method init
     * @returns {Promise<void>} Promise that resolves when initialization is complete
     * @throws {Error} When database query for participants fails
     * 
     * @example
     * ```typescript
     * const group = new Group(data);
     * await group.init();
     * logger.info('Participants:', group.participants);
     * ```
     */
    async init(): Promise<void> {
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

    static async getGroupCountForUser(current_user_id: number, searchString: string): Promise<number> {
        const results = await db.Functions.runViewQuery(db.Views.Group.countByUserId, { current_user_id, search: searchString });
        return results[0].count || 0;
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

    /**
     * Retrieves all participants (members) of this group.
     * Returns full participant objects with usernames and metadata.
     * 
     * @async
     * @method getParticipants
     * @returns {Promise<GroupParticipant[]>} Promise resolving to array of group participants
     * @throws {Error} When participant data cannot be retrieved
     * 
     * @example
     * ```typescript
     * const participants = await group.getParticipants();
     * participants.forEach(p => logger.info(p.username));
     * ```
     */
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
        this.canEdit();
        let participant = await GroupParticipant.getFromDbData(this.group_id, user_id);
        participant.delete(keycloakDelete);
    }

    /**
     * Adds a new participant to this group.
     * Validates edit permissions and creates participant with proper generation settings.
     * 
     * @async
     * @method createParticipant
     * @param {Partial<GroupParticipant>} body - Participant data for creation
     * @returns {Promise<GroupParticipant>} Promise resolving to the created participant
     * @throws {AuthentificationError} When user lacks edit permissions
     * @throws {ValidationError} When participant data is invalid
     * 
     * @example
     * ```typescript
     * const participant = await group.createParticipant({
     *   participant_username: 'newuser',
     *   participant_password: 'password123'
     * });
     * ```
     */
    async createParticipant(body: Partial<GroupParticipant>): Promise<GroupParticipant> {
        this.canEdit();
        let participant = await GroupParticipant.createInDb(this.group_id, this.group_use_new_generation, body);
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
        this.canEdit();
        let participants = await GroupParticipant.getAllFromDbData(this.group_id);
        for(var i = 0; i < participants.length; i++) {
            participants[i].removeUserToKeycloak();
        }
    }

    /**
     * Checks if the current user can edit this group.
     * Validates user permissions against group access control.
     * 
     * @method canEdit
     * @returns {boolean} True if user has edit permissions, otherwise throws error
     * @throws {AuthentificationError} When user lacks edit permissions
     * 
     * @example
     * ```typescript
     * if (group.canEdit()) {
     *   // User can modify the group
     * }
     * ```
     */
    canEdit() : boolean {
         if(this.current_user_permission.toLowerCase() === "full" || this.current_user_permission.toLowerCase() === "write") {
             return true;
         }
         throw new AuthentificationError("User does not have permission to edit this group");
    }

    /**
     * Checks if the current user can delete this group.
     * Validates user permissions for delete operations.
     * 
     * @method canDelete
     * @returns {boolean} True if user has delete permissions, otherwise throws error
     * @throws {AuthentificationError} When user lacks delete permissions
     * 
     * @example
     * ```typescript
     * if (group.canDelete()) {
     *   await group.delete();
     * }
     * ```
     */
    canDelete() : boolean {
        if(this.current_user_permission.toLowerCase() === "full") {
            return true;
        }
        throw new AuthentificationError("User does not have permission to delete this group");
    }

    /**
     * Permanently deletes this group from the database.
     * Validates delete permissions before removal.
     * 
     * @async
     * @method delete
     * @returns {Promise<void>} Promise that resolves when group is deleted
     * @throws {AuthentificationError} When user lacks delete permissions
     * @throws {Error} When database deletion fails
     * 
     * @example
     * ```typescript
     * await group.delete();
     * ```
     */
    async delete(): Promise<void> {
        this.canDelete();
        await db.Tables.Group.destroy({where: {group_id: this.group_id}});
    }

     /**
     * Retrieves all permissions associated with this group.
     * Returns permissions for all users who have access to this group.
     * 
     * @async
     * @method getPermissions
     * @returns {Promise<UserPermission[]>} Promise resolving to array of user permissions
     * @throws {Error} When permission data cannot be retrieved
     * 
     * @example
     * ```typescript
     * const permissions = await group.getPermissions();
     * permissions.forEach(p => logger.info(p.user_id, p.permission_level));
     * ```
     */
     async getPermissions(): Promise<UserPermission> {
      return await UserPermission.getFromDbData('group', this.group_id, this.current_user_id);
    }
    
    async createPermissions(body: any) : Promise<UserPermission> {
        this.canEdit();
        let permissions = await UserPermission.getFromDbData('group', this.group_id, this.current_user_id);
        return await permissions.createPermissions(body);
    }
    
    /**
     * Retrieves permissions for a specific user in this group.
     * Returns the user's access level and role for this group.
     * 
     * @async
     * @method getPermissionsForUser
     * @param {number} userId - ID of the user whose permissions to retrieve
     * @returns {Promise<SingleUserPermission>} Promise resolving to user's permission object
     * @throws {NotFoundError} When user permissions are not found
     * 
     * @example
     * ```typescript
     * const userPerms = await group.getPermissionsForUser(456);
     * logger.info('Permission level:', userPerms.permission_level);
     * ```
     */
    async getPermissionsForUser(userId: number): Promise<SingleUserPermission> {
        return await SingleUserPermission.getFromDbData('group', this.group_id, userId, this.current_user_id);
    }
    
    /**
     * Updates permissions for a specific user in this group.
     * Modifies the user's access level and permissions.
     * 
     * @async
     * @method patchPermissionsForUser
     * @param {number} userId - ID of the user whose permissions to update
     * @param {any} body - Object containing new permission data
     * @returns {Promise<SingleUserPermission>} Promise resolving to updated permission object
     * @throws {AuthentificationError} When user lacks edit permissions
     * @throws {NotFoundError} When user permissions are not found
     * @throws {ValidationError} When permission data is invalid
     * 
     * @example
     * ```typescript
     * const updatedPerms = await group.patchPermissionsForUser(456, {
     *   permission: 'write'
     * });
     * ```
     */
    async patchPermissionsForUser(userId: number, body: any): Promise<SingleUserPermission> {
        this.canEdit();
        let permission = await SingleUserPermission.getFromDbData('group', this.group_id, userId, this.current_user_id);
        return await permission.update(body.permission);
    }

    /**
     * Removes all permissions for a specific user from this group.
     * Revokes the user's access to this group entirely.
     * 
     * @async
     * @method deletePermissionsForUser
     * @param {number} userId - ID of the user whose permissions to remove
     * @returns {Promise<void>} Promise that resolves when permissions are deleted
     * @throws {AuthentificationError} When user lacks edit permissions
     * @throws {NotFoundError} When user permissions are not found
     * 
     * @example
     * ```typescript
     * await group.deletePermissionsForUser(456);
     * ```
     */
    async deletePermissionsForUser(userId: number): Promise<void> {
        this.canEdit();
        let permission = await SingleUserPermission.getFromDbData('group', this.group_id, userId, this.current_user_id);
        await permission.delete();
    }

    /**
     * Converts the group instance to a plain JSON object.
     * Returns serializable representation for API responses.
     * 
     * @method toJSON
     * @returns {Object} Plain object containing group properties
     * 
     * @example
     * ```typescript
     * const groupData = group.toJSON();
     * logger.info('Group name:', groupData.group_name);
     * ```
     */
    toJSON(): object {
        return {
            group_id: this.group_id,
            group_use_new_generation: this.group_use_new_generation,
            group_name: this.group_name,
            participants: this.participants,
            group_owner_user_id: this.group_owner_user_id,
            group_owner_username: this.group_owner_username,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}