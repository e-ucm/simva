import { Activity } from "@/lib/mappers/activities/Activity";
import { LRSActivity } from "@/lib/mappers/activities/LRSActivity";
import {db } from "@/lib/db";

/**
 * Gameplay Activity mapper class extending base Activity.
 * Represents activities involving serious games and interactive gameplay sessions.
 * 
 * @class GamePlayActivity
 * @extends Activity
 * @description Handles game-specific properties including SCORM/xAPI integration,
 * categorization, and game session management for research purposes.
 */
export class GamePlayActivity extends Activity {
	/**
	 * Whether backup of game data is enabled
	 * @default false
	 */
	game_backup: boolean= false;
	
	/**
	 * Whether SCORM/xAPI data is handled by the game itself
	 * @default false
	 */
	game_scorm_xapi: boolean = false;
	
	/**
	 * Category ID for game classification
	 */
	category_id: number;
	
	/**
	 * Subject area ID for educational context
	 */
	subject_area_id: number;
	
	/**
	 * Type/genre of the game (e.g., 'adventure', 'puzzle')
	 */
	game_type: string;
	
	/**
	 * URL where the game can be accessed
	 */
	game_url: string;
	
	/**
	 * Creates a new GamePlayActivity instance
	 * 
	 * @param {any} data - Raw data object containing activity and gameplay-specific properties
	 * @description Initializes base activity properties and gameplay-specific fields.
	 * Uses nullish coalescing for safe assignment of boolean properties.
	 */
	constructor(allocated:boolean, data: any) {
		super(allocated, data);
		// Assign gameplay activity-specific properties if provided in data
		this.game_backup = data.game_backup ?? false;
		this.game_scorm_xapi = data.game_scorm_xapi ?? false;
		this.category_id = data.category_id;
		this.subject_area_id = data.subject_area_id;
		this.game_type = data.game_type;
		this.game_url = data.game_url;
	}
	
	/**
	 * Creates a GamePlayActivity instance with database-loaded data
	 * 
	 * @static
	 * @async
	 * @param {any} activityData - Raw activity data object
	 * @returns {Promise<GamePlayActivity>} Fully initialized GamePlayActivity instance
	 * @description Factory method that creates instance and loads additional data from database.
	 * Handles database errors gracefully and ensures proper initialization.
	 */
	static async getFromDbData(activity_id: number, user_id: number, allocated:boolean, activityData: any): Promise<GamePlayActivity> {
		const instance = new GamePlayActivity(allocated, activityData);
		
		try {
			const gameplayData = await db.Tables.GamePlayActivities.findOne({ 
				where: { activity_id: activity_id } 
			});
			
			if (gameplayData) {
				instance.game_backup = gameplayData.game_backup ?? false;
				instance.game_scorm_xapi = gameplayData.game_scorm_xapi ?? false;
				instance.category_id = gameplayData.category_id as number;
				instance.subject_area_id = gameplayData.subject_area_id as number;
				instance.game_type = gameplayData.game_type;
				instance.game_url = gameplayData.game_url;
			}
		} catch (error) {
			console.error('Error loading GamePlayActivity data:', error);
		}
		
		return instance;
	}

	static getType(){
		return 'gameplay';
	}
	
	static getName(){
		return 'GamePlay Activity';
	}

	static getDescription(){
		return 'An activity to track gameplay sessions and scores.';
	}

	static async getUtils(username : string) : Promise<any> {
		return LRSActivity.getUtils(username);
	}

	/**
	 * Retrieves detailed information about this gameplay activity.
	 * Currently returns placeholder data structure for game sessions and scores.
	 * 
	 * @async
	 * @method getDetails
	 * @returns {Promise<object>} Promise resolving to object with gameSessions and scores arrays
	 * @override
	 */
	async getDetails(): Promise<object>{
		return {
			gameSessions: [], // Fetch game sessions related to this activity
			scores: [] // Fetch scores related to this activity
		};
	}

	/**
	 * Converts the GamePlayActivity instance to a JSON representation.
	 * Extends the base Activity JSON with gameplay-specific properties.
	 * 
	 * @method toJSON
	 * @returns {object} JSON object containing base activity properties plus game fields
	 * @override
	 */
	toJSON(): object {
		return {
			...super.toJSON(),
			activity_type : GamePlayActivity.getType(),
			game_backup: this.game_backup,
			game_scorm_xapi: this.game_scorm_xapi,
			category_id: this.category_id,
			subject_area_id: this.subject_area_id,
			game_type: this.game_type,
			game_url: this.game_url
		};
	}
} 