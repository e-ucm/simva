import { db } from "@/lib/db";

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

    /**
     * Creates a new UserPermission instance
     * 
     * @param {any} data - Raw data object containing username and permission
     * @description Initializes user permission mapping from provided data.
     */
    constructor(object_type: string, object_id: number, data: any) {
        this.user_id = data.user_id;
        this.username = data.username;
        this.permission = data.permission;
        this.object_id = object_id;
        this.object_type = object_type;
    }

    static async getFromDbData(object_type: string, object_id: number, current_user_id: number): Promise<SingleUserPermission> {
        switch (object_type) {
            case 'simlet':
                let simletPermissions = await db.Tables.SimletPermissions.findOne({ where: { simlet_id: object_id , user_id: current_user_id } });
                return new SingleUserPermission(object_type, object_id, simletPermissions);
        case 'session':
            const sessionPermissions = await db.Tables.SessionPermissions.findOne({ where: { session_id: object_id , user_id: current_user_id } }); 
            return new SingleUserPermission(object_type, object_id, sessionPermissions);
        case 'group':
            const groupPermissions = await db.Tables.GroupPermissions.findOne({ where: { group_id: object_id , user_id: current_user_id } });
            return new SingleUserPermission(object_type, object_id, groupPermissions);
        default:
            throw new Error(`Unsupported object type: ${object_type}`);
        }
    }

    /**
     * Updates the permission level for this user permission.
     * 
     * @async
     * @method update
     * @param {string} permission - New permission level to set
     * @returns {Promise<SingleUserPermission>} Promise resolving to the updated instance
     * @throws {Error} When object_type is not supported
     */
    async update(permission: string) : Promise<SingleUserPermission> {
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
                throw new Error(`Unsupported object type: ${this.object_type}`);
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
     * @throws {Error} When object_type is not supported
     */
    async delete() : Promise<boolean> {
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
                throw new Error(`Unsupported object type: ${this.object_type}`);
        }
        return true;
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
            permission: this.permission
        };
    }
}