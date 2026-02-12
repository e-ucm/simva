import { logger } from "@/lib/logger";

/**
 * Group Participant mapper class representing a participant within a group.
 * Manages individual participant data including authentication tokens and roles.
 * 
 * @class GroupParticipant
 * @description Handles participant information within groups including token-based and user-based participants.
 * Supports both registered users and anonymous token-based participation.
 */
export class GroupParticipant {
    /**
     * ID of the group this participant belongs to
     */
    group_id: number;
    
    /**
     * Unique identifier for this participant
     */
    participant_id: number;
    
    /**
     * Username of the participant (may be token-generated)
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
     * Role of the participant within the group/study
     */
    role: string;
    
    /**
     * Email address of the participant
     */
    email: string;

    /**
     * Creates a new GroupParticipant instance
     * 
     * @param {any} data - Raw data object containing participant properties
     * @description Initializes participant properties and assigns additional dynamic properties.
     */
    constructor(data: any) {
        this.group_id = data.group_id;
        this.participant_id = data.participant_id;
        this.username = data.username;
        this.token = data.token;
        this.isToken = data.isToken;
        this.role = data.role;
        this.email = data.email;
    }

    /**
     * Prints debugging information about this participant instance
     * 
     * @returns {void}
     * @description Logs participant information to debug output for troubleshooting.
     */
    printInfo() {
        logger.debug({ GroupParticipant : this }, `GroupParticipant information - Group ID: ${this.group_id}, Participant ID: ${this.participant_id}, Username: ${this.username}, Role: ${this.role}`);
    }
}