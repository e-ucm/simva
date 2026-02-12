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

    /**
     * Array of SingleUserPermission instances representing user permissions
     */
    permissions: SingleUserPermission[]; 
    
    /**
     * Creates a new UserPermission instance
     * 
     * @param {string} object_type - Type of object (simlet, session, group)
     * @param {number} object_id - ID of the object
     * @param {any} data - Raw data array containing permission objects
     * @description Initializes user permission mapping from provided data.
     */ 
    constructor(object_type: string, object_id: number, data: any) { 
        this.object_type = object_type;
        this.object_id = object_id;
        this.permissions = data.map((item: any) => new SingleUserPermission(item)); 
    }

    /**
     * Retrieves user permission data from database based on object type and ID.
     * 
     * @static
     * @async
     * @function getFromDbData
     * @param {string} object_type - Type of object (simlet, session, group)
     * @param {number} object_id - ID of the object to get permissions for
     * @returns {Promise<UserPermission>} Promise that resolves to UserPermission instance
     * 
     * @throws {Error} If unsupported object type is provided
     * 
     * @example
     * ```typescript
     * const permissions = await UserPermission.getFromDbData('simlet', 123);
     * ```
     */
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

    /**
     * Checks if a user has any permission for this object.
     * 
     * @function checkUserPermission
     * @param {number} user_id - The ID of the user to check
     * @returns {boolean} True if user has any permission, false otherwise
     * 
     * @description Verifies whether a user has been granted any permission level
     * for the associated object (simlet, session, or group).
     * 
     * @example
     * ```typescript
     * if (userPermission.checkUserPermission(123)) {
     *   console.log('User has access');
     * }
     * ```
     */
    checkUserPermission(user_id: number) : boolean {
        // Implementation for checking if a user has already permission
        return this.permissions.some(p => p.user_id === user_id);
    }

    /**
     * Checks if a user has a specific permission for this object.
     * 
     * @function checkSpecificUserPermission
     * @param {number} user_id - The ID of the user to check
     * @param {string} permission - The specific permission to check for (e.g., 'READ', 'WRITE')
     * @returns {boolean} True if user has the specific permission, false otherwise
     * 
     * @description Verifies whether a user has been granted a specific permission level
     * for the associated object.
     * 
     * @example
     * ```typescript
     * if (userPermission.checkSpecificUserPermission(123, 'WRITE')) {
     *   console.log('User can write');
     * }
     * ```
     */
    checkSpecificUserPermission(user_id: number, permission: string) : boolean {
        // Implementation for checking if a user has a specific permission for this object
        return this.permissions.some(p => p.user_id === user_id && p.permission === permission);
    }

    /**
     * Adds a new permission for a user to this object.
     * 
     * @async
     * @function addUserPermission
     * @param {number} user_id - The ID of the user to grant permission to
     * @param {string} permission - The permission level to grant (e.g., 'READ', 'WRITE')
     * @returns {Promise<SingleUserPermission[]>} Promise that resolves to updated permissions array
     * 
     * @throws {Error} If unsupported object type is provided
     * 
     * @description Creates a new permission record in the appropriate database table
     * based on object type and adds it to the local permissions array.
     * 
     * @example
     * ```typescript
     * await userPermission.addUserPermission(123, 'WRITE');
     * ```
     */
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

    /**
     * Removes a specific permission for a user from this object.
     * 
     * @async
     * @function removeUserPermission
     * @param {number} user_id - The ID of the user to remove permission from
     * @param {string} permission - The permission level to remove (e.g., 'READ', 'WRITE')
     * @returns {Promise<SingleUserPermission[]>} Promise that resolves to updated permissions array
     * 
     * @throws {Error} If unsupported object type is provided
     * 
     * @description Deletes the permission record from the appropriate database table
     * and removes it from the local permissions array.
     * 
     * @example
     * ```typescript
     * await userPermission.removeUserPermission(123, 'WRITE');
     * ```
     */
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