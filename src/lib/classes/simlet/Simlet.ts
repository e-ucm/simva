import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export class Simlet {
    simlet_id: number;
    name: string;
    description?: string
    username: string;
    permission: string;
    sessions?: number[]
    groups?: number[];
    direct_supervisors_read?: string[]
    direct_supervisors_write?: string[]
    indirect_coordinators_read?: string[];
    indirect_coordinators_write?: string[];
    tags?: string[];
    [key: string]: any;
    static numericKeys = ['sessions', 'groups'];
    static stringKeys = ['direct_supervisors_read','direct_supervisors_write',  'indirect_coordinators_read', 'indirect_coordinators_write', 'tags'];

    constructor(data: any) {
        this.simlet_id = data.simlet_id; // Ensure simlet_id is included in the data
        this.name = data.name || ""; // Ensure name is included in the data
        this.description = data.description || ""; // Ensure description is included in the data
        this.username = data.username || "";
        this.permission = data.permission || "NO"; // Ensure permission is included in the data
        logger.debug({data} , "Initializing Simlet with data");
        if(typeof data === typeof db.Tables.Simlets) {
            logger.debug("Data is of type Simlets, fetching additional details from the database");
            db.Functions.runViewQuery(
                db.Views.Simlet.bySimletIdAndUserId,
                { simlet_id: this.simlet_id, user_id : data.simlet_coordinator_id }
            ).then((resultTable) => {  ;
                if(resultTable.length === 0){
                    throw new Error(`Simlet with ID ${this.simlet_id} not found for user ID ${data.simlet_coordinator_id}.`);
                } else if(resultTable.length > 1){
                    logger.warn(`Multiple simlets found with ID ${this.simlet_id} for user ID ${data.simlet_coordinator_id}. Using the first one.`);
                }
                let result = resultTable[0]; // Use the first result if multiple are returned
                logger.debug({result} , "Simlet data fetched from database");
                result = db.Functions.parseStringArraysToTypedArrays(result, Simlet.numericKeys, 'number');
                result = db.Functions.parseStringArraysToTypedArrays(result, Simlet.stringKeys, 'string');
                logger.debug({result} , "Simlet data after parsing string and numerics arrays");
                Object.assign(this, result);
            });
        } else {
            logger.debug("Data is not of type Simlets, using provided data directly");
            logger.debug({data} , "Simlet data before parsing string and numerics arrays");
            let result = db.Functions.parseStringArraysToTypedArrays(data, Simlet.numericKeys, 'number');
            result = db.Functions.parseStringArraysToTypedArrays(result, Simlet.stringKeys, 'string');
            logger.debug({result} , "Simlet data after parsing string and numerics arrays");
            Object.assign(this, result);
        }
    }

    // Additional methods related to Simlet can be added here
    printInfo() {
        logger.debug({ Simlet : this }, "Simlet information");
    }
}