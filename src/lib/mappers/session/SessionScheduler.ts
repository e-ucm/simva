import { Activity } from "@/lib/mappers/activities/Activity";
import { config } from "@/lib/config";
import { Session } from "./Session";
import { logger } from "@/lib/logger";


export class SessionScheduler {
    activities: Activity[] = [];
    next?: number;
    simlet: number;
    session: number;    
    url: string;

    static async getFromDbData(simlet_id: number, current_user_id: number) {
        const session = await Session.getScheduledSessionForUser(simlet_id, current_user_id);
        return new SessionScheduler(simlet_id, session);
    }
    
    constructor(simletid: number, session: any) {
        this.simlet = simletid;
        this.session = session.allocated_session_id;
        this.url = `${config.externalUrl}/scheduler/${this.simlet}`;
        if(session.allocated_activities && session.allocated_activities.length > 0) {
            for(const activity of session.allocated_activities) {
                this.activities.push(activity);
                if(!this.next) {
                    if(!activity.activity_completed) {
                        this.next = activity.activity_id;
                    }
                }
            }
        }
        logger.debug(this.toJSON(), "SessionScheduler constructor - session and activities data");
    }

    toJSON() {
        return {
            simlet: this.simlet,
            session: this.session,
            url: this.url,
            activities: this.activities.reduce((acc, activity) => {
                acc[activity.activity_id] = activity.toJSON();
                return acc;
            }, {} as Record<number, any>),
            next: this.next
        }
    }
}