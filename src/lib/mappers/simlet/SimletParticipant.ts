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
    allocator_id: number;
    
    /**
     * ID of the group this participant belongs to
     */
    group_id: number;
    
    /**
     * Unique identifier for this participant
     */
    participant_id: number;
    
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

    /**
     * Creates a new SimletParticipant instance
     * 
     * @param {any} data - Raw data object containing participant and study context properties
     * @description Initializes participant data including study context, allocation, and group information.
     * Logs participant data for debugging purposes.
     */
    constructor(data: any) {
        logger.debug(data);
        this.simlet_id = data.simlet_id;
        this.allocator_id = data.allocator_id;
        this.group_id = data.group_id;
        this.participant_id = data.participant_id;
        this.username = data.username;
        this.token = data.token;
        this.isToken = data.isToken;
        this.role = data.role;
        this.email = data.email;
    }

    printInfo() {
        logger.debug({ SimletParticipant : this }, `SimletParticipant information - Simlet ID: ${this.simlet_id}, Allocator ID: ${this.allocator_id}, Group ID: ${this.group_id}, Participant ID: ${this.participant_id}, Username: ${this.username}, Role: ${this.role}`);
    }

    toJSON() {
        return {
            simlet_id: this.simlet_id,
            allocator_id: this.allocator_id,
            group_id: this.group_id,
            participant_id: this.participant_id,
            username: this.username,
            token: this.token,
            isToken: this.isToken,
            role: this.role,
            email: this.email
        };
    }
}