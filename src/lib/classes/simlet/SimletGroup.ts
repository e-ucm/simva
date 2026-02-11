import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { UserPermission } from "../group/UserPermission";

export class SimletGroup {
    simlet_id: number;
    group_id: number;
    group_name: string;
    participants?: string[];
    coordinators_read?: string[];
    coordinators_write?: string[];
    [key: string]: any;
    static numericKeys = ['participants'];
    static stringKeys = ['coordinators_read', 'coordinators_write'];

    constructor(data: any) {
        this.simlet_id = data.simlet_id;
        this.group_id = data.group_id;
        this.group_name = data.group_name;
        let result = db.Functions.parseStringArraysToTypedArrays(data, SimletGroup.numericKeys, 'number');
        result = db.Functions.parseStringArraysToTypedArrays(result, SimletGroup.stringKeys, 'string');
        this.setDirectPermissions(result);
        Object.assign(this, result);
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

    printInfo() {
        logger.debug({ SimletGroup : this }, `SimletGroup information - Simlet ID: ${this.simlet_id}, Group ID: ${this.group_id}, Group Name: ${this.group_name}`);
    }
}