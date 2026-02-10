import { logger } from "@/lib/logger";

export class SimletParticipant {
    simlet_id: number;
    allocator_id: number;
    group_id: number;
    participant_id: number;
    username: string;
    token: string;
    isToken: boolean;
    role: string;
    email: string;
    [key: string]: any;

    constructor(data: any) {
        logger.debug(data);
        this.simlet_id = data.simlet_id;
        this.allocator_id = data.allocator_id;
        this.group_id = data.group_id;
        this.participant_id = data.participant_id;
        this.username = data.username;
        this.token = data.token;
        this.isToken = data.isToken;
        this.role = data.role;
        this.email = data.email;
        Object.assign(this, data);
    }

    printInfo() {
        logger.debug({ SimletParticipant : this }, `SimletParticipant information - Simlet ID: ${this.simlet_id}, Allocator ID: ${this.allocator_id}, Group ID: ${this.group_id}, Participant ID: ${this.participant_id}, Username: ${this.username}, Role: ${this.role}`);
    }
}