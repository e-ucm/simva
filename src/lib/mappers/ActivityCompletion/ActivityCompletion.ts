import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";

export class ActivityCompletion {
    /**
     * ID of the activity completion record
     */
    activity_id: number;

    /**
     * ID of the participant associated with this completion record
     */
    participant_id: number;

    activity_initialized : boolean;

    activity_progress : number;

    activity_suspended : boolean;

    activity_initialization_date: Date;

    activity_suspension_date: Date;

    activity_completion_date: Date;

    activity_registration_id: string;

    activity_result_presigned_url: string | null;

    activity_result_presigned_url_generated_at: Date | null;

    activity_result_presigned_url_expire_at: Date | null;

    activity_completed : boolean;

    createdAt?: Date;

    updatedAt?: Date;

    static async createAll(activity_id: number, participant_ids: number[]): Promise<ActivityCompletion[]> {
        const completions: ActivityCompletion[] = [];
        for (const participant_id of participant_ids) {
            const completion = await this.create(activity_id, participant_id);
            completions.push(completion);
        }
        return completions;
    }

    static async create(activity_id: number, participant_id: number): Promise<ActivityCompletion> {
        let existingRecord = await db.Tables.ActivityCompletion.findOne({
            where: {
                activity_id,
                participant_id
            }
        });
        if (existingRecord) {
            logger.debug(existingRecord, `create: Activity completion record already exists for activity_id ${activity_id} and participant_id ${participant_id}`);
            return new ActivityCompletion(existingRecord);
        }
        const newRecord = await db.Tables.ActivityCompletion.create({
            activity_id,
            participant_id,
            activity_initialized: false,
            activity_completed: false,
            activity_suspended: false,
        });
        logger.debug(newRecord, `create: Created new activity completion record for activity_id ${activity_id} and participant_id ${participant_id}`);
        return new ActivityCompletion(newRecord);
    }


    static async getAllIdsFromDbData(activity_id: number): Promise<number[]> {
        const data = await db.Tables.ActivityCompletion.findAll({
            where: { activity_id: activity_id },
            attributes: ['participant_id']
        });
        logger.debug(data, `getAllIdsFromDbData: Retrieved participant IDs for activity_id ${activity_id}`);
        return data.map((record: any) => record.participant_id);
    }

    static async getAllFromDbData(activity_id: number, attributes?: string[], participants_id?: number[]): Promise<ActivityCompletion[]> {
        let data;
        if(!participants_id || (participants_id && participants_id.length === 0)) {
            data = await db.Tables.ActivityCompletion.findAll({
                where: { activity_id: activity_id },
                attributes: attributes || undefined
            });
        } else {
            data = await db.Tables.ActivityCompletion.findAll({
                where: { activity_id: activity_id, participant_id: { $in: participants_id } }
            });
        }
        logger.debug(data, `getAllFromDbData: Retrieved activity completion data for activity_id ${activity_id}`);
        return data.map((record: any) => new ActivityCompletion(record)); 
    }

    static async getFromDbData(activity_id: number, participant_id: number): Promise<ActivityCompletion> {
        const data = await db.Tables.ActivityCompletion.findOne({
            where: { activity_id: activity_id, participant_id: participant_id }
        });
        if (!data) {
            throw new NotFoundError(`No activity completion record found for activity_id ${activity_id} and participant_id ${participant_id}`);
        }
        logger.debug(data, `getFromDbData: Retrieved activity completion data for activity_id ${activity_id} and participant_id ${participant_id}`);
        return new ActivityCompletion(data);
    }

    /**
     * Creates a new ActivityCompletion instance
     * @param {any} data - Raw data object containing completion record properties
     * @description Initializes activity completion data including status, result, and timestamps.
     */
    constructor(data: any) {
        this.activity_id = data.activity_id;
        this.participant_id = data.participant_id;
        this.activity_initialized = data.activity_initialized;
        this.activity_initialization_date = new Date(data.activity_initialization_date);
        this.activity_progress = data.activity_progress;
        this.activity_suspended = data.activity_suspended;
        this.activity_suspension_date = new Date(data.activity_suspension_date);
        this.activity_completed = data.activity_completed;
        this.activity_completion_date = new Date(data.activity_completion_date);
        this.activity_registration_id = data.activity_registration_id;
        this.activity_result_presigned_url = data.activity_result_presigned_url || null;
        this.activity_result_presigned_url_generated_at = data.activity_result_presigned_url_generated_at ? new Date(data.activity_result_presigned_url_generated_at) : null;
        this.activity_result_presigned_url_expire_at = data.activity_result_presigned_url_expire_at ? new Date(data.activity_result_presigned_url_expire_at) : null;
        this.createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : undefined;
    }

    async update(data : Partial<ActivityCompletion>): Promise<ActivityCompletion> {
        await db.Tables.ActivityCompletion.update(
            data,
            { where: { activity_id: this.activity_id, participant_id: this.participant_id } }
        );
        Object.assign(this, data);
        return this;
    }

    async delete(): Promise<void> {
        await db.Tables.ActivityCompletion.destroy(
            { where: { activity_id: this.activity_id, participant_id: this.participant_id } }
        );
    }

    toJSON(): object {
        return {
            participant_id: this.participant_id,
            activity_initialized: this.activity_initialized,
            activity_initialization_date: this.activity_initialization_date,
            activity_progress: this.activity_progress,
            activity_suspended: this.activity_suspended,
            activity_suspension_date: this.activity_suspension_date,
            activity_completed: this.activity_completed,
            activity_completion_date: this.activity_completion_date,
            activity_registration_id: this.activity_registration_id,
            activity_result_presigned_url: this.activity_result_presigned_url,
            activity_result_presigned_url_generated_at: this.activity_result_presigned_url_generated_at,
            activity_result_presigned_url_expire_at: this.activity_result_presigned_url_expire_at,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}