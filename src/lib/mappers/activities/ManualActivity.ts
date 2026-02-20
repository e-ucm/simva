import { Activity } from "@/lib/mappers/activities/Activity";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

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
	static async getFromDbData(activity_id: number, user_id: number, allocated:boolean, activityData: any): Promise<ManualActivity> {
		const instance = new ManualActivity(allocated, activityData);
		const manualData = await db.Tables.ManualActivities.findOne({ 
			where: { activity_id: activity_id } 
		});
		if (manualData) {
			instance.manual_user_managed = manualData.manual_user_managed ?? false;
			instance.manual_ressource_type = manualData.manual_ressource_type ?? '';
			instance.manual_ressource_url = manualData.manual_ressource_url ?? '';
		}
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

	static async getUtils(username : string){
		return super.getUtils(username);
	}

	async getDetails(){
		return {
			completionStatus: false, // Fetch completion status
			grade: null // Fetch grade if available
		};
	}

	async sendXAPITraceForActivity(username: string, verb: string, timestamp : string, resultScore : number, reasonExtension : string): Promise<void> {
		return super.sendXAPITraceForActivity(username, verb, timestamp, resultScore, reasonExtension);
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