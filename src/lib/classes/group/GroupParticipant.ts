import { logger } from "@/lib/logger";

export class GroupParticipant {
    group_id: number;
    participant_id: number;
    username: string;
    token: string;
    isToken: boolean;
    role: string;
    email: string;
    [key: string]: any;

    constructor(data: any) {
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
        logger.info({ GroupParticipant : this }, `GroupParticipant information - Group ID: ${this.group_id}, Participant ID: ${this.participant_id}, Username: ${this.username}, Role: ${this.role}`);
    }
}