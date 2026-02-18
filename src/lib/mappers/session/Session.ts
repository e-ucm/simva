import { db } from "@/lib/db";
import { AuthentificationError, ValidationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";
import { Activity } from "@/lib/mappers/activities/Activity";
import { ActivityToClass } from  "@/lib/mappers/activities/ActivityToClass";

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
    
    /**
     * ID of the current session user
     */
    current_user_id: number;

    /**
     * Username of the current session user
     */
    current_user_username: string;
    
    /**
     * Permission level for the current session user
     */
    current_user_permission: string;
    
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
    
    /**
     * Whether the session is currently active
     */
    session_active: boolean;
    
    /**
     * Start date for session availability
     */
    session_start_date: Date;
    
    /**
     * End date for session availability
     */
    session_end_date: Date;
    
    /**
     * Array of activity IDs that belong to this session
     */
    activities: number[];
    
    /**
     * Array of tags for categorizing the session
     */
    tags: string[];
    
    /**
     * Array of direct permissions granted for this session
     */
    direct_permissions: string[] = [];
    
    /**
     * Static array defining which properties should be parsed as numeric arrays
     */
    static numericKeys = ['activities'];
    
    /**
     * Static array defining which properties should be parsed as string arrays
     */
    static stringKeys = ['tags'];

    /**
     * Creates a new Session instance
     * 
     * @param {any} data - Raw data object containing session properties
     * @description Initializes session properties and parses array fields from string format.
     * Uses database utility functions to properly convert string arrays to typed arrays.
     */
    constructor(data: any) {
        this.session_id = data.session_id;
        this.simlet_id = data.simlet_id;
        this.current_user_id = data.current_user_id;
        this.current_user_username = data.current_user_username || "";
        this.current_user_permission = data.current_user_permission || "";
        this.session_name = data.session_name || "";
        this.session_description = data.session_description || "";
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
        this.session_experimental_method = data.session_experimental_method || "";
        this.session_active = data.session_active || false;
        this.session_start_date = data.session_start_date ? new Date(data.session_start_date) : new Date();
        this.session_end_date = data.session_end_date ? new Date(data.session_end_date) : new Date();
        
        let result = db.Functions.parseStringArraysToTypedArrays(data, Session.numericKeys, 'number');
        result = db.Functions.parseStringArraysToTypedArrays(result, Session.stringKeys, 'string');
        
        this.activities = result.activities || [];
        this.tags = result.tags || [];
        this.direct_permissions = data.direct_permissions || [];
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
        return sessions.map((session: any) => new Session(session));
    }

    static async getFromDbData(simlet_id: number, session_id: number, current_user_id: number) : Promise<Session> {
        const session = await db.Functions.runViewQuery(
            db.Views.Session.bySimletIdSessionIdAndUserId,
            { session_id, current_user_id, simlet_id }
       );
        if(session.length === 0){
            throw new ValidationError(`Session with ID ${session_id} not found for user ID ${current_user_id}.`);
        } else if(session.length > 1) {
            logger.warn(`Multiple sessions found with ID ${session_id} for user ID ${current_user_id}. Using the first one.`);
        }
        return new Session(session[0]);
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
            throw new ValidationError(`Session name ${sessionData.session_name} is already taken. Please choose a different name.`);
        }
        let session = await db.Tables.Sessions.create(sessionData);
        return Session.getFromDbData(session.simlet_id, session.session_id, session.session_supervisor_id);
    }

    async getActivities(): Promise<Activity[]> {
        const activities = await db.Functions.runViewQuery(
            db.Views.Activity.bySessionIdUserId,
            { session_id: this.session_id, current_user_id : this.current_user_id }
        );
        logger.debug({activities} , "Activities data from view");
        return await Promise.all(activities.map(async (activity: any) => await ActivityToClass(activity)));
    }

    canEdit() : boolean {
        if(this.current_user_permission === "full" || this.current_user_permission === "write") {
            return true;
        }
        throw new AuthentificationError("User does not have permission to edit this session");
    }

}