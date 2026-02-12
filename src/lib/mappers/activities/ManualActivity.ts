import { Activity } from "@/lib/mappers/activities/Activity";
import { LRSActivity } from "@/lib/mappers/activities/LRSActivity";
import { db } from "@/lib/db";

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
	user_managed:boolean=false;
	
	/**
	 * Type of resource associated with the activity (e.g., 'document', 'video')
	 * @default ''
	 */
	ressource_type: string='';
	
	/**
	 * URL to the resource for this manual activity
	 * @default ''
	 */
	ressource_url: string='';

	/**
	 * Creates a new ManualActivity instance
	 * 
	 * @param {any} data - Raw data object containing activity and manual activity-specific properties
	 * @description Initializes base activity properties and manual activity-specific fields.
	 * Uses nullish coalescing for safe default value assignment.
	 */
	constructor(data: any) {
		super(data);
		// Assign manual activity-specific properties if provided in data
		this.user_managed = data.user_managed ?? false;
		this.ressource_type = data.ressource_type ?? '';
		this.ressource_url = data.ressource_url ?? '';
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
	static async getFromDbData(activityData: any): Promise<ManualActivity> {
		const instance = new ManualActivity(activityData);
		
		try {
			const manualData = await db.Tables.ManualActivities.findOne({ 
				where: { activity_id: instance.activity_id } 
			});
			
			if (manualData) {
				instance.user_managed = manualData.user_managed ?? false;
				instance.ressource_type = manualData.ressource_type ?? '';
				instance.ressource_url = manualData.ressource_url ?? '';
			}
		} catch (error) {
			console.error('Error loading ManualActivity data:', error);
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
		return LRSActivity.getUtils(username);
	}

	async getDetails(){
		return {
			completionStatus: false, // Fetch completion status
			grade: null // Fetch grade if available
		};
	}
}