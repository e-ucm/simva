import { db } from "@/lib/db";

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
    direct_coordinators?: number[];
    direct_supervisors?: number[];
    [key: string]: any;
    static keys = ['activities', 'tags', 'direct_coordinators', 'direct_supervisors'];

    constructor(data: any) {
        this.session_id = data.session_id;
        this.simlet_id = data.simlet_id;
        this.username = data.username || "";
        this.name = data.name || "";
        Object.assign(this, db.Functions.parseStringArraysToTypedArrays(data, Session.keys, 'number'));
    }
}