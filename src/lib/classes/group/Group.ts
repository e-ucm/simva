import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { UserPermission } from "@/lib/classes/group/UserPermission";

export class Group {
    group_id: number;
    use_new_generation: boolean;
    name: string;
    created_at?: Date;
    participants?: number[];
    coordinators_read?: string[];
    coordinators_write?: string[];
    coordinator_owner?: string;
    [key: string]: any;
    direct_permissions?: UserPermission[] = [];
    static stringKeys = ['coordinators_read', 'coordinators_write'];
    static numericKeys = ['participants'];

    constructor(data: any) {
        const processedResults = db.Functions.parseStringArraysToTypedArrays(data, Group.stringKeys, 'string');
        const groupData = db.Functions.parseStringArraysToTypedArrays(processedResults, Group.numericKeys, 'number');
        this.group_id = processedResults.group_id; // Ensure group_id is included in the data
        this.use_new_generation = Boolean(processedResults.use_new_generation); // Ensure use_new_generation is included in the data
        this.name = processedResults.name || ""; // Ensure name is included in the data
        this.setDirectPermissions(groupData);
        Object.assign(this, groupData);
    }

    setDirectPermissions(data: any) {
        if (!this.direct_permissions) {
           this.direct_permissions = [];
        }
        if(data.coordinators_read.length > 0) {    
            this.direct_permissions.push(...data.coordinators_read.map((username: string) => new UserPermission({ username, permission: 'read' })));
        }
        if(data.coordinators_write.length > 0) {    
            this.direct_permissions.push(...data.coordinators_write.map((username: string) => new UserPermission({ username, permission: 'write' })));
        }
        if(data.coordinator_owner) {
            this.direct_permissions.push(new UserPermission({ username: data.coordinator_owner, permission: 'owner' }));
        }
    }

    // Additional methods related to Group can be added here
    printInfo() {
        logger.debug({ Group : this }, "Group information");
    }
}