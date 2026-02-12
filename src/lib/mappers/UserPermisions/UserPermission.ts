import { db } from "@/lib/db";
import { SingleUserPermission } from "@/lib/mappers/UserPermisions/SingleUserPermission";

/**
 * User Permission mapper class representing user access permissions.
 * Maps users to their permission levels within the system.
 * 
 * @class UserPermission
 * @description Simple mapper for associating usernames with permission strings.
 * Used for authorization and access control throughout the application.
 */
export class UserPermission { 
    /**
     * Object type identifier
     */
    object_type: string;

    /**
     * Object identifier
     */
    object_id: number;

    /** * Array of SingleUserPermission instances representing user permissions */
    permissions: SingleUserPermission[]; 
    
    /** * Creates a new UserPermission instance
     * 
     * @param {any} data - Raw data object containing username and permission
     * @description Initializes user permission mapping from provided data.
    */ 
    constructor(object_type: string, object_id: number, data: any) { 
        this.object_type = object_type;
        this.object_id = object_id;
        this.permissions = data.map((item: any) => new SingleUserPermission(item)); 
    }

    static async getFromDbData(object_type: string, object_id: number): Promise<UserPermission> {
        switch (object_type) {
            case 'simlet':
                const simletPermissions = await db.Tables.SimletPermissions.findAll({ where: { simlet_id: object_id } });
                return new UserPermission(object_type, object_id, simletPermissions);
        case 'session':
            const sessionPermissions = await db.Tables.SessionPermissions.findAll({ where: { session_id: object_id } }); 
            return new UserPermission(object_type, object_id, sessionPermissions);
        case 'group':
            const groupPermissions = await db.Tables.GroupPermissions.findAll({ where: { group_id: object_id } });
            return new UserPermission(object_type, object_id, groupPermissions);
        default:
            throw new Error(`Unsupported object type: ${object_type}`);
        }
    }

    checkUserPermission(user_id: number) : boolean {
        // Implementation for checking if a user has alreadyy permission
        return this.permissions.some(p => p.user_id === user_id);
    }

    checkSpecificUserPermission(user_id: number, permission: string) : boolean {
        // Implementation for checking if a user has a specific permission for this object
        return this.permissions.some(p => p.user_id === user_id && p.permission === permission);
    }

    async addUserPermission(user_id: number, permission: string) : Promise<SingleUserPermission[]> {
        // Implementation for adding user permission to this object
        switch (this.object_type) {
            case 'simlet':
                await db.Tables.SimletPermissions.create({ simlet_id: this.object_id, user_id, permission });
                break;
            case 'session':
                await db.Tables.SessionPermissions.create({ session_id: this.object_id, user_id, permission });
                break;
            case 'group':
                await db.Tables.GroupPermissions.create({ group_id: this.object_id, user_id, permission });
                break;
            default:
                throw new Error(`Unsupported object type: ${this.object_type}`);
        }
        this.permissions.push(new SingleUserPermission({ user_id, permission }));
        return this.permissions;
    }

    async removeUserPermission(user_id: number, permission: string) : Promise<SingleUserPermission[]> {
        // Implementation for removing user permission from this object
        switch (this.object_type) {
            case 'simlet':
                await db.Tables.SimletPermissions.destroy({ where: { simlet_id: this.object_id, user_id, permission } });
                break;
            case 'session':
                await db.Tables.SessionPermissions.destroy({ where: { session_id: this.object_id, user_id, permission } });
                break;
            case 'group':
                await db.Tables.GroupPermissions.destroy({ where: { group_id: this.object_id, user_id, permission } });
                break;
            default:
                throw new Error(`Unsupported object type: ${this.object_type}`);
        }
        this.permissions = this.permissions.filter(p => !(p.user_id === user_id && p.permission === permission));
        return this.permissions;
    }
}