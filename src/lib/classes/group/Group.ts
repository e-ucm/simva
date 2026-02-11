import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export class Group {
    group_id: number;
    use_new_generation: boolean;
    name: string;
    created_at?: Date;
    participants?: number[];
    coordinators_read?: string[];
    coordinators_write?: string[];
    permissions_owners?: number;
    [key: string]: any;
    static stringKeys = ['coordinators_read', 'coordinators_write'];
    static numericKeys = ['participants'];

    constructor(data: any) {
        const processedResults = db.Functions.parseStringArraysToTypedArrays(data, Group.stringKeys, 'string');
        const groupData = db.Functions.parseStringArraysToTypedArrays(processedResults, Group.numericKeys, 'number');
        this.group_id = processedResults.group_id; // Ensure group_id is included in the data
        this.use_new_generation = Boolean(processedResults.use_new_generation); // Ensure use_new_generation is included in the data
        this.name = processedResults.name || ""; // Ensure name is included in the data
        Object.assign(this, groupData);
    }

    // Additional methods related to Group can be added here
    printInfo() {
        logger.debug({ Group : this }, "Group information");
    }
}