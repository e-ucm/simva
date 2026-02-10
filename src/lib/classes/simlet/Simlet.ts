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
    direct_supervisors?: number[]
    direct_coordinators?: number[];
    tags?: number[];
    [key: string]: any;
    static keys = ['sessions', 'groups', 'direct_supervisors', 'direct_coordinators', 'tags'];

    constructor(data: any) {
        this.simlet_id = data.simlet_id; // Ensure simlet_id is included in the data
        this.name = data.name || ""; // Ensure name is included in the data
        this.description = data.description || ""; // Ensure description is included in the data
        this.username = data.username || "";
        this.permission = data.permission || "NO"; // Ensure permission is included in the data
        logger.info({data} , "Initializing Simlet with data");
        if(typeof data === typeof db.Tables.Simlets) {
            logger.info("Data is of type Simlets, fetching additional details from the database");
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
                logger.info({result} , "Simlet data fetched from database");
                const processedResults = db.Functions.parseStringArraysToTypedArrays(data, Simlet.keys, 'number');
                Object.assign(this, processedResults);
            });
        } else {
            logger.info("Data is not of type Simlets, using provided data directly");
            const processedResults = db.Functions.parseStringArraysToTypedArrays(data, Simlet.keys, 'number');
            Object.assign(this, processedResults);
        }
    }

    // Additional methods related to Simlet can be added here
    printInfo() {
        logger.info({ Simlet : this }, "Simlet information");
    }
}