import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export class SimletGroup {
    simlet_id: number;
    group_id: number;
    group_name: string;
    participants?: string[];
    direct_permissions : string[] = [];
    [key: string]: any;
    static numericKeys = ['participants'];

    constructor(data: any) {
        this.simlet_id = data.simlet_id;
        this.group_id = data.group_id;
        this.group_name = data.group_name;
        let result = db.Functions.parseStringArraysToTypedArrays(data, SimletGroup.numericKeys, 'number');
        Object.assign(this, result);
    }

    printInfo() {
        logger.debug({ SimletGroup : this }, `SimletGroup information - Simlet ID: ${this.simlet_id}, Group ID: ${this.group_id}, Group Name: ${this.group_name}`);
    }
}