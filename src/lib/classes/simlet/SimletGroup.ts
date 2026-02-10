import { logger } from "@/lib/logger";

export class SimletGroup {
    simlet_id: number;
    group_id: number;
    group_name: string;
    [key: string]: any;

    constructor(data: any) {
        this.simlet_id = data.simlet_id;
        this.group_id = data.group_id;
        this.group_name = data.group_name;
        Object.assign(this, data);
    }

    printInfo() {
        logger.debug({ SimletGroup : this }, `SimletGroup information - Simlet ID: ${this.simlet_id}, Group ID: ${this.group_id}, Group Name: ${this.group_name}`);
    }
}