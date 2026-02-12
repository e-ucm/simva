/**
 * User Permission mapper class representing user access permissions.
 * Maps users to their permission levels within the system.
 * 
 * @class SingleSimletUserPermission
 * @description Simple mapper for associating usernames with permission strings.
 * Used for authorization and access control throughout the application.
 */
export class SingleUserPermission {
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
    constructor(data: any) {
        this.user_id = data.user_id;
        this.username = data.username;
        this.permission = data.permission;
    }
}