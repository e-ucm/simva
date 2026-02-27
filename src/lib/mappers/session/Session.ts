import { db } from "@/lib/db";
import { AuthentificationError, ConflictError, NotFoundError, ValidationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";
import { Activity } from "@/lib/mappers/activities/Activity";
import { ActivityToClass } from  "@/lib/mappers/activities/ActivityToClass";
import { UserPermission } from "@/lib/mappers/UserPermisions/UserPermission";
import { SingleUserPermission } from "@/lib/mappers/UserPermisions/SingleUserPermission";
import { SimletParticipant } from "../simlet/SimletParticipant";

/**
 * Session mapper class representing a test session within a study (simlet).
 * Sessions contain activities and define the experimental conditions for participants.
 * 
 * @class Session
 * @description Manages session data including timing, activities, and experimental methods.
 * Sessions are the organizational units that contain multiple activities in sequence.
 */
export class Session {
    /**
     * ID of the simlet (study) this session belongs to
     */
    simlet_id: number;
    
    /**
     * Unique identifier for this session
     */
    session_id: number;
    
    session_order?: number;

    /**
     * ID of the current session user
     */
    current_user_id?: number;

    /**
     * Username of the current session user
     */
    current_user_username?: string;
    
    /**
     * Permission level for the current session user
     */
    current_user_permission?: string;
    
    /**
     * Human-readable name for the session
     */
    session_name: string;
    
    /**
     * Description of the session purpose and content
     */
    session_description: string;
    
    /**
     * Timestamp when the session was created
     */
    createdAt: Date;
    
    /**
     * Timestamp when the session was last updated
     */
    updatedAt: Date;
    
    /**
     * Experimental method or condition for this session
     */
    session_experimental_method: string;
    
    session_can_be_manually_activated: boolean;

    /**
     * Whether the session is currently active
     */
    session_active: boolean;
    
    /**
     * Start date for session availability
     */
    session_start_date?: Date;
    
    /**
     * End date for session availability
     */
    session_end_date?: Date;
    
    /**
     * Array of activity IDs that belong to this session
     */
    activities?: number[] = [];
    
    /**
     * Array of tags for categorizing the session
     */
    tags?: string[] = [];
    
    allocated_user: boolean;
    allocated_user_id?: number;
    allocated_username?: string;
    allocated_isToken?: boolean;
    allocated_token?: string;
    allocated_session_id?: number;
    allocated_activities?: Activity[];
    /**
     * Creates a new Session instance
     * 
     * @param {any} data - Raw data object containing session properties
     * @description Initializes session properties and parses array fields from string format.
     * Uses database utility functions to properly convert string arrays to typed arrays.
     */
    constructor(data: any, allocated_user: boolean = false) {
        this.session_id = data.session_id;
        this.simlet_id = data.simlet_id;
        this.current_user_id = data.current_user_id;
        this.current_user_username = data.current_user_username || "";
        this.current_user_permission = data.current_user_permission || "";
        this.allocated_user = allocated_user;
        this.session_order = data.session_order;
        if(this.allocated_user) {
            this.allocated_user_id = data.allocated_user_id;
            this.allocated_username = data.allocated_username || "";
            this.allocated_isToken = Boolean(data.allocated_isToken);
            this.allocated_token = data.allocated_token || "";
            this.allocated_session_id = data.allocated_session_id;
        } else {
            this.activities = [];
            this.tags = [];
        }
        this.session_name = data.session_name || "";
        this.session_description = data.session_description || "";
        this.createdAt = new Date(data.createdAt);
        this.updatedAt = new Date(data.updatedAt);
        this.session_experimental_method = data.session_experimental_method || "";
        this.session_can_be_manually_activated = Boolean(data.session_can_be_manually_activated);
        this.session_active = Boolean(data.session_active);
        this.session_start_date = data.session_start_date ? new Date(data.session_start_date) : undefined;
        this.session_end_date = data.session_end_date ? new Date(data.session_end_date) : undefined;
    }

    /**
     * Initializes the session instance with additional data from the database.
     * Loads tags and activities associated with this session.
     * 
     * @async
     * @method init
     * @returns {Promise<void>} Promise that resolves when initialization is complete
     */
    async init(): Promise<void> {
        if(!this.allocated_user) {
            //Additional initialization logic can be added here if needed in the future
            const tagIds = await db.Functions.runViewQuery(db.Views.Session.tagsBySessionId, { session_id: this.session_id })
            this.tags = tagIds.map((row: any) => row.tag_name) || [];
            const sessionIds = await db.Functions.runViewQuery(db.Views.Activity.IdsBySessionId, { session_id: this.session_id })
            this.activities = sessionIds.map((row: any) => row.activity_id) || [];
        }
    }

    static async getAllFromDbData(simlet_id: number, current_user_id: number, limit: number | undefined, offset: number | undefined, searchString: string | undefined): Promise<Session[]> {
        let sessions;
        if(limit !== undefined && offset !== undefined) {
            sessions = await db.Functions.runViewQuery( 
                db.Views.Session.bySimletIdAndUserIdWithPagination, 
                { simlet_id, current_user_id, search: searchString, limit, offset } 
            ); 
        } else {
            sessions = await db.Functions.runViewQuery(
                db.Views.Session.bySimletIdAndUserId,
                { simlet_id, current_user_id, search: searchString }
            );
        }
        logger.debug({sessions} , "Sessions data from view");
        return Promise.all(sessions.map(async (session: any) => {
            const sessionInstance = new Session(session, false);
            await sessionInstance.init();
            return sessionInstance;
        }));
    }

    static async getFromDbData(simlet_id: number, session_id: number, current_user_id: number) : Promise<Session> {
        const session = await db.Functions.runViewQuery(
            db.Views.Session.bySimletIdSessionIdAndUserId,
            { session_id, current_user_id, simlet_id }
       );
        if(session.length === 0){
            throw new NotFoundError(`Session with ID ${session_id} not found for user ID ${current_user_id}.`);
        } else if(session.length > 1) {
            logger.warn(`Multiple sessions found with ID ${session_id} for user ID ${current_user_id}. Using the first one.`);
        }
        const sessionInstance = new Session(session[0]);
        await sessionInstance.init();
        return sessionInstance;
    }

    static async getScheduledSessionForUser(simlet_id: number, current_user_id: number): Promise<Session> {
        const activities = await db.Functions.runViewQuery(
            db.Views.Session.byAllocatedUserIdAndSimletId,
            { current_user_id, simlet_id }
        );
        if(activities.length === 0){
            throw new NotFoundError(`Allocated session with SIMLET ID ${simlet_id} not found for user ID ${current_user_id}.`);
        }
        logger.debug({activities} , "Scheduled sessions data from view");
        const session = new Session(activities[0], true);
        await session.init();
        session.allocated_activities = await Promise.all(activities.map(async (activity: any) => {
            return await ActivityToClass(activity.activity_id, current_user_id, true, activity);
        }));
        if(session.session_active) {
            throw new ConflictError(`Allocated session with SIMLET ID ${simlet_id} for user ID ${current_user_id} is not active yet.`);
        }
        return session;
    }
      /**
     * Create a new session.
     * 
     * @async
     * @function createSession
     * @param {Partial<Session>} sessionData - The session data for creation
     * @returns {Promise<Session>} The created session
     * 
     * @example
     * ```typescript
     * const newSession = await Session.createSession({
     *   simlet_id: 1,
     *   session_name: 'Test Session',
     *   session_description: 'A test learning session',
     *   session_supervisor_id: 123
     * });
     * ```
     */
    static async createFromDbData(sessionData: Partial<InstanceType<typeof db.Tables.Sessions>>): Promise<Session> {
        let sessioncount = await db.Tables.Sessions.count({where: {session_name: sessionData.session_name}});
        if(sessioncount > 0){
            throw new ConflictError(`Session name ${sessionData.session_name} is already taken. Please choose a different name.`);
        }
        let session = await db.Tables.Sessions.create(sessionData);
        return Session.getFromDbData(session.simlet_id, session.session_id, session.session_supervisor_id);
    }

    /**
     * Retrieves all activities associated with this session.
     * 
     * @async
     * @method getActivities
     * @returns {Promise<Activity[]>} Array of Activity instances belonging to this session
     */
    async getActivities(): Promise<Activity[]> {
        return await Activity.getAllFromDbData(this.session_id, this.current_user_id as number, this.allocated_user);
    }

    /**
     * Adds a new activity to this session.
     * Requires edit permissions and automatically assigns activity order.
     * 
     * @async
     * @method addActivity
     * @param {Partial<InstanceType<typeof db.Tables.Activities>>} activityData - Activity data for creation
     * @returns {Promise<Activity>} The created Activity instance
     * @throws {AuthentificationError} When user lacks edit permissions
     */
    async addActivity(activityData: Partial<InstanceType<typeof db.Tables.Activities>>): Promise<Activity> {
        this.canEdit();
        activityData.session_id = this.session_id;
        activityData.activity_order = (this.activities?.length ?? 0) + 1; // Add to the end of the activity list
        let activity = await db.Tables.Activities.create(activityData);
        return Activity.getFromDbData(activity.activity_id, this.current_user_id as number, false);
     }

    /**
     * Checks if the current user can edit this session.
     * 
     * @method canEdit
     * @returns {boolean} True if user has edit permissions
     * @throws {AuthentificationError} When user lacks edit permissions
     */
    canEdit() : boolean {
        if(this.current_user_permission === "FULL" || this.current_user_permission === "WRITE") {
            return true;
        }
        throw new AuthentificationError("User does not have permission to edit this session");
    }

    /**
     * Checks if the current user can delete this session.
     * Only users with full permissions can delete sessions.
     * 
     * @method canDelete
     * @returns {boolean} True if user has delete permissions
     * @throws {AuthentificationError} When user lacks delete permissions
     */
    canDelete() : boolean {
        if(this.current_user_permission === "FULL") {
            return true;
        }
        throw new AuthentificationError("User does not have permission to delete this session");
    }
    
    /**
     * Updates this session with new data.
     * Requires edit permissions and validates session existence.
     * 
     * @async
     * @method update
     * @param {any} body - Object containing fields to update
     * @returns {Promise<Session>} The updated Session instance
     * @throws {AuthentificationError} When user lacks edit permissions
     * @throws {NotFoundError} When session is not found
     */
    async update(body: any): Promise<Session> {
        this.canEdit();
        let session = await db.Tables.Sessions.findOne({where:{session_id: this.session_id}});
        if(!session) {
            throw new NotFoundError(`Session with ID ${this.session_id} not found for update`);
        }
        await session.update(body);
        Object.assign(this, body);
        return this;
    }
    
    /**
     * Deletes this session from the database.
     * Requires delete permissions and validates session existence.
     * 
     * @async
     * @method delete
     * @returns {Promise<void>} Promise that resolves when deletion is complete
     * @throws {AuthentificationError} When user lacks delete permissions
     * @throws {NotFoundError} When session is not found
     */
    async delete(): Promise<void> {
        this.canDelete();
        let session = await db.Tables.Sessions.findOne({where:{session_id: this.session_id}});
        if(!session) {
            throw new NotFoundError(`Session with ID ${this.session_id} not found for deletion`);
        }
        await session.destroy();
    }

     /**
     * Retrieves all user permissions for this session.
     * 
     * @async
     * @method getPermissions
     * @returns {Promise<UserPermission>} UserPermission instance for this session
     */
     async getPermissions(): Promise<UserPermission> {
      return await UserPermission.getFromDbData('session', this.session_id, this.current_user_id as number);
    }
    
    /**
     * Creates new permissions for users on this session.
     * Requires edit permissions.
     * 
     * @async
     * @method createPermissions
     * @param {any} body - Permission data containing user assignments
     * @returns {Promise<any>} Created permission data
     * @throws {AuthentificationError} When user lacks edit permissions
     */
    async createPermissions(body: any): Promise<any> {
        this.canEdit();
        let permissions = await UserPermission.getFromDbData('session', this.session_id, this.current_user_id as number);
        return await permissions.createPermissions(body);
    }
    
    /**
     * Retrieves permissions for a specific user on this session.
     * 
     * @async
     * @method getPermissionsForUser
     * @param {number} userId - ID of the user to get permissions for
     * @returns {Promise<SingleUserPermission>} Permission instance for the user
     */
    async getPermissionsForUser(userId: number): Promise<SingleUserPermission> {
        return await SingleUserPermission.getFromDbData('session', this.session_id, userId, this.current_user_id as number);
    }
    
    /**
     * Updates permissions for a specific user on this session.
     * Requires edit permissions.
     * 
     * @async
     * @method patchPermissionsForUser
     * @param {number} userId - ID of the user to update permissions for
     * @param {any} body - Object containing permission level to assign
     * @returns {Promise<any>} Updated permission data
     * @throws {AuthentificationError} When user lacks edit permissions
     */
    async patchPermissionsForUser(userId: number, body: any): Promise<any> {
        this.canEdit();
        let permission = await SingleUserPermission.getFromDbData('session', this.session_id, userId, this.current_user_id as number);
        return await permission.update(body.permission);
    }

    /**
     * Deletes permissions for a specific user on this session.
     * Requires edit permissions.
     * 
     * @async
     * @method deletePermissionsForUser
     * @param {number} userId - ID of the user to remove permissions for
     * @returns {Promise<any>} Result of permission deletion
     * @throws {AuthentificationError} When user lacks edit permissions
     */
    async deletePermissionsForUser(userId: number): Promise<any> {
        this.canEdit();
        let permission = await SingleUserPermission.getFromDbData('session', this.session_id, userId, this.current_user_id as number);
        return await permission.delete();
    }

    /**
     * Deletes all permissions for this session.
     * Requires delete permissions.
     * 
     * @async
     * @method deleteAllPermissions
     * @returns {Promise<any>} Result of permissions deletion
     * @throws {AuthentificationError} When user lacks delete permissions
     */
    async deleteAllPermissions(): Promise<any> {
        this.canDelete();
        let permissions = await UserPermission.getFromDbData('session', this.session_id, this.current_user_id as number);
        return await permissions.deleteAllPermissions();
    }

    /**
     * Activates this session for participant access.
     * Requires edit permissions and session must be configured for manual activation.
     * 
     * @async
     * @method activate
     * @returns {Promise<void>} Promise that resolves when session is activated
     * @throws {AuthentificationError} When user lacks edit permissions
     * @throws {ValidationError} When session cannot be activated or is already active
     */
    async activate(): Promise<Session> {
        this.canEdit();
        if(!this.session_can_be_manually_activated) {
            throw new ConflictError(`Session with ID ${this.session_id} cannot be activated. Please check the session's experimental method and conditions.`);
        }
        if(this.session_active) {
            throw new ValidationError(`Session with ID ${this.session_id} is already active.`);
        }
        let activities = await this.getActivities();
        activities.forEach(async (activity: Activity) => {
            await activity.activate(true);
        });
        this.session_active = true;
        let session = await db.Tables.Sessions.findOne({where:{session_id: this.session_id}});
        if(!session) {
            throw new NotFoundError(`Session with ID ${this.session_id} not found for activation`);
        }
        await session.update({ session_active: true });
        return this;
    }

    /**
     * Deactivates this session to prevent participant access.
     * Requires edit permissions and session must be configured for manual activation.
     * 
     * @async
     * @method deactivate
     * @returns {Promise<void>} Promise that resolves when session is deactivated
     * @throws {AuthentificationError} When user lacks edit permissions
     * @throws {ValidationError} When session cannot be deactivated or is already inactive
     */
    async desactivate(): Promise<Session> {
        this.canEdit();
        if(!this.session_can_be_manually_activated) {
            throw new ConflictError(`Session with ID ${this.session_id} cannot be deactivated. Please check the session's experimental method and conditions.`);
        }
        if(!this.session_active) {
            throw new ValidationError(`Session with ID ${this.session_id} is already inactive.`);
        }
        let activities = await this.getActivities();
        activities.forEach(async (activity: Activity) => {
            await activity.activate(false);
        });
        this.session_active = false;
        let session = await db.Tables.Sessions.findOne({where:{session_id: this.session_id}});
        if(!session) {
            throw new NotFoundError(`Session with ID ${this.session_id} not found for deactivation`);
        }
        await session.update({ session_active: false });
        return this;
    }

    /**
     * Retrieves all participants for this session.
     * Requires read permissions.
     * 
     * @async
     * @method getParticipants
     * @returns {Promise<SimletParticipant[]>} Array of participants in this session
     * @throws {AuthentificationError} When user lacks read permissions
     */
    async getParticipants(): Promise<SimletParticipant[]> {
        return await SimletParticipant.getAllFromDbData('session', this.session_id);
    }

    /**
     * Converts the session instance to a JSON representation.
     * 
     * @method toJSON
     * @returns {object} JSON object representing the session with all its properties
     */
    toJSON(): object {
        if(this.allocated_user) {
            return {
                session_id: this.session_id,
                simlet_id: this.simlet_id,
                session_order: this.session_order,
                allocated_user_id: this.allocated_user_id,
                allocated_username: this.allocated_username,
                allocated_isToken: this.allocated_isToken,
                allocated_token: this.allocated_token,
                allocated_session_id: this.allocated_session_id,
                session_name: this.session_name,
                session_description: this.session_description,
                session_experimental_method: this.session_experimental_method,
                session_can_be_manually_activated: this.session_can_be_manually_activated,
                session_active: this.session_active,
                session_start_date: this.session_start_date,
                session_end_date: this.session_end_date,
                createdAt: this.createdAt,
                updatedAt: this.updatedAt,
            };
        } else {
            return {
                session_id: this.session_id,
                simlet_id: this.simlet_id,
                session_order: this.session_order,
                current_user_id: this.current_user_id,
                current_user_username: this.current_user_username,
                current_user_permission: this.current_user_permission,
                session_name: this.session_name,
                session_description: this.session_description,
                session_experimental_method: this.session_experimental_method,
                session_can_be_manually_activated: this.session_can_be_manually_activated,
                session_active: this.session_active,
                session_start_date: this.session_start_date,
                session_end_date: this.session_end_date,
                activities: this.activities,
                tags: this.tags,
                createdAt: this.createdAt,
                updatedAt: this.updatedAt,
            };
        }   
    }
}