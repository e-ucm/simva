import { db } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";
import { GroupParticipant } from "@/lib/mappers/group/GroupParticipant";

/**
 * Group mapper class representing a collection of participants in studies.
 * Groups are used to organize participants and can be assigned to simlets.
 * 
 * @class Group
 * @description Manages participant groups with permissions and generation settings.
 * Supports both manual participant management and automatic code generation.
 */
export class Group {
    async getParticipants(): Promise<GroupParticipant[]> {
        let participantsData = await db.Functions.runViewQuery(db.Views.GroupParticipant.byId, {group_id: this.group_id});
        logger.debug({ participantsData }, `Group data retrieved for group ID ${this.group_id}`);
        return participantsData.map((participant: any) => new GroupParticipant(participant));
    }
    
    /**
     * Unique identifier for the group
     */
    group_id: number;
    
    /**
     * Whether to use new generation algorithms for participant codes
     */
    use_new_generation: boolean;
    
    /**
     * Human-readable name for the group
     */
    name: string;
    
    /**
     * Timestamp when the group was created
     */
    created_at: Date;
    
    /**
     * Array of participant IDs belonging to this group
     */
    participants: number[];
    
    /**
     * Array of direct permissions granted for this group
     */
    direct_permissions: string[] = [];
    
    /**
     * Static array defining which properties should be parsed as numeric arrays
     */
    static numericKeys = ['participants'];

    /**
     * Creates a new Group instance
     * 
     * @param {any} data - Raw data object containing group properties
     * @description Initializes group properties and parses array fields from string format.
     * Processes participant arrays and ensures proper boolean conversion for use_new_generation.
     */
    constructor(data: any) {
        const processedResults = db.Functions.parseStringArraysToTypedArrays(data, Group.numericKeys, 'number');
        this.group_id = processedResults.group_id; // Ensure group_id is included in the data
        this.use_new_generation = Boolean(processedResults.use_new_generation); // Ensure use_new_generation is included in the data
        this.name = processedResults.name || ""; // Ensure name is included in the data
        this.created_at = processedResults.created_at ? new Date(processedResults.created_at) : new Date();
        this.participants = processedResults.participants || [];
    }

    static async getFromDbData(group_id: number, user_id: number): Promise<Group> {
       let groups = await db.Functions.runViewQuery(
            db.Views.Group.byGroupIdAndUserId, 
            {group_id, user_id}
        );
        if(groups.length === 0) {
            throw new NotFoundError(`Group with ID ${group_id} not found for user ${user_id}`);
        } else if (groups.length > 1) {
            throw new Error(`Multiple groups found with ID ${group_id} for user ${user_id}`);
        }
        logger.debug({ groupData: groups[0] }, `Group data retrieved for group ID ${group_id} and user ID ${user_id}`);
        return new Group(groups[0]);
    }

    /**
     * Prints debugging information about this group instance
     * 
     * @returns {void}
     * @description Logs group information to debug output for troubleshooting.
     */
    printInfo() {
        logger.debug({ Group : this }, "Group information");
    }
}