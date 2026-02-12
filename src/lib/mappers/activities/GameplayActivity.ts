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
	backup: boolean= false;
	
	/**
	 * Whether SCORM/xAPI data is handled by the game itself
	 * @default false
	 */
	scorm_xapi_by_game: boolean = false;
	
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
	constructor(data: any) {
		super(data);
		// Assign gameplay activity-specific properties if provided in data
		this.backup = data.backup ?? false;
		this.scorm_xapi_by_game = data.scorm_xapi_by_game ?? false;
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
	static async getFromDbData(activityData: any): Promise<GamePlayActivity> {
		const instance = new GamePlayActivity(activityData);
		
		try {
			const gameplayData = await db.Tables.GamePlayActivities.findOne({ 
				where: { activity_id: instance.activity_id } 
			});
			
			if (gameplayData) {
				instance.backup = gameplayData.backup ?? false;
				instance.scorm_xapi_by_game = gameplayData.scorm_xapi_by_game ?? false;
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

	async getDetails(){
		return {
			gameSessions: [], // Fetch game sessions related to this activity
			scores: [] // Fetch scores related to this activity
		};
	}
} 