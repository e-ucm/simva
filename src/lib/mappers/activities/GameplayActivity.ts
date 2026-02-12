import { Activity } from "@/lib/mappers/activities/Activity";
import { LRSActivity } from "@/lib/mappers/activities/LRSActivity";
import {db } from "@/lib/db";

export class GamePlayActivity extends Activity {
	backup: boolean= false;
	scorm_xapi_by_game: boolean = false;
	category_id?: number;
	subject_area_id?: number;
	game_type?: string;
	game_url?: string;
	
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
	
	// Static factory method to create instance with database data
	static async createWithDbData(activityData: any): Promise<GamePlayActivity> {
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