import { Activity } from "@/lib/mappers/activities/Activity";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { ActivityCompletion } from "../ActivityCompletion/ActivityCompletion";
import { ActivityMappingResult } from "../ActivityCompletion/ActivityMappingResult";

/**
 * Manual Activity mapper class extending base Activity.
 * Represents activities that require manual completion and instructor oversight.
 * 
 * @class ManualActivity
 * @extends Activity
 * @description Handles manually-managed activities with resource links and completion tracking.
 * Useful for offline activities, document reviews, or instructor-led sessions.
 */
export class ManualActivity extends Activity {
	/**
	 * Whether this activity is managed by users/instructors
	 * @default false
	 */
	manual_user_managed:boolean=false;
	
	/**
	 * Type of resource associated with the activity (e.g., 'document', 'video')
	 * @default ''
	 */
	manual_ressource_type: string='';
	
	/**
	 * URL to the resource for this manual activity
	 * @default ''
	 */
	manual_ressource_url: string='';

	/**
	 * Creates a new ManualActivity instance
	 * 
	 * @param {any} data - Raw data object containing activity and manual activity-specific properties
	 * @description Initializes base activity properties and manual activity-specific fields.
	 * Uses nullish coalescing for safe default value assignment.
	 */
	constructor(allocated: boolean, data: any) {
		super(allocated, data);
		// Assign manual activity-specific properties if provided in data
		this.manual_user_managed = data.manual_user_managed ?? false;
		this.manual_ressource_type = data.manual_ressource_type ?? '';
		this.manual_ressource_url = data.manual_ressource_url ?? '';
	}
	
	/**
	 * Creates a ManualActivity instance with database-loaded data
	 * 
	 * @static
	 * @async
	 * @param {any} activityData - Raw activity data object
	 * @returns {Promise<ManualActivity>} Fully initialized ManualActivity instance
	 * @description Factory method that creates instance and loads additional data from database.
	 * Handles database errors gracefully and ensures proper initialization.
	 */
	static async getFromDbData(activity_id: number, allocated: boolean, is_admin: boolean, activityData: any, user_id?: number): Promise<ManualActivity> {
		const instance = new ManualActivity(allocated, activityData);
		let manualData = await db.Tables.ManualActivities.findOne({ 
			where: { activity_id: activity_id } 
		});
		if (!manualData) {
			manualData = await db.Tables.ManualActivities.create({
				activity_id: activity_id,
				manual_user_managed: activityData.manual_user_managed || false,
				manual_ressource_type: activityData.manual_ressource_type || 'WEB',
				manual_ressource_url: activityData.manual_ressource_url || ''
			});
		}
		instance.manual_user_managed = manualData.manual_user_managed ?? false;
		instance.manual_ressource_type = manualData.manual_ressource_type ?? '';
		instance.manual_ressource_url = manualData.manual_ressource_url ?? '';
		return instance;
	}

	static getType(){
		return 'manual';
	}

	static getName(){
		return 'Manual Activity';
	}
	
	static getDescription(){
		return 'An activity that requires manual completion and grading.';
	}

	static async getUtils(){
		return super.getUtils();
	}

	async activate(activate: boolean): Promise<void> {
		await super.activate(activate);
    }

	canBeOpened(): boolean {
		return this.manual_ressource_url !== undefined && this.manual_ressource_url !== '';
	}

	async getAllCurrentParticipantsId(participants_id?: number[]): Promise<number[]> {
		return super.getAllCurrentParticipantsId(participants_id);
	}

	async target(participants_id?: number[]): Promise<ActivityMappingResult<string>> {
		participants_id = await this.getAllCurrentParticipantsId(participants_id);
		let targetMap = new Map<number, string>();
		for (const participant_id of participants_id) {
			targetMap.set(participant_id, this.manual_ressource_url);
		}
		logger.debug(targetMap.toString());
		return new ActivityMappingResult(targetMap);
	}
	
	async addParticipants(participants_id: number[]): Promise<ActivityCompletion[]> {
		return super.addParticipants(participants_id);
	}

	async removeParticipants(participants_id: number[]): Promise<void> {
		super.removeParticipants(participants_id);
	}

	async getInitialized(participants_id?: number[]): Promise<ActivityMappingResult<boolean | null>> {
		return super.getInitialized(participants_id);
	}

	async setInitialized(initialized: boolean, initialized_date: Date, participant_id: number): Promise<ActivityCompletion> {
		return super.setInitialized(initialized, initialized_date, participant_id);
	}

	async getProgress(participants_id?: number[]): Promise<ActivityMappingResult<number | null>> {
		return super.getProgress(participants_id);
	}
	
	async setProgress(progress: number, progress_date: Date, participant_id: number): Promise<ActivityCompletion> {
		return super.setProgress(progress, progress_date, participant_id);
	}

	async getCompletion(participants_id?: number[]): Promise<ActivityMappingResult<boolean | null>> {
		return super.getCompletion(participants_id);
	}

	async setCompletion(completed: boolean, completed_date: Date, participant_id: number): Promise<ActivityCompletion> {
		return super.setCompletion(completed, completed_date, participant_id);
	}

	async setMultiCompletion(status : boolean): Promise<ActivityCompletion[]> {
		return super.setMultiCompletion(status);
	}

	async setSuspension(status : boolean, participant_id: number): Promise<ActivityCompletion> {
		return super.setSuspension(status, participant_id);
	}

	async getSuspension(participant_id?: number[]): Promise<ActivityMappingResult<boolean>> {
		return super.getSuspension(participant_id);
	}

	async sendXAPITraceForActivity(username: string, verb: string, timestamp : string, resultScore : number, reasonExtension : string): Promise<void> {
		return super.sendXAPITraceForActivity(username, verb, timestamp, resultScore, reasonExtension);
	}

	async generatePresignedFileUrl(): Promise<string> {
		return super.generatePresignedFileUrl();
	}

	async getResults(type: string, participants_id?: number[]): Promise<ActivityMappingResult<string | null>> {
		return super.getResults(type, participants_id);
	}

	toJSON(): object {
		return {
			...super.toJSON(),
			activity_type : ManualActivity.getType(),
			manual_user_managed: this.manual_user_managed,
			manual_ressource_type: this.manual_ressource_type,
			manual_ressource_url: this.manual_ressource_url
		};
	}
}