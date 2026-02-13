import { db } from "@/lib/db";
import { ValidationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";

/**
 * Simlet Group mapper class representing a group assignment within a study (simlet).
 * Maps groups to studies with participant information and permissions.
 * 
 * @class SimletGroup
 * @description Manages the relationship between groups and studies,
 * including participant lists and permission management.
 */
export class SimletGroup {
    /**
     * ID of the simlet (study) this group is assigned to
     */
    simlet_id: number;
    
    /**
     * ID of the group
     */
    group_id: number;
    
    /**
     * Name of the group for display purposes
     */
    group_name: string;
    
    /**
     * Array of participant identifiers in this group
     */
    participants: string[];
    
    /**
     * Array of direct permissions granted for this group within the study
     */
    direct_permissions: string[] = [];
    
    /**
     * Static array defining which properties should be parsed as numeric arrays
     */
    static numericKeys = ['participants'];

    /**
     * Creates a new SimletGroup instance
     * 
     * @param {any} data - Raw data object containing group and study relationship properties
     * @description Initializes group-study relationship and parses participant arrays from string format.
     * Uses database utility functions to properly convert string arrays to typed arrays.
     */
    constructor(data: any) {
        this.simlet_id = data.simlet_id;
        this.group_id = data.group_id;
        this.group_name = data.group_name;
        let result = db.Functions.parseStringArraysToTypedArrays(data, SimletGroup.numericKeys, 'number');
        this.participants = result.participants;
    }
    static async createSimletGroup(simlet_id: number, group_id: number) : Promise<SimletGroup> {
        let simletGroupData = await db.Tables.SimletGroups.create({ simlet_id, group_id });
        return new SimletGroup(simletGroupData);
    }

    static async getFromDbData(simlet_id: number, group_id: number) : Promise<SimletGroup> {
        let simletGroupData = await db.Tables.SimletGroups.findOne({ where: { simlet_id, group_id } });
        if (!simletGroupData) {
            throw new ValidationError(`SimletGroup with simlet_id ${simlet_id} and group_id ${group_id} not found`);
        }
        return new SimletGroup(simletGroupData);
    }
    
    async delete(): Promise<void> {
        let simletGroup = await db.Tables.SimletGroups.findOne({ where: { simlet_id: this.simlet_id, group_id: this.group_id } });
        if (!simletGroup) {
            throw new ValidationError(`SimletGroup with simlet_id ${this.simlet_id} and group_id ${this.group_id} not found`);
        }
        await simletGroup.destroy();
    }

    printInfo(): void {
        logger.debug({ SimletGroup : this }, `SimletGroup information - Simlet ID: ${this.simlet_id}, Group ID: ${this.group_id}, Group Name: ${this.group_name}`);
    }
}