import { Activity } from "@/lib/mappers/activities/Activity";
import { config } from "@/lib/config";
import { Session } from "./Session";
import { logger } from "@/lib/logger";
import { LimesurveyActivity } from "../activities/LimesurveyActivity";


export class SessionScheduler {
    activities: Activity[] = [];
    next?: number;
    simlet: number;
    session: Session;    
    url: string;

    static async getFromDbData(simlet_id: number, is_admin: boolean, current_user_id: number) {
        const session = await Session.getScheduledSessionForUser(simlet_id, current_user_id);
        let scheduler = new SessionScheduler(simlet_id, session);
        await scheduler.initializeNextActivity();
        return scheduler;
    }
    
    constructor(simletid: number, session: any) {
        this.simlet = simletid;
        this.session = session;
        this.url = `${config.externalUrl}/scheduler/${this.simlet}`;
    }

    async initializeNextActivity() {
        let previous = null;
        if(this.session.allocated_activities && this.session.allocated_activities.length > 0) {
            for(const activity of this.session.allocated_activities) {
                let act : Activity = activity;
                this.activities.push(act);
                if(!this.next) {
                    logger.debug({ allocated_activity_result: act.allocated_activity_result }, "Checking activity completion status for next activity scheduling");
                    if(!act.allocated_activity_result!.activity_completed) {
                        if(previous) {
                            if(previous.allocated_activity_result!.activity_initialized) {
                                await act.sendXAPITraceForActivity("terminated", act.allocated_activity_result!.activity_initialization_date!);
                            }
                        }
                        this.next = act.activity_id;
                        if(act.allocated_activity_result!.activity_initialized) {
                            if(act instanceof LimesurveyActivity) {
                                await act.sendXAPITraceForActivity("resumed", act.allocated_activity_result!.activity_initialization_date!);
                            } else {
                                await act.setInitialized(true, new Date(), act.allocated_user_id!);
                                await act.sendXAPITraceForActivity("initialized", act.allocated_activity_result!.activity_initialization_date!);
                            }
                        } else {
                            await act.setInitialized(true, new Date(), act.allocated_user_id!);
                            await act.sendXAPITraceForActivity("initialized", act.allocated_activity_result!.activity_initialization_date!);
                        }
                        logger.debug({ next: this.next }, "Next activity to be scheduled");
                    }
                }
                previous = act;
            }
        }
        logger.debug(this.toJSON(), "SessionScheduler constructor - session and activities data");
    }

    toJSON() {
        return {
            simlet: this.simlet,
            session: this.session.allocated_session_id,
            url: this.url,
            activities: this.activities.reduce((acc, activity) => {
                acc[activity.activity_id] = activity.toJSON();
                return acc;
            }, {} as Record<number, any>),
            next: this.next || null
        }
    }
}