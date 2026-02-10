import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export class Group {
    group_id: number;
    use_new_generation: boolean;
    name: string;
    created_at?: Date;
    participants?: number[];
    permissions_owners?: number;
    [key: string]: any;
    static keys = ['participants', 'coordinators'];

    constructor(data: any) {
        const processedResults = db.Functions.parseStringArraysToTypedArrays(data, Group.keys, 'number');
        const groupData = processedResults;
        this.group_id = processedResults.group_id; // Ensure group_id is included in the data
        this.use_new_generation = processedResults.use_new_generation; // Ensure use_new_generation is included in the data
        this.name = processedResults.name || ""; // Ensure name is included in the data
        Object.assign(this, groupData);
    }

    // Additional methods related to Group can be added here
    printInfo() {
        logger.debug({ Group : this }, "Group information");
    }
}