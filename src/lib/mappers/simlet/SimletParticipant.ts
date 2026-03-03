import { db } from "@/lib/db";
import { BadRequestError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";

/**
 * Simlet Participant mapper class representing a participant within a study (simlet).
 * Combines participant data with their allocation and group assignment information.
 * 
 * @class SimletParticipant
 * @description Manages participant data within the context of a specific study,
 * including allocation strategy and group membership details.
 */
export class SimletParticipant {
    /**
     * ID of the simlet (study) this participant is enrolled in
     */
    simlet_id: number;
    
    /**
     * ID of the allocator used to assign this participant
     */
    allocator_id?: number;

    session_id: string;
    
    /**
     * ID of the group this participant belongs to
     */
    group_id: number;
    
    /**
     * Unique identifier for this participant
     */
    user_id: number;
    
    /**
     * Username of the participant
     */
    username: string;
    
    /**
     * Authentication token for the participant
     */
    token: string;
    
    /**
     * Whether this participant uses token-based authentication
     */
    isToken: boolean;
    
    /**
     * Role of the participant within the study
     */
    role: string;
    
    /**
     * Email address of the participant
     */
    email: string;

    createdAt?: Date;

    updatedAt?: Date;

    /**
     * Creates a new SimletParticipant instance
     * 
     * @param {any} data - Raw data object containing participant and study context properties
     * @description Initializes participant data including study context, allocation, and group information.
     * Logs participant data for debugging purposes.
     */
    constructor(data: any) {
        this.simlet_id = data.simlet_id;
        this.allocator_id = data.allocator_id ?? undefined;
        this.session_id = data.session_id;
        this.group_id = data.group_id;
        this.user_id = data.user_id;
        this.username = data.username;
        this.token = data.token;
        this.isToken = Boolean(data.isToken);
        this.role = data.role;
        this.email = data.email;
        this.createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : undefined;
    }

    static async getAllFromDbData(type: string, object_id: number): Promise<SimletParticipant[]> {
        let allocated;
        if(type === 'simlet') {
            allocated = await db.Functions.runViewQuery(
              db.Views.AllocatedParticipants.bySimletId,
              { simlet_id: object_id }
            );
        } else if(type === 'session') {
            allocated = await db.Functions.runViewQuery(
              db.Views.AllocatedParticipants.bySessionId,
              { session_id: object_id }
            );
        } else {
            throw new BadRequestError(`Invalid type: ${type}`);
        }
        logger.debug({allocated} , "Participants data from view");
        return allocated.map((participant: any) => new SimletParticipant(participant));
    }

    printInfo() {
        logger.debug({ SimletParticipant : this }, `SimletParticipant information - Simlet ID: ${this.simlet_id}, Allocator ID: ${this.allocator_id}, Group ID: ${this.group_id}, Participant ID: ${this.user_id}, Username: ${this.username}, Role: ${this.role}`);
    }

    toJSON(): object {
        return {
            simlet_id: this.simlet_id,
            session_id: this.session_id,
            group_id: this.group_id,
            user_id: this.user_id,
            username: this.username,
            token: this.token,
            isToken: this.isToken,
            role: this.role,
            email: this.email,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}