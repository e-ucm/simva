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
    
    user_id: number;

    /**
     * Username of the session owner/creator
     */
    username: string;
    
    /**
     * Permission level for the current user
     */
    permission: string;
    
    /**
     * Human-readable name for the session
     */
    name: string;
    
    /**
     * Description of the session purpose and content
     */
    description: string;
    
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
    experimental_method: string;
    
    /**
     * Whether the session is currently active
     */
    active: boolean;
    
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
        this.user_id = data.user_id;
        this.username = data.username || "";
        this.permission = data.permission || "";
        this.name = data.name || "";
        this.description = data.description || "";
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
        this.experimental_method = data.experimental_method || "";
        this.active = data.active || false;
        this.session_start_date = data.session_start_date ? new Date(data.session_start_date) : new Date();
        this.session_end_date = data.session_end_date ? new Date(data.session_end_date) : new Date();
        
        let result = db.Functions.parseStringArraysToTypedArrays(data, Session.numericKeys, 'number');
        result = db.Functions.parseStringArraysToTypedArrays(result, Session.stringKeys, 'string');
        
        this.activities = result.activities || [];
        this.tags = result.tags || [];
        this.direct_permissions = data.direct_permissions || [];
    }

    static async getFromDbData(simlet_id: number, session_id: number, user_id: number) : Promise<Session> {
        const session = await db.Functions.runViewQuery(
            db.Views.Session.bySimletIdSessionIdAndUserId,
            { session_id, user_id, simlet_id }
       );
        if(session.length === 0){
            throw new ValidationError(`Session with ID ${session_id} not found for user ID ${user_id}.`);
        } else if(session.length > 1) {
            logger.warn(`Multiple sessions found with ID ${session_id} for user ID ${user_id}. Using the first one.`);
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
     *   name: 'Test Session',
     *   description: 'A test learning session',
     *   session_supervisor_id: 123
     * });
     * ```
     */
    static async createFromDbData(sessionData: Partial<InstanceType<typeof db.Tables.Sessions>>): Promise<Session> {
        let sessioncount = await db.Tables.Sessions.count({where: {name: sessionData.name}});
        if(sessioncount > 0){
            throw new ValidationError(`Session name ${sessionData.name} is already taken. Please choose a different name.`);
        }
        let session = await db.Tables.Sessions.create(sessionData);
        return Session.getFromDbData(session.simlet_id, session.session_id, session.session_supervisor_id);
    }

    async getActivities(): Promise<Activity[]> {
        const activities = await db.Functions.runViewQuery(
            db.Views.Activity.bySessionIdUserId,
            { session_id: this.session_id, user_id: this.user_id }
        );
        logger.debug({activities} , "Activities data from view");
        return await Promise.all(activities.map(async (activity: any) => await ActivityToClass(activity)));
    }

    canEdit() : boolean {
        if(this.permission === "owner" || this.permission === "write") {
            return true;
        }
        throw new AuthentificationError("User does not have permission to edit this simlet");
    }

}