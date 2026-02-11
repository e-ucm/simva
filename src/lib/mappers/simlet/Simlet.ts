import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export class Simlet {
    simlet_id: number;
    name: string;
    description?: string
    username: string;
    permission?: string;
    sessions?: number[]
    groups?: number[];
    tags?: string[];
    direct_permissions : string[] = [];
    [key: string]: any;
    static numericKeys = ['sessions', 'groups'];

    constructor(data: any) {
        this.simlet_id = data.simlet_id; // Ensure simlet_id is included in the data
        this.name = data.name || ""; // Ensure name is included in the data
        this.description = data.description || ""; // Ensure description is included in the data
        this.username = data.username || "";
        logger.debug({data} , "Simlet data before parsing string and numerics arrays");
        let result = db.Functions.parseStringArraysToTypedArrays(data, Simlet.numericKeys, 'number');
        logger.debug({result} , "Simlet data after parsing string and numerics arrays");
        Object.assign(this, result);
    }

    // Additional methods related to Simlet can be added here
    printInfo() {
        logger.debug({ Simlet : this }, "Simlet information");
    }
}