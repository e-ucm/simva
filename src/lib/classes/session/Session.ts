import { db } from "@/lib/db";
import { UserPermission } from "../group/UserPermission";

/**
 * Interface for complete session data from views
 */
export class Session {
    simlet_id: number;
    session_id: number;
    username: string;
    permission?: string;
    name?: string;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date
    experimental_method?: string;
    active?: boolean;
    session_start_date?: Date;
    session_end_date?: Date;
    activities?: number[];
    tags?: string[];
    direct_permissions?: UserPermission[] = [];
    direct_coordinators_read?: string[];
    direct_coordinators_write?: string[];
    direct_coordinator_owner?: string;
    indirect_supervisors_read?: string[];
    indirect_supervisors_write?: string[];
    [key: string]: any;
    static numericKeys = ['activities', 'tags'];
    static stringKeys = ['direct_coordinators_read', 'direct_coordinators_write', 'indirect_supervisors_read', 'indirect_supervisors_write'];

    setDirectPermissions(data: any) {
        if (!this.direct_permissions) {
           this.direct_permissions = [];
        }
        if(data.direct_coordinators_read.length > 0) {    
            this.direct_permissions.push(...data.direct_coordinators_read.map((username: string) => new UserPermission({ username, permission: 'read' })));
        }
        if(data.direct_coordinators_write.length > 0) {    
            this.direct_permissions.push(...data.direct_coordinators_write.map((username: string) => new UserPermission({ username, permission: 'write' })));
        }
        if(data.direct_coordinator_owner) {
            this.direct_permissions.push(new UserPermission({ username: data.direct_coordinator_owner, permission: 'owner' }));
        }
    }

    constructor(data: any) {
        this.session_id = data.session_id;
        this.simlet_id = data.simlet_id;
        this.username = data.username || "";
        this.name = data.name || "";
        let result = db.Functions.parseStringArraysToTypedArrays(data, Session.numericKeys, 'number');
        result = db.Functions.parseStringArraysToTypedArrays(result, Session.stringKeys, 'string');
        this.setDirectPermissions(result);
        Object.assign(this, result);
    }
}