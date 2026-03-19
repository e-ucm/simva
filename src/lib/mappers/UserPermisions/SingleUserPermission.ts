import { db } from "@/lib/db";
import { AuthentificationError, BadRequestError, NotFoundError, ValidationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";

/**
 * User Permission mapper class representing user access permissions.
 * Maps users to their permission levels within the system.
 * 
 * @class SingleSimletUserPermission
 * @description Simple mapper for associating usernames with permission strings.
 * Used for authorization and access control throughout the application.
 */
export class SingleUserPermission {
    object_id: number;
    object_type: string;
    /**
     * User id of the user this permission applies to
     */
    user_id: number;

    /**
     * Username of the user this permission applies to
     */
    username: string;
    
    /**
     * Permission level or type (e.g., 'READ', 'WRITE', 'ADMIN')
     */
    permission: string;

    current_user_id?: number;
    is_admin: boolean;

    createdAt?: Date;

    updatedAt?: Date;

    /**
     * Creates a new UserPermission instance
     * 
     * @param {any} data - Raw data object containing username and permission
     * @description Initializes user permission mapping from provided data.
     */
    constructor(object_type: string, object_id: number, data: any, current_user_id?: number, is_admin: boolean = false) {
        this.user_id = data.user_id;
        this.username = data.username;
        this.permission = data.permission;
        this.object_id = object_id;
        this.object_type = object_type;
        this.current_user_id = current_user_id;
        this.is_admin = is_admin;
        this.createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : undefined;
    }

    static async getFromDbData(object_type: string, object_id: number, user_id: number, current_user_id?: number, is_admin: boolean = false): Promise<SingleUserPermission> {
        switch (object_type) {
            case 'simlet':
                let simletPermissions = await db.Functions.runViewQuery(db.Views.Simlet.directPermissionsBySimletId, { simlet_id: object_id, user_id: user_id });
                if(simletPermissions.length == 0) {
                    throw new NotFoundError("Simlet Permission not found");
                }
                return new SingleUserPermission(object_type, object_id, simletPermissions[0], current_user_id, is_admin);
            case 'session':
                const sessionPermissions = await db.Functions.runViewQuery(db.Views.Session.directPermissionsBySessionId, { session_id: object_id, user_id: user_id }); 
                if(sessionPermissions.length == 0) {
                    throw new NotFoundError("Session Permission not found");
                }
                return new SingleUserPermission(object_type, object_id, sessionPermissions[0], current_user_id, is_admin);
            case 'group':
                const groupPermissions = await db.Functions.runViewQuery(db.Views.Group.directPermissionsByGroupId, { group_id: object_id, user_id: user_id });
                if(groupPermissions.length == 0) {
                    throw new NotFoundError("Group Permission not found");
                }
                return new SingleUserPermission(object_type, object_id, groupPermissions[0], current_user_id, is_admin);
            default:
                throw new BadRequestError(`Unsupported object type: ${object_type}`);
        }
    }

    /**
     * Updates the permission level for this user permission.
     * 
     * @async
     * @method update
     * @param {string} permission - New permission level to set
     * @returns {Promise<SingleUserPermission>} Promise resolving to the updated instance
     * @throws {BadRequestError} When object_type is not supported
     */
    async update(permission: string) : Promise<SingleUserPermission> {
        this.canEdit();
        switch (this.object_type) {
            case 'simlet':
                await db.Tables.SimletPermissions.update({ permission }, { where: { simlet_id: this.object_id, user_id: this.user_id } });
                break;
            case 'session':
                await db.Tables.SessionPermissions.update({ permission }, { where: { session_id: this.object_id, user_id: this.user_id } });
                break;
            case 'group':
                await db.Tables.GroupPermissions.update({ permission }, { where: { group_id: this.object_id, user_id: this.user_id } });
                break;
            default:
                throw new BadRequestError(`Unsupported object type: ${this.object_type}`);
        }
        this.permission = permission;
        return this;
    }

    /**
     * Deletes this user permission from the database.
     * 
     * @async
     * @method delete
     * @returns {Promise<boolean>} Promise resolving to true when deletion is successful
     * @throws {BadRequestError} When object_type is not supported
     */
    async delete() : Promise<boolean> {
        this.canDelete();
        logger.info({simlet_id: this.object_id, user_id: this.user_id}, "delete");
        switch (this.object_type) {
            case 'simlet':
                await db.Tables.SimletPermissions.destroy({ where: { simlet_id: this.object_id, user_id: this.user_id } });
                break;
            case 'session':
                await db.Tables.SessionPermissions.destroy({ where: { session_id: this.object_id, user_id: this.user_id } });
                break;
            case 'group':
                await db.Tables.GroupPermissions.destroy({ where: { group_id: this.object_id, user_id: this.user_id } });
                break;
            default:
                throw new BadRequestError(`Unsupported object type: ${this.object_type}`);
        }
        return true;
    }

    canEdit(): boolean {
        if(this.is_admin) {
            return true;
        }
        if(this.current_user_id != null && this.user_id !== this.current_user_id) {
            return true;
        }
        throw new AuthentificationError('User does not have permission to edit');
    }

    canDelete(): boolean {
        if(this.is_admin) {
            return true;
        }
        if(this.current_user_id != null && this.user_id !== this.current_user_id) {
            return true;
        }
        throw new AuthentificationError('User does not have permission to delete');
    }

    /**
     * Converts the SingleUserPermission instance to a JSON representation.
     * 
     * @method toJSON
     * @returns {object} JSON object containing user_id, username, and permission
     */
    toJSON(): object {
        return {
            user_id: this.user_id,
            username: this.username,
            permission: this.permission,
            isCurrentUser: this.user_id === this.current_user_id,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}